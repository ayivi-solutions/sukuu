'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { authedFetch } from '../../lib/api';

const TABS = [
  { key: 'take', label: 'Take Attendance' },
  { key: 'sessions', label: 'Sessions & History' },
  { key: 'exceptions', label: 'Exceptions' },
  { key: 'devices', label: 'Devices & Events' },
  { key: 'policies', label: 'Policies' },
  { key: 'reports', label: 'Reports' },
];

export default function AttendanceXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('take');
  const [error, setError] = useState('');

  const [classes, setClasses] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [days, setDays] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  const [sessions, setSessions] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [classSummaries, setClassSummaries] = useState<any[]>([]);

  const [sessionForm, setSessionForm] = useState({ academicYearId: '', termId: '', classId: '', streamId: '', subjectId: '', teacherId: '', dayId: '', periodId: '', sessionDate: new Date().toISOString().slice(0, 10) });
  const [activeSession, setActiveSession] = useState<any>(null);
  const [rosterStudents, setRosterStudents] = useState<any[]>([]);
  const [markState, setMarkState] = useState<{ [studentId: string]: string }>({});
  const [sessionError, setSessionError] = useState('');

  const [viewingSession, setViewingSession] = useState<any>(null);
  const [viewingMarks, setViewingMarks] = useState<any[]>([]);

  const [exceptionForm, setExceptionForm] = useState({ studentId: '', sessionId: '', exceptionType: 'MEDICAL_LEAVE', notes: '' });
  const [deviceForm, setDeviceForm] = useState({ deviceName: '', deviceType: 'BIOMETRIC', location: '', ipAddress: '' });
  const [policyForm, setPolicyForm] = useState({ policyName: '', minimumAttendancePercentage: 75, lateThresholdMinutes: 10, autoAbsentThreshold: 30 });
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [policyEditForm, setPolicyEditForm] = useState({ policyName: '', minimumAttendancePercentage: '', lateThresholdMinutes: '', autoAbsentThreshold: '', isActive: true });

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
    authedFetch('/api/v1/academic/streams', t).then(d => Array.isArray(d) && setStreams(d));
    authedFetch('/api/v1/academic/subjects', t).then(d => Array.isArray(d) && setSubjects(d));
    authedFetch('/api/v1/staff', t).then(d => Array.isArray(d) && setStaffList(d));
    authedFetch('/api/v1/academic/years', t).then(d => Array.isArray(d) && setYears(d));
    authedFetch('/api/v1/academic/terms', t).then(d => Array.isArray(d) && setTerms(d));
    authedFetch('/api/v1/schedule/days', t).then(d => Array.isArray(d) && setDays(d));
    authedFetch('/api/v1/schedule/periods', t).then(d => Array.isArray(d) && setPeriods(d));
    authedFetch('/api/v1/students', t).then(d => Array.isArray(d) ? setAllStudents(d) : setError(d?.error));
    authedFetch('/api/v1/attendance/sessions', t).then(d => Array.isArray(d) && setSessions(d));
    authedFetch('/api/v1/attendance/exceptions', t).then(d => Array.isArray(d) && setExceptions(d));
    authedFetch('/api/v1/attendance/devices', t).then(d => Array.isArray(d) && setDevices(d));
    authedFetch('/api/v1/attendance/events', t).then(d => Array.isArray(d) && setEvents(d));
    authedFetch('/api/v1/attendance/policies', t).then(d => Array.isArray(d) && setPolicies(d));
    authedFetch('/api/v1/attendance/summaries', t).then(d => Array.isArray(d) && setClassSummaries(d));
  }

  function nameOf(list: any[], id: string, field = 'name') { return list.find(x => x.id === id)?.[field] || id?.slice(0, 8) || '—'; }
  function staffName(id: string) { const s = staffList.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8) || '—'; }
  function studentName(id: string) { const s = allStudents.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8) || '—'; }

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    setSessionError('');
    const res = await authedFetch('/api/v1/attendance/sessions', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sessionForm) });
    if (res?.error) { setSessionError(res.error); return; }
    setActiveSession(res);
    const roster = await authedFetch(`/api/v1/attendance/roster?classId=${sessionForm.classId}${sessionForm.streamId ? `&streamId=${sessionForm.streamId}` : ''}`, token);
    const classStudents = Array.isArray(roster) ? roster : [];
    setRosterStudents(classStudents);
    const initial: { [k: string]: string } = {};
    classStudents.forEach((s: any) => { initial[s.id] = 'present'; });
    setMarkState(initial);
    loadAll(token);
  }

  async function handleSubmitRegister() {
    const marks = Object.entries(markState).map(([studentId, status]) => ({ studentId, status }));
    await authedFetch(`/api/v1/attendance/sessions/${activeSession.id}/marks/bulk`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ marks }) });
    alert('Register submitted for ' + marks.length + ' students.');
    setActiveSession(null);
    setRosterStudents([]);
    loadAll(token);
  }

  async function openSession(s: any) {
    setViewingSession(s);
    const marks = await authedFetch(`/api/v1/attendance/sessions/${s.id}/marks`, token);
    setViewingMarks(Array.isArray(marks) ? marks : []);
  }
  async function handleUpdateMark(id: string, status: string) {
    await authedFetch(`/api/v1/attendance/marks/${id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    const marks = await authedFetch(`/api/v1/attendance/sessions/${viewingSession.id}/marks`, token);
    setViewingMarks(Array.isArray(marks) ? marks : []);
  }
  async function handleArchiveSession(id: string) { await authedFetch(`/api/v1/attendance/sessions/${id}/archive`, token, { method: 'PATCH' }); setViewingSession(null); loadAll(token); }

  async function handleAddException(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/attendance/exceptions', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(exceptionForm) }); setExceptionForm({ studentId: '', sessionId: '', exceptionType: 'MEDICAL_LEAVE', notes: '' }); loadAll(token); }
  async function handleArchiveException(id: string) { await authedFetch(`/api/v1/attendance/exceptions/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }

  async function handleAddDevice(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/attendance/devices', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deviceForm) }); setDeviceForm({ deviceName: '', deviceType: 'BIOMETRIC', location: '', ipAddress: '' }); loadAll(token); }
  async function handleToggleDevice(id: string, current: boolean) { await authedFetch(`/api/v1/attendance/devices/${id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !current }) }); loadAll(token); }

  async function handleAddPolicy(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/attendance/policies', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(policyForm) }); setPolicyForm({ policyName: '', minimumAttendancePercentage: 75, lateThresholdMinutes: 10, autoAbsentThreshold: 30 }); loadAll(token); }
  function openEditPolicy(p: any) { setEditingPolicy(p); setPolicyEditForm({ policyName: p.policy_name, minimumAttendancePercentage: p.minimum_attendance_percentage, lateThresholdMinutes: p.late_threshold_minutes, autoAbsentThreshold: p.auto_absent_threshold, isActive: p.is_active }); }
  async function handleSavePolicy(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/attendance/policies/${editingPolicy.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(policyEditForm) }); setEditingPolicy(null); loadAll(token); }
  async function handleArchivePolicy(id: string) { await authedFetch(`/api/v1/attendance/policies/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · ATTENDANCEX · 7 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">✅ AttendanceX</div>
            <div className="ph-sub">Student Attendance · Sessions · Devices · Exceptions · Auto-Computed Summaries · CRUAA + RBAC enforced</div>
          </div>
        </div>
      </div>

      <div className="sys-tabs">
        {TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'take' && (
        <div style={{ padding: 'var(--pad)' }}>
          {!activeSession ? (
            <>
              {sessionError && <div className="alert al-er" style={{ marginBottom: 16 }}><span className="al-ic">⚠️</span><div>{sessionError}</div></div>}
              <form className="card" onSubmit={handleCreateSession}>
                <div className="ch"><span className="ch-t">START A NEW SESSION</span></div>
                <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <select className="fi" value={sessionForm.academicYearId} onChange={e => setSessionForm({ ...sessionForm, academicYearId: e.target.value })} required><option value="">Year...</option>{years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select>
                  <select className="fi" value={sessionForm.termId} onChange={e => setSessionForm({ ...sessionForm, termId: e.target.value })} required><option value="">Term...</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                  <select className="fi" value={sessionForm.classId} onChange={e => setSessionForm({ ...sessionForm, classId: e.target.value })} required><option value="">Class...</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                  <select className="fi" value={sessionForm.streamId} onChange={e => setSessionForm({ ...sessionForm, streamId: e.target.value })}><option value="">Stream (optional)...</option>{streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                  <select className="fi" value={sessionForm.subjectId} onChange={e => setSessionForm({ ...sessionForm, subjectId: e.target.value })} required><option value="">Subject...</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                  <select className="fi" value={sessionForm.teacherId} onChange={e => setSessionForm({ ...sessionForm, teacherId: e.target.value })} required><option value="">Teacher...</option>{staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
                  <select className="fi" value={sessionForm.dayId} onChange={e => setSessionForm({ ...sessionForm, dayId: e.target.value })} required><option value="">Day...</option>{days.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                  <select className="fi" value={sessionForm.periodId} onChange={e => setSessionForm({ ...sessionForm, periodId: e.target.value })} required><option value="">Period...</option>{periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  <input className="fi" type="date" value={sessionForm.sessionDate} onChange={e => setSessionForm({ ...sessionForm, sessionDate: e.target.value })} required />
                  <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Start Session</button>
                </div>
              </form>
            </>
          ) : (
            <div className="card">
              <div className="ch"><span className="ch-t">REGISTER — {nameOf(classes, activeSession.class_id)} · {activeSession.session_date}</span></div>
              {rosterStudents.map(s => (
                <div key={s.id} className="ri na">
                  <div className="ri-b"><div className="ri-t">{s.first_name} {s.last_name}</div><div className="ri-s">{s.student_id}</div></div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['present', 'absent', 'late', 'excused'].map(st => (
                      <button key={st} onClick={() => setMarkState({ ...markState, [s.id]: st })} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, fontWeight: 600, background: markState[s.id] === st ? (st === 'present' ? 'var(--okB)' : st === 'absent' ? 'var(--erB)' : 'var(--bwn,#fdf3e3)') : 'var(--soft)', color: markState[s.id] === st ? (st === 'present' ? 'var(--ok)' : st === 'absent' ? 'var(--er)' : '#92660a') : 'var(--ink)' }}>{st}</button>
                    ))}
                  </div>
                </div>
              ))}
              {rosterStudents.length === 0 && <div className="ri na"><div className="ri-s">No students found for this class.</div></div>}
              <div style={{ display: 'flex', gap: 8, padding: 12 }}>
                <button onClick={handleSubmitRegister} style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Submit Register</button>
                <button onClick={() => { setActiveSession(null); setRosterStudents([]); }} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'sessions' && (
        <div className="tbl" style={{ padding: 'var(--pad)' }}>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Class</th><th>Subject</th><th>Teacher</th><th></th></tr></thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id} onClick={() => openSession(s)} style={{ cursor: 'pointer' }}>
                  <td>{s.session_date}</td><td>{nameOf(classes, s.class_id)} {s.stream_id ? `(${nameOf(streams, s.stream_id)})` : ''}</td>
                  <td>{nameOf(subjects, s.subject_id)}</td><td>{staffName(s.teacher_id)}</td>
                  <td><button onClick={e => { e.stopPropagation(); openSession(s); }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>View</button></td>
                </tr>
              ))}
              {sessions.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No sessions recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'exceptions' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card">
            <div className="ch"><span className="ch-t">ATTENDANCE EXCEPTIONS</span></div>
            {exceptions.map(e => (<div key={e.id} className="ri na"><div className="ri-b"><div className="ri-t">{studentName(e.student_id)}</div><div className="ri-s">{e.exception_type} · {e.notes || '—'}</div></div><button onClick={() => handleArchiveException(e.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button></div>))}
            {exceptions.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddException} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={exceptionForm.studentId} onChange={e => setExceptionForm({ ...exceptionForm, studentId: e.target.value })} required><option value="">Student...</option>{allStudents.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <select className="fi" value={exceptionForm.sessionId} onChange={e => setExceptionForm({ ...exceptionForm, sessionId: e.target.value })} required><option value="">Session...</option>{sessions.map(s => <option key={s.id} value={s.id}>{s.session_date} - {nameOf(classes, s.class_id)}</option>)}</select>
              <select className="fi" value={exceptionForm.exceptionType} onChange={e => setExceptionForm({ ...exceptionForm, exceptionType: e.target.value })}><option value="MEDICAL_LEAVE">Medical Leave</option><option value="OFFICIAL_DUTY">Official Duty</option><option value="APPROVED_ABSENCE">Approved Absence</option><option value="DEVICE_ERROR">Device Error</option></select>
              <input className="fi" placeholder="Notes" value={exceptionForm.notes} onChange={e => setExceptionForm({ ...exceptionForm, notes: e.target.value })} style={{ flex: 1 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'devices' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">DEVICES</span></div>
            {devices.map(d => (<div key={d.id} className="ri na"><div className="ri-b"><div className="ri-t">{d.device_name}</div><div className="ri-s">{d.device_type} · {d.location}</div></div><div className={`tog ${d.is_active ? 'on' : 'off'}`} onClick={() => handleToggleDevice(d.id, d.is_active)} /></div>))}
            {devices.length === 0 && <div className="ri na"><div className="ri-s">None registered yet.</div></div>}
            <form onSubmit={handleAddDevice} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Device name" value={deviceForm.deviceName} onChange={e => setDeviceForm({ ...deviceForm, deviceName: e.target.value })} required style={{ flex: 1 }} />
              <select className="fi" value={deviceForm.deviceType} onChange={e => setDeviceForm({ ...deviceForm, deviceType: e.target.value })}><option value="BIOMETRIC">Biometric</option><option value="RFID">RFID</option><option value="FACE_RECOGNITION">Face Recognition</option><option value="MOBILE">Mobile</option></select>
              <input className="fi" placeholder="Location" value={deviceForm.location} onChange={e => setDeviceForm({ ...deviceForm, location: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Register</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">RAW CAPTURE EVENTS</span></div>
            {events.map(ev => (<div key={ev.id} className="ri na"><div className="ri-b"><div className="ri-t">{ev.person_type} · {ev.event_type}</div><div className="ri-s">{new Date(ev.event_time).toLocaleString()}</div></div></div>))}
            {events.length === 0 && <div className="ri na"><div className="ri-s">No capture events yet.</div></div>}
          </div>
        </div>
      )}

      {tab === 'policies' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card">
            <div className="ch"><span className="ch-t">ATTENDANCE POLICIES</span></div>
            {policies.map(p => (<div key={p.id} className="ri na"><div className="ri-b"><div className="ri-t">{p.policy_name}</div><div className="ri-s">Min {p.minimum_attendance_percentage}% · Late after {p.late_threshold_minutes}min · Auto-absent after {p.auto_absent_threshold}min</div></div>
              <span className={`bdg ${p.is_active ? 'bok' : 'ber'}`} style={{ marginRight: 8 }}>{p.is_active ? 'Active' : 'Inactive'}</span>
              <button onClick={() => openEditPolicy(p)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button>
              <button onClick={() => handleArchivePolicy(p.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
            </div>))}
            {policies.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddPolicy} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Policy name" value={policyForm.policyName} onChange={e => setPolicyForm({ ...policyForm, policyName: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" type="number" placeholder="Min %" value={policyForm.minimumAttendancePercentage} onChange={e => setPolicyForm({ ...policyForm, minimumAttendancePercentage: +e.target.value })} style={{ width: 90 }} />
              <input className="fi" type="number" placeholder="Late (min)" value={policyForm.lateThresholdMinutes} onChange={e => setPolicyForm({ ...policyForm, lateThresholdMinutes: +e.target.value })} style={{ width: 100 }} />
              <input className="fi" type="number" placeholder="Auto-absent (min)" value={policyForm.autoAbsentThreshold} onChange={e => setPolicyForm({ ...policyForm, autoAbsentThreshold: +e.target.value })} style={{ width: 130 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="tbl" style={{ padding: 'var(--pad)' }}>
          <table className="data-table">
            <thead><tr><th>Student</th><th>Sessions</th><th>Present</th><th>Absent</th><th>Late</th><th>%</th></tr></thead>
            <tbody>
              {classSummaries.map(s => (
                <tr key={s.id}>
                  <td>{studentName(s.student_id)}</td><td>{s.total_sessions}</td><td>{s.present_count}</td><td>{s.absent_count}</td><td>{s.late_count}</td>
                  <td><span className={`bdg ${Number(s.attendance_percentage) >= 75 ? 'bok' : 'ber'}`}>{Number(s.attendance_percentage).toFixed(1)}%</span></td>
                </tr>
              ))}
              {classSummaries.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No attendance data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {viewingSession && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setViewingSession(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 420, maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 4 }}>{nameOf(classes, viewingSession.class_id)} — {viewingSession.session_date}</h3>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>{nameOf(subjects, viewingSession.subject_id)} · {staffName(viewingSession.teacher_id)}</div>
            {viewingMarks.map(m => (
              <div key={m.id} className="ri na">
                <div className="ri-b"><div className="ri-t">{studentName(m.student_id)}</div></div>
                <select className="fi" value={m.status} onChange={e => handleUpdateMark(m.id, e.target.value)} style={{ width: 110, fontSize: 12 }}>
                  <option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="excused">Excused</option>
                </select>
              </div>
            ))}
            {viewingMarks.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12, padding: 8 }}>No marks recorded for this session.</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => handleArchiveSession(viewingSession.id)} style={{ flex: 1, background: 'var(--erB)', color: 'var(--er)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Archive Session</button>
              <button onClick={() => setViewingSession(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {editingPolicy && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingPolicy(null)}>
          <form onSubmit={handleSavePolicy} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Policy</h3>
            <div className="fg"><label className="fl">NAME</label><input className="fi" value={policyEditForm.policyName} onChange={e => setPolicyEditForm({ ...policyEditForm, policyName: e.target.value })} required /></div>
            <div className="fg"><label className="fl">MINIMUM %</label><input className="fi" type="number" value={policyEditForm.minimumAttendancePercentage} onChange={e => setPolicyEditForm({ ...policyEditForm, minimumAttendancePercentage: e.target.value })} /></div>
            <div className="fg"><label className="fl">LATE THRESHOLD (MIN)</label><input className="fi" type="number" value={policyEditForm.lateThresholdMinutes} onChange={e => setPolicyEditForm({ ...policyEditForm, lateThresholdMinutes: e.target.value })} /></div>
            <div className="fg"><label className="fl">AUTO-ABSENT THRESHOLD (MIN)</label><input className="fi" type="number" value={policyEditForm.autoAbsentThreshold} onChange={e => setPolicyEditForm({ ...policyEditForm, autoAbsentThreshold: e.target.value })} /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={policyEditForm.isActive} onChange={e => setPolicyEditForm({ ...policyEditForm, isActive: e.target.checked })} /> Active</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingPolicy(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
