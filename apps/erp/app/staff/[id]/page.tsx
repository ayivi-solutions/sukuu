'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import { authedFetch } from '../../../lib/api';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'assignments', label: 'Department & Subjects' },
  { key: 'docs', label: 'Documents & Qualifications' },
  { key: 'compliance', label: 'Compliance & Bank' },
  { key: 'hr', label: 'HR Records' },
];

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState('');

  const [staffMember, setStaffMember] = useState<any>(null);
  const [employments, setEmployments] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [exitRecords, setExitRecords] = useState<any[]>([]);
  const [deptAssignments, setDeptAssignments] = useState<any[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState<any[]>([]);
  const [disciplinaryRecords, setDisciplinaryRecords] = useState<any[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<any[]>([]);
  const [training, setTraining] = useState<any[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);

  const [editForm, setEditForm] = useState<any>({});
  const [contractForm, setContractForm] = useState({ contractType: 'PERMANENT', startDate: '', endDate: '', salaryAgreed: '' });
  const [emergencyForm, setEmergencyForm] = useState({ name: '', relationship: '', phone: '', address: '' });
  const [exitForm, setExitForm] = useState({ exitType: 'RESIGNATION', exitDate: '', reason: '', noticeGiven: false });
  const [deptForm, setDeptForm] = useState({ departmentId: '', roleInDepartment: '' });
  const [subjectForm, setSubjectForm] = useState({ subjectId: '', academicYearId: '' });
  const [docForm, setDocForm] = useState({ documentType: '', fileUrl: '' });
  const [qualForm, setQualForm] = useState({ qualificationType: 'DEGREE', title: '', institution: '', yearObtained: '' });
  const [complianceForm, setComplianceForm] = useState({ complianceType: 'TEACHING_LICENSE', status: 'PENDING', issueDate: '', expiryDate: '' });
  const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', accountName: '', isPrimary: false });
  const [discForm, setDiscForm] = useState({ incidentDate: '', incidentType: '', description: '', actionTaken: '' });
  const [reviewForm, setReviewForm] = useState({ reviewPeriod: '', overallRating: '', comments: '', reviewDate: '' });
  const [trainingForm, setTrainingForm] = useState({ trainingName: '', provider: '', trainingType: '', startDate: '' });
  const [balanceForm, setBalanceForm] = useState({ leaveType: 'ANNUAL', year: new Date().getFullYear(), entitlementDays: 21, usedDays: 0 });
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    const t = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    setUser(userStr ? JSON.parse(userStr) : null);
    loadAll(t);
  }, [router, staffId]);

  function loadAll(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    authedFetch(`/api/v1/staff/${staffId}`, t).then(d => { if (d?.error) setError(d.error); else { setStaffMember(d); setEditForm(d); } });
    authedFetch(`/api/v1/staff/${staffId}/employments`, t).then(d => Array.isArray(d) && setEmployments(d));
    authedFetch(`/api/v1/staff/${staffId}/contracts`, t).then(d => Array.isArray(d) && setContracts(d));
    authedFetch(`/api/v1/staff/${staffId}/emergency-contacts`, t).then(d => Array.isArray(d) && setEmergencyContacts(d));
    authedFetch(`/api/v1/staff/${staffId}/exit-records`, t).then(d => Array.isArray(d) && setExitRecords(d));
    authedFetch(`/api/v1/staff/${staffId}/department-assignments`, t).then(d => Array.isArray(d) && setDeptAssignments(d));
    authedFetch(`/api/v1/staff/${staffId}/subject-assignments`, t).then(d => Array.isArray(d) && setSubjectAssignments(d));
    authedFetch(`/api/v1/staff/${staffId}/documents`, t).then(d => Array.isArray(d) && setDocuments(d));
    authedFetch(`/api/v1/staff/${staffId}/qualifications`, t).then(d => Array.isArray(d) && setQualifications(d));
    authedFetch(`/api/v1/staff/${staffId}/compliance`, t).then(d => Array.isArray(d) && setCompliance(d));
    authedFetch(`/api/v1/staff/${staffId}/bank-details`, t).then(d => Array.isArray(d) && setBankDetails(d));
    authedFetch(`/api/v1/staff/${staffId}/disciplinary-records`, t).then(d => Array.isArray(d) && setDisciplinaryRecords(d));
    authedFetch(`/api/v1/staff/${staffId}/performance-reviews`, t).then(d => Array.isArray(d) && setPerformanceReviews(d));
    authedFetch(`/api/v1/staff/${staffId}/training`, t).then(d => Array.isArray(d) && setTraining(d));
    authedFetch(`/api/v1/staff/${staffId}/leave-balances`, t).then(d => Array.isArray(d) && setLeaveBalances(d));
    authedFetch('/api/v1/academic/years', t).then(d => Array.isArray(d) && setAcademicYears(d));
    authedFetch('/api/v1/academic/departments', t).then(d => Array.isArray(d) && setDepartments(d));
    authedFetch('/api/v1/academic/subjects', t).then(d => Array.isArray(d) && setSubjects(d));
  }

  async function handleSaveProfile(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/staff/${staffId}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName: editForm.first_name, lastName: editForm.last_name, phone: editForm.phone, email: editForm.email, address: editForm.address, employmentStatus: editForm.employment_status }) }); loadAll(token); }
  async function handleArchiveStaff() { if (!confirm('Terminate this staff record? It will be retained.')) return; await authedFetch(`/api/v1/staff/${staffId}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddContract(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/staff/${staffId}/contracts`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contractForm) }); setContractForm({ contractType: 'PERMANENT', startDate: '', endDate: '', salaryAgreed: '' }); loadAll(token); }
  async function handleAddEmergencyContact(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/staff/${staffId}/emergency-contacts`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(emergencyForm) }); setEmergencyForm({ name: '', relationship: '', phone: '', address: '' }); loadAll(token); }
  async function handleArchiveEmergencyContact(id: string) { await authedFetch(`/api/v1/staff/${staffId}/emergency-contacts/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddExit(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/staff/${staffId}/exit-records`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(exitForm) }); setExitForm({ exitType: 'RESIGNATION', exitDate: '', reason: '', noticeGiven: false }); loadAll(token); }
  async function handleAddDept(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/staff/${staffId}/department-assignments`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deptForm) }); setDeptForm({ departmentId: '', roleInDepartment: '' }); loadAll(token); }
  async function handleAddSubject(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/staff/${staffId}/subject-assignments`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subjectForm) }); setSubjectForm({ subjectId: '', academicYearId: '' }); loadAll(token); }
  async function handleArchiveSubject(id: string) { await authedFetch(`/api/v1/staff/${staffId}/subject-assignments/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddDoc(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/staff/${staffId}/documents`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(docForm) }); setDocForm({ documentType: '', fileUrl: '' }); loadAll(token); }
  async function handleAddQual(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/staff/${staffId}/qualifications`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(qualForm) }); setQualForm({ qualificationType: 'DEGREE', title: '', institution: '', yearObtained: '' }); loadAll(token); }
  async function handleVerifyQual(id: string, current: boolean) { await authedFetch(`/api/v1/staff/${staffId}/qualifications/${id}/verify`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isVerified: !current }) }); loadAll(token); }
  async function handleArchiveQual(id: string) { await authedFetch(`/api/v1/staff/${staffId}/qualifications/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddCompliance(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/staff/${staffId}/compliance`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(complianceForm) }); setComplianceForm({ complianceType: 'TEACHING_LICENSE', status: 'PENDING', issueDate: '', expiryDate: '' }); loadAll(token); }
  async function handleArchiveCompliance(id: string) { await authedFetch(`/api/v1/staff/${staffId}/compliance/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddBank(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/staff/${staffId}/bank-details`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bankForm) }); setBankForm({ bankName: '', accountNumber: '', accountName: '', isPrimary: false }); loadAll(token); }
  async function handleArchiveBank(id: string) { await authedFetch(`/api/v1/staff/${staffId}/bank-details/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddDisc(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/staff/${staffId}/disciplinary-records`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(discForm) }); setDiscForm({ incidentDate: '', incidentType: '', description: '', actionTaken: '' }); loadAll(token); }
  async function handleAddReview(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/staff/${staffId}/performance-reviews`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reviewForm) }); setReviewForm({ reviewPeriod: '', overallRating: '', comments: '', reviewDate: '' }); loadAll(token); }
  async function handleAddTraining(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/staff/${staffId}/training`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(trainingForm) }); setTrainingForm({ trainingName: '', provider: '', trainingType: '', startDate: '' }); loadAll(token); }
  async function handleSaveBalance(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/staff/${staffId}/leave-balances`, token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(balanceForm) }); loadAll(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;
  if (!staffMember) return <AppShell user={user}><div style={{ padding: 40 }}>Loading…</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">STAFFX · STAFF DETAIL</div>
            <div className="ph-title">👩‍🏫 {staffMember.first_name} {staffMember.last_name}</div>
            <div className="ph-sub">{staffMember.staff_id} · <span className={`bdg ${staffMember.employment_status === 'ACTIVE' ? 'bok' : 'ber'}`}>{staffMember.employment_status}</span></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push('/staff')} style={{ background: 'var(--soft)', color: 'var(--ink)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>← Register</button>
            <button onClick={handleArchiveStaff} style={{ background: 'var(--erB)', color: 'var(--er)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Terminate</button>
          </div>
        </div>
      </div>

      <div className="sys-tabs">
        {TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'overview' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={handleSaveProfile} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">PROFILE</span></div>
            <div className="cb" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
              <div className="fg"><label className="fl">FIRST NAME</label><input className="fi" value={editForm.first_name || ''} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} /></div>
              <div className="fg"><label className="fl">LAST NAME</label><input className="fi" value={editForm.last_name || ''} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} /></div>
              <div className="fg"><label className="fl">PHONE</label><input className="fi" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
              <div className="fg"><label className="fl">EMAIL</label><input className="fi" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
              <div className="fg"><label className="fl">STATUS</label>
                <select className="fi" value={editForm.employment_status || ''} onChange={e => setEditForm({ ...editForm, employment_status: e.target.value })}>
                  <option value="ACTIVE">Active</option><option value="ON_LEAVE">On Leave</option><option value="SUSPENDED">Suspended</option><option value="RESIGNED">Resigned</option><option value="TERMINATED">Terminated</option>
                </select>
              </div>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, alignSelf: 'end' }}>Save</button>
            </div>
          </form>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">EMPLOYMENT HISTORY</span></div>
            {employments.map(e => (<div key={e.id} className="ri na"><div className="ri-b"><div className="ri-t">{e.employment_type}</div><div className="ri-s">Started {e.start_date} {e.is_current && '· Current'}</div></div></div>))}
            {employments.length === 0 && <div className="ri na"><div className="ri-s">No employment record yet.</div></div>}
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">CONTRACTS</span></div>
            {contracts.map(c => (<div key={c.id} className="ri na"><div className="ri-b"><div className="ri-t">{c.contract_type}</div><div className="ri-s">{c.start_date} → {c.end_date || 'Ongoing'}</div></div><span className={`bdg ${c.status === 'ACTIVE' ? 'bok' : 'ber'}`}>{c.status}</span></div>))}
            {contracts.length === 0 && <div className="ri na"><div className="ri-s">No contracts yet.</div></div>}
            <form onSubmit={handleAddContract} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={contractForm.contractType} onChange={e => setContractForm({ ...contractForm, contractType: e.target.value })}><option value="PERMANENT">Permanent</option><option value="CONTRACT">Contract</option><option value="PART_TIME">Part-time</option></select>
              <input className="fi" type="date" value={contractForm.startDate} onChange={e => setContractForm({ ...contractForm, startDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">EMERGENCY CONTACTS</span></div>
            {emergencyContacts.map(c => (<div key={c.id} className="ri na"><div className="ri-b"><div className="ri-t">{c.name}</div><div className="ri-s">{c.relationship} · {c.phone}</div></div><button onClick={() => handleArchiveEmergencyContact(c.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></div>))}
            {emergencyContacts.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddEmergencyContact} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Name" value={emergencyForm.name} onChange={e => setEmergencyForm({ ...emergencyForm, name: e.target.value })} required />
              <input className="fi" placeholder="Relationship" value={emergencyForm.relationship} onChange={e => setEmergencyForm({ ...emergencyForm, relationship: e.target.value })} required />
              <input className="fi" placeholder="Phone" value={emergencyForm.phone} onChange={e => setEmergencyForm({ ...emergencyForm, phone: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">EXIT RECORD</span></div>
            {exitRecords.map(e => (<div key={e.id} className="ri na"><div className="ri-b"><div className="ri-t">{e.exit_type}</div><div className="ri-s">{e.exit_date} · {e.reason || '—'}</div></div></div>))}
            {exitRecords.length === 0 && <div className="ri na"><div className="ri-s">No exit record.</div></div>}
            <form onSubmit={handleAddExit} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={exitForm.exitType} onChange={e => setExitForm({ ...exitForm, exitType: e.target.value })}><option value="RESIGNATION">Resignation</option><option value="TERMINATION">Termination</option><option value="RETIREMENT">Retirement</option></select>
              <input className="fi" type="date" value={exitForm.exitDate} onChange={e => setExitForm({ ...exitForm, exitDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Record</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'assignments' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">DEPARTMENT ASSIGNMENTS</span></div>
            {deptAssignments.map(d => (<div key={d.id} className="ri na"><div className="ri-b"><div className="ri-t">Dept {d.department_id?.slice(0, 8)}</div><div className="ri-s">{d.role_in_department || '—'}</div></div>{d.is_current && <span className="bdg bok">Current</span>}</div>))}
            {deptAssignments.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddDept} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={deptForm.departmentId} onChange={e => setDeptForm({ ...deptForm, departmentId: e.target.value })} required style={{ flex: 1 }}>
                <option value="">Department...</option>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input className="fi" placeholder="Role (e.g. HOD)" value={deptForm.roleInDepartment} onChange={e => setDeptForm({ ...deptForm, roleInDepartment: e.target.value })} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Assign</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">SUBJECT ASSIGNMENTS</span></div>
            {subjectAssignments.map(s => (<div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">Subject {s.subject_id?.slice(0, 8)}</div></div><button onClick={() => handleArchiveSubject(s.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></div>))}
            {subjectAssignments.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddSubject} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={subjectForm.subjectId} onChange={e => setSubjectForm({ ...subjectForm, subjectId: e.target.value })} required style={{ flex: 1 }}>
                <option value="">Subject...</option>
                {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select className="fi" value={subjectForm.academicYearId} onChange={e => setSubjectForm({ ...subjectForm, academicYearId: e.target.value })} required>
                <option value="">Academic Year...</option>
                {academicYears.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Assign</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'docs' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">HR DOCUMENTS</span></div>
            {documents.map(d => (<div key={d.id} className="ri na"><div className="ri-b"><div className="ri-t">{d.document_type}</div><div className="ri-s"><a href={d.file_url} target="_blank" rel="noreferrer" style={{ color: 'var(--in)' }}>View</a></div></div></div>))}
            {documents.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddDoc} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Document type" value={docForm.documentType} onChange={e => setDocForm({ ...docForm, documentType: e.target.value })} required />
              <input className="fi" placeholder="File URL" value={docForm.fileUrl} onChange={e => setDocForm({ ...docForm, fileUrl: e.target.value })} required style={{ flex: 1 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Upload</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">QUALIFICATIONS</span></div>
            {qualifications.map(q => (<div key={q.id} className="ri na"><div className="ri-b"><div className="ri-t">{q.title}</div><div className="ri-s">{q.institution} · {q.year_obtained}</div></div>
              <span className={`bdg ${q.is_verified ? 'bok' : 'bwn'}`} onClick={() => handleVerifyQual(q.id, q.is_verified)} style={{ cursor: 'pointer', marginRight: 8 }}>{q.is_verified ? 'Verified' : 'Unverified'}</span>
              <button onClick={() => handleArchiveQual(q.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
            </div>))}
            {qualifications.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddQual} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={qualForm.qualificationType} onChange={e => setQualForm({ ...qualForm, qualificationType: e.target.value })}><option value="DEGREE">Degree</option><option value="DIPLOMA">Diploma</option><option value="CERTIFICATE">Certificate</option></select>
              <input className="fi" placeholder="Title" value={qualForm.title} onChange={e => setQualForm({ ...qualForm, title: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" placeholder="Institution" value={qualForm.institution} onChange={e => setQualForm({ ...qualForm, institution: e.target.value })} required />
              <input className="fi" type="number" placeholder="Year" value={qualForm.yearObtained} onChange={e => setQualForm({ ...qualForm, yearObtained: e.target.value })} style={{ width: 90 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'compliance' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">REGULATORY COMPLIANCE</span></div>
            {compliance.map(c => (<div key={c.id} className="ri na"><div className="ri-b"><div className="ri-t">{c.compliance_type}</div><div className="ri-s">Expires {c.expiry_date || '—'}</div></div><span className={`bdg ${c.status === 'VALID' ? 'bok' : c.status === 'EXPIRED' ? 'ber' : 'bwn'}`} style={{ marginRight: 8 }}>{c.status}</span><button onClick={() => handleArchiveCompliance(c.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></div>))}
            {compliance.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddCompliance} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={complianceForm.complianceType} onChange={e => setComplianceForm({ ...complianceForm, complianceType: e.target.value })}><option value="TEACHING_LICENSE">Teaching License</option><option value="NATIONAL_ID">National ID</option><option value="TAX_REGISTRATION">Tax Registration</option></select>
              <input className="fi" type="date" placeholder="Expiry" value={complianceForm.expiryDate} onChange={e => setComplianceForm({ ...complianceForm, expiryDate: e.target.value })} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">BANK DETAILS</span></div>
            {bankDetails.map(b => (<div key={b.id} className="ri na"><div className="ri-b"><div className="ri-t">{b.bank_name} {b.is_primary && <span className="bdg bgo">Primary</span>}</div><div className="ri-s">{b.account_number}</div></div><button onClick={() => handleArchiveBank(b.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></div>))}
            {bankDetails.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddBank} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Bank name" value={bankForm.bankName} onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} required />
              <input className="fi" placeholder="Account number" value={bankForm.accountNumber} onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })} required />
              <input className="fi" placeholder="Account name" value={bankForm.accountName} onChange={e => setBankForm({ ...bankForm, accountName: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'hr' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">DISCIPLINARY RECORDS</span></div>
            {disciplinaryRecords.map(d => (<div key={d.id} className="ri na"><div className="ri-b"><div className="ri-t">{d.incident_type}</div><div className="ri-s">{d.description}</div></div></div>))}
            {disciplinaryRecords.length === 0 && <div className="ri na"><div className="ri-s">None recorded.</div></div>}
            <form onSubmit={handleAddDisc} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Incident type" value={discForm.incidentType} onChange={e => setDiscForm({ ...discForm, incidentType: e.target.value })} required />
              <input className="fi" placeholder="Description" value={discForm.description} onChange={e => setDiscForm({ ...discForm, description: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" type="date" value={discForm.incidentDate} onChange={e => setDiscForm({ ...discForm, incidentDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">PERFORMANCE REVIEWS</span></div>
            {performanceReviews.map(r => (<div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{r.review_period}</div><div className="ri-s">Rating: {r.overall_rating}</div></div></div>))}
            {performanceReviews.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddReview} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Review period" value={reviewForm.reviewPeriod} onChange={e => setReviewForm({ ...reviewForm, reviewPeriod: e.target.value })} required />
              <input className="fi" placeholder="Rating" value={reviewForm.overallRating} onChange={e => setReviewForm({ ...reviewForm, overallRating: e.target.value })} required style={{ width: 90 }} />
              <input className="fi" type="date" value={reviewForm.reviewDate} onChange={e => setReviewForm({ ...reviewForm, reviewDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">TRAINING</span></div>
            {training.map(t => (<div key={t.id} className="ri na"><div className="ri-b"><div className="ri-t">{t.training_name}</div><div className="ri-s">{t.provider}</div></div></div>))}
            {training.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddTraining} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Training name" value={trainingForm.trainingName} onChange={e => setTrainingForm({ ...trainingForm, trainingName: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" placeholder="Provider" value={trainingForm.provider} onChange={e => setTrainingForm({ ...trainingForm, provider: e.target.value })} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">LEAVE BALANCE</span></div>
            {leaveBalances.map(b => (<div key={b.id} className="ri na"><div className="ri-b"><div className="ri-t">{b.leave_type} ({b.year})</div><div className="ri-s">{b.remaining_days} / {b.entitlement_days} days remaining</div></div></div>))}
            {leaveBalances.length === 0 && <div className="ri na"><div className="ri-s">No balance set yet.</div></div>}
            <form onSubmit={handleSaveBalance} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={balanceForm.leaveType} onChange={e => setBalanceForm({ ...balanceForm, leaveType: e.target.value })}><option value="ANNUAL">Annual</option><option value="SICK">Sick</option></select>
              <input className="fi" type="number" placeholder="Entitlement" value={balanceForm.entitlementDays} onChange={e => setBalanceForm({ ...balanceForm, entitlementDays: +e.target.value })} style={{ width: 90 }} />
              <input className="fi" type="number" placeholder="Used" value={balanceForm.usedDays} onChange={e => setBalanceForm({ ...balanceForm, usedDays: +e.target.value })} style={{ width: 90 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Save</button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
