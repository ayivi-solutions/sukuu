import { prisma } from '../../lib/prisma';

// ── Academic Years ──────────────────────────────────────
export async function listYears(schoolId: string) {
  return prisma.academicsAcademicYear.findMany({ where: { school_id: schoolId }, orderBy: { start_date: 'desc' } });
}
export async function createYear(schoolId: string, data: any) {
  return prisma.academicsAcademicYear.create({ data: { school_id: schoolId, name: data.name, start_date: data.startDate, end_date: data.endDate, is_active: false } });
}
export async function updateYear(id: string, data: any) {
  return prisma.academicsAcademicYear.update({ where: { id }, data: { ...(data.name && { name: data.name }), ...(data.startDate && { start_date: data.startDate }), ...(data.endDate && { end_date: data.endDate }) } });
}
export async function activateYear(schoolId: string, id: string) {
  await prisma.academicsAcademicYear.updateMany({ where: { school_id: schoolId }, data: { is_active: false } });
  return prisma.academicsAcademicYear.update({ where: { id }, data: { is_active: true } });
}
export async function archiveYear(id: string) {
  return prisma.academicsAcademicYear.update({ where: { id }, data: { is_active: false } });
}

// ── Terms ────────────────────────────────────────────────
export async function listTerms(schoolId: string) {
  return prisma.academicsTerm.findMany({ where: { school_id: schoolId }, orderBy: { term_order: 'asc' } });
}
export async function createTerm(schoolId: string, data: any) {
  return prisma.academicsTerm.create({ data: { school_id: schoolId, academic_year_id: data.academicYearId, name: data.name, term_order: data.termOrder, start_date: data.startDate, end_date: data.endDate, is_active: false } });
}
export async function updateTerm(id: string, data: any) {
  return prisma.academicsTerm.update({ where: { id }, data });
}
export async function archiveTerm(id: string) {
  return prisma.academicsTerm.update({ where: { id }, data: { is_active: false } });
}

// ── Classes ──────────────────────────────────────────────
export async function listClasses(schoolId: string) {
  return prisma.academicsClass.findMany({ where: { school_id: schoolId }, orderBy: { level_order: 'asc' } });
}
export async function createClass(schoolId: string, data: any) {
  return prisma.academicsClass.create({ data: { school_id: schoolId, name: data.name, code: data.code, level_order: data.levelOrder, is_active: true } });
}
export async function updateClass(id: string, data: any) {
  return prisma.academicsClass.update({ where: { id }, data });
}
export async function archiveClass(id: string) {
  return prisma.academicsClass.update({ where: { id }, data: { is_active: false } });
}

// ── Streams ──────────────────────────────────────────────
export async function listStreams(schoolId: string) {
  return prisma.academicsStream.findMany({ where: { school_id: schoolId } });
}
export async function createStream(schoolId: string, data: any) {
  return prisma.academicsStream.create({ data: { school_id: schoolId, class_id: data.classId, name: data.name, code: data.code, capacity: data.capacity, is_active: true } });
}
export async function updateStream(id: string, data: any) {
  return prisma.academicsStream.update({ where: { id }, data });
}
export async function archiveStream(id: string) {
  return prisma.academicsStream.update({ where: { id }, data: { is_active: false } });
}

// ── Subjects ─────────────────────────────────────────────
export async function listSubjects(schoolId: string) {
  return prisma.academicsSubject.findMany({ where: { school_id: schoolId } });
}
export async function createSubject(schoolId: string, data: any) {
  return prisma.academicsSubject.create({ data: { school_id: schoolId, department_id: data.departmentId, name: data.name, code: data.code, subject_type: data.subjectType, credit_hours: data.creditHours, is_active: true } });
}
export async function updateSubject(id: string, data: any) {
  return prisma.academicsSubject.update({ where: { id }, data });
}
export async function archiveSubject(id: string) {
  return prisma.academicsSubject.update({ where: { id }, data: { is_active: false } });
}

