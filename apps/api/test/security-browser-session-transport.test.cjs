const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const apiRoot =
  path.resolve(__dirname, '..');

const repoRoot =
  path.resolve(apiRoot, '../..');

function source(relative) {
  return fs.readFileSync(
    path.join(repoRoot, relative),
    'utf8'
  );
}

const transport = source(
  'apps/api/src/lib/browserAuthTransport.ts'
);

const authenticate = source(
  'apps/api/src/middleware/authenticate.ts'
);

const rateLimiter = source(
  'apps/api/src/middleware/rateLimiter.ts'
);

const controller = source(
  'apps/api/src/modules/auth/auth.controller.ts'
);

const client = source(
  'apps/erp/lib/api.ts'
);

const loginPage = source(
  'apps/erp/app/login/page.tsx'
);

const shell = source(
  'apps/erp/components/AppShell.tsx'
);

test(
  'browser credentials use scoped HTTP-only secure-cookie policy',
  () => {
    assert.match(
      transport,
      /httpOnly:\s*true/g
    );

    assert.match(
      transport,
      /sameSite:\s*'lax'/g
    );

    assert.match(
      transport,
      /NODE_ENV\s*===\s*\n?\s*'production'/
    );

    assert.match(
      transport,
      /path:\s*'\/api\/v1'/
    );

    assert.match(
      transport,
      /path:\s*'\/api\/v1\/auth'/
    );

    assert.doesNotMatch(
      transport,
      /domain\s*:/i
    );

    assert.match(
      transport,
      /Cache-Control/
    );
  }
);

test(
  'cookie-authenticated mutations require trusted origin and CSRF marker',
  () => {
    assert.match(
      transport,
      /x-sukuu-csrf/
    );

    assert.match(
      transport,
      /trustedOrigins\(\)\.has\(origin\)/
    );

    assert.match(
      authenticate,
      /cookieToken\s*&&\s*\n\s*isUnsafeMethod/
    );

    assert.match(
      authenticate,
      /isTrustedBrowserRequest\(req\)/
    );

    assert.match(
      authenticate,
      /bearerToken\s*\|\|\s*cookieToken/
    );
  }
);

test(
  'login and refresh keep bearer compatibility but suppress browser token bodies',
  () => {
    assert.match(
      controller,
      /wantsBrowserAuthTransport\(req\)/
    );

    assert.match(
      controller,
      /readRefreshTokenCookie\(req\)/
    );

    assert.match(
      controller,
      /writeBrowserAuthCookies/
    );

    assert.match(
      controller,
      /const \{\s*accessToken:\s*_accessToken,\s*refreshToken:\s*_refreshToken,/s
    );

    assert.match(
      controller,
      /clearBrowserAuthCookies/
    );
  }
);

test(
  'refresh abuse control derives a private key from body or cookie transport',
  () => {
    assert.match(
      rateLimiter,
      /readRefreshTokenCookie\(req\)/
    );

    assert.match(
      rateLimiter,
      /normalizedBodyValue\(\s*req,\s*'refreshToken'/
    );

    assert.match(
      rateLimiter,
      /hashedKey\(/
    );
  }
);

test(
  'ERP performs one retry through coordinated refresh and sends cookies',
  () => {
    assert.match(
      client,
      /credentials:\s*'include'/
    );

    assert.match(
      client,
      /let refreshPromise/
    );

    assert.match(
      client,
      /navigator as Navigator/
    );

    assert.match(
      client,
      /sukuu_refresh_lock/
    );

    assert.match(
      client,
      /BroadcastChannel/
    );

    assert.match(
      client,
      /mayRefresh:\s*boolean/
    );

    assert.match(
      client,
      /opts,\s*\n\s*false/
    );

    assert.doesNotMatch(
      client,
      /Authorization:\s*`Bearer/
    );
  }
);

test(
  'browser storage retains presentation only and logout reaches the API',
  () => {
    assert.match(
      client,
      /window\.sessionStorage/
    );

    assert.match(
      client,
      /firstName:/
    );

    assert.doesNotMatch(
      client,
      /sukuu_token/
    );

    assert.match(
      loginPage,
      /establishBrowserSession/
    );

    assert.match(
      shell,
      /endBrowserSession/
    );

    assert.match(
      client,
      /\/api\/v1\/auth\/logout/
    );

    assert.match(
      client,
      /subscribeToAuthEvents/
    );

    assert.match(
      shell,
      /role="alert"/
    );
  }
);

test(
  'ERP pages no longer read an access token from browser storage',
  () => {
    const appRoot =
      path.join(repoRoot, 'apps/erp');

    const stack = [appRoot];
    const sourceFiles = [];

    while (stack.length > 0) {
      const current = stack.pop();

      for (
        const entry of
          fs.readdirSync(
            current,
            { withFileTypes: true }
          )
      ) {
        if (
          entry.name === 'node_modules' ||
          entry.name === '.next'
        ) {
          continue;
        }

        const absolute =
          path.join(current, entry.name);

        if (entry.isDirectory()) {
          stack.push(absolute);
        } else if (
          /\.(?:ts|tsx)$/.test(entry.name)
        ) {
          sourceFiles.push(absolute);
        }
      }
    }

    const combined =
      sourceFiles
        .map(file =>
          fs.readFileSync(file, 'utf8')
        )
        .join('\n');

    assert.doesNotMatch(
      combined,
      /localStorage\.(?:getItem|setItem)\(\s*['"]sukuu_token['"]/
    );

    assert.doesNotMatch(
      combined,
      /sessionStorage\.(?:getItem|setItem)\(\s*['"]sukuu_token['"]/
    );

    assert.doesNotMatch(
      combined,
      /Authorization:\s*`Bearer/
    );
  }
);
