import { createHmac } from 'crypto';

const REFRESH_DIGEST_PREFIX =
  'h1:';

function readDigestSecret(): Buffer {
  const encoded =
    process.env
      .REFRESH_TOKEN_DIGEST_SECRET
      ?.trim();

  if (!encoded) {
    throw new Error(
      'REFRESH_TOKEN_DIGEST_SECRET is missing'
    );
  }

  const secret =
    Buffer.from(
      encoded,
      'base64'
    );

  if (
    secret.length !== 32 ||
    secret
      .toString('base64')
      .replace(/=+$/, '') !==
      encoded.replace(/=+$/, '')
  ) {
    throw new Error(
      'REFRESH_TOKEN_DIGEST_SECRET must decode to exactly 32 bytes'
    );
  }

  return secret;
}

export function digestRefreshToken(
  refreshToken: string
): string {
  if (
    typeof refreshToken !== 'string' ||
    refreshToken.length < 32
  ) {
    throw new Error(
      'Refresh token is invalid'
    );
  }

  const digest =
    createHmac(
      'sha256',
      readDigestSecret()
    )
      .update(
        refreshToken,
        'utf8'
      )
      .digest('hex');

  return (
    REFRESH_DIGEST_PREFIX +
    digest
  );
}
