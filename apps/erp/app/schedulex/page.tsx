'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { authedFetch } from '../../lib/api';

const TABS = [
  { key: 'timetable', label: 'Timetable' },
  { key: 'setup', label: 'Rooms, Periods & Days' },
  { key: 'conflicts', label: 'Conflicts & Substitutions' },
  { key: 'events', label: 'Calendar Events' },
  { key: 'locks', label: 'Locks & Templates' },
  { key: 'exams', label: 'Exam Slots' },
];

export default function ScheduleXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('timetable');
  const [error, setError] = useState('');

  const [classes, setClasses] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  const [rooms, setRooms] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [days, setDays] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [locks, setLocks] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [examSlots, setExamSlots] = useState<any[]>([]);

  const [roomForm, setRoomForm] = useState({ roomCode: '', name: '', building: '', roomType: 'CLASSROOM', capacity: '' });
  const [periodForm, setPeriodForm] = useState({ periodOrder: '', name: '', periodType: 'LESSON', startTime: '', endTime: '' });
  const [dayForm, setDayForm] = useState({ dayOrder: '', name: '', isSchoolDay: true });
  const [entryForm, setEntryForm] = useState({ academicYearId: '', termId: '', classId: '', streamId: '', subjectId: '', teacherId: '', roomId: '', dayId: '', periodId: '' });
  const [eventForm, setEventForm] = useState({ eventType: 'ACTIVITY', name: '', description: '', startDate: '', endDate: '', isBlackout: false });
  const [lockForm, setLockForm] = useState({ academicYearId: '', termId: '' });
  const [templateForm, setTemplateForm] = useState({ name: '' });
  const [examForm, setExamForm] = useState({ termId: '', classId: '', subjectId: '', roomId: '', invigilatorId: '', examDate: '', startTime: '', durationMinutes: '' });

  const [entryError, setEntryError] = useState('');
  const [viewingEntry, setViewingEntry] = useState<any>(null);
  const [substitutions, setSubstitutions] = useState<any[]>([]);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [subForm, setSubForm] = useState({ substituteTeacherId: '', date: '', reason: '' });
  const [unlockReason, setUnlockReason] = useState<{ [key: string]: string }>({});

  const [editingPeriod, setEditingPeriod] = useState<any>(null);
  const [periodEditForm, setPeriodEditForm] = useState({ name: '', periodOrder: '', periodType: 'LESSON', startTime: '', endTime: '' });
  const [editingDay, setEditingDay] = useState<any>(null);
  const [dayEditForm, setDayEditForm] = useState({ name: '', dayOrder: '', isSchoolDay: true });
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventEditForm, setEventEditForm] = useState({ name: '', description: '', startDate: '', endDate: '', isBlackout: false });
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateEditForm, setTemplateEditForm] = useState({ name: '' });
  const [editingExamSlot, setEditingExamSlot] = useState<any>(null);
  const [examEditForm, setExamEditForm] = useState({ roomId: '', examDate: '', startTime: '', durationMinutes: '', invigilatorId: '' });
  const [editError, setEditError] = useState('');
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [roomEditForm, setRoomEditForm] = useState({ name: '', capacity: '', isActive: true });

  useEffect(() => {
    const t = localStorage.getItem('sukuu_token');
    const userStr = localStorage.getItem('sukuu_user');
    if (!t) { router.push('/login'); return; }
    setToken(t);
    setUser(userStr ? JSON.parse(userStr) : null);
    loadAll(t);
  }, [router]);

  useEffect(() => { if (token) loadConflicts(token); }, [showResolved]);

  function loadAll(t: string) {
    authedFetch('/api/v1/school/profile', t).then(d => d && !d.error && setSchool(d));
    authedFetch('/api/v1/academic/classes', t).then(d => Array.isArray(d) && setClasses(d));
    authedFetch('/api/v1/academic/streams', t).then(d => Array.isArray(d) && setStreams(d));
    authedFetch('/api/v1/academic/subjects', t).then(d => Array.isArray(d) && setSubjects(d));
    authedFetch('/api/v1/staff', t).then(d => Array.isArray(d) && setStaffList(d));
    authedFetch('/api/v1/academic/years', t).then(d => Array.isArray(d) && setYears(d));
    authedFetch('/api/v1/academic/terms', t).then(d => Array.isArray(d) && setTerms(d));
    authedFetch('/api/v1/schedule/rooms', t).then(d => Array.isArray(d) ? setRooms(d) : setError(d?.error));
    authedFetch('/api/v1/schedule/periods', t).then(d => Array.isArray(d) && setPeriods(d));
    authedFetch('/api/v1/schedule/days', t).then(d => Array.isArray(d) && setDays(d));
    authedFetch('/api/v1/schedule/timetable', t).then(d => Array.isArray(d) && setTimetable(d));
    loadConflicts(t);
    authedFetch('/api/v1/schedule/events', t).then(d => Array.isArray(d) && setEvents(d));
    authedFetch('/api/v1/schedule/locks', t).then(d => Array.isArray(d) && setLocks(d));
    authedFetch('/api/v1/schedule/templates', t).then(d => Array.isArray(d) && setTemplates(d));
    authedFetch('/api/v1/schedule/exam-slots', t).then(d => Array.isArray(d) && setExamSlots(d));
  }
  function loadConflicts(t: string) {
    authedFetch(`/api/v1/schedule/conflicts?includeResolved=${showResolved}`, t).then(d => Array.isArray(d) && setConflicts(d));
  }

  function nameOf(list: any[], id: string, field = 'name') { return list.find(x => x.id === id)?.[field] || id?.slice(0, 8) || '—'; }
  function staffName(id: string) { const s = staffList.find(x => x.id === id); return s ? `${s.first_name} ${s.last_name}` : id?.slice(0, 8) || '—'; }
  function yearLabel(id: string) { return years.find(y => y.id === id)?.name || id?.slice(0, 8) || '—'; }
  function termLabel(id: string) { return terms.find(t => t.id === id)?.name || id?.slice(0, 8) || '—'; }

  async function handleAddRoom(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/schedule/rooms', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roomForm) }); setRoomForm({ roomCode: '', name: '', building: '', roomType: 'CLASSROOM', capacity: '' }); loadAll(token); }
  function openEditRoom(r: any) { setEditingRoom(r); setRoomEditForm({ name: r.name, capacity: r.capacity, isActive: r.is_active }); }
  async function handleSaveRoom(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/schedule/rooms/${editingRoom.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roomEditForm) }); setEditingRoom(null); loadAll(token); }
  async function handleAddPeriod(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/schedule/periods', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(periodForm) }); setPeriodForm({ periodOrder: '', name: '', periodType: 'LESSON', startTime: '', endTime: '' }); loadAll(token); }
  async function handleArchivePeriod(id: string) { await authedFetch(`/api/v1/schedule/periods/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  function openEditPeriod(p: any) { setEditingPeriod(p); setPeriodEditForm({ name: p.name, periodOrder: p.period_order, periodType: p.period_type, startTime: p.start_time, endTime: p.end_time }); }
  async function handleSavePeriod(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/schedule/periods/${editingPeriod.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(periodEditForm) }); setEditingPeriod(null); loadAll(token); }

  async function handleAddDay(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/schedule/days', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dayForm) }); setDayForm({ dayOrder: '', name: '', isSchoolDay: true }); loadAll(token); }
  async function handleArchiveDay(id: string) { await authedFetch(`/api/v1/schedule/days/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  function openEditDay(d: any) { setEditingDay(d); setDayEditForm({ name: d.name, dayOrder: d.day_order, isSchoolDay: d.is_school_day }); }
  async function handleSaveDay(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/schedule/days/${editingDay.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dayEditForm) }); setEditingDay(null); loadAll(token); }

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    setEntryError('');
    const res = await authedFetch('/api/v1/schedule/timetable', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entryForm) });
    if (res?.error) setEntryError(res.error);
    else { setEntryForm({ academicYearId: '', termId: '', classId: '', streamId: '', subjectId: '', teacherId: '', roomId: '', dayId: '', periodId: '' }); loadAll(token); }
  }
  async function handleArchiveEntry(id: string) { await authedFetch(`/api/v1/schedule/timetable/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); setViewingEntry(null); }
  async function openEntry(entry: any) {
    setViewingEntry(entry);
    const subs = await authedFetch(`/api/v1/schedule/timetable/${entry.id}/substitutions`, token);
    setSubstitutions(Array.isArray(subs) ? subs : []);
    const revs = await authedFetch(`/api/v1/schedule/timetable/${entry.id}/revisions`, token);
    setRevisions(Array.isArray(revs) ? revs : []);
  }
  async function handleAddSubstitution(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch(`/api/v1/schedule/timetable/${viewingEntry.id}/substitutions`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subForm) });
    setSubForm({ substituteTeacherId: '', date: '', reason: '' });
    const subs = await authedFetch(`/api/v1/schedule/timetable/${viewingEntry.id}/substitutions`, token);
    setSubstitutions(Array.isArray(subs) ? subs : []);
  }
  async function handleCancelSubstitution(id: string) { await authedFetch(`/api/v1/schedule/substitutions/${id}/cancel`, token, { method: 'PATCH' }); const subs = await authedFetch(`/api/v1/schedule/timetable/${viewingEntry.id}/substitutions`, token); setSubstitutions(Array.isArray(subs) ? subs : []); }
  async function handleResolveConflict(id: string) { await authedFetch(`/api/v1/schedule/conflicts/${id}/resolve`, token, { method: 'PATCH' }); loadConflicts(token); }

  async function handleAddEvent(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/schedule/events', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventForm) }); setEventForm({ eventType: 'ACTIVITY', name: '', description: '', startDate: '', endDate: '', isBlackout: false }); loadAll(token); }
  async function handleArchiveEvent(id: string) { await authedFetch(`/api/v1/schedule/events/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  function openEditEvent(e: any) { setEditingEvent(e); setEventEditForm({ name: e.name, description: e.description || '', startDate: e.start_date, endDate: e.end_date, isBlackout: e.is_blackout }); }
  async function handleSaveEvent(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/schedule/events/${editingEvent.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventEditForm) }); setEditingEvent(null); loadAll(token); }

  async function handleLockSchedule(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/schedule/locks', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lockForm) }); setLockForm({ academicYearId: '', termId: '' }); loadAll(token); }
  async function handleUnlock(id: string) { await authedFetch(`/api/v1/schedule/locks/${id}/unlock`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: unlockReason[id] || 'Unlocked by admin' }) }); loadAll(token); }
  async function handleAddTemplate(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/schedule/templates', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(templateForm) }); setTemplateForm({ name: '' }); loadAll(token); }
  async function handleArchiveTemplate(id: string) { await authedFetch(`/api/v1/schedule/templates/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  function openEditTemplate(t: any) { setEditingTemplate(t); setTemplateEditForm({ name: t.name }); }
  async function handleSaveTemplate(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/schedule/templates/${editingTemplate.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(templateEditForm) }); setEditingTemplate(null); loadAll(token); }

  async function handleAddExamSlot(e: React.FormEvent) {
    e.preventDefault();
    const res = await authedFetch('/api/v1/schedule/exam-slots', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(examForm) });
    if (res?.error) alert(res.error);
    else { setExamForm({ termId: '', classId: '', subjectId: '', roomId: '', invigilatorId: '', examDate: '', startTime: '', durationMinutes: '' }); loadAll(token); }
  }
  async function handleArchiveExamSlot(id: string) { await authedFetch(`/api/v1/schedule/exam-slots/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  function openEditExamSlot(e: any) { setEditingExamSlot(e); setExamEditForm({ roomId: e.room_id, examDate: e.exam_date, startTime: e.start_time, durationMinutes: e.duration_minutes, invigilatorId: e.invigilator_id || '' }); setEditError(''); }
  async function handleSaveExamSlot(e: React.FormEvent) {
    e.preventDefault();
    setEditError('');
    const res = await authedFetch(`/api/v1/schedule/exam-slots/${editingExamSlot.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(examEditForm) });
    if (res?.error) setEditError(res.error);
    else { setEditingExamSlot(null); loadAll(token); }
  }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · SCHEDULEX · 13 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">🗓️ ScheduleX</div>
            <div className="ph-sub">Timetable · Rooms · Periods · Conflict Detection · Substitutions · CRUAA + RBAC enforced</div>
          </div>
        </div>
      </div>

      <div className="fx-overview">
        <div className="stat-grid">
          <button className="fx-card-btn" onClick={() => setTab('timetable')}>
            <div className="sc" title="Timetable entries currently marked is_active">
              <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--inB)' }}>🗓️</div></div>
              <div className="sc-val">{timetable.filter((t: any) => t.is_active).length}</div>
              <div className="sc-lbl">ACTIVE PERIODS SCHEDULED</div>
            </div>
          </button>
          <button className="fx-card-btn" onClick={() => setTab('conflicts')}>
            <div className="sc" title="Detected scheduling conflicts with resolved = false">
              <div className="sc-top">
                <div className="sc-icon" style={{ background: conflicts.filter((c: any) => !c.resolved).length > 0 ? 'var(--erB)' : 'var(--okB)' }}>⚠️</div>
              </div>
              <div className="sc-val">{conflicts.filter((c: any) => !c.resolved).length}</div>
              <div className="sc-lbl">UNRESOLVED CONFLICTS</div>
            </div>
          </button>
          <button className="fx-card-btn" onClick={() => setTab('events')}>
            <div className="sc" title="Calendar events on record, not archived">
              <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--puB)' }}>📆</div></div>
              <div className="sc-val">{events.length}</div>
              <div className="sc-lbl">CALENDAR EVENTS</div>
            </div>
          </button>
          <button className="fx-card-btn" onClick={() => setTab('locks')}>
            <div className="sc" title="Schedule locks currently in place for a term/year">
              <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--goldF)' }}>🔒</div></div>
              <div className="sc-val">{locks.filter((l: any) => !l.unlocked_by).length}</div>
              <div className="sc-lbl">ACTIVE LOCKS</div>
            </div>
          </button>
        </div>
      </div>

      <div className="sys-tabs">
        {TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'timetable' && (
        <div style={{ padding: 'var(--pad)' }}>
          {entryError && <div className="alert al-er" style={{ marginBottom: 16 }}><span className="al-ic">⚠️</span><div>{entryError}</div></div>}
          <form className="card" onSubmit={handleAddEntry} style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">SCHEDULE A LESSON</span></div>
            <div className="cb" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="fi" value={entryForm.academicYearId} onChange={e => setEntryForm({ ...entryForm, academicYearId: e.target.value })} required><option value="">Year...</option>{years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select>
              <select className="fi" value={entryForm.termId} onChange={e => setEntryForm({ ...entryForm, termId: e.target.value })} required><option value="">Term...</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <select className="fi" value={entryForm.classId} onChange={e => setEntryForm({ ...entryForm, classId: e.target.value })} required><option value="">Class...</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select className="fi" value={entryForm.streamId} onChange={e => setEntryForm({ ...entryForm, streamId: e.target.value })}><option value="">Stream (optional)...</option>{streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <select className="fi" value={entryForm.subjectId} onChange={e => setEntryForm({ ...entryForm, subjectId: e.target.value })} required><option value="">Subject...</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <select className="fi" value={entryForm.teacherId} onChange={e => setEntryForm({ ...entryForm, teacherId: e.target.value })} required><option value="">Teacher...</option>{staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <select className="fi" value={entryForm.roomId} onChange={e => setEntryForm({ ...entryForm, roomId: e.target.value })} required><option value="">Room...</option>{rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
              <select className="fi" value={entryForm.dayId} onChange={e => setEntryForm({ ...entryForm, dayId: e.target.value })} required><option value="">Day...</option>{days.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
              <select className="fi" value={entryForm.periodId} onChange={e => setEntryForm({ ...entryForm, periodId: e.target.value })} required><option value="">Period...</option>{periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 16px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Schedule</button>
            </div>
          </form>
          <div className="tbl">
            <table className="data-table">
              <thead><tr><th>Class</th><th>Subject</th><th>Teacher</th><th>Room</th><th>Day</th><th>Period</th><th></th></tr></thead>
              <tbody>
                {timetable.map(e => (
                  <tr key={e.id} onClick={() => openEntry(e)} style={{ cursor: 'pointer' }}>
                    <td>{nameOf(classes, e.class_id)} {e.stream_id ? `(${nameOf(streams, e.stream_id)})` : ''}</td>
                    <td>{nameOf(subjects, e.subject_id)}</td><td>{staffName(e.teacher_id)}</td><td>{nameOf(rooms, e.room_id)}</td>
                    <td>{nameOf(days, e.day_id)}</td><td>{nameOf(periods, e.period_id)}</td>
                    <td><button onClick={ev => { ev.stopPropagation(); openEntry(e); }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>View</button></td>
                  </tr>
                ))}
                {timetable.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No timetable entries yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'setup' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">ROOMS</span></div>
            {rooms.map(r => (<div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{r.name} ({r.room_code})</div><div className="ri-s">{r.room_type} · Cap. {r.capacity} {r.building ? `· ${r.building}` : ''}</div></div>
              <span className={`bdg ${r.is_active ? 'bok' : 'ber'}`} style={{ marginRight: 8 }}>{r.is_active ? 'Active' : 'Inactive'}</span>
              <button onClick={() => openEditRoom(r)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600 }}>Edit</button>
            </div>))}
            {rooms.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddRoom} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Code" value={roomForm.roomCode} onChange={e => setRoomForm({ ...roomForm, roomCode: e.target.value })} required style={{ width: 90 }} />
              <input className="fi" placeholder="Name" value={roomForm.name} onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" placeholder="Building" value={roomForm.building} onChange={e => setRoomForm({ ...roomForm, building: e.target.value })} />
              <select className="fi" value={roomForm.roomType} onChange={e => setRoomForm({ ...roomForm, roomType: e.target.value })}><option value="CLASSROOM">Classroom</option><option value="LABORATORY">Laboratory</option><option value="COMPUTER_LAB">Computer Lab</option><option value="LIBRARY">Library</option><option value="HALL">Hall</option><option value="GYM">Gym</option><option value="STAFF_ROOM">Staff Room</option></select>
              <input className="fi" type="number" placeholder="Capacity" value={roomForm.capacity} onChange={e => setRoomForm({ ...roomForm, capacity: e.target.value })} required style={{ width: 100 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">PERIODS</span></div>
            {periods.map(p => (<div key={p.id} className="ri na"><div className="ri-b"><div className="ri-t">#{p.period_order} {p.name}</div><div className="ri-s">{p.start_time} - {p.end_time} · {p.period_type}</div></div>
              <button onClick={() => openEditPeriod(p)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button>
              <button onClick={() => handleArchivePeriod(p.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
            </div>))}
            {periods.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddPeriod} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" type="number" placeholder="Order" value={periodForm.periodOrder} onChange={e => setPeriodForm({ ...periodForm, periodOrder: e.target.value })} required style={{ width: 80 }} />
              <input className="fi" placeholder="Name" value={periodForm.name} onChange={e => setPeriodForm({ ...periodForm, name: e.target.value })} required style={{ flex: 1 }} />
              <select className="fi" value={periodForm.periodType} onChange={e => setPeriodForm({ ...periodForm, periodType: e.target.value })}><option value="LESSON">Lesson</option><option value="BREAK">Break</option><option value="ASSEMBLY">Assembly</option><option value="FREE">Free</option></select>
              <input className="fi" type="time" value={periodForm.startTime} onChange={e => setPeriodForm({ ...periodForm, startTime: e.target.value })} required />
              <input className="fi" type="time" value={periodForm.endTime} onChange={e => setPeriodForm({ ...periodForm, endTime: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">DAYS</span></div>
            {days.map(d => (<div key={d.id} className="ri na"><div className="ri-b"><div className="ri-t">#{d.day_order} {d.name}</div><div className="ri-s">{d.is_school_day ? 'School day' : 'Non-school day'}</div></div>
              <button onClick={() => openEditDay(d)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button>
              <button onClick={() => handleArchiveDay(d.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
            </div>))}
            {days.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddDay} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" type="number" placeholder="Order" value={dayForm.dayOrder} onChange={e => setDayForm({ ...dayForm, dayOrder: e.target.value })} required style={{ width: 80 }} />
              <input className="fi" placeholder="Monday" value={dayForm.name} onChange={e => setDayForm({ ...dayForm, name: e.target.value })} required style={{ flex: 1 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={dayForm.isSchoolDay} onChange={e => setDayForm({ ...dayForm, isSchoolDay: e.target.checked })} /> School day</label>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'conflicts' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card">
            <div className="ch" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="ch-t">{showResolved ? 'ALL CONFLICTS' : 'UNRESOLVED CONFLICTS'}</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 400 }}><input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} /> Show resolved</label>
            </div>
            {conflicts.map(c => (<div key={c.id} className="ri na"><div className="ri-b"><div className="ri-t">{c.conflict_type}</div><div className="ri-s">Detected {new Date(c.detected_at).toLocaleString()}</div></div>
              {c.resolved ? <span className="bdg bok">Resolved</span> : <button onClick={() => handleResolveConflict(c.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--okB)', color: 'var(--ok)', fontWeight: 600 }}>Mark Resolved</button>}
            </div>))}
            {conflicts.length === 0 && <div className="ri na"><div className="ri-s">No conflicts — schedule is clean. ✓</div></div>}
          </div>
          <div className="alert al-in" style={{ marginTop: 16 }}><span className="al-ic">ℹ️</span><div>Substitutions are managed per timetable entry — click any lesson in the Timetable tab to add a substitute teacher.</div></div>
        </div>
      )}

      {tab === 'events' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card">
            <div className="ch"><span className="ch-t">CALENDAR EVENTS</span></div>
            {events.map(e => (<div key={e.id} className="ri na"><div className="ri-b"><div className="ri-t">{e.name}</div><div className="ri-s">{e.event_type} · {e.start_date} → {e.end_date} {e.is_blackout && '· Blackout'} {e.description && `· ${e.description}`}</div></div>
              <button onClick={() => openEditEvent(e)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button>
              <button onClick={() => handleArchiveEvent(e.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
            </div>))}
            {events.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddEvent} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={eventForm.eventType} onChange={e => setEventForm({ ...eventForm, eventType: e.target.value })}><option value="ACTIVITY">Activity</option><option value="EXAM">Exam</option><option value="HOLIDAY">Holiday</option><option value="TERM_START">Term Start</option><option value="TERM_END">Term End</option></select>
              <input className="fi" placeholder="Name" value={eventForm.name} onChange={e => setEventForm({ ...eventForm, name: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" placeholder="Description" value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} style={{ flex: 1 }} />
              <input className="fi" type="date" value={eventForm.startDate} onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })} required />
              <input className="fi" type="date" value={eventForm.endDate} onChange={e => setEventForm({ ...eventForm, endDate: e.target.value })} required />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={eventForm.isBlackout} onChange={e => setEventForm({ ...eventForm, isBlackout: e.target.checked })} /> Blackout (no lessons)</label>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'locks' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">SCHEDULE LOCKS</span></div>
            {locks.map(l => (<div key={l.id} className="ri na"><div className="ri-b"><div className="ri-t">{yearLabel(l.academic_year_id)} · {termLabel(l.term_id)}</div><div className="ri-s">Locked {new Date(l.locked_at).toLocaleDateString()} {l.unlocked_by && `· Unlocked: ${l.unlock_reason}`}</div></div>
              <span className={`bdg ${l.unlocked_by ? 'bok' : 'ber'}`} style={{ marginRight: 8 }}>{l.unlocked_by ? 'Unlocked' : 'Locked'}</span>
              {!l.unlocked_by && (<div style={{ display: 'flex', gap: 6 }}><input className="fi" placeholder="Reason" value={unlockReason[l.id] || ''} onChange={e => setUnlockReason({ ...unlockReason, [l.id]: e.target.value })} style={{ width: 140, fontSize: 11 }} /><button onClick={() => handleUnlock(l.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Unlock</button></div>)}
            </div>))}
            {locks.length === 0 && <div className="ri na"><div className="ri-s">No locks yet — schedule is fully editable.</div></div>}
            <form onSubmit={handleLockSchedule} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={lockForm.academicYearId} onChange={e => setLockForm({ ...lockForm, academicYearId: e.target.value })} required><option value="">Year...</option>{years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select>
              <select className="fi" value={lockForm.termId} onChange={e => setLockForm({ ...lockForm, termId: e.target.value })} required><option value="">Term...</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>🔒 Lock Schedule</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">TIMETABLE TEMPLATES</span></div>
            {templates.map(t => (<div key={t.id} className="ri na"><div className="ri-b"><div className="ri-t">{t.name}</div><div className="ri-s">Created {new Date(t.created_at).toLocaleDateString()}</div></div>
              <button onClick={() => openEditTemplate(t)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Rename</button>
              <button onClick={() => handleArchiveTemplate(t.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
            </div>))}
            {templates.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddTemplate} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="2026 Term 2 Standard Template" value={templateForm.name} onChange={e => setTemplateForm({ name: e.target.value })} required style={{ flex: 1 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Save Current as Template</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'exams' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card">
            <div className="ch"><span className="ch-t">EXAM SLOTS</span></div>
            {examSlots.map(e => (<div key={e.id} className="ri na"><div className="ri-b"><div className="ri-t">{nameOf(classes, e.class_id)} · {nameOf(subjects, e.subject_id)}</div><div className="ri-s">{nameOf(rooms, e.room_id)} · {e.exam_date} {e.start_time} · {e.duration_minutes}min</div></div>
              <button onClick={() => openEditExamSlot(e)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button>
              <button onClick={() => handleArchiveExamSlot(e.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
            </div>))}
            {examSlots.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddExamSlot} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={examForm.termId} onChange={e => setExamForm({ ...examForm, termId: e.target.value })} required><option value="">Term...</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <select className="fi" value={examForm.classId} onChange={e => setExamForm({ ...examForm, classId: e.target.value })} required><option value="">Class...</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select className="fi" value={examForm.subjectId} onChange={e => setExamForm({ ...examForm, subjectId: e.target.value })} required><option value="">Subject...</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <select className="fi" value={examForm.roomId} onChange={e => setExamForm({ ...examForm, roomId: e.target.value })} required><option value="">Room...</option>{rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
              <select className="fi" value={examForm.invigilatorId} onChange={e => setExamForm({ ...examForm, invigilatorId: e.target.value })}><option value="">Invigilator (optional)...</option>{staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <input className="fi" type="date" value={examForm.examDate} onChange={e => setExamForm({ ...examForm, examDate: e.target.value })} required />
              <input className="fi" type="time" value={examForm.startTime} onChange={e => setExamForm({ ...examForm, startTime: e.target.value })} required />
              <input className="fi" type="number" placeholder="Minutes" value={examForm.durationMinutes} onChange={e => setExamForm({ ...examForm, durationMinutes: e.target.value })} required style={{ width: 100 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Schedule Exam</button>
            </form>
          </div>
        </div>
      )}

      {viewingEntry && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setViewingEntry(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 420, maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 4 }}>{nameOf(subjects, viewingEntry.subject_id)}</h3>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>{nameOf(classes, viewingEntry.class_id)} · {staffName(viewingEntry.teacher_id)} · {nameOf(rooms, viewingEntry.room_id)} · {nameOf(days, viewingEntry.day_id)} {nameOf(periods, viewingEntry.period_id)}</div>

            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>SUBSTITUTIONS</div>
            {substitutions.map(s => (<div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{s.date}</div><div className="ri-s">{s.substitute_teacher_id ? staffName(s.substitute_teacher_id) : 'Free period'} · {s.reason || '—'}</div></div>
              <span className={`bdg ${s.status === 'COVERED' ? 'bok' : s.status === 'CANCELLED' ? 'ber' : 'bwn'}`} style={{ marginRight: 8 }}>{s.status}</span>
              {s.status !== 'CANCELLED' && <button onClick={() => handleCancelSubstitution(s.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Cancel</button>}
            </div>))}
            {substitutions.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12, padding: 8 }}>None yet.</div>}
            <form onSubmit={handleAddSubstitution} style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              <select className="fi" value={subForm.substituteTeacherId} onChange={e => setSubForm({ ...subForm, substituteTeacherId: e.target.value })} style={{ fontSize: 12 }}><option value="">Free period (no substitute)...</option>{staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              <input className="fi" type="date" value={subForm.date} onChange={e => setSubForm({ ...subForm, date: e.target.value })} required style={{ fontSize: 12 }} />
              <input className="fi" placeholder="Reason" value={subForm.reason} onChange={e => setSubForm({ ...subForm, reason: e.target.value })} style={{ fontSize: 12, flex: 1 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '7px 12px', borderRadius: 'var(--rS)', fontSize: 11, fontWeight: 600 }}>Add</button>
            </form>

            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>REVISION HISTORY</div>
            {revisions.map(r => (<div key={r.id} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--bd)' }}>{r.change_type} · {new Date(r.changed_at).toLocaleString()} {r.change_reason && `· ${r.change_reason}`}</div>))}
            {revisions.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12, padding: 8 }}>No revisions yet.</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => handleArchiveEntry(viewingEntry.id)} style={{ flex: 1, background: 'var(--erB)', color: 'var(--er)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Remove Lesson</button>
              <button onClick={() => setViewingEntry(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {editingRoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingRoom(null)}>
          <form onSubmit={handleSaveRoom} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 340, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Room</h3>
            <div className="fg"><label className="fl">NAME</label><input className="fi" value={roomEditForm.name} onChange={e => setRoomEditForm({ ...roomEditForm, name: e.target.value })} required /></div>
            <div className="fg"><label className="fl">CAPACITY</label><input className="fi" type="number" value={roomEditForm.capacity} onChange={e => setRoomEditForm({ ...roomEditForm, capacity: e.target.value })} required /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={roomEditForm.isActive} onChange={e => setRoomEditForm({ ...roomEditForm, isActive: e.target.checked })} /> Active</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingRoom(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingPeriod && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingPeriod(null)}>
          <form onSubmit={handleSavePeriod} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Period</h3>
            <div className="fg"><label className="fl">NAME</label><input className="fi" value={periodEditForm.name} onChange={e => setPeriodEditForm({ ...periodEditForm, name: e.target.value })} required /></div>
            <div className="fg"><label className="fl">ORDER</label><input className="fi" type="number" value={periodEditForm.periodOrder} onChange={e => setPeriodEditForm({ ...periodEditForm, periodOrder: e.target.value })} /></div>
            <div className="fg"><label className="fl">TYPE</label><select className="fi" value={periodEditForm.periodType} onChange={e => setPeriodEditForm({ ...periodEditForm, periodType: e.target.value })}><option value="LESSON">Lesson</option><option value="BREAK">Break</option><option value="ASSEMBLY">Assembly</option><option value="FREE">Free</option></select></div>
            <div className="fg"><label className="fl">START</label><input className="fi" type="time" value={periodEditForm.startTime} onChange={e => setPeriodEditForm({ ...periodEditForm, startTime: e.target.value })} required /></div>
            <div className="fg"><label className="fl">END</label><input className="fi" type="time" value={periodEditForm.endTime} onChange={e => setPeriodEditForm({ ...periodEditForm, endTime: e.target.value })} required /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingPeriod(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingDay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingDay(null)}>
          <form onSubmit={handleSaveDay} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Day</h3>
            <div className="fg"><label className="fl">NAME</label><input className="fi" value={dayEditForm.name} onChange={e => setDayEditForm({ ...dayEditForm, name: e.target.value })} required /></div>
            <div className="fg"><label className="fl">ORDER</label><input className="fi" type="number" value={dayEditForm.dayOrder} onChange={e => setDayEditForm({ ...dayEditForm, dayOrder: e.target.value })} /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={dayEditForm.isSchoolDay} onChange={e => setDayEditForm({ ...dayEditForm, isSchoolDay: e.target.checked })} /> School day</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingDay(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingEvent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingEvent(null)}>
          <form onSubmit={handleSaveEvent} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 380, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Event</h3>
            <div className="fg"><label className="fl">NAME</label><input className="fi" value={eventEditForm.name} onChange={e => setEventEditForm({ ...eventEditForm, name: e.target.value })} required /></div>
            <div className="fg"><label className="fl">DESCRIPTION</label><input className="fi" value={eventEditForm.description} onChange={e => setEventEditForm({ ...eventEditForm, description: e.target.value })} /></div>
            <div className="fg"><label className="fl">START DATE</label><input className="fi" type="date" value={eventEditForm.startDate} onChange={e => setEventEditForm({ ...eventEditForm, startDate: e.target.value })} required /></div>
            <div className="fg"><label className="fl">END DATE</label><input className="fi" type="date" value={eventEditForm.endDate} onChange={e => setEventEditForm({ ...eventEditForm, endDate: e.target.value })} required /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={eventEditForm.isBlackout} onChange={e => setEventEditForm({ ...eventEditForm, isBlackout: e.target.checked })} /> Blackout</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingEvent(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingTemplate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingTemplate(null)}>
          <form onSubmit={handleSaveTemplate} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 340, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Rename Template</h3>
            <div className="fg"><label className="fl">NAME</label><input className="fi" value={templateEditForm.name} onChange={e => setTemplateEditForm({ name: e.target.value })} required /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingTemplate(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingExamSlot && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingExamSlot(null)}>
          <form onSubmit={handleSaveExamSlot} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 380, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Exam Slot</h3>
            {editError && <div className="alert al-er" style={{ marginBottom: 12 }}><span className="al-ic">⚠️</span><div>{editError}</div></div>}
            <div className="fg"><label className="fl">ROOM</label><select className="fi" value={examEditForm.roomId} onChange={e => setExamEditForm({ ...examEditForm, roomId: e.target.value })}>{rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
            <div className="fg"><label className="fl">DATE</label><input className="fi" type="date" value={examEditForm.examDate} onChange={e => setExamEditForm({ ...examEditForm, examDate: e.target.value })} required /></div>
            <div className="fg"><label className="fl">START TIME</label><input className="fi" type="time" value={examEditForm.startTime} onChange={e => setExamEditForm({ ...examEditForm, startTime: e.target.value })} required /></div>
            <div className="fg"><label className="fl">DURATION (MIN)</label><input className="fi" type="number" value={examEditForm.durationMinutes} onChange={e => setExamEditForm({ ...examEditForm, durationMinutes: e.target.value })} /></div>
            <div className="fg"><label className="fl">INVIGILATOR</label><select className="fi" value={examEditForm.invigilatorId} onChange={e => setExamEditForm({ ...examEditForm, invigilatorId: e.target.value })}><option value="">None...</option>{staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingExamSlot(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
