const test = require('node:test');
const assert = require('node:assert/strict');

const {
  authLoginIdentityLimiter,
  authMfaVerifyLimiter,
} = require(
  '../dist/middleware/rateLimiter'
);

function invoke(
  middleware,
  {
    ip = '127.0.0.1',
    body = {},
    userId,
    sessionId,
  } = {}
) {
  const headers = {};
  let statusCode = 200;
  let jsonBody = null;
  let nextCalled = false;

  const req = {
    ip,
    body,
    socket: {
      remoteAddress: ip,
    },
    userId,
    sessionId,
  };

  const res = {
    setHeader(name, value) {
      headers[
        String(name).toLowerCase()
      ] = String(value);
    },

    status(code) {
      statusCode = code;
      return this;
    },

    json(value) {
      jsonBody = value;
      return this;
    },
  };

  middleware(
    req,
    res,
    () => {
      nextCalled = true;
    }
  );

  return {
    headers,
    statusCode,
    jsonBody,
    nextCalled,
  };
}

test(
  'login identity limiter allows ten attempts then returns 429',
  () => {
    const email =
      'security-contract-login@example.invalid';

    for (
      let i = 0;
      i < 10;
      i++
    ) {
      const result =
        invoke(
          authLoginIdentityLimiter,
          {
            body: {
              email,
            },
          }
        );

      assert.equal(
        result.nextCalled,
        true
      );

      assert.equal(
        result.statusCode,
        200
      );

      assert.equal(
        result.headers[
          'x-sukuu-ratelimit-policy'
        ],
        'auth-login-identity'
      );
    }

    const blocked =
      invoke(
        authLoginIdentityLimiter,
        {
          body: {
            email,
          },
        }
      );

    assert.equal(
      blocked.nextCalled,
      false
    );

    assert.equal(
      blocked.statusCode,
      429
    );

    assert.equal(
      blocked.headers[
        'x-sukuu-ratelimit-policy'
      ],
      'auth-login-identity'
    );

    assert.ok(
      Number(
        blocked.headers[
          'retry-after'
        ]
      ) >= 1
    );

    assert.equal(
      blocked.jsonBody.error,
      'Too many requests. Try again later.'
    );
  }
);

test(
  'a distinct login identity has an independent budget',
  () => {
    const result =
      invoke(
        authLoginIdentityLimiter,
        {
          body: {
            email:
              'security-contract-other@example.invalid',
          },
        }
      );

    assert.equal(
      result.nextCalled,
      true
    );

    assert.equal(
      result.statusCode,
      200
    );
  }
);

test(
  'authenticated MFA verification limiter is session-bound',
  () => {
    const request = {
      userId:
        'security-contract-user',
      sessionId:
        'security-contract-session',
    };

    for (
      let i = 0;
      i < 8;
      i++
    ) {
      const result =
        invoke(
          authMfaVerifyLimiter,
          request
        );

      assert.equal(
        result.nextCalled,
        true
      );
    }

    const blocked =
      invoke(
        authMfaVerifyLimiter,
        request
      );

    assert.equal(
      blocked.nextCalled,
      false
    );

    assert.equal(
      blocked.statusCode,
      429
    );

    assert.equal(
      blocked.headers[
        'x-sukuu-ratelimit-policy'
      ],
      'auth-mfa-verify'
    );
  }
);
