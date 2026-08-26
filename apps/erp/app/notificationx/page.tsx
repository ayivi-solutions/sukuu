'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedFetch } from '../../lib/api';
import AppShell from '../../components/AppShell';

const TABS = [
  { key: 'templates', label: 'Templates & Channels' },
  { key: 'queue', label: 'Delivery Queue' },
  { key: 'logs', label: 'SMS & Email Logs' },
];

export default function NotificationXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('templates');
  const [error, setError] = useState('');

  const [templates, setTemplates] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);

  const [templateForm, setTemplateForm] = useState({ eventType: '', channel: 'EMAIL', subject: '', bodyTemplate: '' });
  const [channelForm, setChannelForm] = useState({ channel: 'SMS', isEnabled: true });

  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    const t = 'cookie';
    const userStr = sessionStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t); setUser(userStr ? JSON.parse(userStr) : null);
    loadAll(t);
  }, [router]);

  function loadAll(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    authedFetch('/api/v1/notification/templates', t).then(d => Array.isArray(d) ? setTemplates(d) : setError(d?.error));
    authedFetch('/api/v1/notification/channels', t).then(d => Array.isArray(d) && setChannels(d));
    authedFetch('/api/v1/notification/queue', t).then(d => Array.isArray(d) && setQueue(d));
    authedFetch('/api/v1/notification/sms-logs', t).then(d => Array.isArray(d) && setSmsLogs(d));
    authedFetch('/api/v1/notification/email-logs', t).then(d => Array.isArray(d) && setEmailLogs(d));
    setSummaryLoading(true);
    authedFetch('/api/v1/notification/summary', t)
      .then(d => { if (d && !d.error) { setSummary(d); setSummaryError(''); } else setSummaryError(d?.error || 'Failed to load summary'); })
      .catch(() => setSummaryError('Failed to load summary')).finally(() => setSummaryLoading(false));
  }

  async function post(url: string, body: any, resetFn: () => void) { await authedFetch(url, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); resetFn(); loadAll(token); }
  async function put(url: string, body: any) { await authedFetch(url, token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); loadAll(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · NOTIFICATIONX · 10 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">🔔 NotificationX</div>
            <div className="ph-sub">Preference-Aware, Multi-Channel Delivery & Status</div>
          </div>
        </div>
      </div>

      {summaryError && <div style={{ padding: '0 var(--pad)', marginBottom: 'var(--gap)' }}><div className="alert al-er"><span className="al-ic">⚠️</span><div>Couldn't load the notification overview: {summaryError}.</div></div></div>}

      {summaryLoading ? (
        <div className="fx-overview"><div className="stat-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skel skel-card" />)}</div></div>
      ) : summary && (
        <div className="fx-overview">
          <div className="stat-grid">
            <button className="fx-card-btn" onClick={() => setTab('queue')}>
              <div className="sc" title="All notifications created for this school"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--inB)' }}>🔔</div></div><div className="sc-val">{summary.totalSent}</div><div className="sc-lbl">TOTAL NOTIFICATIONS</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('queue')}>
              <div className="sc" title="Queue entries with status QUEUED"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--puB)' }}>📤</div></div><div className="sc-val">{summary.queuedCount}</div><div className="sc-lbl">IN QUEUE</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('queue')}>
              <div className="sc" title="Queue entries with status FAILED"><div className="sc-top"><div className="sc-icon" style={{ background: summary.failedQueue > 0 ? 'var(--erB)' : 'var(--okB)' }}>⚠️</div></div><div className="sc-val">{summary.failedQueue}</div><div className="sc-lbl">FAILED DELIVERIES</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('templates')}>
              <div className="sc" title="Channels with is_enabled true"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--okB)' }}>📡</div></div><div className="sc-val">{summary.activeChannels}</div><div className="sc-lbl">ACTIVE CHANNELS</div></div>
            </button>
          </div>
        </div>
      )}

      <div className="sys-tabs">{TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}</div>

      {tab === 'templates' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/notification/templates', templateForm, () => setTemplateForm({ eventType: '', channel: 'EMAIL', subject: '', bodyTemplate: '' })); }} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">TEMPLATES</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Event type" value={templateForm.eventType} onChange={e => setTemplateForm({ ...templateForm, eventType: e.target.value })} required style={{ width: 160 }} />
              <select className="fi" value={templateForm.channel} onChange={e => setTemplateForm({ ...templateForm, channel: e.target.value })}><option value="EMAIL">Email</option><option value="SMS">SMS</option><option value="PUSH">Push</option><option value="IN_APP">In-App</option></select>
              <input className="fi" placeholder="Subject" value={templateForm.subject} onChange={e => setTemplateForm({ ...templateForm, subject: e.target.value })} style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" placeholder="Body template" value={templateForm.bodyTemplate} onChange={e => setTemplateForm({ ...templateForm, bodyTemplate: e.target.value })} required style={{ flex: 2, minWidth: 200 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </div>
            {templates.map(t => <div key={t.id} className="ri na"><div className="ri-b"><div className="ri-t">{t.event_type}</div><div className="ri-s">{t.channel} · {t.subject || 'No subject'}</div></div></div>)}
            {templates.length === 0 && <div className="ri na"><div className="ri-s">No templates yet.</div></div>}
          </form>
          <form className="card" onSubmit={e => { e.preventDefault(); put('/api/v1/notification/channels', channelForm); }}>
            <div className="ch"><span className="ch-t">CHANNELS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={channelForm.channel} onChange={e => setChannelForm({ ...channelForm, channel: e.target.value })}><option value="SMS">SMS</option><option value="EMAIL">Email</option><option value="PUSH">Push</option></select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={channelForm.isEnabled} onChange={e => setChannelForm({ ...channelForm, isEnabled: e.target.checked })} /> Enabled</label>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Save</button>
            </div>
            {channels.map(c => <div key={c.id} className="ri na"><div className="ri-b"><div className="ri-t">{c.channel}</div></div><span className={`bdg ${c.is_enabled ? 'bok' : 'bwn'}`}>{c.is_enabled ? 'Enabled' : 'Disabled'}</span></div>)}
            {channels.length === 0 && <div className="ri na"><div className="ri-s">No channel config yet.</div></div>}
          </form>
        </div>
      )}

      {tab === 'queue' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card">
            <div className="ch"><span className="ch-t">DELIVERY QUEUE</span></div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Channel</th><th>Recipient</th><th>Priority</th><th>Status</th></tr></thead>
                <tbody>
                  {queue.map(q => <tr key={q.id}><td>{q.channel}</td><td style={{ fontSize: 11 }}>{q.recipient_address}</td><td>{q.priority}</td><td><span className={`bdg ${q.status === 'SENT' ? 'bok' : q.status === 'FAILED' ? 'ber' : 'bwn'}`}>{q.status}</span></td></tr>)}
                  {queue.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>Queue is empty.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">SMS LOG</span></div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Recipient</th><th>Message</th><th>Status</th></tr></thead>
                <tbody>
                  {smsLogs.map(s => <tr key={s.id}><td>{s.recipient_phone}</td><td style={{ fontSize: 12 }}>{s.message_body?.slice(0, 60)}</td><td>{s.twilio_status || '—'}</td></tr>)}
                  {smsLogs.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No SMS sent yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">EMAIL LOG</span></div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Recipient</th><th>Subject</th><th>Status</th></tr></thead>
                <tbody>
                  {emailLogs.map(e => <tr key={e.id}><td>{e.recipient_email}</td><td style={{ fontSize: 12 }}>{e.subject}</td><td><span className={`bdg ${e.status === 'DELIVERED' || e.status === 'OPENED' ? 'bok' : e.status === 'BOUNCED' || e.status === 'FAILED' ? 'ber' : 'bwn'}`}>{e.status}</span></td></tr>)}
                  {emailLogs.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No emails sent yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
