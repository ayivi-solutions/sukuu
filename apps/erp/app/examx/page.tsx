'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authedFetch } from '../../lib/api';
import AppShell from '../../components/AppShell';

const TABS = [
  { key: 'exams', label: 'Exams' },
  { key: 'papers', label: 'Papers & Rooms' },
  { key: 'schedule', label: 'Schedule & Seating' },
  { key: 'invigilation', label: 'Invigilation' },
  { key: 'scripts', label: 'Scripts & Moderation' },
  { key: 'malpractice', label: 'Malpractice' },
];

export default function ExamXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('exams');
  const [error, setError] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  const [exams, setExams] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [seating, setSeating] = useState<any[]>([]);
  const [invigilators, setInvigilators] = useState<any[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [moderations, setModerations] = useState<any[]>([]);
  const [malpractice, setMalpractice] = useState<any[]>([]);

  const [examForm, setExamForm] = useState({ name: '', examType: 'END_OF_TERM', termId: '', startDate: '', endDate: '' });
  const [paperForm, setPaperForm] = useState({ examId: '', subjectId: '', paperCode: '', durationMinutes: '', totalMarks: '' });
  const [roomForm, setRoomForm] = useState({ name: '', capacity: '', location: '' });
  const [scheduleForm, setScheduleForm] = useState({ paperId: '', classId: '', date: '', startTime: '', endTime: '', roomId: '' });
  const [seatForm, setSeatForm] = useState({ scheduleId: '', studentId: '', seatNumber: '', rowPosition: '', columnPosition: '' });
  const [invigForm, setInvigForm] = useState({ scheduleId: '', staffId: '', role: 'SUPERVISOR' });
  const [scriptForm, setScriptForm] = useState({ studentId: '', paperId: '', scriptCode: '' });
  const [modForm, setModForm] = useState({ paperId: '', moderatorId: '', remarks: '' });
  const [malForm, setMalForm] = useState({ studentId: '', paperId: '', incidentType: '', description: '' });

  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

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
    authedFetch('/api/v1/students', t).then(d => Array.isArray(d) && setStudents(d));
    authedFetch('/api/v1/staff', t).then(d => Array.isArray(d) && setStaff(d));
    authedFetch('/api/v1/academic/subjects', t).then(d => Array.isArray(d) && setSubjects(d));
    authedFetch('/api/v1/academic/classes', t).then(d => Array.isArray(d) && setClasses(d));
    authedFetch('/api/v1/academic/terms', t).then(d => Array.isArray(d) && setTerms(d));
    authedFetch('/api/v1/exam/exams', t).then(d => Array.isArray(d) ? setExams(d) : setError(d?.error));
    authedFetch('/api/v1/exam/subject-papers', t).then(d => Array.isArray(d) && setPapers(d));
    authedFetch('/api/v1/exam/rooms', t).then(d => Array.isArray(d) && setRooms(d));
    authedFetch('/api/v1/exam/schedule', t).then(d => Array.isArray(d) && setSchedule(d));
    authedFetch('/api/v1/exam/seating', t).then(d => Array.isArray(d) && setSeating(d));
    authedFetch('/api/v1/exam/invigilators', t).then(d => Array.isArray(d) && setInvigilators(d));
    authedFetch('/api/v1/exam/scripts', t).then(d => Array.isArray(d) && setScripts(d));
    authedFetch('/api/v1/exam/moderations', t).then(d => Array.isArray(d) && setModerations(d));
    authedFetch('/api/v1/exam/malpractice', t).then(d => Array.isArray(d) && setMalpractice(d));
    setSummaryLoading(true);
    authedFetch('/api/v1/exam/summary', t)
      .then(d => { if (d && !d.error) { setSummary(d); setSummaryError(''); } else setSummaryError(d?.error || 'Failed to load summary'); })
      .catch(() => setSummaryError('Failed to load summary'))
      .finally(() => setSummaryLoading(false));
  }

  function studentName(id: string) { const s = students.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8) || '—'; }
  function staffName(id: string) { const s = staff.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8) || '—'; }
  function subjectName(id: string) { return subjects.find(x => x.id === id)?.name || id?.slice(0, 8) || '—'; }
  function paperCode(id: string) { return papers.find(x => x.id === id)?.paper_code || id?.slice(0, 8) || '—'; }

  async function handleAddExam(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/exam/exams', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(examForm) }); setExamForm({ name: '', examType: 'END_OF_TERM', termId: '', startDate: '', endDate: '' }); loadAll(token); }
  async function handleExamStatus(id: string, status: string) { await authedFetch(`/api/v1/exam/exams/${id}/status`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); loadAll(token); }
  async function handleAddPaper(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/exam/subject-papers', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paperForm) }); setPaperForm({ examId: '', subjectId: '', paperCode: '', durationMinutes: '', totalMarks: '' }); loadAll(token); }
  async function handleAddRoom(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/exam/rooms', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roomForm) }); setRoomForm({ name: '', capacity: '', location: '' }); loadAll(token); }
  async function handleAddSchedule(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/exam/schedule', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scheduleForm) }); setScheduleForm({ paperId: '', classId: '', date: '', startTime: '', endTime: '', roomId: '' }); loadAll(token); }
  async function handleAddSeat(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/exam/seating', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(seatForm) }); setSeatForm({ scheduleId: '', studentId: '', seatNumber: '', rowPosition: '', columnPosition: '' }); loadAll(token); }
  async function handleAddInvig(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/exam/invigilators', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(invigForm) }); setInvigForm({ scheduleId: '', staffId: '', role: 'SUPERVISOR' }); loadAll(token); }
  async function handleAddScript(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/exam/scripts', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(scriptForm) }); setScriptForm({ studentId: '', paperId: '', scriptCode: '' }); loadAll(token); }
  async function handleScriptStatus(id: string, status: string) { await authedFetch(`/api/v1/exam/scripts/${id}/status`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); loadAll(token); }
  async function handleAddModeration(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/exam/moderations', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(modForm) }); setModForm({ paperId: '', moderatorId: '', remarks: '' }); loadAll(token); }
  async function handleModStatus(id: string, status: string) { await authedFetch(`/api/v1/exam/moderations/${id}/status`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); loadAll(token); }
  async function handleAddMalpractice(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/exam/malpractice', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(malForm) }); setMalForm({ studentId: '', paperId: '', incidentType: '', description: '' }); loadAll(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · EXAMX · 9 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">📝 ExamX</div>
            <div className="ph-sub">Examination Scheduling · Candidates · Seating · Invigilation · Scripts · Moderation</div>
          </div>
        </div>
      </div>

      {summaryError && (
        <div style={{ padding: '0 var(--pad)', marginBottom: 'var(--gap)' }}>
          <div className="alert al-er"><span className="al-ic">⚠️</span><div>Couldn't load the exam overview: {summaryError}.</div></div>
        </div>
      )}

      {summaryLoading ? (
        <div className="fx-overview"><div className="stat-grid">{[1, 2, 3, 4].map(i => <div key={i} className="skel skel-card" />)}</div></div>
      ) : summary && (
        <div className="fx-overview">
          <div className="stat-grid">
            <button className="fx-card-btn" onClick={() => setTab('exams')}>
              <div className="sc" title="Total exams on record, in-progress count highlighted">
                <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--inB)' }}>📝</div></div>
                <div className="sc-val">{summary.total}</div>
                <div className="sc-lbl">TOTAL EXAMS</div>
                <div className="sc-foot">{summary.draft} draft · {summary.inProgress} in progress · {summary.published} published</div>
              </div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('scripts')}>
              <div className="sc" title="Exam moderations with status PENDING">
                <div className="sc-top"><div className="sc-icon" style={{ background: summary.pendingModeration > 0 ? 'var(--erB)' : 'var(--okB)' }}>🔍</div></div>
                <div className="sc-val">{summary.pendingModeration}</div>
                <div className="sc-lbl">PENDING MODERATION</div>
              </div>
            </button>
            <button className="fx-card-btn" onClick={() => setTab('malpractice')}>
              <div className="sc" title="Recorded malpractice incidents, all time">
                <div className="sc-top"><div className="sc-icon" style={{ background: summary.malpracticeCount > 0 ? 'var(--erB)' : 'var(--okB)' }}>⚠️</div></div>
                <div className="sc-val">{summary.malpracticeCount}</div>
                <div className="sc-lbl">MALPRACTICE INCIDENTS</div>
              </div>
            </button>
          </div>
        </div>
      )}

      <div className="sys-tabs">
        {TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'exams' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={handleAddExam} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">SCHEDULE EXAM</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Exam name" value={examForm.name} onChange={e => setExamForm({ ...examForm, name: e.target.value })} required style={{ flex: 1, minWidth: 160 }} />
              <select className="fi" value={examForm.examType} onChange={e => setExamForm({ ...examForm, examType: e.target.value })}>
                <option value="END_OF_TERM">End of Term</option><option value="MID_TERM">Mid Term</option><option value="MOCK">Mock</option><option value="ENTRANCE">Entrance</option>
              </select>
              <select className="fi" value={examForm.termId} onChange={e => setExamForm({ ...examForm, termId: e.target.value })} required><option value="">Term...</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <input className="fi" type="date" value={examForm.startDate} onChange={e => setExamForm({ ...examForm, startDate: e.target.value })} required />
              <input className="fi" type="date" value={examForm.endDate} onChange={e => setExamForm({ ...examForm, endDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Schedule</button>
            </div>
          </form>
          <div className="tbl">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Type</th><th>Dates</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {exams.map(ex => (
                  <tr key={ex.id}>
                    <td><strong>{ex.name}</strong></td><td>{ex.exam_type}</td><td style={{ fontSize: 11 }}>{ex.start_date} → {ex.end_date}</td>
                    <td><span className={`bdg ${ex.status === 'PUBLISHED' ? 'bok' : ex.status === 'IN_PROGRESS' ? 'bin' : 'bwn'}`}>{ex.status}</span></td>
                    <td>
                      <select className="fi" style={{ fontSize: 11, padding: '4px 8px' }} value={ex.status} onChange={e => handleExamStatus(ex.id, e.target.value)}>
                        <option value="DRAFT">Draft</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETED">Completed</option><option value="PUBLISHED">Published</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {exams.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No exams scheduled yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'papers' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">SUBJECT PAPERS</span></div>
            <form className="cb" onSubmit={handleAddPaper} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={paperForm.examId} onChange={e => setPaperForm({ ...paperForm, examId: e.target.value })} required><option value="">Exam...</option>{exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}</select>
              <select className="fi" value={paperForm.subjectId} onChange={e => setPaperForm({ ...paperForm, subjectId: e.target.value })} required><option value="">Subject...</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <input className="fi" placeholder="Paper code" value={paperForm.paperCode} onChange={e => setPaperForm({ ...paperForm, paperCode: e.target.value })} required style={{ width: 120 }} />
              <input className="fi" type="number" placeholder="Duration (min)" value={paperForm.durationMinutes} onChange={e => setPaperForm({ ...paperForm, durationMinutes: e.target.value })} required style={{ width: 130 }} />
              <input className="fi" type="number" placeholder="Total marks" value={paperForm.totalMarks} onChange={e => setPaperForm({ ...paperForm, totalMarks: e.target.value })} required style={{ width: 110 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Paper</button>
            </form>
            {papers.map(p => (
              <div key={p.id} className="ri na"><div className="ri-b"><div className="ri-t">{p.paper_code} · {subjectName(p.subject_id)}</div><div className="ri-s">{p.duration_minutes} min · {p.total_marks} marks</div></div></div>
            ))}
            {papers.length === 0 && <div className="ri na"><div className="ri-s">No papers yet.</div></div>}
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">EXAM ROOMS</span></div>
            <form className="cb" onSubmit={handleAddRoom} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Room name" value={roomForm.name} onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} required style={{ flex: 1, minWidth: 140 }} />
              <input className="fi" type="number" placeholder="Capacity" value={roomForm.capacity} onChange={e => setRoomForm({ ...roomForm, capacity: e.target.value })} required style={{ width: 110 }} />
              <input className="fi" placeholder="Location" value={roomForm.location} onChange={e => setRoomForm({ ...roomForm, location: e.target.value })} style={{ flex: 1, minWidth: 140 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add Room</button>
            </form>
            {rooms.map(r => <div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{r.name}</div><div className="ri-s">Capacity {r.capacity} · {r.location || 'No location set'}</div></div></div>)}
            {rooms.length === 0 && <div className="ri na"><div className="ri-s">No rooms yet.</div></div>}
          </div>
        </div>
      )}

      {tab === 'schedule' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">PAPER SCHEDULE</span></div>
            <form className="cb" onSubmit={handleAddSchedule} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={scheduleForm.paperId} onChange={e => setScheduleForm({ ...scheduleForm, paperId: e.target.value })} required><option value="">Paper...</option>{papers.map(p => <option key={p.id} value={p.id}>{p.paper_code}</option>)}</select>
              <select className="fi" value={scheduleForm.classId} onChange={e => setScheduleForm({ ...scheduleForm, classId: e.target.value })} required><option value="">Class...</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <input className="fi" type="date" value={scheduleForm.date} onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })} required />
              <input className="fi" type="time" value={scheduleForm.startTime} onChange={e => setScheduleForm({ ...scheduleForm, startTime: e.target.value })} required />
              <input className="fi" type="time" value={scheduleForm.endTime} onChange={e => setScheduleForm({ ...scheduleForm, endTime: e.target.value })} required />
              <select className="fi" value={scheduleForm.roomId} onChange={e => setScheduleForm({ ...scheduleForm, roomId: e.target.value })} required><option value="">Room...</option>{rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
            {schedule.map(s => <div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{paperCode(s.paper_id)} · {s.date}</div><div className="ri-s">{s.start_time}–{s.end_time}</div></div></div>)}
            {schedule.length === 0 && <div className="ri na"><div className="ri-s">No schedule entries yet.</div></div>}
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">SEATING PLAN</span></div>
            <form className="cb" onSubmit={handleAddSeat} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={seatForm.scheduleId} onChange={e => setSeatForm({ ...seatForm, scheduleId: e.target.value })} required><option value="">Schedule entry...</option>{schedule.map(s => <option key={s.id} value={s.id}>{paperCode(s.paper_id)} - {s.date}</option>)}</select>
              <select className="fi" value={seatForm.studentId} onChange={e => setSeatForm({ ...seatForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <input className="fi" placeholder="Seat #" value={seatForm.seatNumber} onChange={e => setSeatForm({ ...seatForm, seatNumber: e.target.value })} required style={{ width: 90 }} />
              <input className="fi" type="number" placeholder="Row" value={seatForm.rowPosition} onChange={e => setSeatForm({ ...seatForm, rowPosition: e.target.value })} required style={{ width: 80 }} />
              <input className="fi" type="number" placeholder="Col" value={seatForm.columnPosition} onChange={e => setSeatForm({ ...seatForm, columnPosition: e.target.value })} required style={{ width: 80 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Assign Seat</button>
            </form>
            {seating.map(s => <div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{studentName(s.student_id)}</div><div className="ri-s">Seat {s.seat_number} · Row {s.row_position}, Col {s.column_position}</div></div></div>)}
            {seating.length === 0 && <div className="ri na"><div className="ri-s">No seats assigned yet.</div></div>}
          </div>
        </div>
      )}

      {tab === 'invigilation' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={handleAddInvig} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">ASSIGN INVIGILATOR</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={invigForm.scheduleId} onChange={e => setInvigForm({ ...invigForm, scheduleId: e.target.value })} required><option value="">Schedule entry...</option>{schedule.map(s => <option key={s.id} value={s.id}>{paperCode(s.paper_id)} - {s.date}</option>)}</select>
              <select className="fi" value={invigForm.staffId} onChange={e => setInvigForm({ ...invigForm, staffId: e.target.value })} required><option value="">Staff...</option>{staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <select className="fi" value={invigForm.role} onChange={e => setInvigForm({ ...invigForm, role: e.target.value })}><option value="CHIEF">Chief</option><option value="SUPERVISOR">Supervisor</option><option value="ASSISTANT">Assistant</option></select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Assign</button>
            </div>
          </form>
          <div className="tbl">
            <table className="data-table">
              <thead><tr><th>Staff</th><th>Paper</th><th>Role</th></tr></thead>
              <tbody>
                {invigilators.map(i => <tr key={i.id}><td>{staffName(i.staff_id)}</td><td>{paperCode(schedule.find(s => s.id === i.schedule_id)?.paper_id || '')}</td><td><span className="bdg bin">{i.role}</span></td></tr>)}
                {invigilators.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No invigilators assigned.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'scripts' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">SCRIPTS</span></div>
            <form className="cb" onSubmit={handleAddScript} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={scriptForm.studentId} onChange={e => setScriptForm({ ...scriptForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <select className="fi" value={scriptForm.paperId} onChange={e => setScriptForm({ ...scriptForm, paperId: e.target.value })} required><option value="">Paper...</option>{papers.map(p => <option key={p.id} value={p.id}>{p.paper_code}</option>)}</select>
              <input className="fi" placeholder="Script code" value={scriptForm.scriptCode} onChange={e => setScriptForm({ ...scriptForm, scriptCode: e.target.value })} required style={{ width: 140 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Log Script</button>
            </form>
            <div className="tbl">
              <table className="data-table">
                <thead><tr><th>Student</th><th>Paper</th><th>Code</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {scripts.map(s => (
                    <tr key={s.id}>
                      <td>{studentName(s.student_id)}</td><td>{paperCode(s.paper_id)}</td><td style={{ fontFamily: 'monospace', fontSize: 11 }}>{s.script_code}</td>
                      <td><span className={`bdg ${s.status === 'RETURNED' ? 'bok' : 'bin'}`}>{s.status}</span></td>
                      <td>
                        <select className="fi" style={{ fontSize: 11, padding: '4px 8px' }} value={s.status} onChange={e => handleScriptStatus(s.id, e.target.value)}>
                          <option value="SUBMITTED">Submitted</option><option value="MARKED">Marked</option><option value="MODERATED">Moderated</option><option value="RETURNED">Returned</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {scripts.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No scripts logged yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">MODERATION</span></div>
            <form className="cb" onSubmit={handleAddModeration} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={modForm.paperId} onChange={e => setModForm({ ...modForm, paperId: e.target.value })} required><option value="">Paper...</option>{papers.map(p => <option key={p.id} value={p.id}>{p.paper_code}</option>)}</select>
              <select className="fi" value={modForm.moderatorId} onChange={e => setModForm({ ...modForm, moderatorId: e.target.value })} required><option value="">Moderator...</option>{staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <input className="fi" placeholder="Remarks" value={modForm.remarks} onChange={e => setModForm({ ...modForm, remarks: e.target.value })} style={{ flex: 1, minWidth: 140 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Request Moderation</button>
            </form>
            {moderations.map(m => (
              <div key={m.id} className="ri na">
                <div className="ri-b"><div className="ri-t">{paperCode(m.paper_id)} · {staffName(m.moderator_id)}</div><div className="ri-s">{m.remarks || 'No remarks'}</div></div>
                <select className="fi" style={{ fontSize: 11, padding: '4px 8px' }} value={m.status} onChange={e => handleModStatus(m.id, e.target.value)}>
                  <option value="PENDING">Pending</option><option value="IN_PROGRESS">In Progress</option><option value="COMPLETE">Complete</option>
                </select>
              </div>
            ))}
            {moderations.length === 0 && <div className="ri na"><div className="ri-s">No moderation requests yet.</div></div>}
          </div>
        </div>
      )}

      {tab === 'malpractice' && (
        <div style={{ padding: 'var(--pad)' }}>
          <form className="card" onSubmit={handleAddMalpractice} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">RECORD INCIDENT</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={malForm.studentId} onChange={e => setMalForm({ ...malForm, studentId: e.target.value })} required><option value="">Student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <select className="fi" value={malForm.paperId} onChange={e => setMalForm({ ...malForm, paperId: e.target.value })} required><option value="">Paper...</option>{papers.map(p => <option key={p.id} value={p.id}>{p.paper_code}</option>)}</select>
              <input className="fi" placeholder="Incident type" value={malForm.incidentType} onChange={e => setMalForm({ ...malForm, incidentType: e.target.value })} required style={{ width: 160 }} />
              <input className="fi" placeholder="Description" value={malForm.description} onChange={e => setMalForm({ ...malForm, description: e.target.value })} required style={{ flex: 1, minWidth: 160 }} />
              <button type="submit" style={{ background: 'var(--erB)', color: 'var(--er)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Record</button>
            </div>
          </form>
          <div className="tbl">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Paper</th><th>Type</th><th>Description</th><th>Decision</th></tr></thead>
              <tbody>
                {malpractice.map(m => <tr key={m.id}><td>{studentName(m.student_id)}</td><td>{paperCode(m.paper_id)}</td><td>{m.incident_type}</td><td style={{ fontSize: 12 }}>{m.description}</td><td><span className="bdg bwn">{m.decision}</span></td></tr>)}
                {malpractice.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No incidents recorded.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
