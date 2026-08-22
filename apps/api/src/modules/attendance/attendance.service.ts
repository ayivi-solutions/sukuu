import { prisma } from '../../lib/prisma';

// ── Ownership lookups ──
export async function getSessionSchoolId(id: string) { return (await prisma.attendanceSession.findUnique({ where: { id } }))?.school_id; }
export async function getMarkSchoolId(id: string) { return (await prisma.attendanceStudent.findUnique({ where: { id } }))?.school_id; }
export async function getDeviceSchoolId(id: string) { return (await prisma.attendanceDevice.findUnique({ where: { id } }))?.school_id; }
export async function getEventSchoolId(id: string) { return (await prisma.attendanceEvent.findUnique({ where: { id } }))?.school_id; }
export async function getExceptionSchoolId(id: string) { return (await prisma.attendanceException.findUnique({ where: { id } }))?.school_id; }
export async function getPolicySchoolId(id: string) { return (await prisma.attendancePolicy.findUnique({ where: { id } }))?.school_id; }

// ── Sessions ──
export async function listSessions(schoolId: string, filters: any = {}) {
  return prisma.attendanceSession.findMany({ where: { school_id: schoolId, archived_at: null, ...(filters.classId && { class_id: filters.classId }), ...(filters.sessionDate && { session_date: filters.sessionDate }) }, orderBy: { session_date: 'desc' } });
}
export async function createSession(schoolId: string, data: any) {
  try {
    return await prisma.attendanceSession.create({ data: { school_id: schoolId, academic_year_id: data.academicYearId, term_id: data.termId, class_id: data.classId, stream_id: data.streamId, subject_id: data.subjectId, teacher_id: data.teacherId, day_id: data.dayId, period_id: data.periodId, session_date: data.sessionDate } });
  } catch (err: any) {
    if (err.code === 'P2002') throw new Error('A session already exists for this class/period/date');
    throw err;
  }
}
export async function updateSession(id: string, data: any) { return prisma.attendanceSession.update({ where: { id }, data: { ...(data.sessionDate && { session_date: data.sessionDate }), ...(data.dayId && { day_id: data.dayId }), ...(data.periodId && { period_id: data.periodId }) } }); }
export async function archiveSession(id: string) { return prisma.attendanceSession.update({ where: { id }, data: { archived_at: new Date() } }); }

// ── Student marks ──
export async function listSessionMarks(sessionId: string) { return prisma.attendanceStudent.findMany({ where: { session_id: sessionId, archived_at: null } }); }
export async function markAttendance(sessionId: string, studentId: string, status: string, recordedBy: string) {
  const existing = await prisma.attendanceStudent.findFirst({ where: { session_id: sessionId, student_id: studentId } });
  let mark;
  if (existing) mark = await prisma.attendanceStudent.update({ where: { id: existing.id }, data: { status, recorded_at: new Date(), recorded_by: recordedBy, archived_at: null } });
  else {
    const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error('Session not found');
    mark = await prisma.attendanceStudent.create({ data: { school_id: session.school_id, session_id: sessionId, student_id: studentId, status, recorded_at: new Date(), recorded_by: recordedBy } });
  }
  await recalculateSummary(mark.school_id ?? (await prisma.attendanceSession.findUnique({ where: { id: sessionId } }))!.school_id, studentId);
  return mark;
}
export async function bulkMarkAttendance(sessionId: string, marks: { studentId: string; status: string }[], recordedBy: string) {
  const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error('Session not found');
  const results = [];
  for (const m of marks) {
    const existing = await prisma.attendanceStudent.findFirst({ where: { session_id: sessionId, student_id: m.studentId } });
    let mark;
    if (existing) mark = await prisma.attendanceStudent.update({ where: { id: existing.id }, data: { status: m.status, recorded_at: new Date(), recorded_by: recordedBy, archived_at: null } });
    else mark = await prisma.attendanceStudent.create({ data: { school_id: session.school_id, session_id: sessionId, student_id: m.studentId, status: m.status, recorded_at: new Date(), recorded_by: recordedBy } });
    results.push(mark);
    await recalculateSummary(session.school_id, m.studentId, session.academic_year_id, session.term_id);
  }
  return results;
}
export async function updateMark(id: string, status: string) {
  const mark = await prisma.attendanceStudent.update({ where: { id }, data: { status } });
  const session = await prisma.attendanceSession.findUnique({ where: { id: mark.session_id } });
  if (session) await recalculateSummary(session.school_id, mark.student_id, session.academic_year_id, session.term_id);
  return mark;
}
export async function archiveMark(id: string) { return prisma.attendanceStudent.update({ where: { id }, data: { archived_at: new Date() } }); }
export async function getStudentSessionHistory(studentId: string) { return prisma.attendanceStudent.findMany({ where: { student_id: studentId, archived_at: null }, orderBy: { recorded_at: 'desc' } }); }

// ── Devices ──
export async function listDevices(schoolId: string) { return prisma.attendanceDevice.findMany({ where: { school_id: schoolId } }); }
export async function createDevice(schoolId: string, data: any) { return prisma.attendanceDevice.create({ data: { school_id: schoolId, device_name: data.deviceName, device_type: data.deviceType, location: data.location, ip_address: data.ipAddress, is_active: true } }); }
export async function updateDevice(id: string, data: any) { return prisma.attendanceDevice.update({ where: { id }, data: { ...(data.deviceName && { device_name: data.deviceName }), ...(data.location && { location: data.location }), ...(data.isActive !== undefined && { is_active: data.isActive }) } }); }

