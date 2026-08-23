import { prisma } from '../../lib/prisma';

// ── Exams ──
export async function listExams(schoolId: string) { return prisma.examExam.findMany({ where: { school_id: schoolId } }); }
export async function createExam(schoolId: string, data: any) {
  return prisma.examExam.create({ data: { school_id: schoolId, name: data.name, exam_type: data.examType, term_id: data.termId, start_date: data.startDate, end_date: data.endDate, status: data.status || 'DRAFT' } });
}
export async function updateExamStatus(id: string, status: string) { return prisma.examExam.update({ where: { id }, data: { status: status as any } }); }
export async function getExamSchoolId(id: string) { return (await prisma.examExam.findUnique({ where: { id } }))?.school_id; }

// ── Subject Papers ──
export async function listSubjectPapers(schoolId: string, examId?: string) { return prisma.examSubjectPaper.findMany({ where: { school_id: schoolId, ...(examId && { exam_id: examId }) } }); }
export async function createSubjectPaper(schoolId: string, data: any) {
  return prisma.examSubjectPaper.create({ data: { school_id: schoolId, exam_id: data.examId, subject_id: data.subjectId, paper_code: data.paperCode, duration_minutes: data.durationMinutes, total_marks: data.totalMarks } });
}
export async function getSubjectPaperSchoolId(id: string) { return (await prisma.examSubjectPaper.findUnique({ where: { id } }))?.school_id; }

// ── Rooms ──
export async function listExamRooms(schoolId: string) { return prisma.examRoom.findMany({ where: { school_id: schoolId } }); }
export async function createExamRoom(schoolId: string, data: any) {
  return prisma.examRoom.create({ data: { school_id: schoolId, name: data.name, capacity: data.capacity, location: data.location } });
}
export async function getExamRoomSchoolId(id: string) { return (await prisma.examRoom.findUnique({ where: { id } }))?.school_id; }

// ── Schedule ──
export async function listSchedule(schoolId: string, examId?: string) {
  const papers = examId ? await prisma.examSubjectPaper.findMany({ where: { exam_id: examId }, select: { id: true } }) : null;
  return prisma.examSchedule.findMany({ where: { school_id: schoolId, ...(papers && { paper_id: { in: papers.map(p => p.id) } }) } });
}
export async function createScheduleEntry(schoolId: string, data: any) {
  return prisma.examSchedule.create({ data: { school_id: schoolId, paper_id: data.paperId, class_id: data.classId, date: data.date, start_time: data.startTime, end_time: data.endTime, room_id: data.roomId } });
}
export async function getScheduleSchoolId(id: string) { return (await prisma.examSchedule.findUnique({ where: { id } }))?.school_id; }

// ── Seating ──
export async function listSeating(schoolId: string, scheduleId?: string) { return prisma.examSeatingPlan.findMany({ where: { school_id: schoolId, ...(scheduleId && { schedule_id: scheduleId }) } }); }
export async function createSeating(schoolId: string, data: any) {
  return prisma.examSeatingPlan.create({ data: { school_id: schoolId, schedule_id: data.scheduleId, student_id: data.studentId, seat_number: data.seatNumber, row_position: data.rowPosition, column_position: data.columnPosition } });
}
export async function getSeatingSchoolId(id: string) { return (await prisma.examSeatingPlan.findUnique({ where: { id } }))?.school_id; }

// ── Invigilators ──
export async function listInvigilators(schoolId: string, scheduleId?: string) { return prisma.examInvigilator.findMany({ where: { school_id: schoolId, ...(scheduleId && { schedule_id: scheduleId }) } }); }
export async function createInvigilator(schoolId: string, data: any) {
  return prisma.examInvigilator.create({ data: { school_id: schoolId, schedule_id: data.scheduleId, staff_id: data.staffId, role: data.role } });
}
export async function getInvigilatorSchoolId(id: string) { return (await prisma.examInvigilator.findUnique({ where: { id } }))?.school_id; }

// ── Scripts ──
export async function listScripts(schoolId: string, paperId?: string) { return prisma.examScript.findMany({ where: { school_id: schoolId, ...(paperId && { paper_id: paperId }) } }); }
export async function createScript(schoolId: string, data: any) {
  return prisma.examScript.create({ data: { school_id: schoolId, student_id: data.studentId, paper_id: data.paperId, script_code: data.scriptCode, status: data.status || 'SUBMITTED' } });
}
export async function updateScriptStatus(id: string, status: string) { return prisma.examScript.update({ where: { id }, data: { status: status as any } }); }
export async function getScriptSchoolId(id: string) { return (await prisma.examScript.findUnique({ where: { id } }))?.school_id; }

// ── Moderation ──
export async function listModerations(schoolId: string, paperId?: string) { return prisma.examModeration.findMany({ where: { school_id: schoolId, ...(paperId && { paper_id: paperId }) } }); }
export async function createModeration(schoolId: string, data: any) {
  return prisma.examModeration.create({ data: { school_id: schoolId, paper_id: data.paperId, moderator_id: data.moderatorId, status: data.status || 'PENDING', remarks: data.remarks } });
}
export async function updateModerationStatus(id: string, status: string) { return prisma.examModeration.update({ where: { id }, data: { status: status as any } }); }
export async function getModerationSchoolId(id: string) { return (await prisma.examModeration.findUnique({ where: { id } }))?.school_id; }

// ── Malpractice ──
export async function listMalpractice(schoolId: string) { return prisma.examMalpractice.findMany({ where: { school_id: schoolId } }); }
export async function createMalpractice(schoolId: string, data: any) {
  return prisma.examMalpractice.create({ data: { school_id: schoolId, student_id: data.studentId, paper_id: data.paperId, incident_type: data.incidentType, description: data.description, decision: data.decision || 'Under review' } });
}
export async function getMalpracticeSchoolId(id: string) { return (await prisma.examMalpractice.findUnique({ where: { id } }))?.school_id; }

// ── Summary ──
export async function getExamSummary(schoolId: string) {
  const [total, draft, inProgress, published, malpracticeCount, pendingModeration] = await Promise.all([
    prisma.examExam.count({ where: { school_id: schoolId } }),
    prisma.examExam.count({ where: { school_id: schoolId, status: 'DRAFT' } }),
    prisma.examExam.count({ where: { school_id: schoolId, status: 'IN_PROGRESS' } }),
    prisma.examExam.count({ where: { school_id: schoolId, status: 'PUBLISHED' } }),
    prisma.examMalpractice.count({ where: { school_id: schoolId } }),
    prisma.examModeration.count({ where: { school_id: schoolId, status: 'PENDING' } }),
  ]);
  return { total, draft, inProgress, published, malpracticeCount, pendingModeration };
}
