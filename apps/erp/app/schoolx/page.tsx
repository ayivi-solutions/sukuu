'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'branding', label: 'Branding' },
  { key: 'campuses', label: 'Campuses' },
  { key: 'documents', label: 'Documents' },
  { key: 'subscription', label: 'Subscription' },
  { key: 'accreditations', label: 'Accreditations' },
  { key: 'audit', label: 'Audit Log' },
  { key: 'settings', label: 'Settings' },
];

function authedFetch(path: string, token: string, opts: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` },
  }).then(res => res.json());
}

export default function SchoolXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('profile');
  const [school, setSchool] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [termPolicy, setTermPolicy] = useState<any>({ terms_per_year: 3, term_names: 'Term 1,Term 2,Term 3', min_weeks_per_term: 12 });
  const [branding, setBranding] = useState<any>({ primary_color: '', secondary_color: '', motto: '' });
  const [campuses, setCampuses] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [accreditations, setAccreditations] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAccredForm, setShowAccredForm] = useState(false);
  const [accredForm, setAccredForm] = useState({ authority: '', accreditationNumber: '', issueDate: '', expiryDate: '' });
  const [contactForm, setContactForm] = useState({ contactType: 'PHONE', value: '', label: '', isPrimary: false });
  const [campusForm, setCampusForm] = useState({ name: '', code: '', address: '', phone: '' });
  const [docForm, setDocForm] = useState({ documentType: '', fileUrl: '', issueDate: '', expiryDate: '' });
  const [settingForm, setSettingForm] = useState({ key: '', value: '' });
  const [editingContact, setEditingContact] = useState<any>(null);
  const [editContactForm, setEditContactForm] = useState({ value: '', label: '', isPrimary: false });
  const [editingCampus, setEditingCampus] = useState<any>(null);
  const [editCampusForm, setEditCampusForm] = useState({ name: '', address: '', phone: '' });
  const [editingAccred, setEditingAccred] = useState<any>(null);
  const [editAccredForm, setEditAccredForm] = useState({ authority: '', accreditationNumber: '', issueDate: '', expiryDate: '' });

  useEffect(() => {
    const t = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    setUser(userStr ? JSON.parse(userStr) : null);
    loadAll(t);
  }, [router]);

  function loadAll(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d.error ? setError(d.error) : setSchool(d));
    authedFetch('/api/v1/school/contacts', t).then(d => Array.isArray(d) && setContacts(d));
    authedFetch('/api/v1/school/term-policy', t).then(d => d && !d.error && d.id && setTermPolicy(d));
    authedFetch('/api/v1/school/branding', t).then(d => d && !d.error && d.id && setBranding(d));
    authedFetch('/api/v1/school/campuses', t).then(d => Array.isArray(d) && setCampuses(d));
    authedFetch('/api/v1/school/documents', t).then(d => Array.isArray(d) && setDocuments(d));
    authedFetch('/api/v1/school/subscription', t).then(d => d && !d.error && setSubscription(d));
    authedFetch('/api/v1/school/accreditations', t).then(d => Array.isArray(d) && setAccreditations(d));
    authedFetch('/api/v1/school/audit-log', t).then(d => Array.isArray(d) && setAudit(d));
    authedFetch('/api/v1/school/settings', t).then(d => Array.isArray(d) && setSettings(d));
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const updated = await authedFetch('/api/v1/school/profile', token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: school.name, address: school.address, city: school.city, region: school.region, country: school.country, phone: school.phone, email: school.email, website: school.website, logo_url: school.logo_url }) });
    setSchool(updated);
    setSaving(false);
  }
  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/school/contacts', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contactForm) });
    setContactForm({ contactType: 'PHONE', value: '', label: '', isPrimary: false });
    loadAll(token);
  }
  function openEditContact(c: any) { setEditingContact(c); setEditContactForm({ value: c.value, label: c.label || '', isPrimary: c.is_primary }); }
  async function handleSaveContact(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch(`/api/v1/school/contacts/${editingContact.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editContactForm) });
    setEditingContact(null);
    loadAll(token);
  }
  async function handleSaveTermPolicy(e: React.FormEvent) {
    e.preventDefault();
    const r = await authedFetch('/api/v1/school/term-policy', token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(termPolicy) });
    setTermPolicy(r);
  }
  async function handleSaveBranding(e: React.FormEvent) {
    e.preventDefault();
    const r = await authedFetch('/api/v1/school/branding', token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(branding) });
    setBranding(r);
  }
  async function handleAddCampus(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/school/campuses', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(campusForm) });
    setCampusForm({ name: '', code: '', address: '', phone: '' });
    loadAll(token);
  }
  async function handleToggleCampus(id: string, current: boolean) {
    await authedFetch(`/api/v1/school/campuses/${id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !current }) });
    loadAll(token);
  }
  function openEditCampus(c: any) { setEditingCampus(c); setEditCampusForm({ name: c.name, address: c.address || '', phone: c.phone || '' }); }
  async function handleSaveCampus(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch(`/api/v1/school/campuses/${editingCampus.id}`, token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editCampusForm) });
    setEditingCampus(null);
    loadAll(token);
  }
  async function handleAddDocument(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/school/documents', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(docForm) });
    setDocForm({ documentType: '', fileUrl: '', issueDate: '', expiryDate: '' });
    loadAll(token);
  }
  async function handleUpdateSubscriptionStatus(status: string) {
    const r = await authedFetch('/api/v1/school/subscription', token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    setSubscription(r);
  }
  async function handleAddAccreditation(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/school/accreditations', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(accredForm) });
    setShowAccredForm(false);
    setAccredForm({ authority: '', accreditationNumber: '', issueDate: '', expiryDate: '' });
    loadAll(token);
  }
  async function handleArchiveAccreditation(id: string) {
    if (!confirm('Archive this accreditation record?')) return;
    await authedFetch(`/api/v1/school/accreditations/${id}/archive`, token, { method: 'PATCH' });
    loadAll(token);
  }
  function openEditAccred(a: any) { setEditingAccred(a); setEditAccredForm({ authority: a.authority, accreditationNumber: a.accreditation_number, issueDate: a.issue_date || '', expiryDate: a.expiry_date || '' }); }
  async function handleSaveAccred(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch(`/api/v1/school/accreditations/${editingAccred.id}`, token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editAccredForm) });
    setEditingAccred(null);
    loadAll(token);
  }
  async function handleAddSetting(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/school/settings', token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settingForm) });
    setSettingForm({ key: '', value: '' });
    loadAll(token);
  }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;
  if (!school) return <AppShell user={user}><div style={{ padding: 40 }}>Loading…</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SCHOOLX · INSTITUTIONAL TENANT ENGINE</div>
            <div className="ph-title">{school.name}</div>
            <div className="ph-sub">{school.code} · {school.city}, {school.region} · CRUAA enforced</div>
          </div>
        </div>
      </div>

      <div className="sys-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="two-col">
          <form className="card" onSubmit={handleSaveProfile}>
            <div className="ch"><span className="ch-t">INSTITUTION PROFILE</span></div>
            <div className="cb">
              <div className="fg"><label className="fl">SCHOOL NAME</label><input className="fi" value={school.name || ''} onChange={e => setSchool({ ...school, name: e.target.value })} /></div>
              <div className="fg"><label className="fl">ADDRESS</label><input className="fi" value={school.address || ''} onChange={e => setSchool({ ...school, address: e.target.value })} /></div>
              <div className="fg"><label className="fl">CITY</label><input className="fi" value={school.city || ''} onChange={e => setSchool({ ...school, city: e.target.value })} /></div>
              <div className="fg"><label className="fl">REGION</label><input className="fi" value={school.region || ''} onChange={e => setSchool({ ...school, region: e.target.value })} /></div>
              <div className="fg"><label className="fl">COUNTRY</label><input className="fi" value={school.country || ''} onChange={e => setSchool({ ...school, country: e.target.value })} /></div>
              <div className="fg"><label className="fl">PHONE</label><input className="fi" value={school.phone || ''} onChange={e => setSchool({ ...school, phone: e.target.value })} /></div>
              <div className="fg"><label className="fl">EMAIL</label><input className="fi" value={school.email || ''} onChange={e => setSchool({ ...school, email: e.target.value })} /></div>
              <div className="fg"><label className="fl">WEBSITE</label><input className="fi" value={school.website || ''} onChange={e => setSchool({ ...school, website: e.target.value })} /></div>
              <div className="fg"><label className="fl">LOGO URL</label><input className="fi" value={school.logo_url || ''} onChange={e => setSchool({ ...school, logo_url: e.target.value })} /></div>
              <button type="submit" disabled={saving} style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '11px 20px', borderRadius: 'var(--rS)', fontSize: 13, fontWeight: 600 }}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
          <div className="card">
            <div className="ch"><span className="ch-t">REGISTRATION DETAILS</span></div>
            {[['Registration No.', school.registration_number], ['School Type', school.school_type], ['Status', school.is_active ? 'Active' : 'Inactive']].map(([k, v]) => (
              <div key={k} className="ri na"><div className="ri-b"><div className="ri-t">{k as string}</div><div className="ri-s">{v as string}</div></div></div>
            ))}
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">CONTACTS</span></div>
            {contacts.map(c => (
              <div key={c.id} className="ri na"><div className="ri-b"><div className="ri-t">{c.label || c.contact_type}</div><div className="ri-s">{c.value}</div></div>
                {c.is_primary && <span className="bdg bgo" style={{ marginRight: 8 }}>Primary</span>}
                <button onClick={() => openEditContact(c)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>Edit</button>
              </div>
            ))}
            {contacts.length === 0 && <div className="ri na"><div className="ri-s">No contacts added yet.</div></div>}
            <form onSubmit={handleAddContact} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" style={{ width: 'auto' }} value={contactForm.contactType} onChange={e => setContactForm({ ...contactForm, contactType: e.target.value })}>
                <option value="PHONE">Phone</option><option value="EMAIL">Email</option><option value="WHATSAPP">WhatsApp</option>
              </select>
              <input className="fi" placeholder="value" value={contactForm.value} onChange={e => setContactForm({ ...contactForm, value: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" placeholder="label e.g. Principal" value={contactForm.label} onChange={e => setContactForm({ ...contactForm, label: e.target.value })} style={{ flex: 1 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <form className="card" onSubmit={handleSaveTermPolicy}>
            <div className="ch"><span className="ch-t">TERM STRUCTURE</span></div>
            <div className="cb">
              <div className="fg"><label className="fl">TERMS PER YEAR</label><input className="fi" type="number" value={termPolicy.terms_per_year} onChange={e => setTermPolicy({ ...termPolicy, terms_per_year: +e.target.value })} /></div>
              <div className="fg"><label className="fl">TERM NAMES (comma-separated)</label><input className="fi" value={termPolicy.term_names} onChange={e => setTermPolicy({ ...termPolicy, term_names: e.target.value })} /></div>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Save</button>
            </div>
          </form>
        </div>
      )}

      {tab === 'branding' && (
        <form className="card" onSubmit={handleSaveBranding} style={{ margin: 'var(--pad)' }}>
          <div className="ch"><span className="ch-t">INSTITUTIONAL BRANDING</span></div>
          <div className="cb">
            <div className="fg"><label className="fl">PRIMARY COLOR</label><input className="fi" value={branding.primary_color || ''} onChange={e => setBranding({ ...branding, primary_color: e.target.value })} placeholder="#040D34" /></div>
            <div className="fg"><label className="fl">SECONDARY COLOR</label><input className="fi" value={branding.secondary_color || ''} onChange={e => setBranding({ ...branding, secondary_color: e.target.value })} placeholder="#C6A74E" /></div>
            <div className="fg"><label className="fl">MOTTO</label><input className="fi" value={branding.motto || ''} onChange={e => setBranding({ ...branding, motto: e.target.value })} /></div>
            <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '11px 20px', borderRadius: 'var(--rS)', fontSize: 13, fontWeight: 600 }}>Save Branding</button>
          </div>
        </form>
      )}

      {tab === 'campuses' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            {campuses.map(c => (
              <div key={c.id} className="ri na"><div className="ri-b"><div className="ri-t">{c.name} {c.is_primary && <span className="bdg bgo">Primary</span>}</div><div className="ri-s">{c.code} · {c.address}</div></div>
                <button onClick={() => openEditCampus(c)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 8 }}>Edit</button>
                <div className={`tog ${c.is_active ? 'on' : 'off'}`} onClick={() => handleToggleCampus(c.id, c.is_active)} />
              </div>
            ))}
            {campuses.length === 0 && <div className="ri na"><div className="ri-s">No campuses added yet.</div></div>}
          </div>
          <form className="card" onSubmit={handleAddCampus}>
            <div className="ch"><span className="ch-t">ADD CAMPUS</span></div>
            <div className="cb" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
              <div className="fg"><label className="fl">NAME</label><input className="fi" value={campusForm.name} onChange={e => setCampusForm({ ...campusForm, name: e.target.value })} required /></div>
              <div className="fg"><label className="fl">CODE</label><input className="fi" value={campusForm.code} onChange={e => setCampusForm({ ...campusForm, code: e.target.value })} required /></div>
              <div className="fg"><label className="fl">ADDRESS</label><input className="fi" value={campusForm.address} onChange={e => setCampusForm({ ...campusForm, address: e.target.value })} /></div>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, alignSelf: 'end' }}>Add Campus</button>
            </div>
          </form>
        </div>
      )}

      {tab === 'documents' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="tbl" style={{ marginBottom: 16 }}>
            <table className="data-table">
              <thead><tr><th>Type</th><th>File</th><th>Uploaded</th></tr></thead>
              <tbody>
                {documents.map(d => (
                  <tr key={d.id}><td>{d.document_type}</td><td><a href={d.file_url} target="_blank" rel="noreferrer" style={{ color: 'var(--in)' }}>View</a></td><td style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(d.uploaded_at).toLocaleString()}</td></tr>
                ))}
                {documents.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No documents uploaded yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <form className="card" onSubmit={handleAddDocument}>
            <div className="ch"><span className="ch-t">ADD DOCUMENT</span></div>
            <div className="cb" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
              <div className="fg"><label className="fl">TYPE</label><input className="fi" placeholder="e.g. school_license" value={docForm.documentType} onChange={e => setDocForm({ ...docForm, documentType: e.target.value })} required /></div>
              <div className="fg"><label className="fl">FILE URL</label><input className="fi" value={docForm.fileUrl} onChange={e => setDocForm({ ...docForm, fileUrl: e.target.value })} required /></div>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, alignSelf: 'end' }}>Upload</button>
            </div>
          </form>
        </div>
      )}

      {tab === 'subscription' && (
        <div className="card" style={{ margin: 'var(--pad)' }}>
          <div className="ch"><span className="ch-t">SUBSCRIPTION</span></div>
          {subscription ? (
            <div className="cb">
              <div className="ri na"><div className="ri-b"><div className="ri-t">{subscription.plan_name}</div><div className="ri-s">Next billing: {new Date(subscription.next_billing_date).toLocaleDateString()} · GH₵{subscription.amount_ghs}</div></div><span className={`bdg ${subscription.status === 'ACTIVE' ? 'bok' : 'ber'}`}>{subscription.status}</span></div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {subscription.status !== 'ACTIVE' && <button onClick={() => handleUpdateSubscriptionStatus('ACTIVE')} style={{ fontSize: 12, padding: '8px 14px', borderRadius: 6, background: 'var(--okB)', color: 'var(--ok)', fontWeight: 600 }}>Reactivate</button>}
                {subscription.status === 'ACTIVE' && <button onClick={() => handleUpdateSubscriptionStatus('SUSPENDED')} style={{ fontSize: 12, padding: '8px 14px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Suspend</button>}
              </div>
            </div>
          ) : <div className="ri na"><div className="ri-s">No subscription on record.</div></div>}
        </div>
      )}

      {tab === 'accreditations' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={() => setShowAccredForm(true)} style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>+ Add Accreditation</button>
          </div>
          <div className="tbl">
            <table className="data-table">
              <thead><tr><th>Authority</th><th>Number</th><th>Issued</th><th>Expires</th><th></th></tr></thead>
              <tbody>
                {accreditations.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.authority}</strong></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{a.accreditation_number}</td>
                    <td style={{ fontSize: 11 }}>{a.issue_date}</td>
                    <td style={{ fontSize: 11 }}>{a.expiry_date}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEditAccred(a)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>Edit</button>
                      <button onClick={() => handleArchiveAccreditation(a.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
                    </td>
                  </tr>
                ))}
                {accreditations.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No accreditation records yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="tbl" style={{ padding: 'var(--pad)' }}>
          <table className="data-table">
            <thead><tr><th>Action</th><th>By</th><th>Timestamp</th></tr></thead>
            <tbody>
              {audit.map(a => (
                <tr key={a.id}><td style={{ fontSize: 12 }}>{a.action}</td><td style={{ fontFamily: 'monospace', fontSize: 11 }}>{a.performed_by}</td><td style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(a.created_at).toLocaleString()}</td></tr>
              ))}
              {audit.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No audit events recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'settings' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">SETTINGS ({settings.length})</span></div>
            {settings.map(s => (
              <div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{s.key}</div><div className="ri-s">{s.value}</div></div></div>
            ))}
            {settings.length === 0 && <div className="ri na"><div className="ri-s">No custom settings configured yet.</div></div>}
          </div>
          <form className="card" onSubmit={handleAddSetting}>
            <div className="ch"><span className="ch-t">ADD / UPDATE SETTING</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8 }}>
              <input className="fi" placeholder="key e.g. grading_scale" value={settingForm.key} onChange={e => setSettingForm({ ...settingForm, key: e.target.value })} required />
              <input className="fi" placeholder="value" value={settingForm.value} onChange={e => setSettingForm({ ...settingForm, value: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Save</button>
            </div>
          </form>
        </div>
      )}

      {showAccredForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowAccredForm(false)}>
          <form onSubmit={handleAddAccreditation} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Add Accreditation</h3>
            <div className="fg"><label className="fl">AUTHORITY</label><input className="fi" value={accredForm.authority} onChange={e => setAccredForm({ ...accredForm, authority: e.target.value })} required /></div>
            <div className="fg"><label className="fl">ACCREDITATION NUMBER</label><input className="fi" value={accredForm.accreditationNumber} onChange={e => setAccredForm({ ...accredForm, accreditationNumber: e.target.value })} required /></div>
            <div className="fg"><label className="fl">ISSUE DATE</label><input className="fi" type="date" value={accredForm.issueDate} onChange={e => setAccredForm({ ...accredForm, issueDate: e.target.value })} required /></div>
            <div className="fg"><label className="fl">EXPIRY DATE</label><input className="fi" type="date" value={accredForm.expiryDate} onChange={e => setAccredForm({ ...accredForm, expiryDate: e.target.value })} required /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Add</button>
              <button type="button" onClick={() => setShowAccredForm(false)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingContact && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingContact(null)}>
          <form onSubmit={handleSaveContact} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Contact</h3>
            <div className="fg"><label className="fl">VALUE</label><input className="fi" value={editContactForm.value} onChange={e => setEditContactForm({ ...editContactForm, value: e.target.value })} required /></div>
            <div className="fg"><label className="fl">LABEL</label><input className="fi" value={editContactForm.label} onChange={e => setEditContactForm({ ...editContactForm, label: e.target.value })} /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 16 }}>
              <input type="checkbox" checked={editContactForm.isPrimary} onChange={e => setEditContactForm({ ...editContactForm, isPrimary: e.target.checked })} /> Primary contact
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingContact(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingCampus && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingCampus(null)}>
          <form onSubmit={handleSaveCampus} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Campus</h3>
            <div className="fg"><label className="fl">NAME</label><input className="fi" value={editCampusForm.name} onChange={e => setEditCampusForm({ ...editCampusForm, name: e.target.value })} required /></div>
            <div className="fg"><label className="fl">ADDRESS</label><input className="fi" value={editCampusForm.address} onChange={e => setEditCampusForm({ ...editCampusForm, address: e.target.value })} /></div>
            <div className="fg"><label className="fl">PHONE</label><input className="fi" value={editCampusForm.phone} onChange={e => setEditCampusForm({ ...editCampusForm, phone: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingCampus(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingAccred && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingAccred(null)}>
          <form onSubmit={handleSaveAccred} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Accreditation</h3>
            <div className="fg"><label className="fl">AUTHORITY</label><input className="fi" value={editAccredForm.authority} onChange={e => setEditAccredForm({ ...editAccredForm, authority: e.target.value })} required /></div>
            <div className="fg"><label className="fl">NUMBER</label><input className="fi" value={editAccredForm.accreditationNumber} onChange={e => setEditAccredForm({ ...editAccredForm, accreditationNumber: e.target.value })} required /></div>
            <div className="fg"><label className="fl">ISSUE DATE</label><input className="fi" type="date" value={editAccredForm.issueDate} onChange={e => setEditAccredForm({ ...editAccredForm, issueDate: e.target.value })} /></div>
            <div className="fg"><label className="fl">EXPIRY DATE</label><input className="fi" type="date" value={editAccredForm.expiryDate} onChange={e => setEditAccredForm({ ...editAccredForm, expiryDate: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingAccred(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
