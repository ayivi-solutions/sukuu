import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  WebAuthnCredential,
} from '@simplewebauthn/server';
import {
  createHash,
  createHmac,
} from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';

type JsonResult = {
  ok: boolean;
  reason?: string;
  providerId?: string;
  loginName?: string;
  displayName?: string;
  challengeId?: string;
  sessionId?: string;
  challenge?: string;
  credentialId?: string;
  publicKeyBase64?: string;
  counter?: number | string;
  transports?: string | null;
  expiresAt?: string;
};

function normalizedBootstrapToken(
  token: string
): string {
  const value = String(token || '').trim();

  if (
    value.length < 32 ||
    value.length > 256
  ) {
    throw new Error(
      'Provider enrollment authorization failed'
    );
  }

  return value;
}

function tokenHash(token: string): string {
  return createHash('sha256')
    .update(token, 'utf8')
    .digest('hex');
}

function rlsProof(
  message: string
): string {
  const secret =
    process.env.RLS_CONTEXT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'RLS_CONTEXT_SECRET is required for provider authority'
    );
  }

  return createHmac(
    'sha256',
    secret
  )
    .update(message, 'utf8')
    .digest('hex');
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

function providerRpConfig() {
  const configuredOrigin =
    process.env.PROVIDER_WEBAUTHN_ORIGIN ||
    (
      process.env.CORS_ORIGINS || ''
    )
      .split(',')
      .map(value => value.trim())
      .find(Boolean) ||
    '';

  if (!configuredOrigin) {
    throw new Error(
      'Provider WebAuthn origin is not configured'
    );
  }

  const parsed = new URL(configuredOrigin);

  if (
    parsed.protocol !== 'https:' &&
    ![
      'localhost',
      '127.0.0.1',
    ].includes(parsed.hostname)
  ) {
    throw new Error(
      'Provider WebAuthn requires HTTPS outside localhost'
    );
  }

  return {
    origin: parsed.origin,
    rpID:
      process.env.PROVIDER_WEBAUTHN_RP_ID ||
      parsed.hostname,
  };
}

async function jsonFunction(
  sql:
    | Promise<Array<{ result: JsonResult }>>
): Promise<JsonResult> {
  const rows = await sql;

  return (
    rows[0]?.result || {
      ok: false,
      reason: 'NO_RESULT',
    }
  );
}

export async function beginProviderRegistration(
  loginName: string,
  bootstrapToken: string
) {
  const login =
    String(loginName || '')
      .trim()
      .toLowerCase();

  const token =
    normalizedBootstrapToken(
      bootstrapToken
    );

  const hash = tokenHash(token);

  const material =
    await jsonFunction(
      prisma.$queryRaw<
        Array<{ result: JsonResult }>
      >`
        SELECT
          system.provider_bootstrap_material(
            ${login},
            ${hash}
          ) AS result
      `
    );

  if (
    !material.ok ||
    !material.providerId ||
    !material.loginName
  ) {
    throw new Error(
      'Provider enrollment authorization failed'
    );
  }

  const { origin: _origin, rpID } =
    providerRpConfig();

  const options =
    await generateRegistrationOptions({
      rpName:
        'Sukuu Provider Administration',
      rpID,
      userID:
        Buffer.from(
          material.providerId,
          'utf8'
        ),
      userName:
        material.loginName,
      userDisplayName:
        material.displayName ||
        'Platform Owner',
      attestationType: 'direct',
      supportedAlgorithmIDs:
        [-7, -257],
      authenticatorSelection: {
        authenticatorAttachment:
          'cross-platform',
        residentKey: 'discouraged',
        userVerification: 'required',
      },
      timeout: 120000,
    });

  const challengeResult =
    await jsonFunction(
      prisma.$queryRaw<
        Array<{ result: JsonResult }>
      >`
        SELECT
          system.provider_registration_challenge_begin(
            ${login},
            ${hash},
            ${options.challenge},
            ${new Date(
              Date.now() + 2 * 60 * 1000
            )}
          ) AS result
      `
    );

  if (
    !challengeResult.ok ||
    !challengeResult.challengeId
  ) {
    throw new Error(
      'Provider enrollment could not be started'
    );
  }

  return {
    options,
    challengeId:
      challengeResult.challengeId,
  };
}