// ── Departments ──────────────────────────────────────────
export async function listDepartments(schoolId: string) {
  return prisma.academicsDepartment.findMany({ where: { school_id: schoolId, archived_at: null } });
}
export async function createDepartment(schoolId: string, data: any) {
  return prisma.academicsDepartment.create({ data: { school_id: schoolId, name: data.name, code: data.code, head_id: data.headId } });
}
export async function updateDepartment(id: string, data: any) {
  return prisma.academicsDepartment.update({ where: { id }, data });
}
export async function archiveDepartment(id: string) {
  return prisma.academicsDepartment.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Subject Assignments (teacher-subject) ───────────────
export async function listSubjectAssignments(schoolId: string) {
  return prisma.academicsSubjectAssignment.findMany({ where: { school_id: schoolId, archived_at: null } });
}
export async function createSubjectAssignment(schoolId: string, data: any) {
  return prisma.academicsSubjectAssignment.create({ data: { school_id: schoolId, staff_id: data.staffId, subject_id: data.subjectId, academic_year_id: data.academicYearId, assigned_at: new Date() } });
}
export async function archiveSubjectAssignment(id: string) {
  return prisma.academicsSubjectAssignment.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Class Subjects ───────────────────────────────────────
export async function listClassSubjects(schoolId: string) {
  return prisma.academicsClassSubject.findMany({ where: { school_id: schoolId, archived_at: null } });
}
export async function createClassSubject(schoolId: string, data: any) {
  return prisma.academicsClassSubject.create({ data: { school_id: schoolId, class_id: data.classId, subject_id: data.subjectId, is_compulsory: !!data.isCompulsory } });
}
export async function archiveClassSubject(id: string) {
  return prisma.academicsClassSubject.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Stream Subjects ──────────────────────────────────────
export async function listStreamSubjects(schoolId: string) {
  return prisma.academicsStreamSubject.findMany({ where: { school_id: schoolId, archived_at: null } });
}
export async function createStreamSubject(schoolId: string, data: any) {
  return prisma.academicsStreamSubject.create({ data: { school_id: schoolId, stream_id: data.streamId, subject_id: data.subjectId, is_compulsory: !!data.isCompulsory } });
}
export async function archiveStreamSubject(id: string) {
  return prisma.academicsStreamSubject.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Subject Groups ───────────────────────────────────────
export async function listSubjectGroups(schoolId: string) {
  return prisma.academicsSubjectGroup.findMany({ where: { school_id: schoolId, archived_at: null } });
}
export async function createSubjectGroup(schoolId: string, data: any) {
  return prisma.academicsSubjectGroup.create({ data: { school_id: schoolId, name: data.name, group_type: data.groupType, max_selections: data.maxSelections, min_selections: data.minSelections } });
}
export async function archiveSubjectGroup(id: string) {
  return prisma.academicsSubjectGroup.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Curriculum ───────────────────────────────────────────
export async function listCurricula(schoolId: string) {
  return prisma.academicsCurriculum.findMany({ where: { school_id: schoolId, archived_at: null } });
}
export async function createCurriculum(schoolId: string, data: any) {
  return prisma.academicsCurriculum.create({ data: { school_id: schoolId, subject_id: data.subjectId, class_id: data.classId, term_id: data.termId, title: data.title, description: data.description } });
}
export async function updateCurriculum(id: string, data: any) {
  return prisma.academicsCurriculum.update({ where: { id }, data: { title: data.title, description: data.description } });
}
export async function archiveCurriculum(id: string) {
  return prisma.academicsCurriculum.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Curriculum Topics ────────────────────────────────────
export async function listTopics(curriculumId: string) {
  return prisma.academicsCurriculumTopic.findMany({ where: { curriculum_id: curriculumId, archived_at: null }, orderBy: { topic_order: 'asc' } });
}
export async function createTopic(curriculumId: string, data: any) {
  return prisma.academicsCurriculumTopic.create({ data: { curriculum_id: curriculumId, title: data.title, topic_order: data.topicOrder, week_start: data.weekStart, week_end: data.weekEnd, description: data.description } });
}
export async function archiveTopic(id: string) {
  return prisma.academicsCurriculumTopic.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Curriculum Objectives ────────────────────────────────
export async function listObjectives(topicId: string) {
  return prisma.academicsCurriculumObjective.findMany({ where: { topic_id: topicId, archived_at: null }, orderBy: { objective_order: 'asc' } });
}
export async function createObjective(topicId: string, data: any) {
  return prisma.academicsCurriculumObjective.create({ data: { topic_id: topicId, objective: data.objective, objective_order: data.objectiveOrder } });
}
export async function archiveObjective(id: string) {
  return prisma.academicsCurriculumObjective.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Learning Outcomes ────────────────────────────────────
export async function listOutcomes(schoolId: string) {
  return prisma.academicsLearningOutcome.findMany({ where: { school_id: schoolId, archived_at: null } });
}
export async function createOutcome(schoolId: string, data: any) {
  return prisma.academicsLearningOutcome.create({ data: { school_id: schoolId, subject_id: data.subjectId, class_id: data.classId, outcome: data.outcome, strand: data.strand } });
}
export async function archiveOutcome(id: string) {
  return prisma.academicsLearningOutcome.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Promotion Rules ───────────────────────────────────────
export async function listPromotionRules(schoolId: string) {
  return prisma.academicsPromotionRule.findMany({ where: { school_id: schoolId, archived_at: null } });
}
export async function createPromotionRule(schoolId: string, data: any) {
  return prisma.academicsPromotionRule.create({
    data: {
      school_id: schoolId, from_class_id: data.fromClassId, to_class_id: data.toClassId,
      min_gpa: data.minGpa, min_attendance_pct: data.minAttendancePct,
      max_failed_subjects: data.maxFailedSubjects, requires_manual_approval: !!data.requiresManualApproval,
    },
  });
}
export async function archivePromotionRule(id: string) {
  return prisma.academicsPromotionRule.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Class Teacher Assignments ────────────────────────────
export async function listClassTeachers(schoolId: string) {
  return prisma.academicsClassTeacherAssignment.findMany({ where: { school_id: schoolId, archived_at: null } });
}
export async function createClassTeacher(schoolId: string, data: any) {
  return prisma.academicsClassTeacherAssignment.create({
    data: { school_id: schoolId, class_id: data.classId, stream_id: data.streamId, staff_id: data.staffId, academic_year_id: data.academicYearId, assigned_at: new Date() },
  });
}
export async function archiveClassTeacher(id: string) {
  return prisma.academicsClassTeacherAssignment.update({ where: { id }, data: { archived_at: new Date() } });
}
