import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const ACCESS_COOKIE =
  'sukuu_access';

const REFRESH_COOKIE =
  'sukuu_refresh';

const AUTH_TRANSPORT_HEADER =
  'x-sukuu-auth-transport';

const CSRF_HEADER =
  'x-sukuu-csrf';

function cookieValue(
  req: Request,
  name: string
): string | null {
  const header =
    req.headers.cookie || '';

  for (const part of header.split(';')) {
    const separator =
      part.indexOf('=');

    if (separator < 0) {
      continue;
    }

    const key =
      part.slice(0, separator).trim();

    if (key !== name) {
      continue;
    }

    const raw =
      part.slice(separator + 1).trim();

    if (
      raw.length < 16 ||
      raw.length > 4096
    ) {
      return null;
    }

    try {
      return decodeURIComponent(raw);
    } catch {
      return null;
    }
  }

  return null;
}

function trustedOrigins(): Set<string> {
  return new Set(
    (process.env.CORS_ORIGINS || '')
      .split(',')
      .map(value => value.trim())
      .filter(Boolean)
  );
}

function secureCookies(): boolean {
  return process.env.NODE_ENV ===
    'production';
}

function tokenMaxAge(
  token: string,
  fallbackMs: number
): number {
  const claims =
    jwt.decode(token) as
      | jwt.JwtPayload
      | null;

  if (!claims?.exp) {
    return fallbackMs;
  }

  return Math.max(
    1000,
    claims.exp * 1000 - Date.now()
  );
}

function preventAuthCaching(
  res: Response
) {
  res.setHeader(
    'Cache-Control',
    'no-store'
  );

  res.setHeader(
    'Pragma',
    'no-cache'
  );
}

export function wantsBrowserAuthTransport(
  req: Request
): boolean {
  return (
    req.get(AUTH_TRANSPORT_HEADER) || ''
  ).toLowerCase() === 'cookie';
}

export function isTrustedBrowserRequest(
  req: Request
): boolean {
  const origin =
    req.get('origin') || '';

  const csrf =
    req.get(CSRF_HEADER) || '';

  return (
    csrf === '1' &&
    origin.length > 0 &&
    trustedOrigins().has(origin)
  );
}

export function isUnsafeMethod(
  method: string
): boolean {
  return ![
    'GET',
    'HEAD',
    'OPTIONS',
  ].includes(method.toUpperCase());
}

export function readAccessTokenCookie(
  req: Request
): string | null {
  return cookieValue(
    req,
    ACCESS_COOKIE
  );
}

export function readRefreshTokenCookie(
  req: Request
): string | null {
  return cookieValue(
    req,
    REFRESH_COOKIE
  );
}

export function writeBrowserAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
) {
  const secure =
    secureCookies();

  preventAuthCaching(res);

  res.cookie(
    ACCESS_COOKIE,
    accessToken,
    {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/v1',
      maxAge: tokenMaxAge(
        accessToken,
        15 * 60 * 1000
      ),
    }
  );

  res.cookie(
    REFRESH_COOKIE,
    refreshToken,
    {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: tokenMaxAge(
        refreshToken,
        7 * 24 * 60 * 60 * 1000
      ),
    }
  );
}

export function clearBrowserAuthCookies(
  res: Response
) {
  const secure =
    secureCookies();

  preventAuthCaching(res);

  res.clearCookie(
    ACCESS_COOKIE,
    {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/v1',
    }
  );

  res.clearCookie(
    REFRESH_COOKIE,
    {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/v1/auth',
    }
  );
}
