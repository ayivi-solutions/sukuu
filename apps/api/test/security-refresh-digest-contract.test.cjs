const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const apiRoot =
  path.resolve(__dirname, '..');

const repoRoot =
  path.resolve(apiRoot, '../..');

const service = fs.readFileSync(
  path.join(
    apiRoot,
    'src/modules/auth/auth.service.ts'
  ),
  'utf8'
);

const helper = fs.readFileSync(
  path.join(
    apiRoot,
    'src/lib/refreshTokenDigest.ts'
  ),
  'utf8'
);

const bootstrap = fs.readFileSync(
  path.join(
    apiRoot,
    'src/lib/authBootstrap.ts'
  ),
  'utf8'
);

const runtimeEnv = fs.readFileSync(
  path.join(
    apiRoot,
    'src/lib/validateRuntimeEnv.ts'
  ),
  'utf8'
);

const migration = fs.readFileSync(
  path.join(
    repoRoot,
    'packages/database/prisma/migrations/20260825095000_auth_refresh_digest_hardening/migration.sql'
  ),
  'utf8'
);

function section(source, start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(
    end,
    a + start.length
  );

  assert.ok(
    a >= 0 && b > a,
    `section markers missing: ${start}`
  );

  return source.slice(a, b);
}

test(
  'complete-token HMAC distinguishes tokens sharing their first 72 bytes',
  () => {
    const secret =
      Buffer.alloc(32, 7);

    const common =
      'x'.repeat(72);

    const first =
      common + '.token-A';

    const second =
      common + '.token-B';

    const digest = value =>
      'h1:' +
      crypto
        .createHmac(
          'sha256',
          secret
        )
        .update(value, 'utf8')
        .digest('hex');

    assert.equal(
      first.slice(0, 72),
      second.slice(0, 72)
    );

    assert.notEqual(
      digest(first),
      digest(second)
    );

    assert.match(
      digest(first),
      /^h1:[0-9a-f]{64}$/
    );
  }
);

test(
  'API uses a dedicated HMAC digest for login and refresh rotation',
  () => {
    const login = section(
      service,
      'export async function loginUser(',
      'export async function refreshAccessToken('
    );

    const refresh = section(
      service,
      'export async function refreshAccessToken(',
      'export async function logoutSession('
    );

    assert.match(
      helper,
      /createHmac\(\s*'sha256'/
    );

    assert.match(
      helper,
      /REFRESH_TOKEN_DIGEST_SECRET/
    );

    assert.match(
      helper,
      /'h1:'/
    );

    assert.match(
      login,
      /digestRefreshToken\(\s*refreshToken/
    );

    assert.doesNotMatch(
      login,
      /bcrypt\.hash\(\s*refreshToken/
    );

    assert.match(
      refresh,
      /digestRefreshToken\(token\)/
    );

    assert.match(
      refresh,
      /digestRefreshToken\(\s*rotatedRefreshToken/
    );

    assert.doesNotMatch(
      refresh,
      /bcrypt\.hash\(\s*rotatedRefreshToken/
    );

    assert.match(
      bootstrap,
      /presentedRefreshDigest/
    );

    assert.match(
      bootstrap,
      /newRefreshTokenDigest/
    );
  }
);

test(
  'runtime rejects missing, malformed or reused digest key material',
  () => {
    assert.match(
      runtimeEnv,
      /requireValue\('REFRESH_TOKEN_DIGEST_SECRET'\)/
    );

    assert.match(
      runtimeEnv,
      /refreshTokenDigestSecretBytes\.length !== 32/
    );

    assert.match(
      runtimeEnv,
      /must be distinct from JWT_REFRESH_SECRET/
    );
  }
);

test(
  'forward-only migration revokes legacy sessions and preserves atomic replay defense',
  () => {
    assert.match(
      migration,
      /legacy-disabled:/
    );

    assert.match(
      migration,
      /REFRESH_DIGEST_CUTOVER_INVALIDATION/
    );

    assert.match(
      migration,
      /_auth_refresh_digest_matches/
    );

    assert.match(
      migration,
      /FOR UPDATE/
    );

    assert.match(
      migration,
      /REFRESH_TOKEN_REPLAY_DETECTED/
    );

    assert.match(
      migration,
      /REVOKE EXECUTE ON FUNCTION\s+system\._auth_refresh_digest_matches/
    );

    assert.match(
      migration,
      /CHECK\s*\(\s*refresh_token_hash\s*~\s*'\^\(h1\|legacy-disabled\):\[0-9a-f\]\{64\}\$'\s*\)/
    );

    assert.doesNotMatch(
      migration,
      /_auth_password_matches\(\s*p_presented/
    );

    assert.match(
      migration,
      /^\s*BEGIN\s*;/m
    );

    assert.match(
      migration,
      /COMMIT\s*;\s*$/m
    );
  }
);
