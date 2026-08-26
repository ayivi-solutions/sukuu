const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:3001';

const REFRESH_LOCK_KEY =
  'sukuu_refresh_lock';

const AUTH_CHANNEL =
  'sukuu_auth_events';

type LockManagerLike = {
  request<T>(
    name: string,
    callback: () => Promise<T>
  ): Promise<T>;
};

export class StepUpRequiredError extends Error {
  readonly stepUpRequired = true;

  constructor(message: string) {
    super(message);
    this.name = 'StepUpRequiredError';
  }
}

function browserHeaders(
  input?: HeadersInit
): Headers {
  const headers =
    new Headers(input);

  headers.set(
    'X-Sukuu-Auth-Transport',
    'cookie'
  );

  headers.set(
    'X-Sukuu-CSRF',
    '1'
  );

  return headers;
}

function browserFetch(
  path: string,
  options: RequestInit = {}
) {
  return fetch(
    `${API_URL}${path}`,
    {
      ...options,
      credentials: 'include',
      headers:
        browserHeaders(
          options.headers
        ),
    }
  );
}

function broadcastAuthEvent(
  type: 'refresh' | 'logout'
) {
  if (
    typeof window === 'undefined' ||
    typeof BroadcastChannel ===
      'undefined'
  ) {
    return;
  }

  const channel =
    new BroadcastChannel(
      AUTH_CHANNEL
    );

  channel.postMessage({
    type,
    at: Date.now(),
  });

  channel.close();
}

export function subscribeToAuthEvents(
  onLogout: () => void
) {
  if (
    typeof window === 'undefined' ||
    typeof BroadcastChannel ===
      'undefined'
  ) {
    return () => {};
  }

  const channel =
    new BroadcastChannel(
      AUTH_CHANNEL
    );

  channel.onmessage = event => {
    if (event.data?.type === 'logout') {
      clearBrowserSession();
      onLogout();
    }
  };

  return () => {
    channel.close();
  };
}

function safeSessionStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function establishBrowserSession(
  user: any
) {
  const storage =
    safeSessionStorage();

  if (!storage) {
    return;
  }

  const presentation = {
    firstName:
      user?.firstName || null,
    lastName:
      user?.lastName || null,
    roleKey:
      user?.roleKey || null,
    roleLabel:
      user?.roleLabel || null,
  };

  storage.setItem(
    'sukuu_user',
    JSON.stringify(presentation)
  );
}

export function clearBrowserSession() {
  const storage =
    safeSessionStorage();

  storage?.removeItem(
    'sukuu_user'
  );
}

function redirectToExpiredLogin() {
  clearBrowserSession();

  if (typeof window !== 'undefined') {
    window.location.href =
      '/login?expired=1';
  }
}

async function responseData(
  response: Response
) {
  return response
    .json()
    .catch(() => ({}));
}

export async function login(
  email: string,
  password: string,
  mfaCode?: string
) {
  const res =
    await browserFetch(
      '/api/v1/auth/login',
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
              ? { mfaCode }
              : {}),
          }),
      }
    );

  const data =
    await responseData(res);

  if (!res.ok) {
    throw new Error(
      data.error ||
      'Login failed'
    );
  }

  return data;
}

async function performRefresh(): Promise<boolean> {
  const res =
    await browserFetch(
      '/api/v1/auth/refresh',
      {
        method: 'POST',
      }
    ).catch(() => null);

  if (!res?.ok) {
    return false;
  }

  broadcastAuthEvent(
    'refresh'
  );

  return true;
}

function sleep(ms: number) {
  return new Promise(resolve => {
    window.setTimeout(
      resolve,
      ms
    );
  });
}

async function withStorageRefreshLock(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  const owner =
    `${Date.now()}:${Math.random()}`;

  const deadline =
    Date.now() + 10000;

  while (Date.now() < deadline) {
    const now = Date.now();
    let existing:
      | {
          owner?: string;
          expiresAt?: number;
        }
      | null = null;

    try {
      existing = JSON.parse(
        window.localStorage.getItem(
          REFRESH_LOCK_KEY
        ) || 'null'
      );
    } catch {
      existing = null;
    }

    if (
      !existing?.expiresAt ||
      existing.expiresAt <= now
    ) {
      window.localStorage.setItem(
        REFRESH_LOCK_KEY,
        JSON.stringify({
          owner,
          expiresAt: now + 12000,
        })
      );

      let confirmed:
        | { owner?: string }
        | null = null;

      try {
        confirmed = JSON.parse(
          window.localStorage.getItem(
            REFRESH_LOCK_KEY
          ) || 'null'
        );
      } catch {
        confirmed = null;
      }

      if (confirmed?.owner === owner) {
        try {
          return await performRefresh();
        } finally {
          try {
            const current = JSON.parse(
              window.localStorage.getItem(
                REFRESH_LOCK_KEY
              ) || 'null'
            );

            if (current?.owner === owner) {
              window.localStorage.removeItem(
                REFRESH_LOCK_KEY
              );
            }
          } catch {
            window.localStorage.removeItem(
              REFRESH_LOCK_KEY
            );
          }
        }
      }
    }

    await sleep(100);
  }

  return false;
}

let refreshPromise:
  | Promise<boolean>
  | null = null;

function refreshBrowserSession(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise =
    (async () => {
      if (typeof window === 'undefined') {
        return false;
      }

      const locks =
        (
          navigator as Navigator & {
            locks?: LockManagerLike;
          }
        ).locks;

      if (locks) {
        return locks.request(
          'sukuu_refresh_rotation',
          performRefresh
        );
      }

      return withStorageRefreshLock();
    })().finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function authedFetchInternal(
  path: string,
  opts: RequestInit,
  mayRefresh: boolean
): Promise<any> {
  const res =
    await browserFetch(
      path,
      opts
    );

  const data =
    await responseData(res);

  if (
    res.status === 401 &&
    mayRefresh &&
    path !== '/api/v1/auth/refresh'
  ) {
    const refreshed =
      await refreshBrowserSession();

    if (refreshed) {
      return authedFetchInternal(
        path,
        opts,
        false
      );
    }

    redirectToExpiredLogin();
    return null;
  }

  if (res.status === 401) {
    redirectToExpiredLogin();
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

  if (!res.ok && data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function authedFetch(
  path: string,
  _legacyToken = '',
  opts: RequestInit = {}
) {
  return authedFetchInternal(
    path,
    opts,
    true
  );
}

export async function getDashboardSummary(
  legacyToken = ''
) {
  return authedFetch(
    '/api/v1/dashboard/summary',
    legacyToken
  );
}

export async function verifyFreshStepUp(
  legacyToken: string,
  code: string
) {
  return authedFetch(
    '/api/v1/auth/mfa/step-up/verify',
    legacyToken,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body:
        JSON.stringify({ code }),
    }
  );
}

export async function endBrowserSession() {
  const result =
    await authedFetch(
      '/api/v1/auth/logout',
      '',
      {
        method: 'POST',
      }
    );

  if (!result?.success) {
    throw new Error(
      'Secure sign-out could not be confirmed. Check your connection and try again.'
    );
  }

  clearBrowserSession();
  broadcastAuthEvent(
    'logout'
  );
}
