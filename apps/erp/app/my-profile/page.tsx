'use client';
import { useEffect, useState } from 'react';
import { authedFetch } from '../../lib/api';
import AppShell from '../../components/AppShell';

export default function MyProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    authedFetch('/api/v1/auth/me')
      .then((d: any) => {
        setMe(d);
        setUser(d?.user || null);
      })
      .catch(() => setError('Could not load your profile.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);

    if (newPassword !== confirmPassword) {
      setSaveError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 12) {
      setSaveError('New password must be at least 12 characters.');
      return;
    }

    setSaving(true);
    try {
      await authedFetch('/api/v1/auth/change-password', '', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSaveSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setSaveError(err?.message || 'Could not change your password.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell user={user}>
        <div style={{ padding: 40 }}>Loading…</div>
      </AppShell>
    );
  }

  const displayName =
    [me?.user?.firstName, me?.user?.lastName].filter(Boolean).join(' ') ||
    'Your Account';

  return (
    <AppShell user={user}>
      <div style={{ padding: 24, maxWidth: 560 }}>
        <h1 style={{ fontSize: 20, marginBottom: 4 }}>My Profile</h1>
        <p style={{ color: 'rgba(255,255,255,.6)', marginBottom: 24 }}>
          Manage your own account and credentials.
        </p>

        {error && (
          <div style={{ padding: 12, marginBottom: 16, color: 'var(--er)' }}>
            {error}
          </div>
        )}

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 15, marginBottom: 12 }}>Identity</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,.5)' }}>Name</span>
            <span>{displayName}</span>
            <span style={{ color: 'rgba(255,255,255,.5)' }}>Role</span>
            <span>{me?.user?.roleLabel || me?.user?.roleKey || '—'}</span>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 15, marginBottom: 12 }}>Change Password</h2>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              style={{ padding: 10 }}
            />
            <input
              type="password"
              placeholder="New password (min 12 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={12}
              style={{ padding: 10 }}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={12}
              style={{ padding: 10 }}
            />
            {saveError && <div style={{ color: 'var(--er)' }}>{saveError}</div>}
            {saveSuccess && <div style={{ color: 'var(--ok, #4caf50)' }}>Password changed successfully.</div>}
            <button type="submit" disabled={saving} style={{ padding: 10 }}>
              {saving ? 'Saving…' : 'Change Password'}
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