// ── Events (raw capture log, append-only) ──
export async function listEvents(schoolId: string, deviceId?: string) { return prisma.attendanceEvent.findMany({ where: { school_id: schoolId, ...(deviceId && { device_id: deviceId }) }, orderBy: { event_time: 'desc' } }); }
export async function recordEvent(schoolId: string, data: any) { return prisma.attendanceEvent.create({ data: { school_id: schoolId, device_id: data.deviceId, person_type: data.personType, person_id: data.personId, event_time: new Date(), event_type: data.eventType } }); }
// Process a captured event into an actual attendance mark for an active session (device-based capture workflow)
export async function processEvent(eventId: string, sessionId: string, recordedBy: string) {
  const event = await prisma.attendanceEvent.findUnique({ where: { id: eventId } });
  if (!event || event.person_type !== 'student') throw new Error('Invalid or non-student event');
  return markAttendance(sessionId, event.person_id, event.event_type === 'check_in' ? 'present' : 'present', recordedBy);
}

// ── Exceptions ──
export async function listExceptions(schoolId: string) { return prisma.attendanceException.findMany({ where: { school_id: schoolId, archived_at: null }, orderBy: { created_at: 'desc' } }); }
export async function createException(schoolId: string, data: any) { return prisma.attendanceException.create({ data: { school_id: schoolId, student_id: data.studentId, session_id: data.sessionId, exception_type: data.exceptionType, approved_by: data.approvedBy, notes: data.notes } }); }
export async function updateException(id: string, data: any) { return prisma.attendanceException.update({ where: { id }, data: { ...(data.exceptionType && { exception_type: data.exceptionType }), ...(data.notes !== undefined && { notes: data.notes }) } }); }
export async function archiveException(id: string) { return prisma.attendanceException.update({ where: { id }, data: { archived_at: new Date() } }); }

// ── Policies ──
export async function listPolicies(schoolId: string) { return prisma.attendancePolicy.findMany({ where: { school_id: schoolId, archived_at: null } }); }
export async function createPolicy(schoolId: string, data: any) { return prisma.attendancePolicy.create({ data: { school_id: schoolId, policy_name: data.policyName, minimum_attendance_percentage: data.minimumAttendancePercentage, late_threshold_minutes: data.lateThresholdMinutes, auto_absent_threshold: data.autoAbsentThreshold, is_active: true } }); }
export async function updatePolicy(id: string, data: any) { return prisma.attendancePolicy.update({ where: { id }, data: { ...(data.policyName && { policy_name: data.policyName }), ...(data.minimumAttendancePercentage !== undefined && { minimum_attendance_percentage: data.minimumAttendancePercentage }), ...(data.lateThresholdMinutes !== undefined && { late_threshold_minutes: data.lateThresholdMinutes }), ...(data.autoAbsentThreshold !== undefined && { auto_absent_threshold: data.autoAbsentThreshold }), ...(data.isActive !== undefined && { is_active: data.isActive }) } }); }
export async function archivePolicy(id: string) { return prisma.attendancePolicy.update({ where: { id }, data: { archived_at: new Date() } }); }

// ── Summary (auto-computed — replaces StudentX manual attendance-summaries) ──
export async function recalculateSummary(schoolId: string, studentId: string, academicYearId?: string, termId?: string) {
  let yearId = academicYearId, tId = termId;
  if (!yearId || !tId) {
    const anyMark = await prisma.attendanceStudent.findFirst({ where: { student_id: studentId }, orderBy: { recorded_at: 'desc' } });
    if (anyMark) {
      const session = await prisma.attendanceSession.findUnique({ where: { id: anyMark.session_id } });
      if (session) { yearId = session.academic_year_id; tId = session.term_id; }
    }
  }
  if (!yearId || !tId) return null;

  const sessionsInPeriod = await prisma.attendanceSession.findMany({ where: { academic_year_id: yearId, term_id: tId, archived_at: null }, select: { id: true } });
  const sessionIds = sessionsInPeriod.map(s => s.id);
  const marks = await prisma.attendanceStudent.findMany({
    where: { student_id: studentId, archived_at: null, session_id: { in: sessionIds } },
  });
  const total = marks.length;
  const present = marks.filter(m => m.status === 'present').length;
  const absent = marks.filter(m => m.status === 'absent').length;
  const late = marks.filter(m => m.status === 'late').length;
  const pct = total > 0 ? ((present + late) / total) * 100 : 0;

  const existing = await prisma.attendanceSummary.findFirst({ where: { school_id: schoolId, student_id: studentId, academic_year_id: yearId, term_id: tId } });
  if (existing) return prisma.attendanceSummary.update({ where: { id: existing.id }, data: { total_sessions: total, present_count: present, absent_count: absent, late_count: late, attendance_percentage: pct } });
  return prisma.attendanceSummary.create({ data: { school_id: schoolId, student_id: studentId, academic_year_id: yearId, term_id: tId, total_sessions: total, present_count: present, absent_count: absent, late_count: late, attendance_percentage: pct } });
}
export async function getStudentSummary(studentId: string) { return prisma.attendanceSummary.findMany({ where: { student_id: studentId }, orderBy: { updated_at: 'desc' } }); }
export async function listClassSummaries(schoolId: string, classId?: string) { return prisma.attendanceSummary.findMany({ where: { school_id: schoolId } }); }

// ── Class roster (for Take Attendance) — joins active enrollment → student ──
export async function getClassRoster(schoolId: string, classId: string, streamId?: string) {
  const enrollments = await prisma.studentsEnrollment.findMany({ where: { school_id: schoolId, class_id: classId, ...(streamId && { stream_id: streamId }), enrollment_status: 'ACTIVE' } });
  const studentIds = enrollments.map(e => e.student_id);
  if (studentIds.length === 0) return [];
  return prisma.studentsStudent.findMany({ where: { id: { in: studentIds }, school_id: schoolId } });
}
