'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedFetch } from '../../lib/api';
import AppShell from '../../components/AppShell';

const TABS = [
  { key: 'conversations', label: 'Conversations' },
  { key: 'broadcasts', label: 'Broadcasts' },
];

export default function CommunicationXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('conversations');
  const [error, setError] = useState('');

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvo, setActiveConvo] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);

  const [convoForm, setConvoForm] = useState({ subject: '', conversationType: 'DIRECT', participantIds: '' });
  const [messageForm, setMessageForm] = useState({ content: '' });
  const [broadcastForm, setBroadcastForm] = useState({ title: '', body: '', audienceType: 'ALL' });

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
    authedFetch('/api/v1/communication/conversations', t).then(d => Array.isArray(d) ? setConversations(d) : setError(d?.error));
    authedFetch('/api/v1/communication/broadcasts', t).then(d => Array.isArray(d) && setBroadcasts(d));
    setSummaryLoading(true);
    authedFetch('/api/v1/communication/summary', t)
      .then(d => { if (d && !d.error) { setSummary(d); setSummaryError(''); } else setSummaryError(d?.error || 'Failed to load summary'); })
      .catch(() => setSummaryError('Failed to load summary')).finally(() => setSummaryLoading(false));
  }

  function openConversation(id: string) { setActiveConvo(id); authedFetch(`/api/v1/communication/messages?conversationId=${id}`, token).then(d => Array.isArray(d) && setMessages(d)); }

  async function post(url: string, body: any, resetFn: () => void) { await authedFetch(url, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); resetFn(); loadAll(token); }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/communication/messages', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: activeConvo, content: messageForm.content }) });
    setMessageForm({ content: '' });
    openConversation(activeConvo);
  }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · COMMUNICATIONX · 7 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">💬 CommunicationX</div>
            <div className="ph-sub">Direct Messages · Groups · Announcements · Moderation · Retention</div>
          </div>
        </div>
      </div>

      {summaryError && <div style={{ padding: '0 var(--pad)', marginBottom: 'var(--gap)' }}><div className="alert al-er"><span className="al-ic">⚠️</span><div>Couldn't load the communication overview: {summaryError}.</div></div></div>}

      {summaryLoading ? (
        <div className="fx-overview"><div className="stat-grid">{[1, 2, 3].map(i => <div key={i} className="skel skel-card" />)}</div></div>
      ) : summary && (
        <div className="fx-overview">
          <div className="stat-grid">
            <button className="fx-card-btn" onClick={() => setTab('conversations')}>
              <div className="sc" title="Non-archived conversations you're a participant in"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--inB)' }}>💬</div></div><div className="sc-val">{summary.activeConversations}</div><div className="sc-lbl">YOUR CONVERSATIONS</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('broadcasts')}>
              <div className="sc" title="Broadcasts sent school-wide"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--puB)' }}>📣</div></div><div className="sc-val">{summary.broadcastsSent}</div><div className="sc-lbl">BROADCASTS SENT</div></div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('conversations')}>
              <div className="sc" title="All non-deleted messages, school-wide"><div className="sc-top"><div className="sc-icon" style={{ background: 'var(--okB)' }}>✉️</div></div><div className="sc-val">{summary.totalMessages}</div><div className="sc-lbl">TOTAL MESSAGES</div></div>
            </button>
          </div>
        </div>
      )}

      <div className="sys-tabs">{TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}</div>

      {tab === 'conversations' && (
        <div style={{ padding: 'var(--pad)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="card" style={{ flex: 1, minWidth: 260 }}>
            <div className="ch"><span className="ch-t">START CONVERSATION</span></div>
            <form className="cb" onSubmit={e => { e.preventDefault(); post('/api/v1/communication/conversations', { ...convoForm, participantIds: convoForm.participantIds.split(',').map(s => s.trim()).filter(Boolean) }, () => setConvoForm({ subject: '', conversationType: 'DIRECT', participantIds: '' })); }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input className="fi" placeholder="Subject" value={convoForm.subject} onChange={e => setConvoForm({ ...convoForm, subject: e.target.value })} />
              <select className="fi" value={convoForm.conversationType} onChange={e => setConvoForm({ ...convoForm, conversationType: e.target.value })}><option value="DIRECT">Direct</option><option value="GROUP">Group</option></select>
              <input className="fi" placeholder="Participant user IDs, comma-separated" value={convoForm.participantIds} onChange={e => setConvoForm({ ...convoForm, participantIds: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Start</button>
            </form>
            {conversations.map(c => (
              <div key={c.id} className={`ri na${activeConvo === c.id ? ' act' : ''}`} onClick={() => openConversation(c.id)} style={{ cursor: 'pointer' }}>
                <div className="ri-b"><div className="ri-t">{c.subject || `${c.conversation_type} conversation`}</div><div className="ri-s">{c.last_message_at ? new Date(c.last_message_at).toLocaleString() : 'No messages yet'}</div></div>
              </div>
            ))}
            {conversations.length === 0 && <div className="ri na"><div className="ri-s">No conversations yet.</div></div>}
          </div>
          <div className="card" style={{ flex: 2, minWidth: 300 }}>
            <div className="ch"><span className="ch-t">MESSAGES</span></div>
            {!activeConvo && <div style={{ padding: 24, color: 'var(--muted)', textAlign: 'center' }}>Select a conversation.</div>}
            {activeConvo && (
              <>
                <div style={{ maxHeight: 320, overflowY: 'auto', padding: 12 }}>
                  {messages.map(m => <div key={m.id} style={{ marginBottom: 10, padding: '8px 12px', background: m.sender_id === user?.id ? 'var(--soft)' : 'var(--faint)', borderRadius: 8, maxWidth: '80%', marginLeft: m.sender_id === user?.id ? 'auto' : 0 }}><div style={{ fontSize: 13 }}>{m.content}</div><div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{new Date(m.created_at).toLocaleTimeString()}</div></div>)}
                  {messages.length === 0 && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 12 }}>No messages yet.</div>}
                </div>
                <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid var(--line)' }}>
                  <input className="fi" placeholder="Type a message..." value={messageForm.content} onChange={e => setMessageForm({ content: e.target.value })} required style={{ flex: 1 }} />
                  <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Send</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'broadcasts' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/communication/broadcasts', broadcastForm, () => setBroadcastForm({ title: '', body: '', audienceType: 'ALL' })); }}>
            <div className="ch"><span className="ch-t">SEND BROADCAST</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Title" value={broadcastForm.title} onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })} required style={{ flex: 1, minWidth: 160 }} />
              <select className="fi" value={broadcastForm.audienceType} onChange={e => setBroadcastForm({ ...broadcastForm, audienceType: e.target.value })}><option value="ALL">Everyone</option><option value="STAFF_ONLY">Staff Only</option><option value="PARENTS_ONLY">Parents Only</option><option value="CLASS">By Class</option><option value="STREAM">By Stream</option></select>
              <input className="fi" placeholder="Message" value={broadcastForm.body} onChange={e => setBroadcastForm({ ...broadcastForm, body: e.target.value })} required style={{ flex: 2, minWidth: 200 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Broadcast</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Title</th><th>Audience</th><th>Sent</th><th>Delivered</th></tr></thead>
                <tbody>
                  {broadcasts.map(b => <tr key={b.id}><td>{b.title}</td><td>{b.audience_type}</td><td style={{ fontSize: 11 }}>{new Date(b.sent_at).toLocaleString()}</td><td>{b.delivery_count}</td></tr>)}
                  {broadcasts.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No broadcasts sent yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
