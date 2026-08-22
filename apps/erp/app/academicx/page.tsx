'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import { authedFetch } from '../../lib/api';

const TABS = [
  { key: 'years', label: 'Years & Terms' },
  { key: 'classes', label: 'Classes & Streams' },
  { key: 'subjects', label: 'Departments & Subjects' },
  { key: 'links', label: 'Subject Linkages' },
  { key: 'curriculum', label: 'Curriculum & Outcomes' },
  { key: 'promotion', label: 'Promotion Rules' },
];

export default function AcademicXPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [tab, setTab] = useState('years');
  const [error, setError] = useState('');

  const [years, setYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [classTeachers, setClassTeachers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<any[]>([]);
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [streamSubjects, setStreamSubjects] = useState<any[]>([]);
  const [subjectGroups, setSubjectGroups] = useState<any[]>([]);
  const [curricula, setCurricula] = useState<any[]>([]);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [promotionRules, setPromotionRules] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);

  const [yearForm, setYearForm] = useState({ name: '', startDate: '', endDate: '' });
  const [termForm, setTermForm] = useState({ academicYearId: '', name: '', termOrder: 1, startDate: '', endDate: '' });
  const [classForm, setClassForm] = useState({ name: '', code: '', levelOrder: 1 });
  const [streamForm, setStreamForm] = useState({ classId: '', name: '', code: '', capacity: 35 });
  const [classTeacherForm, setClassTeacherForm] = useState({ classId: '', streamId: '', staffId: '', academicYearId: '' });
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [subjectForm, setSubjectForm] = useState({ departmentId: '', name: '', code: '', subjectType: 'CORE', creditHours: 4 });
  const [assignForm, setAssignForm] = useState({ staffId: '', subjectId: '', academicYearId: '' });
  const [classSubForm, setClassSubForm] = useState({ classId: '', subjectId: '', isCompulsory: true });
  const [streamSubForm, setStreamSubForm] = useState({ streamId: '', subjectId: '', isCompulsory: true });
  const [groupForm, setGroupForm] = useState({ name: '', groupType: 'ELECTIVE', maxSelections: 2, minSelections: 1 });
  const [curriculumForm, setCurriculumForm] = useState({ subjectId: '', classId: '', termId: '', title: '', description: '' });
  const [outcomeForm, setOutcomeForm] = useState({ subjectId: '', classId: '', outcome: '', strand: '' });
  const [ruleForm, setRuleForm] = useState({ fromClassId: '', toClassId: '', minGpa: '', minAttendancePct: '', maxFailedSubjects: '', requiresManualApproval: false });

  const [managingCurriculum, setManagingCurriculum] = useState<any>(null);
  const [editingCurriculum, setEditingCurriculum] = useState<any>(null);
  const [curriculumEditForm, setCurriculumEditForm] = useState({ title: '', description: '' });
  const [topics, setTopics] = useState<any[]>([]);
  const [topicForm, setTopicForm] = useState({ title: '', topicOrder: 1, weekStart: '', weekEnd: '', description: '' });
  const [managingTopic, setManagingTopic] = useState<any>(null);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [objectiveForm, setObjectiveForm] = useState({ objective: '', objectiveOrder: 1 });

  const [editingYear, setEditingYear] = useState<any>(null);
  const [yearEditForm, setYearEditForm] = useState({ name: '', startDate: '', endDate: '' });
  const [editingTerm, setEditingTerm] = useState<any>(null);
  const [termEditForm, setTermEditForm] = useState({ name: '', termOrder: 1, startDate: '', endDate: '' });
  const [editingClass, setEditingClass] = useState<any>(null);
  const [classEditForm, setClassEditForm] = useState({ name: '', code: '', levelOrder: 1 });
  const [editingStream, setEditingStream] = useState<any>(null);
  const [streamEditForm, setStreamEditForm] = useState({ name: '', code: '', capacity: 35 });
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deptEditForm, setDeptEditForm] = useState({ name: '', code: '' });
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [subjectEditForm, setSubjectEditForm] = useState({ name: '', code: '', subjectType: 'CORE', creditHours: 4 });

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
    authedFetch('/api/v1/academic/years', t).then(d => Array.isArray(d) ? setYears(d) : setError(d?.error));
    authedFetch('/api/v1/academic/terms', t).then(d => Array.isArray(d) && setTerms(d));
    authedFetch('/api/v1/academic/classes', t).then(d => Array.isArray(d) && setClasses(d));
    authedFetch('/api/v1/academic/streams', t).then(d => Array.isArray(d) && setStreams(d));
    authedFetch('/api/v1/academic/class-teachers', t).then(d => Array.isArray(d) && setClassTeachers(d));
    authedFetch('/api/v1/academic/departments', t).then(d => Array.isArray(d) && setDepartments(d));
    authedFetch('/api/v1/academic/subjects', t).then(d => Array.isArray(d) && setSubjects(d));
    authedFetch('/api/v1/academic/subject-assignments', t).then(d => Array.isArray(d) && setSubjectAssignments(d));
    authedFetch('/api/v1/academic/class-subjects', t).then(d => Array.isArray(d) && setClassSubjects(d));
    authedFetch('/api/v1/academic/stream-subjects', t).then(d => Array.isArray(d) && setStreamSubjects(d));
    authedFetch('/api/v1/academic/subject-groups', t).then(d => Array.isArray(d) && setSubjectGroups(d));
    authedFetch('/api/v1/academic/curricula', t).then(d => Array.isArray(d) && setCurricula(d));
    authedFetch('/api/v1/academic/outcomes', t).then(d => Array.isArray(d) && setOutcomes(d));
    authedFetch('/api/v1/academic/promotion-rules', t).then(d => Array.isArray(d) && setPromotionRules(d));
    authedFetch('/api/v1/system/users', t).then(d => Array.isArray(d) && setStaffUsers(d));
  }

  // Years
  async function handleAddYear(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/academic/years', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(yearForm) }); setYearForm({ name: '', startDate: '', endDate: '' }); loadAll(token); }
  async function handleActivateYear(id: string) { await authedFetch(`/api/v1/academic/years/${id}/activate`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleArchiveYear(id: string) { await authedFetch(`/api/v1/academic/years/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  function openEditYear(y: any) { setEditingYear(y); setYearEditForm({ name: y.name, startDate: y.start_date, endDate: y.end_date }); }
  async function handleSaveYear(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/academic/years/${editingYear.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(yearEditForm) }); setEditingYear(null); loadAll(token); }
  // Terms
  async function handleAddTerm(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/academic/terms', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(termForm) }); setTermForm({ academicYearId: '', name: '', termOrder: 1, startDate: '', endDate: '' }); loadAll(token); }
  async function handleArchiveTerm(id: string) { await authedFetch(`/api/v1/academic/terms/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  function openEditTerm(t: any) { setEditingTerm(t); setTermEditForm({ name: t.name, termOrder: t.term_order, startDate: t.start_date, endDate: t.end_date }); }
  async function handleSaveTerm(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/academic/terms/${editingTerm.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(termEditForm) }); setEditingTerm(null); loadAll(token); }
  // Classes
  async function handleAddClass(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/academic/classes', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(classForm) }); setClassForm({ name: '', code: '', levelOrder: 1 }); loadAll(token); }
  async function handleArchiveClass(id: string) { await authedFetch(`/api/v1/academic/classes/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  function openEditClass(c: any) { setEditingClass(c); setClassEditForm({ name: c.name, code: c.code, levelOrder: c.level_order }); }
  async function handleSaveClass(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/academic/classes/${editingClass.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(classEditForm) }); setEditingClass(null); loadAll(token); }
  // Streams
  async function handleAddStream(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/academic/streams', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(streamForm) }); setStreamForm({ classId: '', name: '', code: '', capacity: 35 }); loadAll(token); }
  async function handleArchiveStream(id: string) { await authedFetch(`/api/v1/academic/streams/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  function openEditStream(s: any) { setEditingStream(s); setStreamEditForm({ name: s.name, code: s.code, capacity: s.capacity }); }
  async function handleSaveStream(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/academic/streams/${editingStream.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(streamEditForm) }); setEditingStream(null); loadAll(token); }
  // Class Teachers
  async function handleAddClassTeacher(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/academic/class-teachers', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(classTeacherForm) }); setClassTeacherForm({ classId: '', streamId: '', staffId: '', academicYearId: '' }); loadAll(token); }
  async function handleArchiveClassTeacher(id: string) { await authedFetch(`/api/v1/academic/class-teachers/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  // Departments
  async function handleAddDept(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/academic/departments', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deptForm) }); setDeptForm({ name: '', code: '' }); loadAll(token); }
  async function handleArchiveDept(id: string) { await authedFetch(`/api/v1/academic/departments/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  function openEditDept(d: any) { setEditingDept(d); setDeptEditForm({ name: d.name, code: d.code }); }
  async function handleSaveDept(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/academic/departments/${editingDept.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deptEditForm) }); setEditingDept(null); loadAll(token); }
  // Subjects
  async function handleAddSubject(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/academic/subjects', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subjectForm) }); setSubjectForm({ departmentId: '', name: '', code: '', subjectType: 'CORE', creditHours: 4 }); loadAll(token); }
  async function handleArchiveSubject(id: string) { await authedFetch(`/api/v1/academic/subjects/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  function openEditSubject(s: any) { setEditingSubject(s); setSubjectEditForm({ name: s.name, code: s.code, subjectType: s.subject_type, creditHours: s.credit_hours }); }
  async function handleSaveSubject(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/academic/subjects/${editingSubject.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subjectEditForm) }); setEditingSubject(null); loadAll(token); }
  // Linkages
  async function handleAddAssignment(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/academic/subject-assignments', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(assignForm) }); setAssignForm({ staffId: '', subjectId: '', academicYearId: '' }); loadAll(token); }
  async function handleArchiveAssignment(id: string) { await authedFetch(`/api/v1/academic/subject-assignments/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddClassSub(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/academic/class-subjects', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(classSubForm) }); setClassSubForm({ classId: '', subjectId: '', isCompulsory: true }); loadAll(token); }
  async function handleArchiveClassSub(id: string) { await authedFetch(`/api/v1/academic/class-subjects/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddStreamSub(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/academic/stream-subjects', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(streamSubForm) }); setStreamSubForm({ streamId: '', subjectId: '', isCompulsory: true }); loadAll(token); }
  async function handleArchiveStreamSub(id: string) { await authedFetch(`/api/v1/academic/stream-subjects/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function handleAddGroup(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/academic/subject-groups', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(groupForm) }); setGroupForm({ name: '', groupType: 'ELECTIVE', maxSelections: 2, minSelections: 1 }); loadAll(token); }
  async function handleArchiveGroup(id: string) { await authedFetch(`/api/v1/academic/subject-groups/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  // Curriculum
  async function handleAddCurriculum(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/academic/curricula', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(curriculumForm) }); setCurriculumForm({ subjectId: '', classId: '', termId: '', title: '', description: '' }); loadAll(token); }
  async function handleArchiveCurriculum(id: string) { await authedFetch(`/api/v1/academic/curricula/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  async function openManageCurriculum(c: any) {
    setManagingCurriculum(c);
    const t = await authedFetch(`/api/v1/academic/curricula/${c.id}/topics`, token);
    setTopics(Array.isArray(t) ? t : []);
  }
  async function handleAddTopic(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch(`/api/v1/academic/curricula/${managingCurriculum.id}/topics`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(topicForm) });
    setTopicForm({ title: '', topicOrder: 1, weekStart: '', weekEnd: '', description: '' });
    const t = await authedFetch(`/api/v1/academic/curricula/${managingCurriculum.id}/topics`, token);
    setTopics(Array.isArray(t) ? t : []);
  }
  async function handleArchiveTopic(id: string) {
    await authedFetch(`/api/v1/academic/topics/${id}/archive`, token, { method: 'PATCH' });
    const t = await authedFetch(`/api/v1/academic/curricula/${managingCurriculum.id}/topics`, token);
    setTopics(Array.isArray(t) ? t : []);
  }
  async function openManageTopic(top: any) {
    setManagingTopic(top);
    const o = await authedFetch(`/api/v1/academic/topics/${top.id}/objectives`, token);
    setObjectives(Array.isArray(o) ? o : []);
  }
  async function handleAddObjective(e: React.FormEvent) {
    e.preventDefault();
    await authedFetch(`/api/v1/academic/topics/${managingTopic.id}/objectives`, token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(objectiveForm) });
    setObjectiveForm({ objective: '', objectiveOrder: 1 });
    const o = await authedFetch(`/api/v1/academic/topics/${managingTopic.id}/objectives`, token);
    setObjectives(Array.isArray(o) ? o : []);
  }
  async function handleArchiveObjective(id: string) {
    await authedFetch(`/api/v1/academic/objectives/${id}/archive`, token, { method: 'PATCH' });
    const o = await authedFetch(`/api/v1/academic/topics/${managingTopic.id}/objectives`, token);
    setObjectives(Array.isArray(o) ? o : []);
  }
  // Outcomes
  async function handleAddOutcome(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/academic/outcomes', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(outcomeForm) }); setOutcomeForm({ subjectId: '', classId: '', outcome: '', strand: '' }); loadAll(token); }
  async function handleArchiveOutcome(id: string) { await authedFetch(`/api/v1/academic/outcomes/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }
  // Promotion
  async function handleAddRule(e: React.FormEvent) { e.preventDefault(); await authedFetch('/api/v1/academic/promotion-rules', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ruleForm) }); setRuleForm({ fromClassId: '', toClassId: '', minGpa: '', minAttendancePct: '', maxFailedSubjects: '', requiresManualApproval: false }); loadAll(token); }
  async function handleArchiveRule(id: string) { await authedFetch(`/api/v1/academic/promotion-rules/${id}/archive`, token, { method: 'PATCH' }); loadAll(token); }

  function nameOf(list: any[], id: string, field = 'name') { return list.find(x => x.id === id)?.[field] || id?.slice(0, 8) || '—'; }
  function staffName(id: string) { const u = staffUsers.find(s => s.id === id); return u ? u.name : id?.slice(0, 8) || '—'; }

  async function handleSaveCurriculum(e: React.FormEvent) { e.preventDefault(); await authedFetch(`/api/v1/academic/curricula/${editingCurriculum.id}`, token, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(curriculumEditForm) }); setEditingCurriculum(null); loadAll(token); }

  if (error) return <AppShell user={user}><div style={{ padding: 40, color: 'var(--er)' }}>{error}</div></AppShell>;

  return (
    <AppShell user={user} schoolName={school?.name}>
      <div className="ph">
        <div className="ph-row">
          <div>
            <div className="ph-ey">SUKUU ERP · ACADEMICX · 16 TABLES · sukuux SCHEMA</div>
            <div className="ph-title">🎓 AcademicX</div>
            <div className="ph-sub">Years · Terms · Classes · Streams · Subjects · Curriculum · Promotion Rules · CRUAA enforced</div>
          </div>
        </div>
      </div>

      <div className="fx-overview">
        <div className="stat-grid">
          <button className="fx-card-btn" onClick={() => setTab('years')}>
            <div className="sc" title="Academic years marked is_active, out of all years on record for this school">
              <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--inB)' }}>📅</div></div>
              <div className="sc-val">{years.filter((y: any) => y.is_active).length}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}> / {years.length}</span></div>
              <div className="sc-lbl">ACTIVE YEARS</div>
            </div>
          </button>
          <button className="fx-card-btn" onClick={() => setTab('classes')}>
            <div className="sc" title="Classes marked is_active, out of all classes on record">
              <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--okB)' }}>🏫</div></div>
              <div className="sc-val">{classes.filter((c: any) => c.is_active).length}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}> / {classes.length}</span></div>
              <div className="sc-lbl">ACTIVE CLASSES</div>
            </div>
          </button>
          <button className="fx-card-btn" onClick={() => setTab('subjects')}>
            <div className="sc" title="Subjects marked is_active, out of all subjects on record">
              <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--puB)' }}>📚</div></div>
              <div className="sc-val">{subjects.filter((s: any) => s.is_active).length}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}> / {subjects.length}</span></div>
              <div className="sc-lbl">ACTIVE SUBJECTS</div>
            </div>
          </button>
          <button className="fx-card-btn" onClick={() => setTab('subjects')}>
            <div className="sc" title="Departments on record for this school">
              <div className="sc-top"><div className="sc-icon" style={{ background: 'var(--goldF)' }}>🏛️</div></div>
              <div className="sc-val">{departments.length}</div>
              <div className="sc-lbl">DEPARTMENTS</div>
            </div>
          </button>
        </div>
      </div>

      <div className="sys-tabs">
        {TABS.map(t => <button key={t.key} className={`sys-tab-btn${tab === t.key ? ' act' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'years' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">ACADEMIC YEARS</span></div>
            {years.map(y => (
              <div key={y.id} className="ri na"><div className="ri-b"><div className="ri-t">{y.name}</div><div className="ri-s">{y.start_date} → {y.end_date}</div></div>
                <span className={`bdg ${y.is_active ? 'bok' : 'ber'}`} style={{ marginRight: 8 }}>{y.is_active ? 'Active' : 'Inactive'}</span>
                <button onClick={() => openEditYear(y)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button>
                {!y.is_active && <button onClick={() => handleActivateYear(y.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--okB)', color: 'var(--ok)', fontWeight: 600, marginRight: 6 }}>Activate</button>}
                <button onClick={() => handleArchiveYear(y.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {years.length === 0 && <div className="ri na"><div className="ri-s">No academic years yet.</div></div>}
            <form onSubmit={handleAddYear} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="2026/2027" value={yearForm.name} onChange={e => setYearForm({ ...yearForm, name: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" type="date" value={yearForm.startDate} onChange={e => setYearForm({ ...yearForm, startDate: e.target.value })} required />
              <input className="fi" type="date" value={yearForm.endDate} onChange={e => setYearForm({ ...yearForm, endDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">TERMS</span></div>
            {terms.map(t => (
              <div key={t.id} className="ri na"><div className="ri-b"><div className="ri-t">{t.name} (#{t.term_order})</div><div className="ri-s">{nameOf(years, t.academic_year_id)} · {t.start_date} → {t.end_date}</div></div>
                <button onClick={() => openEditTerm(t)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button>
                <button onClick={() => handleArchiveTerm(t.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {terms.length === 0 && <div className="ri na"><div className="ri-s">No terms yet.</div></div>}
            <form onSubmit={handleAddTerm} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={termForm.academicYearId} onChange={e => setTermForm({ ...termForm, academicYearId: e.target.value })} required style={{ flex: 1 }}>
                <option value="">Academic Year…</option>
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
              <input className="fi" placeholder="Term 1" value={termForm.name} onChange={e => setTermForm({ ...termForm, name: e.target.value })} required />
              <input className="fi" type="number" placeholder="#" value={termForm.termOrder} onChange={e => setTermForm({ ...termForm, termOrder: +e.target.value })} style={{ width: 60 }} />
              <input className="fi" type="date" value={termForm.startDate} onChange={e => setTermForm({ ...termForm, startDate: e.target.value })} required />
              <input className="fi" type="date" value={termForm.endDate} onChange={e => setTermForm({ ...termForm, endDate: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'classes' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">CLASSES</span></div>
            {classes.map(c => (
              <div key={c.id} className="ri na"><div className="ri-b"><div className="ri-t">{c.name}</div><div className="ri-s">{c.code} · Level {c.level_order}</div></div>
                <span className={`bdg ${c.is_active ? 'bok' : 'ber'}`} style={{ marginRight: 8 }}>{c.is_active ? 'Active' : 'Inactive'}</span>
                <button onClick={() => openEditClass(c)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button>
                <button onClick={() => handleArchiveClass(c.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {classes.length === 0 && <div className="ri na"><div className="ri-s">No classes yet.</div></div>}
            <form onSubmit={handleAddClass} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="JHS 1" value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" placeholder="JHS1" value={classForm.code} onChange={e => setClassForm({ ...classForm, code: e.target.value })} required />
              <input className="fi" type="number" placeholder="level order" value={classForm.levelOrder} onChange={e => setClassForm({ ...classForm, levelOrder: +e.target.value })} style={{ width: 100 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">STREAMS</span></div>
            {streams.map(s => (
              <div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{s.name}</div><div className="ri-s">{nameOf(classes, s.class_id)} · Cap. {s.capacity}</div></div>
                <button onClick={() => openEditStream(s)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button>
                <button onClick={() => handleArchiveStream(s.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {streams.length === 0 && <div className="ri na"><div className="ri-s">No streams yet.</div></div>}
            <form onSubmit={handleAddStream} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={streamForm.classId} onChange={e => setStreamForm({ ...streamForm, classId: e.target.value })} required style={{ flex: 1 }}>
                <option value="">Class…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className="fi" placeholder="JHS1A" value={streamForm.name} onChange={e => setStreamForm({ ...streamForm, name: e.target.value })} required />
              <input className="fi" placeholder="code" value={streamForm.code} onChange={e => setStreamForm({ ...streamForm, code: e.target.value })} required />
              <input className="fi" type="number" placeholder="capacity" value={streamForm.capacity} onChange={e => setStreamForm({ ...streamForm, capacity: +e.target.value })} style={{ width: 100 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">CLASS TEACHER ASSIGNMENTS</span></div>
            {classTeachers.map(ct => (
              <div key={ct.id} className="ri na"><div className="ri-b"><div className="ri-t">{staffName(ct.staff_id)}</div><div className="ri-s">{nameOf(classes, ct.class_id)} {ct.stream_id ? `· ${nameOf(streams, ct.stream_id)}` : ''}</div></div>
                <button onClick={() => handleArchiveClassTeacher(ct.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {classTeachers.length === 0 && <div className="ri na"><div className="ri-s">No class teacher assignments yet.</div></div>}
            <form onSubmit={handleAddClassTeacher} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={classTeacherForm.classId} onChange={e => setClassTeacherForm({ ...classTeacherForm, classId: e.target.value })} required>
                <option value="">Class…</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="fi" value={classTeacherForm.streamId} onChange={e => setClassTeacherForm({ ...classTeacherForm, streamId: e.target.value })}>
                <option value="">Stream (optional)…</option>{streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select className="fi" value={classTeacherForm.staffId} onChange={e => setClassTeacherForm({ ...classTeacherForm, staffId: e.target.value })} required>
                <option value="">Staff…</option>{staffUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <select className="fi" value={classTeacherForm.academicYearId} onChange={e => setClassTeacherForm({ ...classTeacherForm, academicYearId: e.target.value })} required>
                <option value="">Year…</option>{years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'subjects' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">DEPARTMENTS</span></div>
            {departments.map(d => (
              <div key={d.id} className="ri na"><div className="ri-b"><div className="ri-t">{d.name}</div><div className="ri-s">{d.code}</div></div>
                <button onClick={() => openEditDept(d)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button>
                <button onClick={() => handleArchiveDept(d.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {departments.length === 0 && <div className="ri na"><div className="ri-s">No departments yet.</div></div>}
            <form onSubmit={handleAddDept} style={{ display: 'flex', gap: 8, padding: 12 }}>
              <input className="fi" placeholder="Science" value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} required />
              <input className="fi" placeholder="SCI" value={deptForm.code} onChange={e => setDeptForm({ ...deptForm, code: e.target.value })} required />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">SUBJECTS</span></div>
            {subjects.map(s => (
              <div key={s.id} className="ri na"><div className="ri-b"><div className="ri-t">{s.name}</div><div className="ri-s">{s.code} · {nameOf(departments, s.department_id)} · {s.subject_type}</div></div>
                <button onClick={() => openEditSubject(s)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button>
                <button onClick={() => handleArchiveSubject(s.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {subjects.length === 0 && <div className="ri na"><div className="ri-s">No subjects yet.</div></div>}
            <form onSubmit={handleAddSubject} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={subjectForm.departmentId} onChange={e => setSubjectForm({ ...subjectForm, departmentId: e.target.value })}>
                <option value="">Department…</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input className="fi" placeholder="Mathematics" value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" placeholder="MATH101" value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })} required />
              <select className="fi" value={subjectForm.subjectType} onChange={e => setSubjectForm({ ...subjectForm, subjectType: e.target.value })}>
                <option value="CORE">Core</option><option value="ELECTIVE">Elective</option><option value="EXTRA_CURRICULAR">Extra-curricular</option>
              </select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'links' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">SUBJECT ASSIGNMENTS (TEACHER → SUBJECT)</span></div>
            {subjectAssignments.map(a => (
              <div key={a.id} className="ri na"><div className="ri-b"><div className="ri-t">{staffName(a.staff_id)}</div><div className="ri-s">{nameOf(subjects, a.subject_id)} · {nameOf(years, a.academic_year_id)}</div></div>
                <button onClick={() => handleArchiveAssignment(a.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {subjectAssignments.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddAssignment} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={assignForm.staffId} onChange={e => setAssignForm({ ...assignForm, staffId: e.target.value })} required><option value="">Staff…</option>{staffUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
              <select className="fi" value={assignForm.subjectId} onChange={e => setAssignForm({ ...assignForm, subjectId: e.target.value })} required><option value="">Subject…</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <select className="fi" value={assignForm.academicYearId} onChange={e => setAssignForm({ ...assignForm, academicYearId: e.target.value })} required><option value="">Year…</option>{years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">CLASS ↔ SUBJECT</span></div>
            {classSubjects.map(cs => (
              <div key={cs.id} className="ri na"><div className="ri-b"><div className="ri-t">{nameOf(classes, cs.class_id)}</div><div className="ri-s">{nameOf(subjects, cs.subject_id)} · {cs.is_compulsory ? 'Compulsory' : 'Optional'}</div></div>
                <button onClick={() => handleArchiveClassSub(cs.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {classSubjects.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddClassSub} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={classSubForm.classId} onChange={e => setClassSubForm({ ...classSubForm, classId: e.target.value })} required><option value="">Class…</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select className="fi" value={classSubForm.subjectId} onChange={e => setClassSubForm({ ...classSubForm, subjectId: e.target.value })} required><option value="">Subject…</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={classSubForm.isCompulsory} onChange={e => setClassSubForm({ ...classSubForm, isCompulsory: e.target.checked })} /> Compulsory</label>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">STREAM ↔ SUBJECT</span></div>
            {streamSubjects.map(ss => (
              <div key={ss.id} className="ri na"><div className="ri-b"><div className="ri-t">{nameOf(streams, ss.stream_id)}</div><div className="ri-s">{nameOf(subjects, ss.subject_id)} · {ss.is_compulsory ? 'Compulsory' : 'Optional'}</div></div>
                <button onClick={() => handleArchiveStreamSub(ss.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {streamSubjects.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddStreamSub} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={streamSubForm.streamId} onChange={e => setStreamSubForm({ ...streamSubForm, streamId: e.target.value })} required><option value="">Stream…</option>{streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <select className="fi" value={streamSubForm.subjectId} onChange={e => setStreamSubForm({ ...streamSubForm, subjectId: e.target.value })} required><option value="">Subject…</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={streamSubForm.isCompulsory} onChange={e => setStreamSubForm({ ...streamSubForm, isCompulsory: e.target.checked })} /> Compulsory</label>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">SUBJECT GROUPS (ELECTIVE BUNDLES)</span></div>
            {subjectGroups.map(g => (
              <div key={g.id} className="ri na"><div className="ri-b"><div className="ri-t">{g.name}</div><div className="ri-s">{g.group_type} · select {g.min_selections}–{g.max_selections}</div></div>
                <button onClick={() => handleArchiveGroup(g.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {subjectGroups.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddGroup} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <input className="fi" placeholder="Science Electives" value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} required style={{ flex: 1 }} />
              <input className="fi" type="number" placeholder="min" value={groupForm.minSelections} onChange={e => setGroupForm({ ...groupForm, minSelections: +e.target.value })} style={{ width: 70 }} />
              <input className="fi" type="number" placeholder="max" value={groupForm.maxSelections} onChange={e => setGroupForm({ ...groupForm, maxSelections: +e.target.value })} style={{ width: 70 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'curriculum' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch"><span className="ch-t">CURRICULA</span></div>
            {curricula.map(c => (
              <div key={c.id} className="ri na"><div className="ri-b"><div className="ri-t">{c.title}</div><div className="ri-s">{nameOf(subjects, c.subject_id)} · {nameOf(classes, c.class_id)} · {nameOf(terms, c.term_id)}</div></div>
                <button onClick={() => { setEditingCurriculum(c); setCurriculumEditForm({ title: c.title, description: c.description || '' }); }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--soft)', color: 'var(--ink)', fontWeight: 600, marginRight: 6 }}>Edit</button>
                <button onClick={() => openManageCurriculum(c)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--inB)', color: 'var(--in)', fontWeight: 600, marginRight: 6 }}>Topics</button>
                <button onClick={() => handleArchiveCurriculum(c.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {curricula.length === 0 && <div className="ri na"><div className="ri-s">No curricula yet.</div></div>}
            <form onSubmit={handleAddCurriculum} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={curriculumForm.subjectId} onChange={e => setCurriculumForm({ ...curriculumForm, subjectId: e.target.value })} required><option value="">Subject…</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <select className="fi" value={curriculumForm.classId} onChange={e => setCurriculumForm({ ...curriculumForm, classId: e.target.value })} required><option value="">Class…</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select className="fi" value={curriculumForm.termId} onChange={e => setCurriculumForm({ ...curriculumForm, termId: e.target.value })} required><option value="">Term…</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <input className="fi" placeholder="Title" value={curriculumForm.title} onChange={e => setCurriculumForm({ ...curriculumForm, title: e.target.value })} required style={{ flex: 1 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
          <div className="card">
            <div className="ch"><span className="ch-t">LEARNING OUTCOMES</span></div>
            {outcomes.map(o => (
              <div key={o.id} className="ri na"><div className="ri-b"><div className="ri-t">{o.outcome}</div><div className="ri-s">{nameOf(subjects, o.subject_id)} · {nameOf(classes, o.class_id)} {o.strand ? `· ${o.strand}` : ''}</div></div>
                <button onClick={() => handleArchiveOutcome(o.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {outcomes.length === 0 && <div className="ri na"><div className="ri-s">None yet.</div></div>}
            <form onSubmit={handleAddOutcome} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={outcomeForm.subjectId} onChange={e => setOutcomeForm({ ...outcomeForm, subjectId: e.target.value })} required><option value="">Subject…</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <select className="fi" value={outcomeForm.classId} onChange={e => setOutcomeForm({ ...outcomeForm, classId: e.target.value })} required><option value="">Class…</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <input className="fi" placeholder="Outcome description" value={outcomeForm.outcome} onChange={e => setOutcomeForm({ ...outcomeForm, outcome: e.target.value })} required style={{ flex: 1 }} />
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'promotion' && (
        <div style={{ padding: 'var(--pad)' }}>
          <div className="alert al-in" style={{ marginBottom: 16 }}><span className="al-ic">ℹ️</span><div>Promotion rules govern advancement between class levels at end of year.</div></div>
          <div className="card">
            {promotionRules.map(r => (
              <div key={r.id} className="ri na"><div className="ri-b"><div className="ri-t">{nameOf(classes, r.from_class_id)} → {nameOf(classes, r.to_class_id)}</div><div className="ri-s">Min GPA {r.min_gpa ?? '—'} · Min Attendance {r.min_attendance_pct ?? '—'}% · Max Failed {r.max_failed_subjects ?? '—'}</div></div>
                <span className={`bdg ${r.requires_manual_approval ? 'bwn' : 'bok'}`} style={{ marginRight: 8 }}>{r.requires_manual_approval ? 'Manual' : 'Automatic'}</span>
                <button onClick={() => handleArchiveRule(r.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {promotionRules.length === 0 && <div className="ri na"><div className="ri-s">No promotion rules yet.</div></div>}
            <form onSubmit={handleAddRule} style={{ display: 'flex', gap: 8, padding: 12, flexWrap: 'wrap' }}>
              <select className="fi" value={ruleForm.fromClassId} onChange={e => setRuleForm({ ...ruleForm, fromClassId: e.target.value })} required><option value="">From Class…</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select className="fi" value={ruleForm.toClassId} onChange={e => setRuleForm({ ...ruleForm, toClassId: e.target.value })} required><option value="">To Class…</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <input className="fi" type="number" placeholder="Min GPA" value={ruleForm.minGpa} onChange={e => setRuleForm({ ...ruleForm, minGpa: e.target.value })} style={{ width: 90 }} />
              <input className="fi" type="number" placeholder="Min Att %" value={ruleForm.minAttendancePct} onChange={e => setRuleForm({ ...ruleForm, minAttendancePct: e.target.value })} style={{ width: 90 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><input type="checkbox" checked={ruleForm.requiresManualApproval} onChange={e => setRuleForm({ ...ruleForm, requiresManualApproval: e.target.checked })} /> Manual approval</label>
              <button type="submit" style={{ background: 'var(--navy)', color: 'var(--gold)', padding: '9px 14px', borderRadius: 'var(--rS)', fontSize: 12, fontWeight: 600 }}>Add</button>
            </form>
          </div>
        </div>
      )}

      {managingCurriculum && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setManagingCurriculum(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 420, maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Topics: {managingCurriculum.title}</h3>
            {topics.map(t => (
              <div key={t.id} className="ri na"><div className="ri-b"><div className="ri-t">#{t.topic_order} {t.title}</div><div className="ri-s">Weeks {t.week_start ?? '—'}–{t.week_end ?? '—'}</div></div>
                <button onClick={() => openManageTopic(t)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--inB)', color: 'var(--in)', fontWeight: 600, marginRight: 6 }}>Objectives</button>
                <button onClick={() => handleArchiveTopic(t.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {topics.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12, padding: 8 }}>No topics yet.</div>}
            <form onSubmit={handleAddTopic} style={{ marginTop: 12 }}>
              <div className="fg"><label className="fl">TITLE</label><input className="fi" value={topicForm.title} onChange={e => setTopicForm({ ...topicForm, title: e.target.value })} required /></div>
              <div className="fg"><label className="fl">ORDER</label><input className="fi" type="number" value={topicForm.topicOrder} onChange={e => setTopicForm({ ...topicForm, topicOrder: +e.target.value })} /></div>
              <button type="submit" style={{ width: '100%', background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Add Topic</button>
            </form>
            <button onClick={() => setManagingCurriculum(null)} style={{ marginTop: 12, width: '100%', background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Close</button>
          </div>
        </div>
      )}

      {managingTopic && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 101 }} onClick={() => setManagingTopic(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 380, maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Objectives: {managingTopic.title}</h3>
            {objectives.map(o => (
              <div key={o.id} className="ri na"><div className="ri-b"><div className="ri-t">#{o.objective_order} {o.objective}</div></div>
                <button onClick={() => handleArchiveObjective(o.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--erB)', color: 'var(--er)', fontWeight: 600 }}>Archive</button>
              </div>
            ))}
            {objectives.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12, padding: 8 }}>No objectives yet.</div>}
            <form onSubmit={handleAddObjective} style={{ marginTop: 12 }}>
              <div className="fg"><label className="fl">OBJECTIVE</label><input className="fi" value={objectiveForm.objective} onChange={e => setObjectiveForm({ ...objectiveForm, objective: e.target.value })} required /></div>
              <button type="submit" style={{ width: '100%', background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Add Objective</button>
            </form>
            <button onClick={() => setManagingTopic(null)} style={{ marginTop: 12, width: '100%', background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Close</button>
          </div>
        </div>
      )}

      {editingYear && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingYear(null)}>
          <form onSubmit={handleSaveYear} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Academic Year</h3>
            <div className="fg"><label className="fl">NAME</label><input className="fi" value={yearEditForm.name} onChange={e => setYearEditForm({ ...yearEditForm, name: e.target.value })} required /></div>
            <div className="fg"><label className="fl">START DATE</label><input className="fi" type="date" value={yearEditForm.startDate} onChange={e => setYearEditForm({ ...yearEditForm, startDate: e.target.value })} required /></div>
            <div className="fg"><label className="fl">END DATE</label><input className="fi" type="date" value={yearEditForm.endDate} onChange={e => setYearEditForm({ ...yearEditForm, endDate: e.target.value })} required /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingYear(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingTerm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingTerm(null)}>
          <form onSubmit={handleSaveTerm} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Term</h3>
            <div className="fg"><label className="fl">NAME</label><input className="fi" value={termEditForm.name} onChange={e => setTermEditForm({ ...termEditForm, name: e.target.value })} required /></div>
            <div className="fg"><label className="fl">ORDER</label><input className="fi" type="number" value={termEditForm.termOrder} onChange={e => setTermEditForm({ ...termEditForm, termOrder: +e.target.value })} /></div>
            <div className="fg"><label className="fl">START DATE</label><input className="fi" type="date" value={termEditForm.startDate} onChange={e => setTermEditForm({ ...termEditForm, startDate: e.target.value })} required /></div>
            <div className="fg"><label className="fl">END DATE</label><input className="fi" type="date" value={termEditForm.endDate} onChange={e => setTermEditForm({ ...termEditForm, endDate: e.target.value })} required /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingTerm(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingClass && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingClass(null)}>
          <form onSubmit={handleSaveClass} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Class</h3>
            <div className="fg"><label className="fl">NAME</label><input className="fi" value={classEditForm.name} onChange={e => setClassEditForm({ ...classEditForm, name: e.target.value })} required /></div>
            <div className="fg"><label className="fl">CODE</label><input className="fi" value={classEditForm.code} onChange={e => setClassEditForm({ ...classEditForm, code: e.target.value })} required /></div>
            <div className="fg"><label className="fl">LEVEL ORDER</label><input className="fi" type="number" value={classEditForm.levelOrder} onChange={e => setClassEditForm({ ...classEditForm, levelOrder: +e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingClass(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingStream && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingStream(null)}>
          <form onSubmit={handleSaveStream} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Stream</h3>
            <div className="fg"><label className="fl">NAME</label><input className="fi" value={streamEditForm.name} onChange={e => setStreamEditForm({ ...streamEditForm, name: e.target.value })} required /></div>
            <div className="fg"><label className="fl">CODE</label><input className="fi" value={streamEditForm.code} onChange={e => setStreamEditForm({ ...streamEditForm, code: e.target.value })} required /></div>
            <div className="fg"><label className="fl">CAPACITY</label><input className="fi" type="number" value={streamEditForm.capacity} onChange={e => setStreamEditForm({ ...streamEditForm, capacity: +e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingStream(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingDept && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingDept(null)}>
          <form onSubmit={handleSaveDept} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Department</h3>
            <div className="fg"><label className="fl">NAME</label><input className="fi" value={deptEditForm.name} onChange={e => setDeptEditForm({ ...deptEditForm, name: e.target.value })} required /></div>
            <div className="fg"><label className="fl">CODE</label><input className="fi" value={deptEditForm.code} onChange={e => setDeptEditForm({ ...deptEditForm, code: e.target.value })} required /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingDept(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingSubject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingSubject(null)}>
          <form onSubmit={handleSaveSubject} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Subject</h3>
            <div className="fg"><label className="fl">NAME</label><input className="fi" value={subjectEditForm.name} onChange={e => setSubjectEditForm({ ...subjectEditForm, name: e.target.value })} required /></div>
            <div className="fg"><label className="fl">CODE</label><input className="fi" value={subjectEditForm.code} onChange={e => setSubjectEditForm({ ...subjectEditForm, code: e.target.value })} required /></div>
            <div className="fg"><label className="fl">TYPE</label>
              <select className="fi" value={subjectEditForm.subjectType} onChange={e => setSubjectEditForm({ ...subjectEditForm, subjectType: e.target.value })}>
                <option value="CORE">Core</option><option value="ELECTIVE">Elective</option><option value="EXTRA_CURRICULAR">Extra-curricular</option>
              </select>
            </div>
            <div className="fg"><label className="fl">CREDIT HOURS</label><input className="fi" type="number" value={subjectEditForm.creditHours} onChange={e => setSubjectEditForm({ ...subjectEditForm, creditHours: +e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingSubject(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {editingCurriculum && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,13,52,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditingCurriculum(null)}>
          <form onSubmit={handleSaveCurriculum} onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', padding: 24, borderRadius: 'var(--r)', width: 360, boxShadow: 'var(--shL)' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 16 }}>Edit Curriculum</h3>
            <div className="fg"><label className="fl">TITLE</label><input className="fi" value={curriculumEditForm.title} onChange={e => setCurriculumEditForm({ ...curriculumEditForm, title: e.target.value })} required /></div>
            <div className="fg"><label className="fl">DESCRIPTION</label><input className="fi" value={curriculumEditForm.description} onChange={e => setCurriculumEditForm({ ...curriculumEditForm, description: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" style={{ flex: 1, background: 'var(--navy)', color: 'var(--gold)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Save</button>
              <button type="button" onClick={() => setEditingCurriculum(null)} style={{ flex: 1, background: 'var(--soft)', color: 'var(--ink)', padding: 11, borderRadius: 'var(--rS)', fontWeight: 600 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
