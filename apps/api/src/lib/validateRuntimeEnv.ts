function requireValue(name: string): string {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Required environment variable ${name} is missing`
    );
  }

  return value;
}


export function validateRuntimeEnvironment(): void {
  const databaseUrl =
    requireValue('DATABASE_URL');

  const jwtSecret =
    requireValue('JWT_SECRET');

  const jwtRefreshSecret =
    requireValue('JWT_REFRESH_SECRET');

  const rlsContextSecret =
    requireValue('RLS_CONTEXT_SECRET');

  const mfaEncryptionKey =
    requireValue('MFA_ENCRYPTION_KEY');

  const mfaProofSecret =
    requireValue('MFA_PROOF_SECRET');


  if (jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET must contain at least 32 characters'
    );
  }


  if (jwtRefreshSecret.length < 32) {
    throw new Error(
      'JWT_REFRESH_SECRET must contain at least 32 characters'
    );
  }


  if (rlsContextSecret.length < 32) {
    throw new Error(
      'RLS_CONTEXT_SECRET must contain at least 32 characters'
    );
  }


  let mfaEncryptionKeyBytes: Buffer;

  try {

    mfaEncryptionKeyBytes =
      Buffer.from(
        mfaEncryptionKey,
        'base64'
      );

  } catch {

    throw new Error(
      'MFA_ENCRYPTION_KEY must be a valid base64 value'
    );

  }


  if (mfaEncryptionKeyBytes.length !== 32) {

    throw new Error(
      'MFA_ENCRYPTION_KEY must decode to exactly 32 bytes'
    );

  }


  let mfaProofSecretBytes: Buffer;

  try {

    mfaProofSecretBytes =
      Buffer.from(
        mfaProofSecret,
        'base64'
      );

  } catch {

    throw new Error(
      'MFA_PROOF_SECRET must be a valid base64 value'
    );

  }


  if (
    mfaProofSecretBytes.length !== 32
  ) {

    throw new Error(
      'MFA_PROOF_SECRET must decode to exactly 32 bytes'
    );

  }


  let databaseUsername = '';

  try {
    databaseUsername =
      decodeURIComponent(
        new URL(databaseUrl).username
      );
  } catch {
    throw new Error(
      'DATABASE_URL is not a valid PostgreSQL connection URL'
    );
  }


  if (process.env.NODE_ENV === 'production') {

    if (
      databaseUsername === 'postgres' ||
      databaseUsername.startsWith('postgres.')
    ) {
      throw new Error(
        'Production API must not run with the postgres administrative database role'
      );
    }


    if (
      databaseUsername !== 'sukuu_app_runtime' &&
      !databaseUsername.startsWith(
        'sukuu_app_runtime.'
      )
    ) {
      throw new Error(
        'Production DATABASE_URL must use the sukuu_app_runtime role'
      );
    }


    requireValue('CORS_ORIGINS');
  }
}
