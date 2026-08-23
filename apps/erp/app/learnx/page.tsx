'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedFetch } from '../../lib/api';
import AppShell from '../../components/AppShell';

const TABS = [
  { key: 'courses', label: 'Courses & Lessons' },
  { key: 'delivery', label: 'Topic Delivery' },
  { key: 'assignments', label: 'Assignments & Submissions' },
  { key: 'mastery', label: 'Mastery' },
  { key: 'quizzes', label: 'Quizzes' },
  { key: 'other', label: 'Observations & Reading' },
];

export default function LearnXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('courses');
  const [error, setError] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);

  const [courses, setCourses] = useState<any[]>([]);
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [mastery, setMastery] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [readingRecords, setReadingRecords] = useState<any[]>([]);

  const [courseForm, setCourseForm] = useState({ subjectId: '', teacherId: '', classId: '', academicYearId: '', title: '', description: '' });
  const [lessonForm, setLessonForm] = useState({ courseId: '', topic: '', objectives: '', lessonDate: '', durationMinutes: '' });
  const [deliveryForm, setDeliveryForm] = useState({ lessonPlanId: '', curriculumTopicId: '', deliveryStatus: 'PLANNED', teacherNotes: '' });
  const [assignmentForm, setAssignmentForm] = useState({ courseId: '', title: '', instructions: '', dueDate: '', maxScore: '' });
  const [submissionForm, setSubmissionForm] = useState({ assignmentId: '', studentId: '', submissionFile: '' });
  const [masteryForm, setMasteryForm] = useState({ studentId: '', curriculumTopicId: '', masteryState: 'EMERGING' });
  const [quizForm, setQuizForm] = useState({ courseId: '', title: '', timeLimit: '', attemptLimit: '1' });
  const [obsForm, setObsForm] = useState({ lessonPlanId: '', teacherId: '', observationDate: '', rating: 'SATISFACTORY', strengths: '', areasForImprovement: '' });
  const [readingForm, setReadingForm] = useState({ studentId: '', readingLevel: '', bookTitle: '', completed: false, recordedDate: '', academicYearId: '' });

  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t); setUser(userStr ? JSON.parse(userStr) : null);
    loadAll(t);
  }, [router]);

  function loadAll(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    authedFetch('/api/v1/students', t).then(d => Array.isArray(d) && setStudents(d));
    authedFetch('/api/v1/staff', t).then(d => Array.isArray(d) && setStaff(d));
    authedFetch('/api/v1/academic/subjects', t).then(d => Array.isArray(d) && setSubjects(d));
    authedFetch('/api/v1/academic/classes', t).then(d => Array.isArray(d) && setClasses(d));
    authedFetch('/api/v1/academic/years', t).then(d => Array.isArray(d) && setYears(d));
    authedFetch('/api/v1/learn/courses', t).then(d => Array.isArray(d) ? setCourses(d) : setError(d?.error));
    authedFetch('/api/v1/learn/lesson-plans', t).then(d => Array.isArray(d) && setLessonPlans(d));
    authedFetch('/api/v1/learn/topic-deliveries', t).then(d => Array.isArray(d) && setDeliveries(d));
    authedFetch('/api/v1/learn/assignments', t).then(d => Array.isArray(d) && setAssignments(d));
    authedFetch('/api/v1/learn/submissions', t).then(d => Array.isArray(d) && setSubmissions(d));
    authedFetch('/api/v1/learn/mastery', t).then(d => Array.isArray(d) && setMastery(d));
    authedFetch('/api/v1/learn/quizzes', t).then(d => Array.isArray(d) && setQuizzes(d));
    authedFetch('/api/v1/learn/observations', t).then(d => Array.isArray(d) && setObservations(d));
    authedFetch('/api/v1/learn/reading-records', t).then(d => Array.isArray(d) && setReadingRecords(d));
    setSummaryLoading(true);
    authedFetch('/api/v1/learn/summary', t)
      .then(d => { if (d && !d.error) { setSummary(d); setSummaryError(''); } else setSummaryError(d?.error || 'Failed to load summary'); })
      .catch(() => setSummaryError('Failed to load summary')).finally(() => setSummaryLoading(false));
  }

  function studentName(id: string) { const s = students.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8) || '—'; }
  function staffName(id: string) { const s = staff.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8) || '—'; }
  function courseTitle(id: string) { return courses.find(c => c.id === id)?.title || id?.slice(0, 8) || '—'; }

  async function post(url: string, body: any, resetFn: () => void) { await authedFetch(url, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); resetFn(); loadAll(token); }
  async function patch(url: string, body: any) { await authedFetch(url, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); loadAll(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · LEARNX · 13 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">📖 LearnX</div>
            <div className="ph-sub">Lesson Delivery · Curriculum Coverage · Resources · Assignments · Mastery Linkage</div>
          </div>
        </div>
      </div>

      {summaryError && <div style={{ padding: '0 var(--pad)', marginBottom: 'var(--gap)' }}><div className="alert al-er"><span className="al-ic">⚠️</span><div>Couldn't load the learning overview: {summaryError}.</div></div></div>}

      {summaryLoading ? (
        <div className="fx-overview"><div className="stat-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skel skel-card" />)}</div></div>
      ) : summary && (
        <div className="fx-overview">
          <div className="stat-grid">
            <button className="fx-card-btn" onClick={() => setTab('delivery')}>
              <div className="sc" title="Topic deliveries with status DELIVERED, out of all lesson plans on record">
                <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--inB)' }}>📖</div></div>
                <div className="sc-val">{summary.lessonsDelivered}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}> / {summary.lessonsPlanned}</span></div>
                <div className="sc-lbl">TOPICS DELIVERED</div>
              </div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('assignments')}>
              <div className="sc" title="Submissions with no score recorded yet">
                <div className="sc-top"><div className="sc-icon" style={{ background: summary.pendingSubmissions > 0 ? 'var(--erB)' : 'var(--okB)' }}>📥</div></div>
                <div className="sc-val">{summary.pendingSubmissions}</div>
                <div className="sc-lbl">SUBMISSIONS TO GRADE</div>
              </div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('mastery')}>
              <div className="sc" title="Student-topic mastery records with mastery_state MASTERED">
                <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--okB)' }}>🏆</div></div>
                <div className="sc-val">{summary.masteredCount}</div>
                <div className="sc-lbl">TOPICS MASTERED</div>
              </div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('mastery')}>
              <div className="sc" title="Student-topic mastery records in EMERGING or DEVELOPING state">
                <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--puB)' }}>🌱</div></div>
                <div className="sc-val">{summary.developingCount}</div>
                <div className="sc-lbl">STILL DEVELOPING</div>
              </div>
            </button>
          </div>
        </div>
      )}

      <div className="sys-tabs">{TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}</div>

      {tab === 'courses' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/learn/courses', courseForm, () => setCourseForm({ subjectId: '', teacherId: '', classId: '', academicYearId: '', title: '', description: '' })); }} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">COURSES</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Title" value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <select className="fi" value={courseForm.subjectId} onChange={e => setCourseForm({ ...courseForm, subjectId: e.target.value })} required><option value="">Subject...</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <select className="fi" value={courseForm.teacherId} onChange={e => setCourseForm({ ...courseForm, teacherId: e.target.value })} required><option value="">Teacher...</option>{staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <select className="fi" value={courseForm.classId} onChange={e => setCourseForm({ ...courseForm, classId: e.target.value })} required><option value="">Class...</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select className="fi" value={courseForm.academicYearId} onChange={e => setCourseForm({ ...courseForm, academicYearId: e.target.value })} required><option value="">Year...</option>{years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Course</button>
            </div>
          </form>
          <div className="card" style={{ marginBottom: 16 }}>
            {courses.map(c => <div key={c.id} className="ri na"><div className="ri-b"><div className="ri-t">{c.title}</div><div className="ri-s">{staffName(c.teacher_id)}</div></div></div>)}
            {courses.length === 0 && <div className="ri na"><div className="ri-s">No courses yet.</div></div>}
          </div>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/learn/lesson-plans', lessonForm, () => setLessonForm({ courseId: '', topic: '', objectives: '', lessonDate: '', durationMinutes: '' })); }}>
            <div className="ch"><span className="ch-t">LESSON PLANS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={lessonForm.courseId} onChange={e => setLessonForm({ ...lessonForm, courseId: e.target.value })} required><option value="">Course...</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
              <input className="fi" placeholder="Topic" value={lessonForm.topic} onChange={e => setLessonForm({ ...lessonForm, topic: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" type="date" value={lessonForm.lessonDate} onChange={e => setLessonForm({ ...lessonForm, lessonDate: e.target.value })} required />
              <input className="fi" type="number" placeholder="Minutes" value={lessonForm.durationMinutes} onChange={e => setLessonForm({ ...lessonForm, durationMinutes: e.target.value })} style={{ width: 100 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Plan</button>
            </div>
            {lessonPlans.map(l => <div key={l.id} className="ri na"><div className="ri-b"><div className="ri-t">{l.topic}</div><div className="ri-s">{courseTitle(l.course_id)} · {l.lesson_date}</div></div></div>)}
            {lessonPlans.length === 0 && <div className="ri na"><div className="ri-s">No lesson plans yet.</div></div>}
          </form>
        </div>
      )}

      {tab === 'delivery' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/learn/topic-deliveries', deliveryForm, () => setDeliveryForm({ lessonPlanId: '', curriculumTopicId: '', deliveryStatus: 'PLANNED', teacherNotes: '' })); }}>
            <div className="ch"><span className="ch-t">TOPIC DELIVERY TRACKING</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={deliveryForm.lessonPlanId} onChange={e => setDeliveryForm({ ...deliveryForm, lessonPlanId: e.target.value })} required><option value="">Lesson plan...</option>{lessonPlans.map(l => <option key={l.id} value={l.id}>{l.topic}</option>)}</select>
              <input className="fi" placeholder="Curriculum topic ID" value={deliveryForm.curriculumTopicId} onChange={e => setDeliveryForm({ ...deliveryForm, curriculumTopicId: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" placeholder="Notes" value={deliveryForm.teacherNotes} onChange={e => setDeliveryForm({ ...deliveryForm, teacherNotes: e.target.value })} style={{ flex: 1, minWidth: 140 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Log Delivery</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Lesson</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {deliveries.map(d => (
                    <tr key={d.id}>
                      <td>{lessonPlans.find(l => l.id === d.lesson_plan_id)?.topic || '—'}</td>
                      <td><span className={`bdg ${d.delivery_status === 'DELIVERED' ? 'bok' : d.delivery_status === 'SKIPPED' ? 'ber' : 'bin'}`}>{d.delivery_status}</span></td>
                      <td>
                        <select className="fi" style={{ fontSize: 11, padding: '4px 8px' }} value={d.delivery_status} onChange={e => patch(`/api/v1/learn/topic-deliveries/${d.id}/status`, { status: e.target.value })}>
                          <option value="PLANNED">Planned</option><option value="DELIVERED">Delivered</option><option value="PARTIAL">Partial</option><option value="SKIPPED">Skipped</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {deliveries.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No delivery records yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      )}

      {tab === 'assignments' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/learn/assignments', assignmentForm, () => setAssignmentForm({ courseId: '', title: '', instructions: '', dueDate: '', maxScore: '' })); }} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">ASSIGNMENTS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={assignmentForm.courseId} onChange={e => setAssignmentForm({ ...assignmentForm, courseId: e.target.value })} required><option value="">Course...</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
              <input className="fi" placeholder="Title" value={assignmentForm.title} onChange={e => setAssignmentForm({ ...assignmentForm, title: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" type="date" value={assignmentForm.dueDate} onChange={e => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })} required />
              <input className="fi" type="number" placeholder="Max score" value={assignmentForm.maxScore} onChange={e => setAssignmentForm({ ...assignmentForm, maxScore: e.target.value })} required style={{ width: 110 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Assign</button>
            </div>
            {assignments.map(a => <div key={a.id} className="ri na"><div className="ri-b"><div className="ri-t">{a.title}</div><div className="ri-s">Due {a.due_date} · Max {a.max_score}</div></div></div>)}
            {assignments.length === 0 && <div className="ri na"><div className="ri-s">No assignments yet.</div></div>}
          </form>
          <div className="card">
            <div className="ch"><span className="ch-t">SUBMISSIONS</span></div>
            <form onSubmit={e => { e.preventDefault(); post('/api/v1/learn/submissions', submissionForm, () => setSubmissionForm({ assignmentId: '', studentId: '', submissionFile: '' })); }} className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={submissionForm.assignmentId} onChange={e => setSubmissionForm({ ...submissionForm, assignmentId: e.target.value })} required><option value="">Assignment...</option>{assignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</select>
              <select className="fi" value={submissionForm.studentId} onChange={e => setSubmissionForm({ ...submissionForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Log Submission</button>
            </form>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Student</th><th>Assignment</th><th>Score</th><th></th></tr></thead>
                <tbody>
                  {submissions.map(s => (
                    <tr key={s.id}>
                      <td>{studentName(s.student_id)}</td><td>{assignments.find(a => a.id === s.assignment_id)?.title || '—'}</td>
                      <td>{s.score ?? '—'}</td>
                      <td>{s.score === null && <button onClick={() => { const score = prompt('Score:'); if (score) patch(`/api/v1/learn/submissions/${s.id}/grade`, { score: Number(score) }); }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>Grade</button>}</td>
                    </tr>
                  ))}
                  {submissions.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No submissions yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'mastery' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/learn/mastery', masteryForm, () => setMasteryForm({ studentId: '', curriculumTopicId: '', masteryState: 'EMERGING' })); }}>
            <div className="ch"><span className="ch-t">MASTERY TRACKING</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={masteryForm.studentId} onChange={e => setMasteryForm({ ...masteryForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <input className="fi" placeholder="Curriculum topic ID" value={masteryForm.curriculumTopicId} onChange={e => setMasteryForm({ ...masteryForm, curriculumTopicId: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <select className="fi" value={masteryForm.masteryState} onChange={e => setMasteryForm({ ...masteryForm, masteryState: e.target.value })}><option value="EMERGING">Emerging</option><option value="DEVELOPING">Developing</option><option value="ADVANCED">Advanced</option><option value="MASTERED">Mastered</option></select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Record</button>
            </div>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Student</th><th>State</th></tr></thead>
                <tbody>
                  {mastery.map(m => <tr key={m.id}><td>{studentName(m.student_id)}</td><td><span className={`bdg ${m.mastery_state === 'MASTERED' ? 'bok' : m.mastery_state === 'ADVANCED' ? 'bin' : 'bwn'}`}>{m.mastery_state}</span></td></tr>)}
                  {mastery.length === 0 && <tr><td colSpan={2} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No mastery records yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </form>
        </div>
      )}

      {tab === 'quizzes' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/learn/quizzes', quizForm, () => setQuizForm({ courseId: '', title: '', timeLimit: '', attemptLimit: '1' })); }}>
            <div className="ch"><span className="ch-t">QUIZZES</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={quizForm.courseId} onChange={e => setQuizForm({ ...quizForm, courseId: e.target.value })} required><option value="">Course...</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
              <input className="fi" placeholder="Title" value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" type="number" placeholder="Time limit (min)" value={quizForm.timeLimit} onChange={e => setQuizForm({ ...quizForm, timeLimit: e.target.value })} style={{ width: 140 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Create Quiz</button>
            </div>
            {quizzes.map(q => <div key={q.id} className="ri na"><div className="ri-b"><div className="ri-t">{q.title}</div><div className="ri-s">{courseTitle(q.course_id)}</div></div></div>)}
            {quizzes.length === 0 && <div className="ri na"><div className="ri-s">No quizzes yet.</div></div>}
          </form>
        </div>
      )}

      {tab === 'other' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/learn/observations', obsForm, () => setObsForm({ lessonPlanId: '', teacherId: '', observationDate: '', rating: 'SATISFACTORY', strengths: '', areasForImprovement: '' })); }} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">CLASSROOM OBSERVATIONS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={obsForm.teacherId} onChange={e => setObsForm({ ...obsForm, teacherId: e.target.value })} required><option value="">Teacher...</option>{staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <input className="fi" type="date" value={obsForm.observationDate} onChange={e => setObsForm({ ...obsForm, observationDate: e.target.value })} required />
              <select className="fi" value={obsForm.rating} onChange={e => setObsForm({ ...obsForm, rating: e.target.value })}><option value="EXCELLENT">Excellent</option><option value="GOOD">Good</option><option value="SATISFACTORY">Satisfactory</option><option value="NEEDS_IMPROVEMENT">Needs Improvement</option></select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Record</button>
            </div>
            {observations.map(o => <div key={o.id} className="ri na"><div className="ri-b"><div className="ri-t">{staffName(o.teacher_id)}</div><div className="ri-s">{o.observation_date} · {o.rating}</div></div></div>)}
            {observations.length === 0 && <div className="ri na"><div className="ri-s">No observations yet.</div></div>}
          </form>
          <form className="card" onSubmit={e => { e.preventDefault(); post('/api/v1/learn/reading-records', readingForm, () => setReadingForm({ studentId: '', readingLevel: '', bookTitle: '', completed: false, recordedDate: '', academicYearId: '' })); }}>
            <div className="ch"><span className="ch-t">READING RECORDS</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={readingForm.studentId} onChange={e => setReadingForm({ ...readingForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <input className="fi" placeholder="Reading level" value={readingForm.readingLevel} onChange={e => setReadingForm({ ...readingForm, readingLevel: e.target.value })} required style={{ width: 140 }} />
              <input className="fi" placeholder="Book title" value={readingForm.bookTitle} onChange={e => setReadingForm({ ...readingForm, bookTitle: e.target.value })} style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" type="date" value={readingForm.recordedDate} onChange={e => setReadingForm({ ...readingForm, recordedDate: e.target.value })} required />
              <select className="fi" value={readingForm.academicYearId} onChange={e => setReadingForm({ ...readingForm, academicYearId: e.target.value })} required><option value="">Year...</option>{years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Record</button>
            </div>
            {readingRecords.map(r => <div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{studentName(r.student_id)}</div><div className="ri-s">{r.reading_level} · {r.book_title || 'No title'}</div></div></div>)}
            {readingRecords.length === 0 && <div className="ri na"><div className="ri-s">No reading records yet.</div></div>}
          </form>
        </div>
      )}
    </AppShell>
  );
}
