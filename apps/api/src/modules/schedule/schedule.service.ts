import { prisma } from '../../lib/prisma';

// ── Ownership lookups ──
export async function getRoomSchoolId(id: string) { return (await prisma.scheduleRoom.findUnique({ where: { id } }))?.school_id; }
export async function getPeriodSchoolId(id: string) { return (await prisma.schedulePeriod.findUnique({ where: { id } }))?.school_id; }
export async function getDaySchoolId(id: string) { return (await prisma.scheduleDay.findUnique({ where: { id } }))?.school_id; }
export async function getTimetableSchoolId(id: string) { return (await prisma.scheduleTimetable.findUnique({ where: { id } }))?.school_id; }
export async function getEventSchoolId(id: string) { return (await prisma.scheduleCalendarEvent.findUnique({ where: { id } }))?.school_id; }
export async function getLockSchoolId(id: string) { return (await prisma.scheduleLock.findUnique({ where: { id } }))?.school_id; }
export async function getConflictSchoolId(id: string) { return (await prisma.scheduleConflict.findUnique({ where: { id } }))?.school_id; }
export async function getTemplateSchoolId(id: string) { return (await prisma.scheduleTemplate.findUnique({ where: { id } }))?.school_id; }
export async function getExamSlotSchoolId(id: string) { return (await prisma.scheduleExamSlot.findUnique({ where: { id } }))?.school_id; }
export async function getSubstitutionSchoolId(id: string) {
  const s = await prisma.scheduleSubstitution.findUnique({ where: { id } });
  if (!s) return undefined;
  return getTimetableSchoolId(s.timetable_id);
}

// ── Rooms, Periods, Days (foundational setup) ──
export async function listRooms(schoolId: string) { return prisma.scheduleRoom.findMany({ where: { school_id: schoolId } }); }
export async function createRoom(schoolId: string, data: any) { return prisma.scheduleRoom.create({ data: { school_id: schoolId, campus_id: data.campusId, building: data.building, room_code: data.roomCode, name: data.name, room_type: data.roomType, capacity: data.capacity, is_active: true } }); }
export async function updateRoom(id: string, data: any) { return prisma.scheduleRoom.update({ where: { id }, data: { ...(data.name && { name: data.name }), ...(data.capacity !== undefined && { capacity: data.capacity }), ...(data.isActive !== undefined && { is_active: data.isActive }) } }); }

export async function listPeriods(schoolId: string) { return prisma.schedulePeriod.findMany({ where: { school_id: schoolId, archived_at: null }, orderBy: { period_order: 'asc' } }); }
export async function createPeriod(schoolId: string, data: any) { return prisma.schedulePeriod.create({ data: { school_id: schoolId, period_order: data.periodOrder, name: data.name, period_type: data.periodType, start_time: data.startTime, end_time: data.endTime } }); }
export async function archivePeriod(id: string) { return prisma.schedulePeriod.update({ where: { id }, data: { archived_at: new Date() } }); }
export async function updatePeriod(id: string, data: any) { return prisma.schedulePeriod.update({ where: { id }, data: { ...(data.name && { name: data.name }), ...(data.periodOrder !== undefined && { period_order: data.periodOrder }), ...(data.periodType && { period_type: data.periodType }), ...(data.startTime && { start_time: data.startTime }), ...(data.endTime && { end_time: data.endTime }) } }); }

export async function listDays(schoolId: string) { return prisma.scheduleDay.findMany({ where: { school_id: schoolId, archived_at: null }, orderBy: { day_order: 'asc' } }); }
export async function createDay(schoolId: string, data: any) { return prisma.scheduleDay.create({ data: { school_id: schoolId, day_order: data.dayOrder, name: data.name, is_school_day: data.isSchoolDay !== false } }); }
export async function archiveDay(id: string) { return prisma.scheduleDay.update({ where: { id }, data: { archived_at: new Date() } }); }
export async function updateDay(id: string, data: any) { return prisma.scheduleDay.update({ where: { id }, data: { ...(data.name && { name: data.name }), ...(data.dayOrder !== undefined && { day_order: data.dayOrder }), ...(data.isSchoolDay !== undefined && { is_school_day: data.isSchoolDay }) } }); }

// ── Lock check helper ──
async function assertNotLocked(schoolId: string, academicYearId: string, termId: string) {
  const lock = await prisma.scheduleLock.findFirst({ where: { school_id: schoolId, academic_year_id: academicYearId, term_id: termId } });
  if (lock && !lock.unlocked_by) throw new Error('Schedule is locked for this term. Unlock before making changes.');
}

// ── Timetable with real conflict detection ──
export async function listTimetable(schoolId: string) { return prisma.scheduleTimetable.findMany({ where: { school_id: schoolId, is_active: true } }); }

