'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { login } from '../../lib/api';

function ExpiredBanner({ onExpired }: { onExpired: () => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('expired') === '1') onExpired();
  }, [searchParams, onExpired]);
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      localStorage.setItem('sukuu_token', data.accessToken);
      localStorage.setItem('sukuu_user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
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

        <form onSubmit={handleSubmit} style={{
          width: '100%', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(198,167,78,.18)',
          borderRadius: 'clamp(14px,3vw,20px)', padding: 'clamp(20px,5vw,28px)', backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: 'rgba(242,230,201,.6)',
            letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 16, textAlign: 'center',
          }}>Sign in to your workspace</div>

          {error && (
            <div style={{
              background: 'rgba(124,26,26,.2)', color: '#ff9b9b', padding: '10px 14px',
              borderRadius: 'var(--rS)', fontSize: 13, marginBottom: 14, border: '1px solid rgba(124,26,26,.4)',
            }}>{error}</div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(242,230,201,.5)',
              letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 6,
            }}>Phone / Email</label>
            <input
              type="text" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="e.g. 0244 000 000" autoComplete="username"
              style={{
                width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,.07)',
                border: '1.5px solid rgba(198,167,78,.2)', borderRadius: 'var(--rS)',
                fontSize: 14, color: 'var(--ivory)', outline: 'none',
              }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(242,230,201,.5)',
              letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 6,
            }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Enter password" autoComplete="current-password"
              style={{
                width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,.07)',
                border: '1.5px solid rgba(198,167,78,.2)', borderRadius: 'var(--rS)',
                fontSize: 14, color: 'var(--ivory)', outline: 'none',
              }}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 13, marginTop: 4, background: 'var(--gold)', color: 'var(--navy)',
            border: 'none', borderRadius: 'var(--rS)', fontSize: 14, fontWeight: 700, letterSpacing: '.02em',
          }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, opacity: 0.6 }}>
          <img src="/ges-coa.png" alt="Ghana Education Service" style={{ height: 28, width: 'auto' }} />
          <span style={{ fontSize: 10, color: 'rgba(242,230,201,.55)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Built for GES-regulated schools</span>
        </div>
      </div>
    </div>
  );
}
