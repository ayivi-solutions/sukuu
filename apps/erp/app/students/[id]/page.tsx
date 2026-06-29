'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import { authedFetch } from '../../../lib/api';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'family', label: 'Family & Contacts' },
  { key: 'medical', label: 'Medical & Welfare' },
  { key: 'documents', label: 'Documents' },
  { key: 'academic', label: 'Academic Life' },
  { key: 'finance', label: 'Finance' },
  { key: 'records', label: 'Records' },
];

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState('');

  const [student, setStudent] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [academicClasses, setAcademicClasses] = useState<any[]>([]);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [medical, setMedical] = useState<any>({});
  const [healthIncidents, setHealthIncidents] = useState<any[]>([]);
  const [behaviorRecords, setBehaviorRecords] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [identityDocuments, setIdentityDocuments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [attendanceSummaries, setAttendanceSummaries] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [transportAssignments, setTransportAssignments] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [feeProfiles, setFeeProfiles] = useState<any[]>([]);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [graduations, setGraduations] = useState<any[]>([]);
  const [portalAccess, setPortalAccess] = useState<any>(null);

  const [editForm, setEditForm] = useState<any>({});
  const [enrollForm, setEnrollForm] = useState({ academicYearId: '', classId: '', streamId: '', admissionDate: '', rollNumber: '' });
  const [guardianForm, setGuardianForm] = useState({ fullName: '', relationship: 'FATHER', phone: '', email: '', isPrimary: false });
  const [addressForm, setAddressForm] = useState({ addressType: 'RESIDENTIAL', street: '', city: '', region: '', isPrimary: false });
  const [contactForm, setContactForm] = useState({ contactType: 'PHONE', value: '', label: '' });
  const [healthForm, setHealthForm] = useState({ description: '', actionTaken: '', parentNotified: false });
  const [behaviorForm, setBehaviorForm] = useState({ recordType: 'COMMENDATION', description: '', incidentDate: '', parentNotified: false });
  const [docForm, setDocForm] = useState({ documentType: '', fileUrl: '' });
  const [idDocForm, setIdDocForm] = useState({ documentType: 'BIRTH_CERTIFICATE', documentNumber: '', verified: false });
  const [noteForm, setNoteForm] = useState({ note: '', category: '', isConfidential: false });
  const [attForm, setAttForm] = useState({ termId: '', totalSchoolDays: 0, daysPresent: 0, daysAbsent: 0, daysLate: 0, attendancePct: 0 });
  const [houseForm, setHouseForm] = useState({ houseName: '' });
  const [transportForm, setTransportForm] = useState({ routeName: '', pickupPoint: '', dropoffPoint: '' });
  const [tagForm, setTagForm] = useState({ tag: '' });
  const [feeForm, setFeeForm] = useState({ feeStructureId: '', notes: '' });
  const [scholarshipForm, setScholarshipForm] = useState({ scholarshipName: '', sponsor: '', coverageType: 'FULL', coveragePct: 100, startDate: '' });
  const [transferForm, setTransferForm] = useState({ transferType: 'OUT', toSchool: '', fromSchool: '', transferDate: '', reason: '' });
  const [graduationForm, setGraduationForm] = useState({ graduationDate: '', finalClassId: '', honours: '' });
  const [editingEnrollment, setEditingEnrollment] = useState<any>(null);
  const [enrollEditForm, setEnrollEditForm] = useState({ rollNumber: '', enrollmentStatus: 'ACTIVE' });
  const [editingGuardian, setEditingGuardian] = useState<any>(null);
  const [guardianEditForm, setGuardianEditForm] = useState({ fullName: '', relationship: 'FATHER', phone: '', email: '', isPrimary: false });
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [addressEditForm, setAddressEditForm] = useState({ addressType: 'RESIDENTIAL', street: '', city: '', region: '', isPrimary: false });
  const [editingContact, setEditingContact] = useState<any>(null);
  const [contactEditForm, setContactEditForm] = useState({ contactType: 'PHONE', value: '', label: '' });
  const [editingIdDoc, setEditingIdDoc] = useState<any>(null);
  const [idDocEditForm, setIdDocEditForm] = useState({ documentType: 'BIRTH_CERTIFICATE', documentNumber: '' });
  const [editingFee, setEditingFee] = useState<any>(null);
  const [feeEditForm, setFeeEditForm] = useState({ notes: '' });
  const [editingScholarship, setEditingScholarship] = useState<any>(null);
  const [scholarshipEditForm, setScholarshipEditForm] = useState({ scholarshipName: '', sponsor: '', coverageType: 'FULL', coveragePct: 100, endDate: '' });

  useEffect(() => {
    const t = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    setUser(userStr ? JSON.parse(userStr) : null);
    loadAll(t);
  }, [router, studentId]);

  function loadAll(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    authedFetch(`/api/v1/students/${studentId}`, t).then(d => { if (d?.error) setError(d.error); else { setStudent(d); setEditForm(d); } });
    authedFetch(`/api/v1/students/${studentId}/enrollments`, t).then(d => Array.isArray(d) && setEnrollments(d));
    authedFetch(`/api/v1/students/${studentId}/status-history`, t).then(d => Array.isArray(d) && setStatusHistory(d));
    authedFetch('/api/v1/academic/years', t).then(d => Array.isArray(d) && setAcademicYears(d));
    authedFetch('/api/v1/academic/classes', t).then(d => Array.isArray(d) && setAcademicClasses(d));
    authedFetch(`/api/v1/students/${studentId}/guardians`, t).then(d => Array.isArray(d) && setGuardians(d));
    authedFetch(`/api/v1/students/${studentId}/addresses`, t).then(d => Array.isArray(d) && setAddresses(d));
    authedFetch(`/api/v1/students/${studentId}/contacts`, t).then(d => Array.isArray(d) && setContacts(d));
    authedFetch(`/api/v1/students/${studentId}/medical`, t).then(d => d && setMedical(d));
    authedFetch(`/api/v1/students/${studentId}/health-incidents`, t).then(d => Array.isArray(d) && setHealthIncidents(d));
    authedFetch(`/api/v1/students/${studentId}/behavior-records`, t).then(d => Array.isArray(d) && setBehaviorRecords(d));
    authedFetch(`/api/v1/students/${studentId}/documents`, t).then(d => Array.isArray(d) && setDocuments(d));
    authedFetch(`/api/v1/students/${studentId}/identity-documents`, t).then(d => Array.isArray(d) && setIdentityDocuments(d));
    authedFetch(`/api/v1/students/${studentId}/notes`, t).then(d => Array.isArray(d) && setNotes(d));
    authedFetch(`/api/v1/students/${studentId}/attendance-summaries`, t).then(d => Array.isArray(d) && setAttendanceSummaries(d));
    authedFetch(`/api/v1/students/${studentId}/houses`, t).then(d => Array.isArray(d) && setHouses(d));
    authedFetch(`/api/v1/students/${studentId}/transport-assignments`, t).then(d => Array.isArray(d) && setTransportAssignments(d));
    authedFetch(`/api/v1/students/${studentId}/tags`, t).then(d => Array.isArray(d) && setTags(d));
    authedFetch(`/api/v1/students/${studentId}/fee-profiles`, t).then(d => Array.isArray(d) && setFeeProfiles(d));
    authedFetch(`/api/v1/students/${studentId}/scholarships`, t).then(d => Array.isArray(d) && setScholarships(d));
    authedFetch(`/api/v1/students/${studentId}/transfers`, t).then(d => Array.isArray(d) && setTransfers(d));
    authedFetch(`/api/v1/students/${studentId}/graduations`, t).then(d => Array.isArray(d) && setGraduations(d));
    authedFetch(`/api/v1/students/${studentId}/portal-access`, t).then(d => d && setPortalAccess(d));
  }

  async function handleSaveProfile(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName: editForm.first_name, middleName: editForm.middle_name, lastName: editForm.last_name, gender: editForm.gender, nationality: editForm.nationality, status: editForm.status }) }); loadAll(token); }
  async function handleArchiveStudent() { if (!confirm('Withdraw this student? Record is retained.')) return; await authedFetch(`/api/v1/students/${studentId}/archive`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Withdrawn via StudentX' }) }); loadAll(token); }
  async function handleAddEnrollment(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/enrollments`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(enrollForm) }); loadAll(token); }
  async function handleAddGuardian(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/guardians`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(guardianForm) }); setGuardianForm({ fullName: '', relationship: 'FATHER', phone: '', email: '', isPrimary: false }); loadAll(token); }
  async function handleArchiveGuardian(id: string) { await authedFetch(`/api/v1/students/${studentId}/guardians/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddAddress(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/addresses`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addressForm) }); setAddressForm({ addressType: 'RESIDENTIAL', street: '', city: '', region: '', isPrimary: false }); loadAll(token); }
  async function handleArchiveAddress(id: string) { await authedFetch(`/api/v1/students/${studentId}/addresses/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddContact(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/contacts`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contactForm) }); setContactForm({ contactType: 'PHONE', value: '', label: '' }); loadAll(token); }
  async function handleArchiveContact(id: string) { await authedFetch(`/api/v1/students/${studentId}/contacts/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleSaveMedical(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/medical`, token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(medical) }); loadAll(token); }
  async function handleAddHealthIncident(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/health-incidents`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(healthForm) }); setHealthForm({ description: '', actionTaken: '', parentNotified: false }); loadAll(token); }
  async function handleAddBehavior(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/behavior-records`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(behaviorForm) }); setBehaviorForm({ recordType: 'COMMENDATION', description: '', incidentDate: '', parentNotified: false }); loadAll(token); }
  async function handleAddDocument(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/documents`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(docForm) }); setDocForm({ documentType: '', fileUrl: '' }); loadAll(token); }
  async function handleAddIdDoc(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/identity-documents`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(idDocForm) }); setIdDocForm({ documentType: 'BIRTH_CERTIFICATE', documentNumber: '', verified: false }); loadAll(token); }
  async function handleVerifyIdDoc(id: string, current: boolean) { await authedFetch(`/api/v1/students/${studentId}/identity-documents/${id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ verified: !current }) }); loadAll(token); }
  async function handleArchiveIdDoc(id: string) { await authedFetch(`/api/v1/students/${studentId}/identity-documents/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddNote(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/notes`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(noteForm) }); setNoteForm({ note: '', category: '', isConfidential: false }); loadAll(token); }
  async function handleSaveAttendance(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/attendance-summaries`, token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(attForm) }); loadAll(token); }
  async function handleAssignHouse(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/houses`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(houseForm) }); setHouseForm({ houseName: '' }); loadAll(token); }
  async function handleAddTransport(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/transport-assignments`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(transportForm) }); setTransportForm({ routeName: '', pickupPoint: '', dropoffPoint: '' }); loadAll(token); }
  async function handleToggleTransport(id: string, current: boolean) { await authedFetch(`/api/v1/students/${studentId}/transport-assignments/${id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !current }) }); loadAll(token); }
  async function handleAddTag(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/tags`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tagForm) }); setTagForm({ tag: '' }); loadAll(token); }
  async function handleArchiveTag(id: string) { await authedFetch(`/api/v1/students/${studentId}/tags/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddFee(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/fee-profiles`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(feeForm) }); setFeeForm({ feeStructureId: '', notes: '' }); loadAll(token); }
  async function handleArchiveFee(id: string) { await authedFetch(`/api/v1/students/${studentId}/fee-profiles/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddScholarship(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/scholarships`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scholarshipForm) }); setScholarshipForm({ scholarshipName: '', sponsor: '', coverageType: 'FULL', coveragePct: 100, startDate: '' }); loadAll(token); }
  async function handleArchiveScholarship(id: string) { await authedFetch(`/api/v1/students/${studentId}/scholarships/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddTransfer(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/transfers`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(transferForm) }); setTransferForm({ transferType: 'OUT', toSchool: '', fromSchool: '', transferDate: '', reason: '' }); loadAll(token); }
  async function handleAddGraduation(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/graduations`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(graduationForm) }); setGraduationForm({ graduationDate: '', finalClassId: '', honours: '' }); loadAll(token); }
  async function handleTogglePortal() { await authedFetch(`/api/v1/students/${studentId}/portal-access`, token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: portalAccess?.user_id || '', isEnabled: !portalAccess?.is_enabled }) }); loadAll(token); }
  function openEditEnrollment(en: any) { setEditingEnrollment(en); setEnrollEditForm({ rollNumber: en.roll_number || '', enrollmentStatus: en.enrollment_status }); }
  async function handleSaveEnrollment(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/enrollments/${editingEnrollment.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(enrollEditForm) }); setEditingEnrollment(null); loadAll(token); }
  function openEditGuardian(g: any) { setEditingGuardian(g); setGuardianEditForm({ fullName: g.full_name, relationship: g.relationship, phone: g.phone, email: g.email || '', isPrimary: g.is_primary }); }
  async function handleSaveGuardian(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/guardians/${editingGuardian.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(guardianEditForm) }); setEditingGuardian(null); loadAll(token); }
  function openEditAddress(a: any) { setEditingAddress(a); setAddressEditForm({ addressType: a.address_type, street: a.street || '', city: a.city, region: a.region, isPrimary: a.is_primary }); }
  async function handleSaveAddress(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/addresses/${editingAddress.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addressEditForm) }); setEditingAddress(null); loadAll(token); }
  function openEditContact(c: any) { setEditingContact(c); setContactEditForm({ contactType: c.contact_type, value: c.value, label: c.label || '' }); }
  async function handleSaveContact(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/contacts/${editingContact.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contactEditForm) }); setEditingContact(null); loadAll(token); }
  function openEditIdDoc(d: any) { setEditingIdDoc(d); setIdDocEditForm({ documentType: d.document_type, documentNumber: d.document_number }); }
  async function handleSaveIdDoc(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/identity-documents/${editingIdDoc.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(idDocEditForm) }); setEditingIdDoc(null); loadAll(token); }
  function openEditFee(f: any) { setEditingFee(f); setFeeEditForm({ notes: f.notes || '' }); }
  async function handleSaveFee(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/fee-profiles/${editingFee.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(feeEditForm) }); setEditingFee(null); loadAll(token); }
  function openEditScholarship(s: any) { setEditingScholarship(s); setScholarshipEditForm({ scholarshipName: s.scholarship_name, sponsor: s.sponsor || '', coverageType: s.coverage_type, coveragePct: s.coverage_pct || 100, endDate: s.end_date || '' }); }
  async function handleSaveScholarship(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/students/${studentId}/scholarships/${editingScholarship.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scholarshipEditForm) }); setEditingScholarship(null); loadAll(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;
  if (!student) return <AppShell user={user}><div style={{ padding: 40 }}>Loading…</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">STUDENTX · STUDENT DETAIL</div>
            <div className="ph-title">🧑‍🎒 {student.first_name} {student.last_name}</div>
            <div className="ph-sub">{student.student_id} · <span className={`bdg ${student.status === 'ACTIVE' ? 'bok' : student.status === 'SUSPENDED' ? 'bwn' : 'ber'}`}>{student.status}</span></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push('/students')} style={{ background: 'var(--soft)', color: 'var(--ink)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>← Register</button>
            <button onClick={handleArchiveStudent} style={{ background: 'var(--erB)', color: 'var(--er)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Withdraw</button>
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
              <div className="fg"><label className="fl">MIDDLE NAME</label><input className="fi" value={editForm.middle_name || ''} onChange={e => setEditForm({ ...editForm, middle_name: e.target.value })} /></div>
              <div className="fg"><label className="fl">LAST NAME</label><input className="fi" value={editForm.last_name || ''} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} /></div>
              <div className="fg"><label className="fl">NATIONALITY</label><input className="fi" value={editForm.nationality || ''} onChange={e => setEditForm({ ...editForm, nationality: e.target.value })} /></div>
              <div className="fg"><label className="fl">STATUS</label>
                <select className="fi" value={editForm.status || ''} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="GRADUATED">Graduated</option><option value="TRANSFERRED">Transferred</option><option value="WITHDRAWN">Withdrawn</option>
                </select>
              </div>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, alignSelf: 'end' }}>Save</button>
            </div>
          </form>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">ENROLMENT HISTORY</span></div>
            {enrollments.map(en => (<div key={en.id} className="ri na"><div className="ri-b"><div className="ri-t">{en.enrollment_status}</div><div className="ri-s">Roll #{en.roll_number || '—'} · Admitted {en.admission_date}</div></div><button onClick={() => openEditEnrollment(en)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>Edit</button></div>))}
            {enrollments.length === 0 && <div className="ri na"><div className="ri-s">No enrolment records yet.</div></div>}
            <form onSubmit={handleAddEnrollment} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={enrollForm.academicYearId} onChange={e => setEnrollForm({ ...enrollForm, academicYearId: e.target.value })} required>
                <option value="">Academic Year...</option>
                {academicYears.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
              <select className="fi" value={enrollForm.classId} onChange={e => setEnrollForm({ ...enrollForm, classId: e.target.value })} required>
                <option value="">Class...</option>
                {academicClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className="fi" type="date" value={enrollForm.admissionDate} onChange={e => setEnrollForm({ ...enrollForm, admissionDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">STATUS HISTORY</span></div>
            {statusHistory.map(h => (<div key={h.id} className="ri na"><div className="ri-b"><div className="ri-t">{h.from_status} → {h.to_status}</div><div className="ri-s">{h.reason || '—'} · {new Date(h.changed_at).toLocaleString()}</div></div></div>))}
            {statusHistory.length === 0 && <div className="ri na"><div className="ri-s">No status changes yet.</div></div>}
          </div>
        </div>
      )}

      {tab === 'family' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">GUARDIANS</span></div>
            {guardians.map(g => (<div key={g.id} className="ri na"><div className="ri-b"><div className="ri-t">{g.full_name} {g.is_primary && <span className="bdg bgo">Primary</span>}</div><div className="ri-s">{g.relationship} · {g.phone}</div></div><button onClick={() => openEditGuardian(g)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button><button onClick={() => handleArchiveGuardian(g.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></div>))}
            {guardians.length === 0 && <div className="ri na"><div className="ri-s">No guardians yet.</div></div>}
            <form onSubmit={handleAddGuardian} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Full name" value={guardianForm.fullName} onChange={e => setGuardianForm({ ...guardianForm, fullName: e.target.value })} required />
              <select className="fi" value={guardianForm.relationship} onChange={e => setGuardianForm({ ...guardianForm, relationship: e.target.value })}><option value="FATHER">Father</option><option value="MOTHER">Mother</option><option value="GUARDIAN">Guardian</option></select>
              <input className="fi" placeholder="Phone" value={guardianForm.phone} onChange={e => setGuardianForm({ ...guardianForm, phone: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">ADDRESSES</span></div>
            {addresses.map(a => (<div key={a.id} className="ri na"><div className="ri-b"><div className="ri-t">{a.city}, {a.region}</div><div className="ri-s">{a.address_type} {a.is_primary && '· Primary'}</div></div><button onClick={() => openEditAddress(a)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button><button onClick={() => handleArchiveAddress(a.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></div>))}
            {addresses.length === 0 && <div className="ri na"><div className="ri-s">No addresses yet.</div></div>}
            <form onSubmit={handleAddAddress} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="City" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} required />
              <input className="fi" placeholder="Region" value={addressForm.region} onChange={e => setAddressForm({ ...addressForm, region: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">ADDITIONAL CONTACTS</span></div>
            {contacts.map(c => (<div key={c.id} className="ri na"><div className="ri-b"><div className="ri-t">{c.label || c.contact_type}</div><div className="ri-s">{c.value}</div></div><button onClick={() => openEditContact(c)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button><button onClick={() => handleArchiveContact(c.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></div>))}
            {contacts.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddContact} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={contactForm.contactType} onChange={e => setContactForm({ ...contactForm, contactType: e.target.value })}><option value="PHONE">Phone</option><option value="EMAIL">Email</option><option value="WHATSAPP">WhatsApp</option></select>
              <input className="fi" placeholder="Value" value={contactForm.value} onChange={e => setContactForm({ ...contactForm, value: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'medical' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={handleSaveMedical} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">MEDICAL PROFILE</span></div>
            <div className="cb" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
              <div className="fg"><label className="fl">BLOOD GROUP</label><input className="fi" value={medical.blood_group || ''} onChange={e => setMedical({ ...medical, blood_group: e.target.value })} /></div>
              <div className="fg"><label className="fl">ALLERGIES</label><input className="fi" value={medical.allergies || ''} onChange={e => setMedical({ ...medical, allergies: e.target.value })} /></div>
              <div className="fg"><label className="fl">EMERGENCY CONTACT NAME</label><input className="fi" value={medical.emergency_contact_name || ''} onChange={e => setMedical({ ...medical, emergency_contact_name: e.target.value })} /></div>
              <div className="fg"><label className="fl">EMERGENCY PHONE</label><input className="fi" value={medical.emergency_contact_phone || ''} onChange={e => setMedical({ ...medical, emergency_contact_phone: e.target.value })} /></div>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, alignSelf: 'end' }}>Save</button>
            </div>
          </form>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">HEALTH INCIDENTS</span></div>
            {healthIncidents.map(h => (<div key={h.id} className="ri na"><div className="ri-b"><div className="ri-t">{h.description}</div><div className="ri-s">{new Date(h.incident_date).toLocaleDateString()} · {h.action_taken || '—'}</div></div></div>))}
            {healthIncidents.length === 0 && <div className="ri na"><div className="ri-s">None recorded.</div></div>}
            <form onSubmit={handleAddHealthIncident} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Description" value={healthForm.description} onChange={e => setHealthForm({ ...healthForm, description: e.target.value })} required style={{ flex: 1 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">BEHAVIOUR RECORDS</span></div>
            {behaviorRecords.map(b => (<div key={b.id} className="ri na"><div className="ri-b"><div className="ri-t">{b.description}</div><div className="ri-s">{b.record_type} · {b.incident_date}</div></div></div>))}
            {behaviorRecords.length === 0 && <div className="ri na"><div className="ri-s">None recorded.</div></div>}
            <form onSubmit={handleAddBehavior} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={behaviorForm.recordType} onChange={e => setBehaviorForm({ ...behaviorForm, recordType: e.target.value })}><option value="COMMENDATION">Commendation</option><option value="INFRACTION">Infraction</option></select>
              <input className="fi" placeholder="Description" value={behaviorForm.description} onChange={e => setBehaviorForm({ ...behaviorForm, description: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" type="date" value={behaviorForm.incidentDate} onChange={e => setBehaviorForm({ ...behaviorForm, incidentDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'documents' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">DOCUMENT LIBRARY</span></div>
            {documents.map(d => (<div key={d.id} className="ri na"><div className="ri-b"><div className="ri-t">{d.document_type}</div><div className="ri-s"><a href={d.file_url} target="_blank" rel="noreferrer" style={{ color: 'var(--in)' }}>View file</a></div></div></div>))}
            {documents.length === 0 && <div className="ri na"><div className="ri-s">No documents yet.</div></div>}
            <form onSubmit={handleAddDocument} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Document type" value={docForm.documentType} onChange={e => setDocForm({ ...docForm, documentType: e.target.value })} required />
              <input className="fi" placeholder="File URL" value={docForm.fileUrl} onChange={e => setDocForm({ ...docForm, fileUrl: e.target.value })} required style={{ flex: 1 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Upload</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">IDENTITY DOCUMENTS</span></div>
            {identityDocuments.map(d => (<div key={d.id} className="ri na"><div className="ri-b"><div className="ri-t">{d.document_type}</div><div className="ri-s">{d.document_number}</div></div>
              <span className={`bdg ${d.verified ? 'bok' : 'bwn'}`} onClick={() => handleVerifyIdDoc(d.id, d.verified)} style={{ cursor: 'pointer', marginRight: 8 }}>{d.verified ? 'Verified' : 'Unverified'}</span>
              <button onClick={() => openEditIdDoc(d)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button>
              <button onClick={() => handleArchiveIdDoc(d.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
            </div>))}
            {identityDocuments.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddIdDoc} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={idDocForm.documentType} onChange={e => setIdDocForm({ ...idDocForm, documentType: e.target.value })}><option value="BIRTH_CERTIFICATE">Birth Certificate</option><option value="PASSPORT">Passport</option><option value="NATIONAL_ID">National ID</option></select>
              <input className="fi" placeholder="Document number" value={idDocForm.documentNumber} onChange={e => setIdDocForm({ ...idDocForm, documentNumber: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">STAFF NOTES</span></div>
            {notes.map(n => (<div key={n.id} className="ri na"><div className="ri-b"><div className="ri-t">{n.note} {n.is_confidential && <span className="bdg ber">Confidential</span>}</div><div className="ri-s">{n.category || '—'} · {new Date(n.created_at).toLocaleString()}</div></div></div>))}
            {notes.length === 0 && <div className="ri na"><div className="ri-s">No notes yet.</div></div>}
            <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Note" value={noteForm.note} onChange={e => setNoteForm({ ...noteForm, note: e.target.value })} required style={{ flex: 1 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={noteForm.isConfidential} onChange={e => setNoteForm({ ...noteForm, isConfidential: e.target.checked })} /> Confidential</label>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'academic' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">ATTENDANCE SUMMARY</span></div>
            {attendanceSummaries.map(a => (<div key={a.id} className="ri na"><div className="ri-b"><div className="ri-t">{a.attendance_pct}% attendance</div><div className="ri-s">{a.days_present} present / {a.days_absent} absent / {a.days_late} late</div></div></div>))}
            {attendanceSummaries.length === 0 && <div className="ri na"><div className="ri-s">No attendance recorded yet.</div></div>}
            <form onSubmit={handleSaveAttendance} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Term ID" value={attForm.termId} onChange={e => setAttForm({ ...attForm, termId: e.target.value })} required />
              <input className="fi" type="number" placeholder="Present" value={attForm.daysPresent} onChange={e => setAttForm({ ...attForm, daysPresent: +e.target.value })} style={{ width: 90 }} />
              <input className="fi" type="number" placeholder="Absent" value={attForm.daysAbsent} onChange={e => setAttForm({ ...attForm, daysAbsent: +e.target.value })} style={{ width: 90 }} />
              <input className="fi" type="number" placeholder="% " value={attForm.attendancePct} onChange={e => setAttForm({ ...attForm, attendancePct: +e.target.value })} style={{ width: 70 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Save</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">HOUSE</span></div>
            {houses.map(h => (<div key={h.id} className="ri na"><div className="ri-b"><div className="ri-t">{h.house_name}</div></div>{h.is_current && <span className="bdg bok">Current</span>}</div>))}
            {houses.length === 0 && <div className="ri na"><div className="ri-s">No house assigned yet.</div></div>}
            <form onSubmit={handleAssignHouse} style={{ display: 'flex', gap: 8, padding: 12 }}>
              <input className="fi" placeholder="House name" value={houseForm.houseName} onChange={e => setHouseForm({ ...houseForm, houseName: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Assign</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">TRANSPORT</span></div>
            {transportAssignments.map(t => (<div key={t.id} className="ri na"><div className="ri-b"><div className="ri-t">{t.route_name}</div><div className="ri-s">{t.pickup_point}</div></div><div className={`tog ${t.is_active ? 'on' : 'off'}`} onClick={() => handleToggleTransport(t.id, t.is_active)} /></div>))}
            {transportAssignments.length === 0 && <div className="ri na"><div className="ri-s">None assigned yet.</div></div>}
            <form onSubmit={handleAddTransport} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Route name" value={transportForm.routeName} onChange={e => setTransportForm({ ...transportForm, routeName: e.target.value })} required />
              <input className="fi" placeholder="Pickup point" value={transportForm.pickupPoint} onChange={e => setTransportForm({ ...transportForm, pickupPoint: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">TAGS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {tags.map(t => (<span key={t.id} className="bdg bin" style={{ cursor: 'pointer' }} onClick={() => handleArchiveTag(t.id)}>{t.tag} ✕</span>))}
            </div>
            <form onSubmit={handleAddTag} style={{ display: 'flex', gap: 8, padding: 12 }}>
              <input className="fi" placeholder="Tag" value={tagForm.tag} onChange={e => setTagForm({ ...tagForm, tag: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'finance' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">FEE PROFILES</span></div>
            {feeProfiles.map(f => (<div key={f.id} className="ri na"><div className="ri-b"><div className="ri-t">Fee structure {f.fee_structure_id?.slice(0, 8)}</div><div className="ri-s">{f.notes || '—'}</div></div><button onClick={() => openEditFee(f)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button><button onClick={() => handleArchiveFee(f.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></div>))}
            {feeProfiles.length === 0 && <div className="ri na"><div className="ri-s">No fee profile assigned yet.</div></div>}
            <form onSubmit={handleAddFee} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Fee Structure ID" value={feeForm.feeStructureId} onChange={e => setFeeForm({ ...feeForm, feeStructureId: e.target.value })} required style={{ flex: 1 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Assign</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">SCHOLARSHIPS</span></div>
            {scholarships.map(s => (<div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{s.scholarship_name}</div><div className="ri-s">{s.sponsor || '—'} · {s.coverage_type} {s.coverage_pct}%</div></div><button onClick={() => openEditScholarship(s)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button><button onClick={() => handleArchiveScholarship(s.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></div>))}
            {scholarships.length === 0 && <div className="ri na"><div className="ri-s">No scholarships yet.</div></div>}
            <form onSubmit={handleAddScholarship} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Scholarship name" value={scholarshipForm.scholarshipName} onChange={e => setScholarshipForm({ ...scholarshipForm, scholarshipName: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" placeholder="Sponsor" value={scholarshipForm.sponsor} onChange={e => setScholarshipForm({ ...scholarshipForm, sponsor: e.target.value })} />
              <input className="fi" type="date" value={scholarshipForm.startDate} onChange={e => setScholarshipForm({ ...scholarshipForm, startDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'records' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">TRANSFERS</span></div>
            {transfers.map(t => (<div key={t.id} className="ri na"><div className="ri-b"><div className="ri-t">{t.transfer_type}</div><div className="ri-s">{t.from_school || '—'} → {t.to_school || '—'} · {t.transfer_date}</div></div></div>))}
            {transfers.length === 0 && <div className="ri na"><div className="ri-s">No transfer records yet.</div></div>}
            <form onSubmit={handleAddTransfer} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={transferForm.transferType} onChange={e => setTransferForm({ ...transferForm, transferType: e.target.value })}><option value="IN">In</option><option value="OUT">Out</option></select>
              <input className="fi" placeholder="To/From school" value={transferForm.toSchool} onChange={e => setTransferForm({ ...transferForm, toSchool: e.target.value })} />
              <input className="fi" type="date" value={transferForm.transferDate} onChange={e => setTransferForm({ ...transferForm, transferDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">GRADUATION</span></div>
            {graduations.map(g => (<div key={g.id} className="ri na"><div className="ri-b"><div className="ri-t">{g.graduation_date}</div><div className="ri-s">{g.honours || '—'}</div></div></div>))}
            {graduations.length === 0 && <div className="ri na"><div className="ri-s">No graduation record yet.</div></div>}
            <form onSubmit={handleAddGraduation} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" type="date" value={graduationForm.graduationDate} onChange={e => setGraduationForm({ ...graduationForm, graduationDate: e.target.value })} required />
              <input className="fi" placeholder="Final class ID" value={graduationForm.finalClassId} onChange={e => setGraduationForm({ ...graduationForm, finalClassId: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Record</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">PORTAL ACCESS</span></div>
            <div className="ri na"><div className="ri-b"><div className="ri-t">Student portal login</div><div className="ri-s">{portalAccess?.is_enabled ? 'Enabled' : 'Disabled'}</div></div><div className={`tog ${portalAccess?.is_enabled ? 'on' : 'off'}`} onClick={handleTogglePortal} /></div>
          </div>
        </div>
      )}

      {editingEnrollment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingEnrollment(null)}>
          <form onSubmit={handleSaveEnrollment} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 340, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Enrolment</h3>
            <div className="fg"><label className="fl">ROLL NUMBER</label><input className="fi" value={enrollEditForm.rollNumber} onChange={e => setEnrollEditForm({ ...enrollEditForm, rollNumber: e.target.value })} /></div>
            <div className="fg"><label className="fl">STATUS</label><select className="fi" value={enrollEditForm.enrollmentStatus} onChange={e => setEnrollEditForm({ ...enrollEditForm, enrollmentStatus: e.target.value })}><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="TRANSFERRED">Transferred</option><option value="WITHDRAWN">Withdrawn</option></select></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingEnrollment(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingGuardian && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingGuardian(null)}>
          <form onSubmit={handleSaveGuardian} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Guardian</h3>
            <div className="fg"><label className="fl">FULL NAME</label><input className="fi" value={guardianEditForm.fullName} onChange={e => setGuardianEditForm({ ...guardianEditForm, fullName: e.target.value })} required /></div>
            <div className="fg"><label className="fl">RELATIONSHIP</label><select className="fi" value={guardianEditForm.relationship} onChange={e => setGuardianEditForm({ ...guardianEditForm, relationship: e.target.value })}><option value="FATHER">Father</option><option value="MOTHER">Mother</option><option value="GUARDIAN">Guardian</option><option value="SIBLING">Sibling</option><option value="GRANDPARENT">Grandparent</option><option value="OTHER">Other</option></select></div>
            <div className="fg"><label className="fl">PHONE</label><input className="fi" value={guardianEditForm.phone} onChange={e => setGuardianEditForm({ ...guardianEditForm, phone: e.target.value })} required /></div>
            <div className="fg"><label className="fl">EMAIL</label><input className="fi" value={guardianEditForm.email} onChange={e => setGuardianEditForm({ ...guardianEditForm, email: e.target.value })} /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={guardianEditForm.isPrimary} onChange={e => setGuardianEditForm({ ...guardianEditForm, isPrimary: e.target.checked })} /> Primary guardian</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingGuardian(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingAddress && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingAddress(null)}>
          <form onSubmit={handleSaveAddress} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Address</h3>
            <div className="fg"><label className="fl">TYPE</label><select className="fi" value={addressEditForm.addressType} onChange={e => setAddressEditForm({ ...addressEditForm, addressType: e.target.value })}><option value="RESIDENTIAL">Residential</option><option value="POSTAL">Postal</option><option value="HOSTEL">Hostel</option></select></div>
            <div className="fg"><label className="fl">STREET</label><input className="fi" value={addressEditForm.street} onChange={e => setAddressEditForm({ ...addressEditForm, street: e.target.value })} /></div>
            <div className="fg"><label className="fl">CITY</label><input className="fi" value={addressEditForm.city} onChange={e => setAddressEditForm({ ...addressEditForm, city: e.target.value })} required /></div>
            <div className="fg"><label className="fl">REGION</label><input className="fi" value={addressEditForm.region} onChange={e => setAddressEditForm({ ...addressEditForm, region: e.target.value })} required /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={addressEditForm.isPrimary} onChange={e => setAddressEditForm({ ...addressEditForm, isPrimary: e.target.checked })} /> Primary address</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingAddress(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingContact && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingContact(null)}>
          <form onSubmit={handleSaveContact} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 340, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Contact</h3>
            <div className="fg"><label className="fl">TYPE</label><select className="fi" value={contactEditForm.contactType} onChange={e => setContactEditForm({ ...contactEditForm, contactType: e.target.value })}><option value="PHONE">Phone</option><option value="EMAIL">Email</option><option value="WHATSAPP">WhatsApp</option></select></div>
            <div className="fg"><label className="fl">VALUE</label><input className="fi" value={contactEditForm.value} onChange={e => setContactEditForm({ ...contactEditForm, value: e.target.value })} required /></div>
            <div className="fg"><label className="fl">LABEL</label><input className="fi" value={contactEditForm.label} onChange={e => setContactEditForm({ ...contactEditForm, label: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingContact(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingIdDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingIdDoc(null)}>
          <form onSubmit={handleSaveIdDoc} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 340, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Identity Document</h3>
            <div className="fg"><label className="fl">TYPE</label><select className="fi" value={idDocEditForm.documentType} onChange={e => setIdDocEditForm({ ...idDocEditForm, documentType: e.target.value })}><option value="BIRTH_CERTIFICATE">Birth Certificate</option><option value="PASSPORT">Passport</option><option value="NATIONAL_ID">National ID</option></select></div>
            <div className="fg"><label className="fl">DOCUMENT NUMBER</label><input className="fi" value={idDocEditForm.documentNumber} onChange={e => setIdDocEditForm({ ...idDocEditForm, documentNumber: e.target.value })} required /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingIdDoc(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingFee && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingFee(null)}>
          <form onSubmit={handleSaveFee} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 340, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Fee Profile Notes</h3>
            <div className="fg"><label className="fl">NOTES</label><input className="fi" value={feeEditForm.notes} onChange={e => setFeeEditForm({ notes: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingFee(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingScholarship && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingScholarship(null)}>
          <form onSubmit={handleSaveScholarship} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Scholarship</h3>
            <div className="fg"><label className="fl">NAME</label><input className="fi" value={scholarshipEditForm.scholarshipName} onChange={e => setScholarshipEditForm({ ...scholarshipEditForm, scholarshipName: e.target.value })} required /></div>
            <div className="fg"><label className="fl">SPONSOR</label><input className="fi" value={scholarshipEditForm.sponsor} onChange={e => setScholarshipEditForm({ ...scholarshipEditForm, sponsor: e.target.value })} /></div>
            <div className="fg"><label className="fl">COVERAGE TYPE</label><select className="fi" value={scholarshipEditForm.coverageType} onChange={e => setScholarshipEditForm({ ...scholarshipEditForm, coverageType: e.target.value })}><option value="FULL">Full</option><option value="PARTIAL">Partial</option></select></div>
            <div className="fg"><label className="fl">COVERAGE %</label><input className="fi" type="number" value={scholarshipEditForm.coveragePct} onChange={e => setScholarshipEditForm({ ...scholarshipEditForm, coveragePct: +e.target.value })} /></div>
            <div className="fg"><label className="fl">END DATE</label><input className="fi" type="date" value={scholarshipEditForm.endDate} onChange={e => setScholarshipEditForm({ ...scholarshipEditForm, endDate: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingScholarship(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
