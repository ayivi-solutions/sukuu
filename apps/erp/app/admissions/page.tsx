'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { authedFetch } from '../../lib/api';

const TABS = [
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'batches', label: 'Batches' },
  { key: 'waitlist', label: 'Waitlist' },
  { key: 'requirements', label: 'Requirements' },
];

export default function AdmissionsPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('pipeline');
  const [error, setError] = useState('');

  const [applicants, setApplicants] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [batchEditForm, setBatchEditForm] = useState({ name: '', openDate: '', closeDate: '', targetEnrolment: '' });
  const [editingRequirement, setEditingRequirement] = useState<any>(null);
  const [requirementEditForm, setRequirementEditForm] = useState({ description: '', isMandatory: true });
  const [form, setForm] = useState({ firstName: '', lastName: '', gender: 'MALE', dateOfBirth: '', nationality: 'Ghanaian', applyingForClassId: '', guardianName: '', guardianPhone: '' });
  const [batchForm, setBatchForm] = useState({ academicYearId: '', name: '', openDate: '', closeDate: '', targetEnrolment: '' });
  const [reqForm, setReqForm] = useState({ requirementType: 'DOCUMENT', description: '', isMandatory: true });
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  useEffect(() => {
    const t = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    setUser(userStr ? JSON.parse(userStr) : null);
    load(t);
  }, [router]);

  function load(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    authedFetch('/api/v1/admissions', t).then(d => Array.isArray(d) ? setApplicants(d) : setError(d?.error));
    authedFetch('/api/v1/admissions/batches', t).then(d => Array.isArray(d) && setBatches(d));
    authedFetch('/api/v1/admissions/waitlist', t).then(d => Array.isArray(d) && setWaitlist(d));
    authedFetch('/api/v1/admissions/requirements', t).then(d => Array.isArray(d) && setRequirements(d));
    authedFetch('/api/v1/academic/years', t).then(d => Array.isArray(d) && setAcademicYears(d));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await authedFetch('/api/v1/admissions', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res?.error) { setShowCreate(false); setForm({ firstName: '', lastName: '', gender: 'MALE', dateOfBirth: '', nationality: 'Ghanaian', applyingForClassId: '', guardianName: '', guardianPhone: '' }); load(token); }
  }
  async function handleAddBatch(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/admissions/batches', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(batchForm) });
    setBatchForm({ academicYearId: '', name: '', openDate: '', closeDate: '', targetEnrolment: '' });
    load(token);
  }
  async function handleBatchStatus(id: string, status: string) {
    await authedFetch(`/api/v1/admissions/batches/${id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    load(token);
  }
  async function handleWaitlistStatus(id: string, status: string) {
    await authedFetch(`/api/v1/admissions/waitlist/${id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    load(token);
  }
  async function handleAddRequirement(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch('/api/v1/admissions/requirements', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reqForm) });
    setReqForm({ requirementType: 'DOCUMENT', description: '', isMandatory: true });
    load(token);
  }
  async function handleArchiveRequirement(id: string) {
    await authedFetch(`/api/v1/admissions/requirements/${id}/archive`, token, { method: 'PATCH' });
    load(token);
  }

  const shown = applicants.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (query && !`${a.first_name} ${a.last_name}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  async function handleSaveBatch(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/admissions/batches/${editingBatch.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(batchEditForm) }); setEditingBatch(null); load(token); }
  async function handleSaveRequirement(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/admissions/requirements/${editingRequirement.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requirementEditForm) }); setEditingRequirement(null); load(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · ADMISSIONX · 11 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">📋 AdmissionX</div>
            <div className="ph-sub">Applications · Interviews · Offers · Enrolment Pipeline · CRUAA enforced</div>
          </div>
          {tab === 'pipeline' && <button onClick={() => setShowCreate(true)} style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>+ New Applicant</button>}
        </div>
      </div>

      <div className="sys-tabs">
        {TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'pipeline' && (
        <div>
          <div style={{ padding: 'var(--pad) var(--pad) 8px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input className="fi" placeholder="Search name…" value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, minWidth: 160, maxWidth: 280 }} />
            <select className="fi" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="PENDING">Pending</option><option value="UNDER_REVIEW">Under Review</option><option value="INTERVIEWED">Interviewed</option>
              <option value="OFFERED">Offered</option><option value="ENROLLED">Enrolled</option><option value="REJECTED">Rejected</option><option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>
          <div className="tbl" style={{ padding: '0 var(--pad) var(--pad)' }}>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Class Applied</th><th>Guardian</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {shown.map(a => (
                  <tr key={a.id} onClick={() => router.push(`/admissions/${a.id}`)} style={{ cursor: 'pointer' }}>
                    <td><strong>{a.first_name} {a.last_name}</strong></td>
                    <td style={{ fontSize: 11 }}>{a.applying_for_class_id}</td>
                    <td style={{ fontSize: 11 }}>{a.guardian_name} · {a.guardian_phone}</td>
                    <td><span className={`bdg ${a.status === 'ENROLLED' ? 'bok' : a.status === 'REJECTED' || a.status === 'WITHDRAWN' ? 'ber' : a.status === 'OFFERED' ? 'bgo' : 'bin'}`}>{a.status}</span></td>
                    <td onClick={e => e.stopPropagation()}><button onClick={() => router.push(`/admissions/${a.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>View</button></td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No applicants match</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'batches' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            {batches.map(b => (
              <div key={b.id} className="ri na"><div className="ri-b"><div className="ri-t">{b.name}</div><div className="ri-s">{b.open_date} → {b.close_date} {b.target_enrolment ? `· Target ${b.target_enrolment}` : ''}</div></div>
                <span className={`bdg ${b.status === 'OPEN' ? 'bok' : b.status === 'CLOSED' ? 'ber' : 'bwn'}`} style={{ marginRight: 8 }}>{b.status}</span>
                <button onClick={() => { setEditingBatch(b); setBatchEditForm({ name: b.name, openDate: b.open_date, closeDate: b.close_date, targetEnrolment: b.target_enrolment || '' }); }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button>
                {b.status === 'OPEN' && <button onClick={() => handleBatchStatus(b.id, 'CLOSED')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Close</button>}
              </div>
            ))}
            {batches.length === 0 && <div className="ri na"><div className="ri-s">No batches yet.</div></div>}
          </div>
          <form className="card" onSubmit={handleAddBatch}>
            <div className="ch"><span className="ch-t">CREATE BATCH</span></div>
            <div className="cb" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
              <div className="fg"><label className="fl">ACADEMIC YEAR ID</label><select className="fi" value={batchForm.academicYearId} onChange={e => setBatchForm({ ...batchForm, academicYearId: e.target.value })} required>
                <option value="">Select...</option>
                {academicYears.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select></div>
              <div className="fg"><label className="fl">NAME</label><input className="fi" placeholder="2027 Intake" value={batchForm.name} onChange={e => setBatchForm({ ...batchForm, name: e.target.value })} required /></div>
              <div className="fg"><label className="fl">OPEN DATE</label><input className="fi" type="date" value={batchForm.openDate} onChange={e => setBatchForm({ ...batchForm, openDate: e.target.value })} required /></div>
              <div className="fg"><label className="fl">CLOSE DATE</label><input className="fi" type="date" value={batchForm.closeDate} onChange={e => setBatchForm({ ...batchForm, closeDate: e.target.value })} required /></div>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, alignSelf: 'end' }}>Create</button>
            </div>
          </form>
        </div>
      )}

      {tab === 'waitlist' && (
        <div className="tbl" style={{ padding: 'var(--pad)' }}>
          <table className="data-table">
            <thead><tr><th>#</th><th>Applicant</th><th>Class</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {waitlist.map(w => {
                const a = applicants.find(x => x.id === w.applicant_id);
                return (
                  <tr key={w.id}>
                    <td>{w.position}</td>
                    <td><strong>{a ? `${a.first_name} ${a.last_name}` : w.applicant_id?.slice(0, 8)}</strong></td>
                    <td style={{ fontSize: 11 }}>{w.class_id}</td>
                    <td><span className={`bdg ${w.status === 'WAITING' ? 'bwn' : w.status === 'OFFERED' ? 'bok' : 'ber'}`}>{w.status}</span></td>
                    <td>{w.status === 'WAITING' && <button onClick={() => handleWaitlistStatus(w.id, 'OFFERED')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--okB)', color: 'var(--ok)', fontWeight: 600 }}>Offer Vacancy</button>}</td>
                  </tr>
                );
              })}
              {waitlist.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No waitlisted applicants.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'requirements' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            {requirements.map(r => (
              <div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{r.requirement_type}</div><div className="ri-s">{r.description} {r.is_mandatory && '· Mandatory'}</div></div>
                <button onClick={() => { setEditingRequirement(r); setRequirementEditForm({ description: r.description, isMandatory: r.is_mandatory }); }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button>
                <button onClick={() => handleArchiveRequirement(r.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {requirements.length === 0 && <div className="ri na"><div className="ri-s">No requirements defined yet.</div></div>}
          </div>
          <form className="card" onSubmit={handleAddRequirement}>
            <div className="ch"><span className="ch-t">ADD REQUIREMENT</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={reqForm.requirementType} onChange={e => setReqForm({ ...reqForm, requirementType: e.target.value })}>
                <option value="DOCUMENT">Document</option><option value="AGE">Age</option><option value="EXAM">Exam</option><option value="QUALIFICATION">Qualification</option>
              </select>
              <input className="fi" placeholder="Description" value={reqForm.description} onChange={e => setReqForm({ ...reqForm, description: e.target.value })} required style={{ flex: 1 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={reqForm.isMandatory} onChange={e => setReqForm({ ...reqForm, isMandatory: e.target.checked })} /> Mandatory</label>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </div>
          </form>
        </div>
      )}

      {editingBatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingBatch(null)}>
          <form onSubmit={handleSaveBatch} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Batch</h3>
            <div className="fg"><label className="fl">NAME</label><input className="fi" value={batchEditForm.name} onChange={e => setBatchEditForm({ ...batchEditForm, name: e.target.value })} required /></div>
            <div className="fg"><label className="fl">OPEN DATE</label><input className="fi" type="date" value={batchEditForm.openDate} onChange={e => setBatchEditForm({ ...batchEditForm, openDate: e.target.value })} required /></div>
            <div className="fg"><label className="fl">CLOSE DATE</label><input className="fi" type="date" value={batchEditForm.closeDate} onChange={e => setBatchEditForm({ ...batchEditForm, closeDate: e.target.value })} required /></div>
            <div className="fg"><label className="fl">TARGET ENROLMENT</label><input className="fi" type="number" value={batchEditForm.targetEnrolment} onChange={e => setBatchEditForm({ ...batchEditForm, targetEnrolment: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingBatch(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingRequirement && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingRequirement(null)}>
          <form onSubmit={handleSaveRequirement} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Requirement</h3>
            <div className="fg"><label className="fl">DESCRIPTION</label><input className="fi" value={requirementEditForm.description} onChange={e => setRequirementEditForm({ ...requirementEditForm, description: e.target.value })} required /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={requirementEditForm.isMandatory} onChange={e => setRequirementEditForm({ ...requirementEditForm, isMandatory: e.target.checked })} /> Mandatory</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingRequirement(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 380, maxHeight: '85vh', overflowY: 'auto', boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>New Applicant</h3>
            <div className="fg"><label className="fl">FIRST NAME</label><input className="fi" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required /></div>
            <div className="fg"><label className="fl">LAST NAME</label><input className="fi" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required /></div>
            <div className="fg"><label className="fl">GENDER</label><select className="fi" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}><option value="MALE">Male</option><option value="FEMALE">Female</option></select></div>
            <div className="fg"><label className="fl">DATE OF BIRTH</label><input className="fi" type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} required /></div>
            <div className="fg"><label className="fl">APPLYING FOR CLASS ID</label><input className="fi" value={form.applyingForClassId} onChange={e => setForm({ ...form, applyingForClassId: e.target.value })} required /></div>
            <div className="fg"><label className="fl">GUARDIAN NAME</label><input className="fi" value={form.guardianName} onChange={e => setForm({ ...form, guardianName: e.target.value })} required /></div>
            <div className="fg"><label className="fl">GUARDIAN PHONE</label><input className="fi" value={form.guardianPhone} onChange={e => setForm({ ...form, guardianPhone: e.target.value })} required /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Create</button>
              <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