export async function completeProviderRegistration(
  loginName: string,
  bootstrapToken: string,
  challengeId: string,
  response: any
) {
  const login =
    String(loginName || '')
      .trim()
      .toLowerCase();

  const token =
    normalizedBootstrapToken(
      bootstrapToken
    );

  const hash = tokenHash(token);

  const material =
    await jsonFunction(
      prisma.$queryRaw<
        Array<{ result: JsonResult }>
      >`
        SELECT
          system.provider_registration_material(
            ${login},
            ${hash},
            ${challengeId}
          ) AS result
      `
    );

  if (
    !material.ok ||
    !material.providerId ||
    !material.challenge
  ) {
    throw new Error(
      'Provider enrollment verification failed'
    );
  }

  const { origin, rpID } =
    providerRpConfig();

  const verification =
    await verifyRegistrationResponse({
      response,
      expectedChallenge:
        material.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

  if (
    !verification.verified ||
    !verification.registrationInfo
  ) {
    throw new Error(
      'Provider security-key verification failed'
    );
  }

  const {
    credential,
    credentialDeviceType,
    credentialBackedUp,
    aaguid,
    fmt,
  } = verification.registrationInfo;

  const attachment =
    response?.authenticatorAttachment;

  const allowedAaguids =
    new Set(
      (
        process.env
          .PROVIDER_WEBAUTHN_ALLOWED_AAGUIDS ||
        ''
      )
        .split(',')
        .map(value =>
          value
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    );

  if (
    allowedAaguids.size === 0
  ) {
    throw new Error(
      'Provider authenticator allowlist is not configured'
    );
  }

  if (
    fmt ===
      'none' ||
    credentialDeviceType !==
      'singleDevice' ||
    credentialBackedUp !== false ||
    attachment !==
      'cross-platform' ||
    !allowedAaguids.has(
      String(aaguid)
        .toLowerCase()
    )
  ) {
    throw new Error(
      'Provider administration requires an approved directly-attested external security key'
    );
  }

  const proof = rlsProof(
    [
      'provider-register',
      material.providerId,
      challengeId,
      credential.id,
      String(credential.counter),
    ].join(':')
  );

  const completed =
    await jsonFunction(
      prisma.$queryRaw<
        Array<{ result: JsonResult }>
      >`
        SELECT
          system.provider_registration_complete(
            ${login},
            ${hash},
            ${challengeId},
            ${credential.id},
            ${Buffer.from(
              credential.publicKey
            )},
            ${BigInt(
              credential.counter
            )},
            ${JSON.stringify(
              credential.transports || []
            )},
            ${credentialDeviceType},
            ${credentialBackedUp},
            ${String(aaguid || '')},
            ${attachment},
            ${proof}
          ) AS result
      `
    );

  if (!completed.ok) {
    throw new Error(
      'Provider enrollment verification failed'
    );
  }

  return {
    success: true,
    message:
      'Provider hardware-backed WebAuthn enrollment completed. Sign in to open the provider session.',
  };
}

type ProviderCredentialMaterial = {
  provider_id: string;
  login_name: string;
  credential_id: string;
  public_key_base64: string;
  counter: bigint;
  transports: string | null;
};

export async function beginProviderLogin(
  loginName: string
) {
  const login =
    String(loginName || '')
      .trim()
      .toLowerCase();

  const rows =
    await prisma.$queryRaw<
      ProviderCredentialMaterial[]
    >`
      SELECT *
      FROM system.provider_auth_material(
        ${login}
      )
    `;

  if (!rows.length) {
    throw new Error(
      'Provider authentication failed'
    );
  }

  const { rpID } =
    providerRpConfig();

  const options =
    await generateAuthenticationOptions({
      rpID,
      userVerification: 'required',
      timeout: 120000,
      allowCredentials:
        rows.map(row => ({
          id: row.credential_id,
          transports:
            row.transports
              ? JSON.parse(
                  row.transports
                )
              : undefined,
        })),
    });

  const challenge =
    await jsonFunction(
      prisma.$queryRaw<
        Array<{ result: JsonResult }>
      >`
        SELECT
          system.provider_auth_challenge_begin(
            ${rows[0].provider_id},
            ${options.challenge},
            ${new Date(
              Date.now() + 2 * 60 * 1000
            )}
          ) AS result
      `
    );

  if (
    !challenge.ok ||
    !challenge.challengeId
  ) {
    throw new Error(
      'Provider authentication failed'
    );
  }

  return {
    options,
    challengeId:
      challenge.challengeId,
  };
}

export async function completeProviderLogin(
  loginName: string,
  challengeId: string,
  response: any,
  meta: {
    ipAddress?: string | null;
    userAgent?: string | null;
  } = {}
) {
  const login =
    String(loginName || '')
      .trim()
      .toLowerCase();

  const material =
    await jsonFunction(
      prisma.$queryRaw<
        Array<{ result: JsonResult }>
      >`
        SELECT
          system.provider_auth_verify_material(
            ${login},
            ${challengeId},
            ${String(
              response?.id || ''
            )}
          ) AS result
      `
    );

  if (
    !material.ok ||
    !material.providerId ||
    !material.challenge ||
    !material.credentialId ||
    !material.publicKeyBase64
  ) {
    throw new Error(
      'Provider authentication failed'
    );
  }

  const { origin, rpID } =
    providerRpConfig();

  const credential: WebAuthnCredential = {
    id: material.credentialId,
    publicKey:
      new Uint8Array(
        Buffer.from(
          material.publicKeyBase64,
          'base64'
        )
      ),
    counter:
      Number(material.counter || 0),
    transports:
      material.transports
        ? JSON.parse(
            material.transports
          )
        : undefined,
  };

  const verification =
    await verifyAuthenticationResponse({
      response,
      expectedChallenge:
        material.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential,
      requireUserVerification: true,
    });

  if (!verification.verified) {
    throw new Error(
      'Provider authentication failed'
    );
  }

  const newCounter =
    verification.authenticationInfo
      .newCounter;

  const proof = rlsProof(
    [
      'provider-auth',
      material.providerId,
      challengeId,
      material.credentialId,
      String(newCounter),
    ].join(':')
  );

  const completed =
    await jsonFunction(
      prisma.$queryRaw<
        Array<{ result: JsonResult }>
      >`
        SELECT
          system.provider_auth_complete(
            ${material.providerId},
            ${challengeId},
            ${material.credentialId},
            ${BigInt(newCounter)},
            ${meta.ipAddress ?? null},
            ${meta.userAgent ?? null},
            ${proof}
          ) AS result
      `
    );

  if (
    !completed.ok ||
    !completed.providerId ||
    !completed.sessionId
  ) {
    throw new Error(
      'Provider authentication failed'
    );
  }

  const accessToken =
    jwt.sign(
      {
        providerId:
          completed.providerId,
        sessionId:
          completed.sessionId,
        authority:
          'platform_admin',
        assurance:
          'WEBAUTHN_HARDWARE',
      },
      providerJwtSecret(),
      {
        expiresIn: '15m',
        audience: 'sukuu-provider',
        issuer: 'sukuu-api',
      }
    );

  return {
    accessToken,
    expiresAt:
      completed.expiresAt || null,
    provider: {
      id:
        completed.providerId,
      authority:
        'platform_admin',
      assurance:
        'WEBAUTHN_HARDWARE',
    },
  };
}
