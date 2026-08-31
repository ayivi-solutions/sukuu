import {
  NextFunction,
  Request,
  Response,
} from 'express';
import jwt from 'jsonwebtoken';
import { createHmac } from 'crypto';
import { prisma } from '../lib/prisma';
import {
  isTrustedProviderBrowserRequest,
  readProviderAccessCookie,
} from '../lib/providerBrowserTransport';
import {
  runWithProviderContext,
} from '../lib/providerContext';

export interface ProviderAuthRequest extends Request {
  providerId?: string;
  providerSessionId?: string;
  providerAuthority?: 'platform_admin';
  providerAssurance?: 'WEBAUTHN_HARDWARE';
}

function providerJwtSecret(): Buffer {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET is required for provider authentication'
    );
  }

  return createHmac(
    'sha256',
    secret
  )
    .update(
      'sukuu-provider-jwt-v1',
      'utf8'
    )
    .digest();
}

export async function authenticateProvider(
  req: ProviderAuthRequest,
  res: Response,
  next: NextFunction
) {
  if (
    !isTrustedProviderBrowserRequest(
      req
    )
  ) {
    return res.status(403).json({
      error:
        'Provider browser request was not trusted',
    });
  }

  const token =
    readProviderAccessCookie(
      req
    );

  if (!token) {
    return res.status(401).json({
      error: 'Provider authentication required',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      providerJwtSecret(),
      {
        audience: 'sukuu-provider',
        issuer: 'sukuu-api',
      }
    ) as jwt.JwtPayload & {
      providerId?: string;
      sessionId?: string;
      authority?: string;
      assurance?: string;
    };

    if (
      !decoded.providerId ||
      !decoded.sessionId ||
      decoded.authority !== 'platform_admin' ||
      decoded.assurance !== 'WEBAUTHN_HARDWARE'
    ) {
      return res.status(401).json({
        error: 'Provider session is invalid',
      });
    }

    const rows =
      await prisma.$queryRaw<
        Array<{
          active: boolean;
          assurance: string | null;
        }>
      >`
        SELECT *
        FROM system.provider_auth_session_lookup(
          ${decoded.sessionId},
          ${decoded.providerId}
        )
      `;

    const session = rows[0];

    if (
      !session?.active ||
      session.assurance !==
        'WEBAUTHN_HARDWARE'
    ) {
      return res.status(401).json({
        error: 'Provider session is no longer active',
      });
    }

    req.providerId = decoded.providerId;
    req.providerSessionId = decoded.sessionId;
    req.providerAuthority = 'platform_admin';
    req.providerAssurance =
      'WEBAUTHN_HARDWARE';

    return runWithProviderContext(
      {
        providerId:
          decoded.providerId,
        sessionId:
          decoded.sessionId,
      },
      async () => {
        next();
      }
    ).catch(next);
  } catch {
    return res.status(401).json({
      error: 'Provider session is invalid or expired',
    });
  }
}
