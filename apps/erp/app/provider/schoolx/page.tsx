'use client';

import {
  useEffect,
  useState,
} from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:3001';

const LOGIN_NAME = 'platform-owner';

function fromBase64Url(value: string) {
  const normalized =
    value
      .replace(/-/g, '+')
      .replace(/_/g, '/');

  const padded =
    normalized +
    '='.repeat(
      (4 - normalized.length % 4) % 4
    );

  const binary = atob(padded);
  const bytes =
    new Uint8Array(binary.length);

  for (
    let i = 0;
    i < binary.length;
    i += 1
  ) {
    bytes[i] =
      binary.charCodeAt(i);
  }

  return bytes.buffer;
}

function toBase64Url(
  value: ArrayBuffer | null
) {
  if (!value) return null;

  const bytes =
    new Uint8Array(value);

  let binary = '';

  bytes.forEach(byte => {
    binary +=
      String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function registrationOptions(
  options: any
): PublicKeyCredentialCreationOptions {
  return {
    ...options,
    challenge:
      fromBase64Url(
        options.challenge
      ),
    user: {
      ...options.user,
      id:
        fromBase64Url(
          options.user.id
        ),
    },
    excludeCredentials:
      options.excludeCredentials
        ?.map((item: any) => ({
          ...item,
          id:
            fromBase64Url(
              item.id
            ),
        })),
  };
}

function authenticationOptions(
  options: any
): PublicKeyCredentialRequestOptions {
  return {
    ...options,
    challenge:
      fromBase64Url(
        options.challenge
      ),
    allowCredentials:
      options.allowCredentials
        ?.map((item: any) => ({
          ...item,
          id:
            fromBase64Url(
              item.id
            ),
        })),
  };
}

function registrationResponse(
  credential: PublicKeyCredential
) {
  const response =
    credential.response as
      AuthenticatorAttestationResponse;

  return {
    id: credential.id,
    rawId:
      toBase64Url(
        credential.rawId
      ),
    type: credential.type,
    authenticatorAttachment:
      credential.authenticatorAttachment,
    clientExtensionResults:
      credential.getClientExtensionResults(),
    response: {
      clientDataJSON:
        toBase64Url(
          response.clientDataJSON
        ),
      attestationObject:
        toBase64Url(
          response.attestationObject
        ),
      transports:
        typeof response.getTransports ===
          'function'
          ? response.getTransports()
          : [],
    },
  };
}

function authenticationResponse(
  credential: PublicKeyCredential
) {
  const response =
    credential.response as
      AuthenticatorAssertionResponse;

  return {
    id: credential.id,
    rawId:
      toBase64Url(
        credential.rawId
      ),
    type: credential.type,
    authenticatorAttachment:
      credential.authenticatorAttachment,
    clientExtensionResults:
      credential.getClientExtensionResults(),
    response: {
      clientDataJSON:
        toBase64Url(
          response.clientDataJSON
        ),
      authenticatorData:
        toBase64Url(
          response.authenticatorData
        ),
      signature:
        toBase64Url(
          response.signature
        ),
      userHandle:
        toBase64Url(
          response.userHandle
        ),
    },
  };
}

async function api(
  path: string,
  options: RequestInit = {}
) {
  const response =
    await fetch(
      `${API_URL}${path}`,
      {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type':
            'application/json',
          'X-Sukuu-Provider-CSRF':
            '1',
          ...(options.headers || {}),
        },
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ||
      'Provider request failed'
    );
  }

  return data;
}

export default function ProviderSchoolXPage() {
  const [
    bootstrapToken,
    setBootstrapToken,
  ] = useState('');

  const [
    providerReady,
    setProviderReady,
  ] = useState(false);

  const [
    status,
    setStatus,
  ] = useState('');

  const [
    schools,
    setSchools,
  ] = useState<any[]>([]);

  const [
    createForm,
    setCreateForm,
  ] = useState({
    name: '',
    code: '',
    schoolType: 'BASIC',
    address: '',
    city: '',
    region: '',
    country: 'Ghana',
    phone: '',
    email: '',
    ownershipType: 'PRIVATE',
  });

  const [
    delegate,
    setDelegate,
  ] = useState({
    schoolId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    reason:
      'Initial institutional delegate nomination',
  });

  const [
    approval,
    setApproval,
  ] = useState({
    schoolId: '',
    reason:
      'Institution verification evidence reviewed and approved',
  });

  const [
    issuedInvite,
    setIssuedInvite,
  ] = useState('');

  useEffect(() => {
    api(
      '/api/v1/provider/me'
    )
      .then(() => {
        setProviderReady(true);
        return loadSchools();
      })
      .catch(() => {
        setProviderReady(false);
      });
  }, []);

  async function loadSchools() {
    try {
      const data =
        await api(
          '/api/v1/provider/schoolx/institutions'
        );

      setSchools(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error: any) {
      setStatus(
        error.message
      );
    }
  }

  async function enrollProvider() {
    setStatus(
      'Starting hardware-backed WebAuthn enrollment...'
    );

    try {
      const begin =
        await api(
          '/api/v1/provider/auth/registration/options',
          {
            method: 'POST',
            body:
              JSON.stringify({
                loginName:
                  LOGIN_NAME,
                bootstrapToken,
              }),
          }
        );

      const credential =
        await navigator.credentials.create({
          publicKey:
            registrationOptions(
              begin.options
            ),
        }) as
          | PublicKeyCredential
          | null;

      if (!credential) {
        throw new Error(
          'No authenticator response was returned'
        );
      }

      await api(
        '/api/v1/provider/auth/registration/verify',
        {
          method: 'POST',
          body:
            JSON.stringify({
              loginName:
                LOGIN_NAME,
              bootstrapToken,
              challengeId:
                begin.challengeId,
              response:
                registrationResponse(
                  credential
                ),
            }),
        }
      );

      setBootstrapToken('');
      setStatus(
        'Provider security-key enrollment completed. Sign in next.'
      );
    } catch (error: any) {
      setStatus(
        error.message
      );
    }
  }

  async function signInProvider() {
    setStatus(
      'Waiting for provider authenticator...'
    );

    try {
      const begin =
        await api(
          '/api/v1/provider/auth/options',
          {
            method: 'POST',
            body:
              JSON.stringify({
                loginName:
                  LOGIN_NAME,
              }),
          }
        );

      const credential =
        await navigator.credentials.get({
          publicKey:
            authenticationOptions(
              begin.options
            ),
        }) as
          | PublicKeyCredential
          | null;

      if (!credential) {
        throw new Error(
          'No authenticator response was returned'
        );
      }

      const completed =
        await api(
          '/api/v1/provider/auth/verify',
          {
            method: 'POST',
            body:
              JSON.stringify({
                loginName:
                  LOGIN_NAME,
                challengeId:
                  begin.challengeId,
                response:
                  authenticationResponse(
                    credential
                  ),
              }),
          }
        );

      if (
        completed.success !== true
      ) {
        throw new Error(
          'Provider session was not established'
        );
      }

      setProviderReady(true);

      setStatus(
        'Provider session established.'
      );

      await loadSchools();
    } catch (error: any) {
      setStatus(
        error.message
      );
    }
  }

  async function createSchool() {
    try {
      await api(
        '/api/v1/provider/schoolx/institutions',
        {
          method: 'POST',
          body:
            JSON.stringify(
              createForm
            ),
        }
      );

      setStatus(
        'Institution created in DRAFT state.'
      );

      await loadSchools();
    } catch (error: any) {
      setStatus(
        error.message
      );
    }
  }

  async function nominate() {
    setIssuedInvite('');

    try {
      const result =
        await api(
          `/api/v1/provider/schoolx/institutions/${delegate.schoolId}/delegate`,
          {
            method: 'POST',
            body:
              JSON.stringify(
                delegate
              ),
          }
        );

      setIssuedInvite(
        result.inviteToken
      );

      setStatus(
        'Delegate nominated. Copy the one-time invitation token now.'
      );

      await loadSchools();
    } catch (error: any) {
      setStatus(
        error.message
      );
    }
  }

  async function approve() {
    try {
      await api(
        `/api/v1/provider/schoolx/institutions/${approval.schoolId}/approve`,
        {
          method: 'POST',
          body:
            JSON.stringify({
              reason:
                approval.reason,
            }),
        }
      );

      setStatus(
        'Institution verification approved and ACTIVE.'
      );

      await loadSchools();
    } catch (error: any) {
      setStatus(
        error.message
      );
    }
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: '40px auto',
        padding: 24,
        fontFamily:
          'Arial, sans-serif',
      }}
    >
      <h1>
        Sukuu Provider SchoolX
      </h1>

      <p>
        Provider authority is separate
        from every school tenant. This
        workspace never uses a school
        Superadmin session.
      </p>

      {status && (
        <p
          role="status"
          style={{
            padding: 12,
            background: '#f3f4f6',
          }}
        >
          {status}
        </p>
      )}

      {!providerReady && (
        <>
          <section
            style={{
              marginBottom: 32,
              border:
                '1px solid #ddd',
              padding: 16,
            }}
          >
            <h2>
              First provider enrollment
            </h2>

            <input
              type="password"
              value={bootstrapToken}
              placeholder="One-time bootstrap token"
              onChange={event =>
                setBootstrapToken(
                  event.target.value
                )
              }
              style={{
                width: '100%',
                padding: 10,
                marginBottom: 10,
              }}
            />

            <button
              onClick={enrollProvider}
              disabled={
                !bootstrapToken
              }
            >
              Enroll hardware-backed WebAuthn
            </button>
          </section>

          <section
            style={{
              marginBottom: 32,
              border:
                '1px solid #ddd',
              padding: 16,
            }}
          >
            <h2>
              Provider sign-in
            </h2>

            <button
              onClick={signInProvider}
            >
              Sign in with approved security key
            </button>
          </section>
        </>
      )}

      {providerReady && (
        <>
          <section
            style={{
              marginBottom: 32,
            }}
          >
            <button
              onClick={async () => {
                try {
                  await api(
                    '/api/v1/provider/logout',
                    {
                      method: 'POST',
                    }
                  );
                } finally {
                  setProviderReady(false);
                  setSchools([]);
                  setStatus(
                    'Provider session ended.'
                  );
                }
              }}
            >
              Sign out provider session
            </button>
          </section>

          <section
            style={{
              marginBottom: 32,
              border:
                '1px solid #ddd',
              padding: 16,
            }}
          >
            <h2>
              Institution register
            </h2>

            <button
              onClick={() =>
                loadSchools()
              }
            >
              Refresh
            </button>

            <table
              style={{
                width: '100%',
                marginTop: 12,
                borderCollapse:
                  'collapse',
              }}
            >
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Delegate</th>
                </tr>
              </thead>
              <tbody>
                {schools.map(
                  school => (
                    <tr
                      key={school.id}
                    >
                      <td>
                        {school.id}
                      </td>
                      <td>
                        {school.name}
                      </td>
                      <td>
                        {school.code}
                      </td>
                      <td>
                        {school.status}
                      </td>
                      <td>
                        {school.delegate_status ||
                          '—'}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </section>

          <section
            style={{
              marginBottom: 32,
              border:
                '1px solid #ddd',
              padding: 16,
            }}
          >
            <h2>
              Create institution
            </h2>

            {Object.entries(
              createForm
            ).map(([key, value]) => (
              <input
                key={key}
                value={value}
                placeholder={key}
                onChange={event =>
                  setCreateForm(
                    current => ({
                      ...current,
                      [key]:
                        event.target.value,
                    })
                  )
                }
                style={{
                  width: '100%',
                  padding: 8,
                  marginBottom: 8,
                }}
              />
            ))}

            <button
              onClick={createSchool}
            >
              Create DRAFT institution
            </button>
          </section>

          <section
            style={{
              marginBottom: 32,
              border:
                '1px solid #ddd',
              padding: 16,
            }}
          >
            <h2>
              Nominate initial Tenant Superadmin
            </h2>

            {Object.entries(
              delegate
            ).map(([key, value]) => (
              <input
                key={key}
                value={value}
                placeholder={key}
                onChange={event =>
                  setDelegate(
                    current => ({
                      ...current,
                      [key]:
                        event.target.value,
                    })
                  )
                }
                style={{
                  width: '100%',
                  padding: 8,
                  marginBottom: 8,
                }}
              />
            ))}

            <button
              onClick={nominate}
            >
              Nominate delegate
            </button>

            {issuedInvite && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  border:
                    '1px solid #b91c1c',
                }}
              >
                <strong>
                  One-time invitation token
                </strong>
                <pre
                  style={{
                    whiteSpace:
                      'pre-wrap',
                  }}
                >
                  {issuedInvite}
                </pre>
                <p>
                  Transfer this token to
                  the nominated delegate
                  out-of-band. It will
                  not be displayed again
                  by the API.
                </p>
              </div>
            )}
          </section>

          <section
            style={{
              marginBottom: 32,
              border:
                '1px solid #ddd',
              padding: 16,
            }}
          >
            <h2>
              Approve institution verification
            </h2>

            <input
              value={approval.schoolId}
              placeholder="schoolId"
              onChange={event =>
                setApproval(
                  current => ({
                    ...current,
                    schoolId:
                      event.target.value,
                  })
                )
              }
              style={{
                width: '100%',
                padding: 8,
                marginBottom: 8,
              }}
            />

            <textarea
              value={approval.reason}
              onChange={event =>
                setApproval(
                  current => ({
                    ...current,
                    reason:
                      event.target.value,
                  })
                )
              }
              style={{
                width: '100%',
                padding: 8,
                minHeight: 90,
                marginBottom: 8,
              }}
            />

            <button
              onClick={approve}
            >
              Approve UNDER_VERIFICATION → ACTIVE
            </button>
          </section>
        </>
      )}
    </main>
  );
}