export async function createTimetableEntry(schoolId: string, data: any) {
  await assertNotLocked(schoolId, data.academicYearId, data.termId);

  const classConflict = await prisma.scheduleTimetable.findFirst({ where: { school_id: schoolId, class_id: data.classId, stream_id: data.streamId || null, day_id: data.dayId, period_id: data.periodId, is_active: true } });
  if (classConflict) throw new Error('Class/stream already has a lesson in this period');

  const teacherConflict = await prisma.scheduleTimetable.findFirst({ where: { school_id: schoolId, teacher_id: data.teacherId, day_id: data.dayId, period_id: data.periodId, is_active: true } });
  if (teacherConflict) {
    await prisma.scheduleConflict.create({ data: { school_id: schoolId, conflict_type: 'TEACHER_DOUBLE_BOOKED', timetable_entry_1: teacherConflict.id, timetable_entry_2: 'pending', detected_at: new Date(), resolved: false } });
    throw new Error('Teacher is already scheduled in this period');
  }

  const roomConflict = await prisma.scheduleTimetable.findFirst({ where: { school_id: schoolId, room_id: data.roomId, day_id: data.dayId, period_id: data.periodId, is_active: true } });
  if (roomConflict) {
    await prisma.scheduleConflict.create({ data: { school_id: schoolId, conflict_type: 'ROOM_DOUBLE_BOOKED', timetable_entry_1: roomConflict.id, timetable_entry_2: 'pending', detected_at: new Date(), resolved: false } });
    throw new Error('Room is already booked in this period');
  }

  const entry = await prisma.scheduleTimetable.create({
    data: { school_id: schoolId, academic_year_id: data.academicYearId, term_id: data.termId, class_id: data.classId, stream_id: data.streamId, subject_id: data.subjectId, teacher_id: data.teacherId, room_id: data.roomId, day_id: data.dayId, period_id: data.periodId, is_active: true },
  });
  await prisma.scheduleTeacherSchedule.create({ data: { teacher_id: data.teacherId, timetable_id: entry.id, day_id: data.dayId, period_id: data.periodId, class_id: data.classId, subject_id: data.subjectId } });
  await prisma.scheduleRoomSchedule.create({ data: { room_id: data.roomId, timetable_id: entry.id, day_id: data.dayId, period_id: data.periodId, class_id: data.classId } });
  return entry;
}

export async function updateTimetableEntry(id: string, changedBy: string, data: any) {
  const before = await prisma.scheduleTimetable.findUnique({ where: { id } });
  if (!before) throw new Error('Timetable entry not found');
  await assertNotLocked(before.school_id, before.academic_year_id, before.term_id);
  const after = await prisma.scheduleTimetable.update({ where: { id }, data: { ...(data.roomId && { room_id: data.roomId }), ...(data.teacherId && { teacher_id: data.teacherId }) } });
  await prisma.scheduleRevision.create({ data: { timetable_id: id, change_type: data.roomId ? 'ROOM_CHANGE' : 'TEACHER_CHANGE', before_state: JSON.stringify(before), after_state: JSON.stringify(after), changed_by: changedBy, changed_at: new Date(), change_reason: data.reason } });
  return after;
}

export async function archiveTimetableEntry(id: string, changedBy: string) {
  const before = await prisma.scheduleTimetable.findUnique({ where: { id } });
  if (!before) throw new Error('Timetable entry not found');
  await assertNotLocked(before.school_id, before.academic_year_id, before.term_id);
  const after = await prisma.scheduleTimetable.update({ where: { id }, data: { is_active: false } });
  await prisma.scheduleRevision.create({ data: { timetable_id: id, change_type: 'DELETION', before_state: JSON.stringify(before), after_state: JSON.stringify(after), changed_by: changedBy, changed_at: new Date() } });
  return after;
}

export async function getTeacherSchedule(teacherId: string) { return prisma.scheduleTeacherSchedule.findMany({ where: { teacher_id: teacherId } }); }
export async function getRoomSchedule(roomId: string) { return prisma.scheduleRoomSchedule.findMany({ where: { room_id: roomId } }); }
export async function listRevisions(timetableId: string) { return prisma.scheduleRevision.findMany({ where: { timetable_id: timetableId }, orderBy: { changed_at: 'desc' } }); }

// ── Conflicts (read + resolve) ──
export async function listConflicts(schoolId: string, includeResolved?: boolean) { return prisma.scheduleConflict.findMany({ where: { school_id: schoolId, ...(includeResolved ? {} : { resolved: false }) }, orderBy: { detected_at: 'desc' } }); }
export async function resolveConflict(id: string) { return prisma.scheduleConflict.update({ where: { id }, data: { resolved: true } }); }

