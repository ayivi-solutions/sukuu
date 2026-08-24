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
