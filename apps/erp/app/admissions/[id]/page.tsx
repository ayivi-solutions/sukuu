'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppShell from '../../../components/AppShell';
import { authedFetch } from '../../../lib/api';

const TABS = [
  { key: 'pipeline', label: 'Stages & Decision' },
  { key: 'interviews', label: 'Interviews & Documents' },
  { key: 'offers', label: 'Offers & Conversion' },
];

export default function ApplicantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const applicantId = params.id as string;
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('pipeline');
  const [error, setError] = useState('');

  const [applicant, setApplicant] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);

  const [editForm, setEditForm] = useState<any>({});
  const [stageForm, setStageForm] = useState({ stageName: '', stageOrder: 1 });
  const [reviewForm, setReviewForm] = useState({ decision: 'PROGRESS', notes: '' });
  const [decisionForm, setDecisionForm] = useState({ decision: 'ADMIT', notes: '', aggregateScore: '' });
  const [interviewForm, setInterviewForm] = useState({ interviewerId: '', scheduledDate: '', maxScore: 100 });
  const [docForm, setDocForm] = useState({ documentType: '', fileUrl: '' });
  const [offerForm, setOfferForm] = useState({ classId: '', academicYearId: '', expiryDate: '' });
  const [convertResult, setConvertResult] = useState('');
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [academicClasses, setAcademicClasses] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);

  useEffect(() => {
    const t = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    setUser(userStr ? JSON.parse(userStr) : null);
    loadAll(t);
  }, [router, applicantId]);

  function loadAll(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    authedFetch(`/api/v1/admissions/${applicantId}`, t).then(d => { if (d?.error) setError(d.error); else { setApplicant(d); setEditForm(d); } });
    authedFetch(`/api/v1/admissions/${applicantId}/stages`, t).then(d => Array.isArray(d) && setStages(d));
    authedFetch(`/api/v1/admissions/${applicantId}/reviews`, t).then(d => Array.isArray(d) && setReviews(d));
    authedFetch(`/api/v1/admissions/${applicantId}/decisions`, t).then(d => Array.isArray(d) && setDecisions(d));
    authedFetch(`/api/v1/admissions/${applicantId}/status-history`, t).then(d => Array.isArray(d) && setStatusHistory(d));
    authedFetch(`/api/v1/admissions/${applicantId}/interviews`, t).then(d => Array.isArray(d) && setInterviews(d));
    authedFetch(`/api/v1/admissions/${applicantId}/documents`, t).then(d => Array.isArray(d) && setDocuments(d));
    authedFetch(`/api/v1/admissions/${applicantId}/offers`, t).then(d => Array.isArray(d) && setOffers(d));
    authedFetch('/api/v1/academic/years', t).then(d => Array.isArray(d) && setAcademicYears(d));
    authedFetch('/api/v1/academic/classes', t).then(d => Array.isArray(d) && setAcademicClasses(d));
    authedFetch('/api/v1/system/users', t).then(d => Array.isArray(d) && setStaffUsers(d));
  }

  async function handleSaveProfile(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/admissions/${applicantId}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName: editForm.first_name, lastName: editForm.last_name, guardianPhone: editForm.guardian_phone, status: editForm.status, statusReason: 'Manual update' }) }); loadAll(token); }
  async function handleArchive() { if (!confirm('Withdraw this application?')) return; await authedFetch(`/api/v1/admissions/${applicantId}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddStage(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/admissions/${applicantId}/stages`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stageForm) }); setStageForm({ stageName: '', stageOrder: 1 }); loadAll(token); }
  async function handleStageStatus(id: string, status: string) { await authedFetch(`/api/v1/admissions/${applicantId}/stages/${id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); loadAll(token); }
  async function handleAddReview(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/admissions/${applicantId}/reviews`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reviewForm) }); setReviewForm({ decision: 'PROGRESS', notes: '' }); loadAll(token); }
  async function handleAddDecision(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/admissions/${applicantId}/decisions`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(decisionForm) }); setDecisionForm({ decision: 'ADMIT', notes: '', aggregateScore: '' }); loadAll(token); }
  async function handleAddInterview(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/admissions/${applicantId}/interviews`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(interviewForm) }); setInterviewForm({ interviewerId: '', scheduledDate: '', maxScore: 100 }); loadAll(token); }
  async function handleScoreInterview(id: string, score: string, recommendation: string) { await authedFetch(`/api/v1/admissions/${applicantId}/interviews/${id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score: +score, recommendation, status: 'COMPLETED' }) }); loadAll(token); }
  async function handleAddDoc(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/admissions/${applicantId}/documents`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(docForm) }); setDocForm({ documentType: '', fileUrl: '' }); loadAll(token); }
  async function handleVerifyDoc(id: string, current: boolean) { await authedFetch(`/api/v1/admissions/${applicantId}/documents/${id}/verify`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isVerified: !current }) }); loadAll(token); }
  async function handleAddOffer(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/admissions/${applicantId}/offers`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(offerForm) }); setOfferForm({ classId: '', academicYearId: '', expiryDate: '' }); loadAll(token); }
  async function handleOfferStatus(id: string, status: string) { await authedFetch(`/api/v1/admissions/${applicantId}/offers/${id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); loadAll(token); }
  async function handleConvert(offerId: string) {
    const res = await authedFetch(`/api/v1/admissions/${applicantId}/convert`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ offerId }) });
    if (res?.student) { setConvertResult(`Converted! New Student ID: ${res.student.student_id}`); loadAll(token); }
    else setConvertResult(res?.error || 'Conversion failed');
  }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;
  if (!applicant) return <AppShell user={user}><div style={{ padding: 40 }}>Loading…</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">ADMISSIONX · APPLICANT DETAIL</div>
            <div className="ph-title">📋 {applicant.first_name} {applicant.last_name}</div>
            <div className="ph-sub">Applying for {applicant.applying_for_class_id} · <span className={`bdg ${applicant.status === 'ENROLLED' ? 'bok' : 'bin'}`}>{applicant.status}</span></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push('/admissions')} style={{ background: 'var(--soft)', color: 'var(--ink)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>← Pipeline</button>
            <button onClick={handleArchive} style={{ background: 'var(--erB)', color: 'var(--er)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Withdraw</button>
          </div>
        </div>
      </div>

      <div className="sys-tabs">
        {TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'pipeline' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={handleSaveProfile} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">APPLICANT PROFILE</span></div>
            <div className="cb" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
              <div className="fg"><label className="fl">FIRST NAME</label><input className="fi" value={editForm.first_name || ''} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} /></div>
              <div className="fg"><label className="fl">LAST NAME</label><input className="fi" value={editForm.last_name || ''} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} /></div>
              <div className="fg"><label className="fl">GUARDIAN PHONE</label><input className="fi" value={editForm.guardian_phone || ''} onChange={e => setEditForm({ ...editForm, guardian_phone: e.target.value })} /></div>
              <div className="fg"><label className="fl">STATUS</label>
                <select className="fi" value={editForm.status || ''} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="PENDING">Pending</option><option value="UNDER_REVIEW">Under Review</option><option value="INTERVIEWED">Interviewed</option><option value="OFFERED">Offered</option><option value="ENROLLED">Enrolled</option><option value="REJECTED">Rejected</option><option value="WITHDRAWN">Withdrawn</option>
                </select>
              </div>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600, alignSelf: 'end' }}>Save</button>
            </div>
          </form>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">APPLICATION STAGES</span></div>
            {stages.map(s => (<div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">#{s.stage_order} {s.stage_name}</div><div className="ri-s">{s.notes || '—'}</div></div>
              <select value={s.status} onChange={e => handleStageStatus(s.id, e.target.value)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--bd)' }}>
                <option value="PENDING">Pending</option><option value="IN_PROGRESS">In Progress</option><option value="PASSED">Passed</option><option value="FAILED">Failed</option><option value="SKIPPED">Skipped</option>
              </select>
            </div>))}
            {stages.length === 0 && <div className="ri na"><div className="ri-s">No stages defined yet.</div></div>}
            <form onSubmit={handleAddStage} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Stage name e.g. Document Check" value={stageForm.stageName} onChange={e => setStageForm({ ...stageForm, stageName: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" type="number" placeholder="Order" value={stageForm.stageOrder} onChange={e => setStageForm({ ...stageForm, stageOrder: +e.target.value })} style={{ width: 80 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">STAFF REVIEWS</span></div>
            {reviews.map(r => (<div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{r.decision}</div><div className="ri-s">{r.notes || '—'}</div></div></div>))}
            {reviews.length === 0 && <div className="ri na"><div className="ri-s">No reviews yet.</div></div>}
            <form onSubmit={handleAddReview} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={reviewForm.decision} onChange={e => setReviewForm({ ...reviewForm, decision: e.target.value })}><option value="PROGRESS">Progress</option><option value="HOLD">Hold</option><option value="REJECT">Reject</option></select>
              <input className="fi" placeholder="Notes" value={reviewForm.notes} onChange={e => setReviewForm({ ...reviewForm, notes: e.target.value })} style={{ flex: 1 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">FINAL DECISION</span></div>
            {decisions.map(d => (<div key={d.id} className="ri na"><div className="ri-b"><div className="ri-t">{d.decision}</div><div className="ri-s">{d.notes || '—'}</div></div></div>))}
            {decisions.length === 0 && <div className="ri na"><div className="ri-s">No decision recorded yet.</div></div>}
            <form onSubmit={handleAddDecision} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={decisionForm.decision} onChange={e => setDecisionForm({ ...decisionForm, decision: e.target.value })}><option value="ADMIT">Admit</option><option value="REJECT">Reject</option><option value="WAITLIST">Waitlist</option></select>
              <input className="fi" placeholder="Notes" value={decisionForm.notes} onChange={e => setDecisionForm({ ...decisionForm, notes: e.target.value })} style={{ flex: 1 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Record</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">STATUS HISTORY</span></div>
            {statusHistory.map(h => (<div key={h.id} className="ri na"><div className="ri-b"><div className="ri-t">{h.from_status} → {h.to_status}</div><div className="ri-s">{h.change_reason || '—'} · {new Date(h.changed_at).toLocaleString()}</div></div></div>))}
            {statusHistory.length === 0 && <div className="ri na"><div className="ri-s">No status changes yet.</div></div>}
          </div>
        </div>
      )}

      {tab === 'interviews' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">INTERVIEWS</span></div>
            {interviews.map(i => (
              <div key={i.id} className="ri na"><div className="ri-b"><div className="ri-t">{new Date(i.scheduled_date).toLocaleString()}</div><div className="ri-s">{i.score != null ? `Score: ${i.score}/${i.max_score}` : 'Not yet scored'} {i.recommendation ? `· ${i.recommendation}` : ''}</div></div>
                <span className={`bdg ${i.status === 'COMPLETED' ? 'bok' : 'bin'}`}>{i.status}</span>
                {i.status === 'SCHEDULED' && (
                  <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                    <input type="number" placeholder="Score" id={`score-${i.id}`} style={{ width: 60, fontSize: 11, padding: 4, borderRadius: 6, border: '1px solid var(--bd)' }} />
                    <button onClick={() => { const el = document.getElementById(`score-${i.id}`) as HTMLInputElement; handleScoreInterview(i.id, el.value, 'ADMIT'); }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--okB)', color: 'var(--ok)', fontWeight: 600 }}>Submit</button>
                  </div>
                )}
              </div>
            ))}
            {interviews.length === 0 && <div className="ri na"><div className="ri-s">No interviews scheduled yet.</div></div>}
            <form onSubmit={handleAddInterview} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={interviewForm.interviewerId} onChange={e => setInterviewForm({ ...interviewForm, interviewerId: e.target.value })} required>
                <option value="">Interviewer...</option>
                {staffUsers.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <input className="fi" type="datetime-local" value={interviewForm.scheduledDate} onChange={e => setInterviewForm({ ...interviewForm, scheduledDate: e.target.value })} required />
              <input className="fi" type="number" placeholder="Max score" value={interviewForm.maxScore} onChange={e => setInterviewForm({ ...interviewForm, maxScore: +e.target.value })} style={{ width: 100 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Schedule</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">SUBMITTED DOCUMENTS</span></div>
            {documents.map(d => (<div key={d.id} className="ri na"><div className="ri-b"><div className="ri-t">{d.document_type}</div><div className="ri-s"><a href={d.file_url} target="_blank" rel="noreferrer" style={{ color: 'var(--in)' }}>View</a></div></div>
              <span className={`bdg ${d.is_verified ? 'bok' : 'bwn'}`} onClick={() => handleVerifyDoc(d.id, d.is_verified)} style={{ cursor: 'pointer' }}>{d.is_verified ? 'Verified' : 'Unverified'}</span>
            </div>))}
            {documents.length === 0 && <div className="ri na"><div className="ri-s">No documents submitted yet.</div></div>}
            <form onSubmit={handleAddDoc} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Document type" value={docForm.documentType} onChange={e => setDocForm({ ...docForm, documentType: e.target.value })} required />
              <input className="fi" placeholder="File URL" value={docForm.fileUrl} onChange={e => setDocForm({ ...docForm, fileUrl: e.target.value })} required style={{ flex: 1 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Upload</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'offers' && (
        <div style={{ padding: 'var(--pad)' }}>
          {convertResult && <div className="alert al-ok" style={{ marginBottom: 16 }}>{convertResult}</div>}
          <div className="card">
            <div className="ch"><span className="ch-t">ADMISSION OFFERS</span></div>
            {offers.map(o => (
              <div key={o.id} className="ri na"><div className="ri-b"><div className="ri-t">Class {o.class_id}</div><div className="ri-s">Issued {new Date(o.issued_date).toLocaleDateString()} {o.accepted_date ? `· Accepted ${new Date(o.accepted_date).toLocaleDateString()}` : ''}</div></div>
                <span className={`bdg ${o.status === 'ACCEPTED' ? 'bok' : o.status === 'DECLINED' || o.status === 'EXPIRED' ? 'ber' : 'bwn'}`} style={{ marginRight: 8 }}>{o.status}</span>
                {o.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleOfferStatus(o.id, 'ACCEPTED')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--okB)', color: 'var(--ok)', fontWeight: 600 }}>Accept</button>
                    <button onClick={() => handleOfferStatus(o.id, 'DECLINED')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Decline</button>
                  </div>
                )}
                {o.status === 'ACCEPTED' && <button onClick={() => handleConvert(o.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--navy)', color: 'var(--gold)', fontWeight: 600 }}>Convert to Student</button>}
              </div>
            ))}
            {offers.length === 0 && <div className="ri na"><div className="ri-s">No offers issued yet.</div></div>}
            <form onSubmit={handleAddOffer} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={offerForm.classId} onChange={e => setOfferForm({ ...offerForm, classId: e.target.value })} required>
                <option value="">Class...</option>
                {academicClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="fi" value={offerForm.academicYearId} onChange={e => setOfferForm({ ...offerForm, academicYearId: e.target.value })} required>
                <option value="">Academic Year...</option>
                {academicYears.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
              <input className="fi" type="date" placeholder="Expiry" value={offerForm.expiryDate} onChange={e => setOfferForm({ ...offerForm, expiryDate: e.target.value })} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Issue Offer</button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
