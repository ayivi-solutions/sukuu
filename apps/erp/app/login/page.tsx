'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  authedFetch,
  establishBrowserSession,
  login,
} from '../../lib/api';


function ExpiredBanner({ onExpired }: { onExpired: () => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('expired') === '1') onExpired();
  }, [searchParams, onExpired]);
  return null;
}

const inputStyle = {
  width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,.07)',
  border: '1.5px solid rgba(198,167,78,.2)', borderRadius: 'var(--rS)',
  fontSize: 14, color: 'var(--ivory)', outline: 'none',
} as const;
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(242,230,201,.5)',
  letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 6,
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  // Set once a temp-password login succeeds — holds what's needed to
  // complete the change-password step without asking the person to
  // re-type their temp password a second time.
  const [pendingReset, setPendingReset] = useState<{ email: string; tempPassword: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data =
        await login(
          email,
          password,
          mfaRequired
            ? mfaCode
            : undefined
        );

      if (
        data.mfaRequired ===
        true
      ) {
        setMfaRequired(true);
        setMfaCode('');
        return;
      }

      if (
        data.user?.mustResetPassword
      ) {
        setPendingReset({
          email,
          tempPassword:
            password,
        });

        return;
      }

      establishBrowserSession(
        data.user
      );

      router.push(
        '/dashboard'
      );

    } catch (err: any) {

      setError(
        err.message ||
        'Login failed'
      );

      if (mfaRequired) {
        setMfaCode('');
      }

    } finally {

      setLoading(false);

    }
  }

  async function handleSetNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError('');
    if (newPassword.length < 8) { setResetError('Your new password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setResetError('Passwords do not match — please type it the same way both times.'); return; }
    if (!pendingReset) return;

    setResetLoading(true);
    try {
      const data = await authedFetch(
        '/api/v1/auth/change-password',
        'cookie',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body:
            JSON.stringify({
              currentPassword:
                pendingReset.tempPassword,
              newPassword,
            }),
        }
      );

      if (!data?.success) {
        throw new Error(
          'Could not set new password'
        );
      }

      // Log in again with the new password — the freshest, simplest way
      // to get a fully-authorized token (mustResetPassword now false)
      // rather than duplicating token-issuance logic here.
      const fresh =
        await login(
          pendingReset.email,
          newPassword
        );

      if (
        fresh.mfaRequired ===
        true
      ) {
        setEmail(
          pendingReset.email
        );

        setPassword(
          newPassword
        );

        setPendingReset(
          null
        );

        setMfaRequired(
          true
        );

        setMfaCode(
          ''
        );

        setNewPassword(
          ''
        );

        setConfirmPassword(
          ''
        );

        return;
      }

      establishBrowserSession(
        fresh.user
      );

      router.push(
        '/dashboard'
      );
    } catch (err: any) {
      setResetError(err.message || 'Could not set new password');
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--navy)', position: 'relative', overflow: 'hidden',
      padding: 'clamp(20px,5vw,40px) clamp(16px,4vw,24px)',
    }}>
      <Suspense fallback={null}>
        <ExpiredBanner onExpired={() => setError('Your session expired. Please sign in again.')} />
      </Suspense>
      <div style={{
        position: 'absolute', width: 'clamp(320px,80vw,600px)', height: 'clamp(320px,80vw,600px)',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(198,167,78,.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 400,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(14px,3vw,20px)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <img src="/sukuu-logo-vertical-2.png" alt="Sukuu ERP - Schools Operating System" style={{
            width: 'clamp(140px,38vw,180px)', height: 'auto',
          }} />
        </div>

        {!pendingReset ? (
          <form onSubmit={handleSubmit} style={{
            width: '100%', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(198,167,78,.18)',
            borderRadius: 'clamp(14px,3vw,20px)', padding: 'clamp(20px,5vw,28px)', backdropFilter: 'blur(8px)',
          }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: 'rgba(242,230,201,.6)',
              letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 16, textAlign: 'center',
            }}>{mfaRequired ? 'Verify privileged sign-in' : 'Sign in to your workspace'}</div>

            {error && (
              <div style={{
                background: 'rgba(124,26,26,.2)', color: '#ff9b9b', padding: '10px 14px',
                borderRadius: 'var(--rS)', fontSize: 13, marginBottom: 14, border: '1px solid rgba(124,26,26,.4)',
              }}>{error}</div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Phone / Email</label>
              <input
                type="text" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="e.g. 0244 000 000" autoComplete="username"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Enter password" autoComplete="current-password"
                style={inputStyle}
              />
            </div>

            {mfaRequired && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Authenticator Code</label>
                <input
                  type="text"
                  value={mfaCode}
                  onChange={e =>
                    setMfaCode(
                      e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6)
                    )
                  }
                  required
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="6-digit code"
                  style={inputStyle}
                />
                <div style={{
                  fontSize: 11,
                  color: 'rgba(242,230,201,.45)',
                  marginTop: 5,
                }}>
                  Enter the current code from your Sukuu authenticator.
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 13, marginTop: 4, background: 'var(--gold)', color: 'var(--navy)',
              border: 'none', borderRadius: 'var(--rS)', fontSize: 14, fontWeight: 700, letterSpacing: '.02em',
            }}>
              {loading ? (mfaRequired ? 'Verifying…' : 'Signing in…') : (mfaRequired ? 'Verify & Sign In' : 'Sign In')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSetNewPassword} style={{
            width: '100%', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(198,167,78,.18)',
            borderRadius: 'clamp(14px,3vw,20px)', padding: 'clamp(20px,5vw,28px)', backdropFilter: 'blur(8px)',
          }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: 'rgba(242,230,201,.6)',
              letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 4, textAlign: 'center',
            }}>Set your password</div>
            <p style={{ fontSize: 12, color: 'rgba(242,230,201,.55)', textAlign: 'center', marginBottom: 16 }}>
              This is your first sign-in. Choose a password only you know before continuing — the one you were given was temporary.
            </p>

            {resetError && (
              <div style={{
                background: 'rgba(124,26,26,.2)', color: '#ff9b9b', padding: '10px 14px',
                borderRadius: 'var(--rS)', fontSize: 13, marginBottom: 14, border: '1px solid rgba(124,26,26,.4)',
              }}>{resetError}</div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>New Password</label>
              <input
                type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                placeholder="At least 8 characters" autoComplete="new-password"
                style={inputStyle}
              />
              <div style={{ fontSize: 11, color: newPassword.length >= 8 ? '#8fd19e' : 'rgba(242,230,201,.4)', marginTop: 5 }}>
                {newPassword.length >= 8 ? '✓' : '•'} At least 8 characters {newPassword.length > 0 && `(${newPassword.length}/8)`}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                placeholder="Type it again" autoComplete="new-password"
                style={inputStyle}
              />
              {confirmPassword.length > 0 && (
                <div style={{ fontSize: 11, color: confirmPassword === newPassword ? '#8fd19e' : '#ff9b9b', marginTop: 5 }}>
                  {confirmPassword === newPassword ? '✓ Matches' : '✕ Does not match yet'}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={resetLoading || newPassword.length < 8 || newPassword !== confirmPassword}
              style={{
                width: '100%', padding: 13, marginTop: 4,
                background: (newPassword.length < 8 || newPassword !== confirmPassword) ? 'rgba(198,167,78,.35)' : 'var(--gold)',
                color: 'var(--navy)', border: 'none', borderRadius: 'var(--rS)', fontSize: 14, fontWeight: 700, letterSpacing: '.02em',
              }}
            >
              {resetLoading ? 'Setting password…' : 'Set Password & Continue'}
            </button>
          </form>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, opacity: 0.6 }}>
          <img src="/ges-coa.png" alt="Ghana Education Service" style={{ height: 28, width: 'auto' }} />
          <span style={{ fontSize: 10, color: 'rgba(242,230,201,.55)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Built for GES-regulated schools</span>
        </div>
      </div>
    </div>
  );
}
