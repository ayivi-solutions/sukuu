const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export class StepUpRequiredError extends Error {
  readonly stepUpRequired = true;

  constructor(message: string) {
    super(message);
    this.name = 'StepUpRequiredError';
  }
}

export async function login(
  email: string,
  password: string,
  mfaCode?: string
) {
  const res = await fetch(
    `${API_URL}/api/v1/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body:
        JSON.stringify({
          email,
          password,
          ...(mfaCode
            ? {
                mfaCode,
              }
            : {}),
        }),
    }
  );

  const data =
    await res.json();

  if (!res.ok) {
    throw new Error(
      data.error ||
      'Login failed'
    );
  }

  return data;
}

export async function getDashboardSummary(token: string) {
  return authedFetch('/api/v1/dashboard/summary', token);
}

export async function authedFetch(path: string, token: string, opts: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 || data?.error === 'Invalid or expired token' || data?.error === 'No token provided') {
    localStorage.removeItem('sukuu_token');
    localStorage.removeItem('sukuu_user');
    if (typeof window !== 'undefined') window.location.href = '/login?expired=1';
    return null;
  }
  if (
    res.status === 403 &&
    data?.stepUpRequired === true
  ) {
    throw new StepUpRequiredError(
      data.error ||
      'Fresh authentication is required for this operation.'
    );
  }

  if (!res.ok && data?.error) throw new Error(data.error);
  return data;
}

export async function verifyFreshStepUp(
  token: string,
  code: string
) {
  return authedFetch(
    '/api/v1/auth/mfa/step-up/verify',
    token,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body:
        JSON.stringify({
          code,
        }),
    }
  );
}
