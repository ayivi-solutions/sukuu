import {
  Request,
  Response,
} from 'express';
import jwt from 'jsonwebtoken';

const PROVIDER_COOKIE =
  'sukuu_provider_access';

const PROVIDER_CSRF_HEADER =
  'x-sukuu-provider-csrf';

function cookieValue(
  req: Request,
  name: string
): string | null {
  const header =
    req.headers.cookie || '';

  for (
    const part
    of header.split(';')
  ) {
    const separator =
      part.indexOf('=');

    if (separator < 0) {
      continue;
    }

    const key =
      part
        .slice(0, separator)
        .trim();

    if (key !== name) {
      continue;
    }

    const raw =
      part
        .slice(separator + 1)
        .trim();

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

function secureCookies(): boolean {
  return (
    process.env.NODE_ENV ===
    'production'
  );
}

function trustedProviderOrigin(): string {
  const raw =
    process.env
      .PROVIDER_WEBAUTHN_ORIGIN ||
    '';

  if (!raw) {
    return '';
  }

  try {
    return new URL(raw).origin;
  } catch {
    return '';
  }
}

function preventCaching(
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

function tokenMaxAge(
  token: string
) {
  const claims =
    jwt.decode(token) as
      | jwt.JwtPayload
      | null;

  if (!claims?.exp) {
    return 15 * 60 * 1000;
  }

  return Math.max(
    1000,
    claims.exp * 1000 -
      Date.now()
  );
}

export function
readProviderAccessCookie(
  req: Request
): string | null {
  return cookieValue(
    req,
    PROVIDER_COOKIE
  );
}

export function
isTrustedProviderBrowserRequest(
  req: Request
): boolean {
  const expectedOrigin =
    trustedProviderOrigin();

  const origin =
    req.get('origin') || '';

  const csrf =
    req.get(
      PROVIDER_CSRF_HEADER
    ) || '';

  return (
    expectedOrigin.length > 0 &&
    origin === expectedOrigin &&
    csrf === '1'
  );
}

export function
writeProviderAuthCookie(
  res: Response,
  accessToken: string
) {
  preventCaching(res);

  res.cookie(
    PROVIDER_COOKIE,
    accessToken,
    {
      httpOnly: true,
      secure: secureCookies(),
      sameSite: 'strict',
      path: '/api/v1/provider',
      maxAge:
        tokenMaxAge(
          accessToken
        ),
    }
  );
}

export function
clearProviderAuthCookie(
  res: Response
) {
  preventCaching(res);

  res.clearCookie(
    PROVIDER_COOKIE,
    {
      httpOnly: true,
      secure: secureCookies(),
      sameSite: 'strict',
      path: '/api/v1/provider',
    }
  );
}
