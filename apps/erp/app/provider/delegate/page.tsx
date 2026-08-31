'use client';

import {
  useState,
} from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:3001';

async function api(
  path: string,
  body: any
) {
  const response =
    await fetch(
      `${API_URL}${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body:
          JSON.stringify(body),
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ||
      'Delegate activation failed'
    );
  }

  return data;
}

export default function ProviderDelegatePage() {
  const [
    invitationToken,
    setInvitationToken,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    totpCode,
    setTotpCode,
  ] = useState('');

  const [
    setup,
    setSetup,
  ] = useState<any>(null);

  const [
    status,
    setStatus,
  ] = useState('');

  async function start() {
    try {
      const result =
        await api(
          '/api/v1/provider/delegate/accept/start',
          {
            invitationToken,
          }
        );

      setSetup(result);
      setStatus(
        'Add the secret below to your authenticator app, then enter a current code and your new password.'
      );
    } catch (error: any) {
      setStatus(
        error.message
      );
    }
  }

  async function complete() {
    try {
      const result =
        await api(
          '/api/v1/provider/delegate/accept/complete',
          {
            invitationToken,
            password,
            totpCode,
          }
        );

      setStatus(
        result.message ||
        'Tenant Superadmin activated.'
      );

      setInvitationToken('');
      setPassword('');
      setTotpCode('');
      setSetup(null);
    } catch (error: any) {
      setStatus(
        error.message
      );
    }
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '40px auto',
        padding: 24,
        fontFamily:
          'Arial, sans-serif',
      }}
    >
      <h1>
        Sukuu Institutional Delegate Activation
      </h1>

      <p>
        This invitation establishes the
        nominated institutional delegate
        as the first Tenant Superadmin.
        AYIVI provider authority does
        not become a school user.
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

      <input
        type="password"
        value={invitationToken}
        placeholder="One-time invitation token"
        onChange={event =>
          setInvitationToken(
            event.target.value
          )
        }
        style={{
          width: '100%',
          padding: 10,
          marginBottom: 10,
        }}
      />

      {!setup && (
        <button
          onClick={start}
          disabled={
            !invitationToken
          }
        >
          Start activation
        </button>
      )}

      {setup && (
        <>
          <div
            style={{
              marginTop: 20,
              padding: 16,
              border:
                '1px solid #ddd',
            }}
          >
            <strong>
              Authenticator account
            </strong>
            <p>
              {setup.email}
            </p>

            <strong>
              TOTP secret
            </strong>
            <pre
              style={{
                whiteSpace:
                  'pre-wrap',
              }}
            >
              {setup.secret}
            </pre>

            <p>
              You may also open the
              following URI in a
              compatible authenticator:
            </p>

            <a
              href={setup.otpAuthUri}
            >
              Configure authenticator
            </a>
          </div>

          <input
            type="password"
            value={password}
            placeholder="New password"
            onChange={event =>
              setPassword(
                event.target.value
              )
            }
            style={{
              width: '100%',
              padding: 10,
              marginTop: 12,
              marginBottom: 10,
            }}
          />

          <input
            inputMode="numeric"
            value={totpCode}
            placeholder="6-digit authenticator code"
            onChange={event =>
              setTotpCode(
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
            onClick={complete}
            disabled={
              !password ||
              !/^\d{6}$/.test(
                totpCode
              )
            }
          >
            Activate Tenant Superadmin
          </button>
        </>
      )}
    </main>
  );
}