// ── Substitutions ──
export async function listSubstitutions(timetableId: string) { return prisma.scheduleSubstitution.findMany({ where: { timetable_id: timetableId } }); }
export async function createSubstitution(timetableId: string, data: any) {
  const timetable = await prisma.scheduleTimetable.findUnique({ where: { id: timetableId } });
  if (!timetable) throw new Error('Timetable entry not found');
  return prisma.scheduleSubstitution.create({ data: { timetable_id: timetableId, original_teacher_id: timetable.teacher_id, substitute_teacher_id: data.substituteTeacherId, date: data.date, reason: data.reason, status: data.substituteTeacherId ? 'COVERED' : 'FREE_PERIOD' } });
}
export async function cancelSubstitution(id: string) { return prisma.scheduleSubstitution.update({ where: { id }, data: { status: 'CANCELLED' } }); }

// ── Calendar Events ──
export async function listEvents(schoolId: string) { return prisma.scheduleCalendarEvent.findMany({ where: { school_id: schoolId, archived_at: null } }); }
export async function createEvent(schoolId: string, data: any) { return prisma.scheduleCalendarEvent.create({ data: { school_id: schoolId, event_type: data.eventType, name: data.name, description: data.description, start_date: data.startDate, end_date: data.endDate, is_blackout: !!data.isBlackout, visible_to_parents: data.visibleToParents !== false } }); }
export async function archiveEvent(id: string) { return prisma.scheduleCalendarEvent.update({ where: { id }, data: { archived_at: new Date() } }); }
export async function updateEvent(id: string, data: any) { return prisma.scheduleCalendarEvent.update({ where: { id }, data: { ...(data.name && { name: data.name }), ...(data.description !== undefined && { description: data.description }), ...(data.startDate && { start_date: data.startDate }), ...(data.endDate && { end_date: data.endDate }), ...(data.isBlackout !== undefined && { is_blackout: data.isBlackout }) } }); }

// ── Lock / Unlock ──
export async function listLocks(schoolId: string) { return prisma.scheduleLock.findMany({ where: { school_id: schoolId } }); }
export async function lockSchedule(schoolId: string, lockedBy: string, data: any) { return prisma.scheduleLock.create({ data: { school_id: schoolId, academic_year_id: data.academicYearId, term_id: data.termId, locked_by: lockedBy, locked_at: new Date() } }); }
export async function unlockSchedule(id: string, unlockedBy: string, reason: string) { return prisma.scheduleLock.update({ where: { id }, data: { unlocked_by: unlockedBy, unlock_reason: reason } }); }

// ── Templates ──
export async function listTemplates(schoolId: string) { return prisma.scheduleTemplate.findMany({ where: { school_id: schoolId, archived_at: null } }); }
export async function createTemplate(schoolId: string, createdBy: string, data: any) { return prisma.scheduleTemplate.create({ data: { school_id: schoolId, name: data.name, created_from_term_id: data.createdFromTermId, created_by: createdBy } }); }
export async function archiveTemplate(id: string) { return prisma.scheduleTemplate.update({ where: { id }, data: { archived_at: new Date() } }); }
export async function updateTemplate(id: string, data: any) { return prisma.scheduleTemplate.update({ where: { id }, data: { name: data.name } }); }

// ── Exam Slots ──
export async function listExamSlots(schoolId: string) { return prisma.scheduleExamSlot.findMany({ where: { school_id: schoolId, archived_at: null } }); }
export async function createExamSlot(schoolId: string, data: any) {
  const roomConflict = await prisma.scheduleExamSlot.findFirst({ where: { school_id: schoolId, room_id: data.roomId, exam_date: data.examDate, start_time: data.startTime, archived_at: null } });
  if (roomConflict) throw new Error('Room already booked for an exam at this time');
  return prisma.scheduleExamSlot.create({ data: { school_id: schoolId, term_id: data.termId, class_id: data.classId, subject_id: data.subjectId, room_id: data.roomId, invigilator_id: data.invigilatorId, exam_date: data.examDate, start_time: data.startTime, duration_minutes: data.durationMinutes } });
}
export async function updateExamSlot(id: string, data: any) {
  const current = await prisma.scheduleExamSlot.findUnique({ where: { id } });
  if (!current) throw new Error('Exam slot not found');
  const roomId = data.roomId || current.room_id;
  const examDate = data.examDate || current.exam_date;
  const startTime = data.startTime || current.start_time;
  if (data.roomId || data.examDate || data.startTime) {
    const conflict = await prisma.scheduleExamSlot.findFirst({ where: { school_id: current.school_id, room_id: roomId, exam_date: examDate, start_time: startTime, archived_at: null, id: { not: id } } });
    if (conflict) throw new Error('Room already booked for an exam at this time');
  }
  return prisma.scheduleExamSlot.update({ where: { id }, data: { ...(data.roomId && { room_id: data.roomId }), ...(data.examDate && { exam_date: data.examDate }), ...(data.startTime && { start_time: data.startTime }), ...(data.durationMinutes !== undefined && { duration_minutes: data.durationMinutes }), ...(data.invigilatorId !== undefined && { invigilator_id: data.invigilatorId }) } });
}
export async function archiveExamSlot(id: string) { return prisma.scheduleExamSlot.update({ where: { id }, data: { archived_at: new Date() } }); }
