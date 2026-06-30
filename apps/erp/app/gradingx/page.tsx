'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { authedFetch } from '../../lib/api';

const TABS = [
  { key: 'assessments', label: 'Assessments' },
  { key: 'scoring', label: 'Score Entry' },
  { key: 'scales', label: 'Grade Scales' },
  { key: 'policies', label: 'Policies' },
  { key: 'results', label: 'Results' },
  { key: 'approval', label: 'Approval & Publication' },
  { key: 'reports', label: 'Reports' },
];

export default function GradingXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('assessments');
  const [error, setError] = useState('');

  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  const [assessments, setAssessments] = useState<any[]>([]);
  const [scales, setScales] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [locks, setLocks] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [classResults, setClassResults] = useState<any[]>([]);

  const [assessForm, setAssessForm] = useState({ subjectId: '', classId: '', termId: '', name: '', assessmentType: 'CLASS_TEST', maxScore: 100, weightage: 30 });
  const [scaleForm, setScaleForm] = useState({ scaleName: 'GES', minScore: 0, maxScore: 100, grade: '', gradePoint: 1, isPassing: true });
  const [policyForm, setPolicyForm] = useState({ classId: '', termId: '', caWeightPct: 30, examWeightPct: 70, passMark: 50, gradingScaleId: '' });
  const [approvalForm, setApprovalForm] = useState({ classId: '', termId: '', approvalLevel: 'HOD' });
  const [lockForm, setLockForm] = useState({ classId: '', termId: '' });
  const [reportForm, setReportForm] = useState({ studentId: '', classId: '', termId: '', reportType: 'TERM_REPORT' });

  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [assessmentScores, setAssessmentScores] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [scoreState, setScoreState] = useState<{ [enrollmentId: string]: string }>({});

  const [resultEnrollmentId, setResultEnrollmentId] = useState('');
  const [resultTermId, setResultTermId] = useState('');
  const [subjectResults, setSubjectResults] = useState<any[]>([]);
  const [overallResult, setOverallResult] = useState<any>(null);

  const [computeForm, setComputeForm] = useState({ classId: '', termId: '' });
  const [computeMsg, setComputeMsg] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    setUser(userStr ? JSON.parse(userStr) : null);
    loadAll(t);
  }, [router]);

  function loadAll(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    authedFetch('/api/v1/academic/classes', t).then(d => Array.isArray(d) && setClasses(d));
    authedFetch('/api/v1/academic/subjects', t).then(d => Array.isArray(d) && setSubjects(d));
    authedFetch('/api/v1/academic/terms', t).then(d => Array.isArray(d) && setTerms(d));
    authedFetch('/api/v1/students', t).then(d => Array.isArray(d) ? setAllStudents(d) : setError(d?.error));
    authedFetch('/api/v1/grading/assessments', t).then(d => Array.isArray(d) && setAssessments(d));
    authedFetch('/api/v1/grading/scales', t).then(d => Array.isArray(d) && setScales(d));
    authedFetch('/api/v1/grading/policies', t).then(d => Array.isArray(d) && setPolicies(d));
    authedFetch('/api/v1/grading/approvals', t).then(d => Array.isArray(d) && setApprovals(d));
    authedFetch('/api/v1/grading/publications', t).then(d => Array.isArray(d) && setPublications(d));
    authedFetch('/api/v1/grading/locks', t).then(d => Array.isArray(d) && setLocks(d));
    authedFetch('/api/v1/grading/reports', t).then(d => Array.isArray(d) && setReports(d));
  }

  function nameOf(list: any[], id: string, field = 'name') { return list.find(x => x.id === id)?.[field] || id?.slice(0, 8) || '—'; }
  function studentName(id: string) { const s = allStudents.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8) || '—'; }

  async function handleAddAssessment(e: React.FormEvent) {
    e.preventDefault();
    const res = await authedFetch('/api/v1/grading/assessments', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(assessForm) });
    if (res?.error) { alert(res.error); return; }
    setAssessForm({ subjectId: '', classId: '', termId: '', name: '', assessmentType: 'CLASS_TEST', maxScore: 100, weightage: 30 });
    loadAll(token);
  }
  async function handleArchiveAssessment(id: string) { await authedFetch(`/api/v1/grading/assessments/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }

  async function openScoring(a: any) {
    setSelectedAssessment(a);
    const scores = await authedFetch(`/api/v1/grading/assessments/${a.id}/scores`, token);
    setAssessmentScores(Array.isArray(scores) ? scores : []);
    const rosterRes = await authedFetch(`/api/v1/attendance/roster?classId=${a.class_id}`, token);
    const list = Array.isArray(rosterRes) ? rosterRes : [];
    setRoster(list);
    const initial: { [k: string]: string } = {};
    (Array.isArray(scores) ? scores : []).forEach((s: any) => { initial[s.enrollment_id] = s.score?.toString() || ''; });
    setScoreState(initial);
  }
  async function handleSubmitScores() {
    const enrollMap: { [studentId: string]: string } = {};
    for (const st of roster) {
      const enr = await authedFetch(`/api/v1/students/${st.id}/enrollments`, token);
      const active = Array.isArray(enr) ? enr.find((e: any) => e.enrollment_status === 'ACTIVE') : null;
      if (active) enrollMap[st.id] = active.id;
    }
    const scoresToSubmit = Object.entries(scoreState).filter(([k, v]) => v !== '').map(([enrollmentIdOrStudentId, score]) => ({
      enrollmentId: enrollMap[enrollmentIdOrStudentId] || enrollmentIdOrStudentId,
      score: parseFloat(score),
    }));
    const res = await authedFetch(`/api/v1/grading/assessments/${selectedAssessment.id}/scores/bulk`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scores: scoresToSubmit }) });
    if (res?.error) { alert(res.error); return; }
    alert('Scores submitted for ' + scoresToSubmit.length + ' students.');
    setSelectedAssessment(null);
  }

  async function handleAddScale(e: React.FormEvent) { e.preventDefault(); const res = await authedFetch('/api/v1/grading/scales', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scaleForm) }); if (res?.error) { alert(res.error); return; } setScaleForm({ scaleName: 'GES', minScore: 0, maxScore: 100, grade: '', gradePoint: 1, isPassing: true }); loadAll(token); }
  async function handleArchiveScale(id: string) { await authedFetch(`/api/v1/grading/scales/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }

  async function handleAddPolicy(e: React.FormEvent) { e.preventDefault(); const res = await authedFetch('/api/v1/grading/policies', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(policyForm) }); if (res?.error) { alert(res.error); return; } setPolicyForm({ classId: '', termId: '', caWeightPct: 30, examWeightPct: 70, passMark: 50, gradingScaleId: '' }); loadAll(token); }
  async function handleArchivePolicy(id: string) { await authedFetch(`/api/v1/grading/policies/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }

  async function handleCompute(e: React.FormEvent) {
    e.preventDefault();
    setComputeMsg('');
    const res = await authedFetch('/api/v1/grading/compute/class-results', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(computeForm) });
    if (res?.error) { setComputeMsg('Error: ' + res.error); return; }
    setComputeMsg(`Computed results for ${res.computed} students.`);
  }
  async function loadStudentResult() {
    if (!resultEnrollmentId || !resultTermId) return;
    const subj = await authedFetch(`/api/v1/grading/enrollments/${resultEnrollmentId}/subject-results?termId=${resultTermId}`, token);
    setSubjectResults(Array.isArray(subj) ? subj : []);
    const overall = await authedFetch(`/api/v1/grading/enrollments/${resultEnrollmentId}/result?termId=${resultTermId}`, token);
    setOverallResult(overall && !overall.error ? overall : null);
  }

  async function handleRequestApproval(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/grading/approvals', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(approvalForm) }); setApprovalForm({ classId: '', termId: '', approvalLevel: 'HOD' }); loadAll(token); }
  async function handleDecideApproval(id: string, status: string) { await authedFetch(`/api/v1/grading/approvals/${id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); loadAll(token); }
  async function handlePublish(classId: string, termId: string) {
    const res = await authedFetch('/api/v1/grading/publish', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classId, termId, visibleToStudents: true, visibleToParents: true }) });
    if (res?.error) alert(res.error); else { alert('Results published.'); loadAll(token); }
  }
  async function handleLock(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/grading/locks', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lockForm) }); setLockForm({ classId: '', termId: '' }); loadAll(token); }
  async function handleUnlock(id: string) { await authedFetch(`/api/v1/grading/locks/${id}`, token, { method: 'DELETE' }); loadAll(token); }

  async function handleGenerateReport(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/grading/reports', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reportForm) }); loadAll(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · GRADINGX · 15 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">📊 GradingX</div>
            <div className="ph-sub">Assessments · Scoring · Computation · Approval · Publication · CRUAA + RBAC enforced</div>
          </div>
        </div>
      </div>

      <div className="sys-tabs">
        {TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'assessments' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={handleAddAssessment} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">CREATE ASSESSMENT</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={assessForm.subjectId} onChange={e => setAssessForm({ ...assessForm, subjectId: e.target.value })} required><option value="">Subject...</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <select className="fi" value={assessForm.classId} onChange={e => setAssessForm({ ...assessForm, classId: e.target.value })} required><option value="">Class...</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select className="fi" value={assessForm.termId} onChange={e => setAssessForm({ ...assessForm, termId: e.target.value })} required><option value="">Term...</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <input className="fi" placeholder="Name e.g. Class Test 1" value={assessForm.name} onChange={e => setAssessForm({ ...assessForm, name: e.target.value })} required style={{ flex: 1 }} />
              <select className="fi" value={assessForm.assessmentType} onChange={e => setAssessForm({ ...assessForm, assessmentType: e.target.value })}><option value="CA">CA</option><option value="CLASS_TEST">Class Test</option><option value="MID_TERM">Mid Term</option><option value="END_OF_TERM">End of Term</option><option value="PRACTICAL">Practical</option><option value="PROJECT">Project</option></select>
              <input className="fi" type="number" placeholder="Max Score" value={assessForm.maxScore} onChange={e => setAssessForm({ ...assessForm, maxScore: +e.target.value })} style={{ width: 100 }} />
              <input className="fi" type="number" placeholder="Weight %" value={assessForm.weightage} onChange={e => setAssessForm({ ...assessForm, weightage: +e.target.value })} style={{ width: 100 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Create</button>
            </div>
          </form>
          <div className="tbl">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Subject</th><th>Class</th><th>Type</th><th>Max</th><th>Weight</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {assessments.map(a => (
                  <tr key={a.id}>
                    <td>{a.name}</td><td>{nameOf(subjects, a.subject_id)}</td><td>{nameOf(classes, a.class_id)}</td><td>{a.assessment_type}</td><td>{a.max_score}</td><td>{a.weightage}%</td>
                    <td><span className={`bdg ${a.status === 'PUBLISHED' ? 'bok' : 'bwn'}`}>{a.status}</span></td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setTab('scoring'); openScoring(a); }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--inB)', color: 'var(--in)', fontWeight: 600 }}>Score</button>
                      <button onClick={() => handleArchiveAssessment(a.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
                    </td>
                  </tr>
                ))}
                {assessments.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No assessments yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'scoring' && (
        <div style={{ padding: 'var(--pad)' }}>
          {!selectedAssessment ? (
            <div className="alert al-in"><span className="al-ic">ℹ️</span><div>Select an assessment from the Assessments tab and click "Score" to enter marks.</div></div>
          ) : (
            <div className="card">
              <div className="ch"><span className="ch-t">SCORE ENTRY — {selectedAssessment.name} (max {selectedAssessment.max_score})</span></div>
              {roster.map(s => (
                <div key={s.id} className="ri na">
                  <div className="ri-b"><div className="ri-t">{s.first_name} {s.last_name}</div><div className="ri-s">{s.student_id}</div></div>
                  <input className="fi" type="number" placeholder="Score" value={scoreState[s.id] || ''} onChange={e => setScoreState({ ...scoreState, [s.id]: e.target.value })} style={{ width: 90 }} max={selectedAssessment.max_score} />
                </div>
              ))}
              {roster.length === 0 && <div className="ri na"><div className="ri-s">No students found for this class.</div></div>}
              <div style={{ display: 'flex', gap: 8, padding: 12 }}>
                <button onClick={handleSubmitScores} style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Submit Scores</button>
                <button onClick={() => setSelectedAssessment(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Close</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'scales' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card">
            <div className="ch"><span className="ch-t">GRADE SCALES (BANDS)</span></div>
            {scales.map(s => (<div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{s.scale_name} — {s.grade}</div><div className="ri-s">{s.min_score} - {s.max_score} {s.grade_point && `· GP ${s.grade_point}`} {s.is_passing ? '· Passing' : '· Failing'}</div></div><button onClick={() => handleArchiveScale(s.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></div>))}
            {scales.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddScale} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Scale name" value={scaleForm.scaleName} onChange={e => setScaleForm({ ...scaleForm, scaleName: e.target.value })} required style={{ width: 100 }} />
              <input className="fi" placeholder="Grade e.g. A1" value={scaleForm.grade} onChange={e => setScaleForm({ ...scaleForm, grade: e.target.value })} required style={{ width: 90 }} />
              <input className="fi" type="number" placeholder="Min" value={scaleForm.minScore} onChange={e => setScaleForm({ ...scaleForm, minScore: +e.target.value })} style={{ width: 90 }} />
              <input className="fi" type="number" placeholder="Max" value={scaleForm.maxScore} onChange={e => setScaleForm({ ...scaleForm, maxScore: +e.target.value })} style={{ width: 90 }} />
              <input className="fi" type="number" placeholder="Grade Point" value={scaleForm.gradePoint} onChange={e => setScaleForm({ ...scaleForm, gradePoint: +e.target.value })} style={{ width: 110 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={scaleForm.isPassing} onChange={e => setScaleForm({ ...scaleForm, isPassing: e.target.checked })} /> Passing</label>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Band</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'policies' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card">
            <div className="ch"><span className="ch-t">GRADING POLICIES (CA/EXAM WEIGHTING)</span></div>
            {policies.map(p => (<div key={p.id} className="ri na"><div className="ri-b"><div className="ri-t">{nameOf(classes, p.class_id)} · {nameOf(terms, p.term_id)}</div><div className="ri-s">CA {p.ca_weight_pct}% / Exam {p.exam_weight_pct}% · Pass mark {p.pass_mark}</div></div><button onClick={() => handleArchivePolicy(p.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></div>))}
            {policies.length === 0 && <div className="ri na"><div className="ri-s">None yet — defaults to CA 30% / Exam 70%.</div></div>}
            <form onSubmit={handleAddPolicy} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={policyForm.classId} onChange={e => setPolicyForm({ ...policyForm, classId: e.target.value })} required><option value="">Class...</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select className="fi" value={policyForm.termId} onChange={e => setPolicyForm({ ...policyForm, termId: e.target.value })} required><option value="">Term...</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <select className="fi" value={policyForm.gradingScaleId} onChange={e => setPolicyForm({ ...policyForm, gradingScaleId: e.target.value })} required><option value="">Grade scale band...</option>{scales.map(s => <option key={s.id} value={s.id}>{s.scale_name} ({s.grade})</option>)}</select>
              <input className="fi" type="number" placeholder="CA %" value={policyForm.caWeightPct} onChange={e => setPolicyForm({ ...policyForm, caWeightPct: +e.target.value })} style={{ width: 90 }} />
              <input className="fi" type="number" placeholder="Exam %" value={policyForm.examWeightPct} onChange={e => setPolicyForm({ ...policyForm, examWeightPct: +e.target.value })} style={{ width: 90 }} />
              <input className="fi" type="number" placeholder="Pass Mark" value={policyForm.passMark} onChange={e => setPolicyForm({ ...policyForm, passMark: +e.target.value })} style={{ width: 100 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'results' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form onSubmit={handleCompute} className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">COMPUTE CLASS RESULTS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8 }}>
              <select className="fi" value={computeForm.classId} onChange={e => setComputeForm({ ...computeForm, classId: e.target.value })} required><option value="">Class...</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select className="fi" value={computeForm.termId} onChange={e => setComputeForm({ ...computeForm, termId: e.target.value })} required><option value="">Term...</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>▶ Compute</button>
            </div>
            {computeMsg && <div style={{ padding: '8px 16px', fontSize: 12, color: computeMsg.startsWith('Error') ? 'var(--er)' : 'var(--ok)' }}>{computeMsg}</div>}
          </form>
          <div className="card">
            <div className="ch"><span className="ch-t">VIEW STUDENT RESULT</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, padding: 12 }}>
              <input className="fi" placeholder="Enrollment ID" value={resultEnrollmentId} onChange={e => setResultEnrollmentId(e.target.value)} style={{ flex: 1 }} />
              <select className="fi" value={resultTermId} onChange={e => setResultTermId(e.target.value)}><option value="">Term...</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <button onClick={loadStudentResult} style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Load</button>
            </div>
            {overallResult && (
              <div style={{ padding: '0 12px 12px' }}>
                <div className="alert al-in"><span className="al-ic">📊</span><div>Overall: {Number(overallResult.total_score).toFixed(1)}% · Aggregate {overallResult.aggregate_score} · Position {overallResult.position} {overallResult.is_published && '· Published'}</div></div>
              </div>
            )}
            {subjectResults.map(r => (<div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{nameOf(subjects, r.subject_id)}</div><div className="ri-s">CA {r.ca_score ? Number(r.ca_score).toFixed(1) : '—'} · Exam {r.exam_score ? Number(r.exam_score).toFixed(1) : '—'} · Total {r.total_score ? Number(r.total_score).toFixed(1) : '—'} {r.position && `· Position ${r.position}/${r.class_size}`}</div></div><span className="bdg bok">{r.grade || '—'}</span></div>))}
          </div>
        </div>
      )}

      {tab === 'approval' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">APPROVAL WORKFLOW</span></div>
            {approvals.map(a => (<div key={a.id} className="ri na"><div className="ri-b"><div className="ri-t">{nameOf(classes, a.class_id)} · {nameOf(terms, a.term_id)}</div><div className="ri-s">{a.approval_level}</div></div>
              <span className={`bdg ${a.status === 'APPROVED' ? 'bok' : a.status === 'REJECTED' ? 'ber' : 'bwn'}`} style={{ marginRight: 8 }}>{a.status}</span>
              {a.status === 'PENDING' && (<><button onClick={() => handleDecideApproval(a.id, 'APPROVED')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--okB)', color: 'var(--ok)', fontWeight: 600, marginRight: 6 }}>Approve</button><button onClick={() => handleDecideApproval(a.id, 'REJECTED')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Reject</button></>)}
              {a.status === 'APPROVED' && <button onClick={() => handlePublish(a.class_id, a.term_id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--navy)', color: 'var(--gold)', fontWeight: 600 }}>Publish</button>}
            </div>))}
            {approvals.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleRequestApproval} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={approvalForm.classId} onChange={e => setApprovalForm({ ...approvalForm, classId: e.target.value })} required><option value="">Class...</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select className="fi" value={approvalForm.termId} onChange={e => setApprovalForm({ ...approvalForm, termId: e.target.value })} required><option value="">Term...</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <select className="fi" value={approvalForm.approvalLevel} onChange={e => setApprovalForm({ ...approvalForm, approvalLevel: e.target.value })}><option value="HOD">HOD</option><option value="HEADMASTER">Headmaster</option></select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Request Approval</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">PUBLICATIONS</span></div>
            {publications.map(p => (<div key={p.id} className="ri na"><div className="ri-b"><div className="ri-t">{nameOf(classes, p.class_id)} · {nameOf(terms, p.term_id)}</div><div className="ri-s">Published {new Date(p.published_at).toLocaleString()}</div></div></div>))}
            {publications.length === 0 && <div className="ri na"><div className="ri-s">None published yet.</div></div>}
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">RESULT LOCKS</span></div>
            {locks.map(l => (<div key={l.id} className="ri na"><div className="ri-b"><div className="ri-t">{nameOf(classes, l.class_id)} · {nameOf(terms, l.term_id)}</div><div className="ri-s">Locked {new Date(l.locked_at).toLocaleString()}</div></div><button onClick={() => handleUnlock(l.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Unlock</button></div>))}
            {locks.length === 0 && <div className="ri na"><div className="ri-s">No locks — results are editable.</div></div>}
            <form onSubmit={handleLock} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={lockForm.classId} onChange={e => setLockForm({ ...lockForm, classId: e.target.value })} required><option value="">Class...</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select className="fi" value={lockForm.termId} onChange={e => setLockForm({ ...lockForm, termId: e.target.value })} required><option value="">Term...</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>🔒 Lock</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card">
            <div className="ch"><span className="ch-t">GENERATED REPORTS</span></div>
            {reports.map(r => (<div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{r.report_type}</div><div className="ri-s">{r.student_id ? studentName(r.student_id) : nameOf(classes, r.class_id)} · {new Date(r.generated_at).toLocaleString()}</div></div></div>))}
            {reports.length === 0 && <div className="ri na"><div className="ri-s">None generated yet.</div></div>}
            <form onSubmit={handleGenerateReport} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={reportForm.reportType} onChange={e => setReportForm({ ...reportForm, reportType: e.target.value })}><option value="TERM_REPORT">Term Report</option><option value="PROGRESS_REPORT">Progress Report</option><option value="SUBJECT_ANALYSIS">Subject Analysis</option><option value="CLASS_PERFORMANCE">Class Performance</option></select>
              <select className="fi" value={reportForm.studentId} onChange={e => setReportForm({ ...reportForm, studentId: e.target.value })}><option value="">Student (optional)...</option>{allStudents.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <select className="fi" value={reportForm.classId} onChange={e => setReportForm({ ...reportForm, classId: e.target.value })}><option value="">Class (optional)...</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select className="fi" value={reportForm.termId} onChange={e => setReportForm({ ...reportForm, termId: e.target.value })} required><option value="">Term...</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Generate</button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
