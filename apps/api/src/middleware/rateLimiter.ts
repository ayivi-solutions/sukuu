import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';
import { createHash } from 'crypto';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  name: string;
  windowMs: number;
  max: number;
  key: (req: Request) => string;
}

const MAX_KEYS_PER_LIMITER = 10000;
const SWEEP_EVERY = 250;

function clientIp(req: Request): string {
  return (
    req.ip ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function normalizedBodyValue(
  req: Request,
  field: string
): string {
  const value =
    req.body &&
    typeof req.body[field] === 'string'
      ? req.body[field]
      : '';

  return value.trim();
}

function normalizedEmail(req: Request): string {
  return normalizedBodyValue(
    req,
    'email'
  ).toLowerCase();
}

function identityOrIp(
  req: Request
): string {
  const email = normalizedEmail(req);

  return email
    ? `email:${email}`
    : `anonymous-ip:${clientIp(req)}`;
}

function tokenOrIp(
  req: Request,
  field: string
): string {
  const token =
    normalizedBodyValue(
      req,
      field
    );

  return token
    ? `token:${token}`
    : `anonymous-ip:${clientIp(req)}`;
}

function authenticatedSessionKey(
  req: Request
): string {
  const authReq =
    req as Request & {
      userId?: string;
      sessionId?: string;
    };

  if (
    authReq.userId &&
    authReq.sessionId
  ) {
    return (
      `user:${authReq.userId}:` +
      `session:${authReq.sessionId}`
    );
  }

  return `ip:${clientIp(req)}`;
}

function hashedKey(
  namespace: string,
  raw: string
): string {
  return createHash('sha256')
    .update(
      `${namespace}\u0000${raw}`,
      'utf8'
    )
    .digest('hex');
}

export function createRateLimiter(
  options: RateLimitOptions
): RequestHandler {
  const windows =
    new Map<string, RateLimitEntry>();

  let requestCount = 0;

  function sweep(now: number) {
    for (
      const [key, entry]
      of windows
    ) {
      if (entry.resetAt <= now) {
        windows.delete(key);
      }
    }

    while (
      windows.size >=
      MAX_KEYS_PER_LIMITER
    ) {
      const oldest =
        windows.keys().next();

      if (oldest.done) {
        break;
      }

      windows.delete(oldest.value);
    }
  }

  return function boundedRateLimiter(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const now =
      Date.now();

    requestCount += 1;

    if (
      requestCount %
        SWEEP_EVERY ===
          0 ||
      windows.size >=
        MAX_KEYS_PER_LIMITER
    ) {
      sweep(now);
    }

    const rawKey =
      options.key(req);

    const key =
      hashedKey(
        options.name,
        rawKey
      );

    let entry =
      windows.get(key);

    if (
      !entry ||
      entry.resetAt <= now
    ) {
      entry = {
        count: 0,
        resetAt:
          now +
          options.windowMs,
      };

      windows.set(
        key,
        entry
      );
    }

    entry.count += 1;

    const retryAfterSeconds =
      Math.max(
        1,
        Math.ceil(
          (
            entry.resetAt -
            now
          ) /
          1000
        )
      );

    const remaining =
      Math.max(
        0,
        options.max -
          entry.count
      );

    res.setHeader(
      'RateLimit-Limit',
      String(options.max)
    );

    res.setHeader(
      'RateLimit-Remaining',
      String(remaining)
    );

    res.setHeader(
      'RateLimit-Reset',
      String(
        Math.ceil(
          entry.resetAt /
          1000
        )
      )
    );

    res.setHeader(
      'RateLimit-Policy',
      `${options.max};w=${Math.ceil(
        options.windowMs /
        1000
      )}`
    );

    res.setHeader(
      'X-Sukuu-RateLimit-Policy',
      options.name
    );

    if (
      entry.count >
      options.max
    ) {
      res.setHeader(
        'Retry-After',
        String(
          retryAfterSeconds
        )
      );

      return res
        .status(429)
        .json({
          error:
            'Too many requests. Try again later.',
          retryAfterSeconds,
        });
    }

    next();
  };
}

/**
 * Process-local fallback limiter.
 *
 * The current Sukuu API deployment is single-replica. Before horizontal
 * scaling, these counters must move to a shared atomic store such as Redis.
 * The bounded in-memory implementation deliberately prevents unbounded key
 * growth and is layered with database credential/MFA failure controls.
 */
export const rateLimiter =
  createRateLimiter({
    name: 'global',
    windowMs: 60_000,
    max: 100,
    key: req =>
      `ip:${clientIp(req)}`,
  });

export const authLoginIpLimiter =
  createRateLimiter({
    name: 'auth-login-ip',
    windowMs: 5 * 60_000,
    max: 30,
    key: req =>
      `ip:${clientIp(req)}`,
  });

export const authLoginIdentityLimiter =
  createRateLimiter({
    name:
      'auth-login-identity',
    windowMs: 5 * 60_000,
    max: 10,
    key: identityOrIp,
  });

export const authActivationIpLimiter =
  createRateLimiter({
    name:
      'auth-activation-ip',
    windowMs:
      15 * 60_000,
    max: 15,
    key: req =>
      `ip:${clientIp(req)}`,
  });

export const authActivationTokenLimiter =
  createRateLimiter({
    name:
      'auth-activation-token',
    windowMs:
      15 * 60_000,
    max: 5,
    key: req =>
      tokenOrIp(
        req,
        'activationToken'
      ),
  });

export const authRecoveryIpLimiter =
  createRateLimiter({
    name:
      'auth-recovery-ip',
    windowMs:
      15 * 60_000,
    max: 15,
    key: req =>
      `ip:${clientIp(req)}`,
  });

export const authRecoveryIdentityLimiter =
  createRateLimiter({
    name:
      'auth-recovery-identity',
    windowMs:
      15 * 60_000,
    max: 8,
    key: identityOrIp,
  });

export const authRefreshIpLimiter =
  createRateLimiter({
    name:
      'auth-refresh-ip',
    windowMs: 5 * 60_000,
    max: 60,
    key: req =>
      `ip:${clientIp(req)}`,
  });

export const authRefreshTokenLimiter =
  createRateLimiter({
    name:
      'auth-refresh-token',
    windowMs: 5 * 60_000,
    max: 20,
    key: req =>
      tokenOrIp(
        req,
        'refreshToken'
      ),
  });

export const authMfaActionLimiter =
  createRateLimiter({
    name:
      'auth-mfa-action',
    windowMs: 5 * 60_000,
    max: 10,
    key:
      authenticatedSessionKey,
  });

export const authMfaVerifyLimiter =
  createRateLimiter({
    name:
      'auth-mfa-verify',
    windowMs: 5 * 60_000,
    max: 8,
    key:
      authenticatedSessionKey,
  });

export const authPasswordChangeLimiter =
  createRateLimiter({
    name:
      'auth-password-change',
    windowMs:
      10 * 60_000,
    max: 6,
    key:
      authenticatedSessionKey,
  });
