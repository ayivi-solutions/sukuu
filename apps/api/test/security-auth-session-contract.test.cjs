const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root =
  path.resolve(
    __dirname,
    '..'
  );

const service =
  fs.readFileSync(
    path.join(
      root,
      'src/modules/auth/auth.service.ts'
    ),
    'utf8'
  );

const controller =
  fs.readFileSync(
    path.join(
      root,
      'src/modules/auth/auth.controller.ts'
    ),
    'utf8'
  );

const bootstrap =
  fs.readFileSync(
    path.join(
      root,
      'src/lib/authBootstrap.ts'
    ),
    'utf8'
  );

const migration =
  fs.readFileSync(
    path.resolve(
      root,
      '../../packages/database/prisma/migrations/20260825023500_auth_refresh_rotation_enumeration_hardening/migration.sql'
    ),
    'utf8'
  );

function section(
  source,
  start,
  end
) {
  const a =
    source.indexOf(
      start
    );

  const b =
    source.indexOf(
      end,
      a + start.length
    );

  assert.ok(
    a >= 0 &&
    b > a,
    'section markers missing: ' +
      start
  );

  return source.slice(
    a,
    b
  );
}

test(
  'login and refresh failures expose generic external semantics',
  () => {
    const login =
      section(
        controller,
        'export async function login(',
        'export async function refresh('
      );

    const refresh =
      section(
        controller,
        'export async function refresh(',
        'export async function logout('
      );

    assert.match(
      login,
      /Authentication failed/
    );

    assert.doesNotMatch(
      login,
      /err\.message/
    );

    assert.match(
      refresh,
      /Refresh authentication failed/
    );

    assert.doesNotMatch(
      refresh,
      /err\.message/
    );
  }
);

test(
  'refresh tokens rotate through an atomic database contract',
  () => {
    const refresh =
      section(
        service,
        'export async function refreshAccessToken(',
        'export async function logoutSession('
      );

    assert.match(
      refresh,
      /rotateAuthRefreshSession/
    );

    assert.match(
      refresh,
      /rotatedRefreshToken/
    );

    assert.match(
      refresh,
      /randomUUID\(\)/
    );

    assert.match(
      refresh,
      /refreshToken:/
    );

    assert.doesNotMatch(
      refresh,
      /lookupAuthSession/
    );

    assert.match(
      bootstrap,
      /system\.auth_rotate_refresh_session/
    );
  }
);

test(
  'migration protects verifier bypass and refresh replay',
  () => {
    assert.match(
      migration,
      /RENAME TO\s+_auth_verify_credentials_core/
    );

    assert.match(
      migration,
      /_auth_password_matches/
    );

    assert.match(
      migration,
      /\$2y\$12\$/
    );

    assert.doesNotMatch(
      migration,
      /no current password hash is available for timing normalization/
    );

    assert.doesNotMatch(
      migration,
      /INTO v_dummy_hash/
    );


    assert.match(
      migration,
      /REFRESH_TOKEN_REPLAY_DETECTED/
    );

    assert.match(
      migration,
      /FOR UPDATE/
    );

    assert.match(
      migration,
      /REVOKE EXECUTE ON FUNCTION system\._auth_verify_credentials_core/
    );

    assert.doesNotMatch(
      migration,
      /^\s*BEGIN\s*;/m
    );

    assert.doesNotMatch(
      migration,
      /COMMIT\s*;\s*$/m
    );
  }
);
