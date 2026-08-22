const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
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
  if (!res.ok && data?.error) throw new Error(data.error);
  return data;
}
