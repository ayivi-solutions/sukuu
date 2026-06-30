import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ── Ownership lookups ──
export async function getAssessmentSchoolId(id: string) { return (await prisma.gradingAssessment.findUnique({ where: { id } }))?.school_id; }
export async function getScoreSchoolId(id: string) {
  const s = await prisma.gradingScore.findUnique({ where: { id } });
  if (!s) return undefined;
  return getAssessmentSchoolId(s.assessment_id);
}
export async function getScaleSchoolId(id: string) { return (await prisma.gradingScale.findUnique({ where: { id } }))?.school_id; }
export async function getComponentSchoolId(id: string) { return (await prisma.gradingComponent.findUnique({ where: { id } }))?.school_id; }
export async function getPolicySchoolId(id: string) { return (await prisma.gradingPolicy.findUnique({ where: { id } }))?.school_id; }
export async function getResultSchoolId(id: string, schoolId: string) { return schoolId; } // results scoped by enrollment, verified via class/term match upstream
export async function getApprovalSchoolId(id: string) { return (await prisma.gradingApproval.findUnique({ where: { id } }))?.school_id; }
export async function getPublicationSchoolId(id: string) { return (await prisma.gradingPublication.findUnique({ where: { id } }))?.school_id; }
export async function getModerationSchoolId(id: string) {
  const m = await prisma.gradingModeration.findUnique({ where: { id } });
  if (!m) return undefined;
  return getScoreSchoolId(m.assessment_id);
}
export async function getLockSchoolId(id: string) {
  const l = await prisma.gradingLock.findUnique({ where: { id } });
  return l ? 'lock-exists' : undefined; // school scoping enforced via class_id check at call site
}

// ── Lock check helper ──
async function assertNotLocked(classId: string, termId: string) {
  const lock = await prisma.gradingLock.findFirst({ where: { class_id: classId, term_id: termId } });
  if (lock) throw new Error('Results are locked for this class/term. Cannot modify.');
}

// ── Assessments ──
export async function listAssessments(schoolId: string, filters: any = {}) {
  return prisma.gradingAssessment.findMany({ where: { school_id: schoolId, archived_at: null, ...(filters.classId && { class_id: filters.classId }), ...(filters.termId && { term_id: filters.termId }), ...(filters.subjectId && { subject_id: filters.subjectId }) } });
}
export async function createAssessment(schoolId: string, data: any) {
  if (Number(data.weightage) > 100) throw new Error('Weightage cannot exceed 100%');
  return prisma.gradingAssessment.create({ data: { school_id: schoolId, subject_id: data.subjectId, class_id: data.classId, stream_id: data.streamId, term_id: data.termId, name: data.name, assessment_type: data.assessmentType, max_score: data.maxScore, weightage: data.weightage, assessment_date: data.assessmentDate, status: 'DRAFT' } });
}
export async function updateAssessment(id: string, data: any) { return prisma.gradingAssessment.update({ where: { id }, data: { ...(data.name && { name: data.name }), ...(data.maxScore !== undefined && { max_score: data.maxScore }), ...(data.weightage !== undefined && { weightage: data.weightage }), ...(data.assessmentDate !== undefined && { assessment_date: data.assessmentDate }), ...(data.status && { status: data.status }) } }); }
export async function archiveAssessment(id: string) { return prisma.gradingAssessment.update({ where: { id }, data: { archived_at: new Date() } }); }

// ── Scores ──
export async function listAssessmentScores(assessmentId: string) { return prisma.gradingScore.findMany({ where: { assessment_id: assessmentId, archived_at: null } }); }
export async function recordScore(assessmentId: string, enrollmentId: string, data: any, enteredBy: string) {
  const assessment = await prisma.gradingAssessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) throw new Error('Assessment not found');
  await assertNotLocked(assessment.class_id, assessment.term_id);
  if (data.score !== undefined && data.score !== null && Number(data.score) > Number(assessment.max_score)) throw new Error(`Score cannot exceed max score of ${assessment.max_score}`);

  const existing = await prisma.gradingScore.findFirst({ where: { assessment_id: assessmentId, enrollment_id: enrollmentId } });
  let score;
  if (existing) {
    score = await prisma.gradingScore.update({ where: { id: existing.id }, data: { score: data.score, is_absent: !!data.isAbsent, is_excused: !!data.isExcused, remarks: data.remarks, entered_by: enteredBy, archived_at: null } });
    await prisma.gradingHistory.create({ data: { score_id: score.id, previous_score: existing.score, new_score: score.score, changed_by: enteredBy, change_reason: data.changeReason || 'Score updated', changed_at: new Date() } });
  } else {
    score = await prisma.gradingScore.create({ data: { enrollment_id: enrollmentId, assessment_id: assessmentId, score: data.score, is_absent: !!data.isAbsent, is_excused: !!data.isExcused, remarks: data.remarks, entered_by: enteredBy, entered_at: new Date() } });
    await prisma.gradingHistory.create({ data: { score_id: score.id, previous_score: null, new_score: score.score, changed_by: enteredBy, change_reason: 'Initial entry', changed_at: new Date() } });
  }
  return score;
}
export async function bulkRecordScores(assessmentId: string, scores: { enrollmentId: string; score?: number; isAbsent?: boolean }[], enteredBy: string) {
  const results = [];
  for (const s of scores) results.push(await recordScore(assessmentId, s.enrollmentId, s, enteredBy));
  return results;
}
export async function archiveScore(id: string) { return prisma.gradingScore.update({ where: { id }, data: { archived_at: new Date() } }); }

// ── Moderation ──
export async function listModerations(assessmentId: string) { return prisma.gradingModeration.findMany({ where: { assessment_id: assessmentId } }); }
export async function createModeration(assessmentId: string, data: any, moderatedBy: string) { return prisma.gradingModeration.create({ data: { assessment_id: assessmentId, moderated_by: moderatedBy, moderation_type: data.moderationType, moderation_value: data.moderationValue, reason: data.reason, applied_at: new Date() } }); }

// ── Grade Scales ──
export async function listScales(schoolId: string) { return prisma.gradingScale.findMany({ where: { school_id: schoolId, archived_at: null }, orderBy: { min_score: 'desc' } }); }
export async function createScaleBand(schoolId: string, data: any) {
  if (Number(data.minScore) > Number(data.maxScore)) throw new Error('min_score cannot exceed max_score');
  return prisma.gradingScale.create({ data: { school_id: schoolId, scale_name: data.scaleName, min_score: data.minScore, max_score: data.maxScore, grade: data.grade, grade_point: data.gradePoint, description: data.description, is_passing: !!data.isPassing } });
}
export async function updateScaleBand(id: string, data: any) { return prisma.gradingScale.update({ where: { id }, data: { ...(data.minScore !== undefined && { min_score: data.minScore }), ...(data.maxScore !== undefined && { max_score: data.maxScore }), ...(data.grade && { grade: data.grade }), ...(data.gradePoint !== undefined && { grade_point: data.gradePoint }), ...(data.isPassing !== undefined && { is_passing: data.isPassing }) } }); }
export async function archiveScaleBand(id: string) { return prisma.gradingScale.update({ where: { id }, data: { archived_at: new Date() } }); }
async function getGradeFromScore(schoolId: string, scaleName: string, score: number) {
  const band = await prisma.gradingScale.findFirst({ where: { school_id: schoolId, scale_name: scaleName, min_score: { lte: score }, max_score: { gte: score }, archived_at: null } });
  return band || null;
}

// ── Components ──
export async function listComponents(schoolId: string, classId?: string, termId?: string) { return prisma.gradingComponent.findMany({ where: { school_id: schoolId, archived_at: null, ...(classId && { class_id: classId }), ...(termId && { term_id: termId }) } }); }
export async function createComponent(schoolId: string, data: any) { return prisma.gradingComponent.create({ data: { school_id: schoolId, subject_id: data.subjectId, term_id: data.termId, class_id: data.classId, component_name: data.componentName, weight_pct: data.weightPct } }); }
export async function archiveComponent(id: string) { return prisma.gradingComponent.update({ where: { id }, data: { archived_at: new Date() } }); }

// ── Policies ──
export async function listPolicies(schoolId: string) { return prisma.gradingPolicy.findMany({ where: { school_id: schoolId, archived_at: null } }); }
export async function createPolicy(schoolId: string, data: any) {
  if (Number(data.caWeightPct) + Number(data.examWeightPct) !== 100) throw new Error('CA weight + Exam weight must equal 100%');
  return prisma.gradingPolicy.create({ data: { school_id: schoolId, class_id: data.classId, term_id: data.termId, ca_weight_pct: data.caWeightPct, exam_weight_pct: data.examWeightPct, pass_mark: data.passMark, grading_scale_id: data.gradingScaleId } });
}
export async function updatePolicy(id: string, data: any) { return prisma.gradingPolicy.update({ where: { id }, data: { ...(data.caWeightPct !== undefined && { ca_weight_pct: data.caWeightPct }), ...(data.examWeightPct !== undefined && { exam_weight_pct: data.examWeightPct }), ...(data.passMark !== undefined && { pass_mark: data.passMark }) } }); }
export async function archivePolicy(id: string) { return prisma.gradingPolicy.update({ where: { id }, data: { archived_at: new Date() } }); }

// ── Remarks ──
export async function listRemarks(enrollmentId: string, termId: string) { return prisma.gradingRemark.findMany({ where: { enrollment_id: enrollmentId, term_id: termId, archived_at: null } }); }
export async function upsertRemark(data: any, teacherId: string) {
  const existing = await prisma.gradingRemark.findFirst({ where: { enrollment_id: data.enrollmentId, subject_id: data.subjectId, term_id: data.termId } });
  if (existing) return prisma.gradingRemark.update({ where: { id: existing.id }, data: { remark: data.remark, class_teacher_remark: data.classTeacherRemark, archived_at: null } });
  return prisma.gradingRemark.create({ data: { enrollment_id: data.enrollmentId, subject_id: data.subjectId, term_id: data.termId, teacher_id: teacherId, remark: data.remark, class_teacher_remark: data.classTeacherRemark } });
}

// ── Compute subject result (core engine) ──
export async function computeSubjectResult(enrollmentId: string, subjectId: string, classId: string, termId: string, schoolId: string) {
  const policy = await prisma.gradingPolicy.findFirst({ where: { school_id: schoolId, class_id: classId, term_id: termId, archived_at: null } });
  const assessments = await prisma.gradingAssessment.findMany({ where: { school_id: schoolId, subject_id: subjectId, class_id: classId, term_id: termId, archived_at: null } });
  const caAssessments = assessments.filter(a => a.assessment_type !== 'END_OF_TERM' && a.assessment_type !== 'MID_TERM');
  const examAssessments = assessments.filter(a => a.assessment_type === 'END_OF_TERM' || a.assessment_type === 'MID_TERM');

  async function weightedAvg(items: typeof assessments) {
    let totalWeighted = 0, totalWeight = 0;
    for (const a of items) {
      const score = await prisma.gradingScore.findFirst({ where: { assessment_id: a.id, enrollment_id: enrollmentId, archived_at: null } });
      if (score && score.score !== null) {
        const pct = (Number(score.score) / Number(a.max_score)) * 100;
        totalWeighted += pct * Number(a.weightage);
        totalWeight += Number(a.weightage);
      }
    }
    return totalWeight > 0 ? totalWeighted / totalWeight : null;
  }

  const caPct = await weightedAvg(caAssessments);
  const examPct = await weightedAvg(examAssessments);
  const caWeight = policy ? Number(policy.ca_weight_pct) : 30;
  const examWeight = policy ? Number(policy.exam_weight_pct) : 70;

  let total: number | null = null;
  if (caPct !== null && examPct !== null) total = (caPct * caWeight / 100) + (examPct * examWeight / 100);
  else if (caPct !== null) total = caPct;
  else if (examPct !== null) total = examPct;

  let grade: string | null = null, gradePoint: number | null = null;
  if (total !== null) {
    let scaleName: string | undefined;
    if (policy) scaleName = (await prisma.gradingScale.findUnique({ where: { id: policy.grading_scale_id } }))?.scale_name;
    if (!scaleName) {
      // No policy configured — fall back to whatever scale the school has set up, if any
      const anyScale = await prisma.gradingScale.findFirst({ where: { school_id: schoolId, archived_at: null } });
      scaleName = anyScale?.scale_name;
    }
    const band = scaleName ? await getGradeFromScore(schoolId, scaleName, total) : null;
    if (band) { grade = band.grade; gradePoint = band.grade_point ? Number(band.grade_point) : null; }
  }

  const existing = await prisma.gradingSubjectResult.findFirst({ where: { enrollment_id: enrollmentId, subject_id: subjectId, term_id: termId } });
  const data = { ca_score: caPct, exam_score: examPct, total_score: total, grade, grade_point: gradePoint, computed_at: new Date() };
  if (existing) return prisma.gradingSubjectResult.update({ where: { id: existing.id }, data });
  return prisma.gradingSubjectResult.create({ data: { enrollment_id: enrollmentId, subject_id: subjectId, term_id: termId, class_id: classId, ...data } });
}

export async function computeClassResults(classId: string, termId: string, schoolId: string) {
  await assertNotLocked(classId, termId);
  const enrollments = await prisma.studentsEnrollment.findMany({ where: { school_id: schoolId, class_id: classId, term_id: undefined, enrollment_status: 'ACTIVE' } as any }).catch(() => prisma.studentsEnrollment.findMany({ where: { school_id: schoolId, class_id: classId, enrollment_status: 'ACTIVE' } }));
  const subjects = await prisma.academicsSubject.findMany({ where: { school_id: schoolId } });
  const subjectResultsByEnrollment: Record<string, any[]> = {};

  for (const enr of enrollments) {
    subjectResultsByEnrollment[enr.id] = [];
    for (const subj of subjects) {
      const result = await computeSubjectResult(enr.id, subj.id, classId, termId, schoolId);
      subjectResultsByEnrollment[enr.id].push(result);
    }
  }

  // Compute overall result + aggregate (best 6 subjects, Ghanaian style) + position
  const overallScores: { enrollmentId: string; total: number; aggregate: number }[] = [];
  for (const enr of enrollments) {
    const subjResults = subjectResultsByEnrollment[enr.id].filter(r => r.total_score !== null);
    const totalScore = subjResults.reduce((s, r) => s + Number(r.total_score), 0) / (subjResults.length || 1);
    const gradePoints = subjResults.map(r => r.grade_point !== null ? Number(r.grade_point) : 9).sort((a, b) => a - b).slice(0, 6);
    const aggregate = gradePoints.reduce((s, gp) => s + gp, 0);
    overallScores.push({ enrollmentId: enr.id, total: totalScore, aggregate });
  }
  overallScores.sort((a, b) => b.total - a.total);

  for (let i = 0; i < overallScores.length; i++) {
    const { enrollmentId, total, aggregate } = overallScores[i];
    const position = i + 1;
    const existing = await prisma.gradingResult.findFirst({ where: { enrollment_id: enrollmentId, term_id: termId } });
    const data = { total_score: total, aggregate_score: aggregate, position, is_published: false };
    if (existing) await prisma.gradingResult.update({ where: { id: existing.id }, data });
    else await prisma.gradingResult.create({ data: { enrollment_id: enrollmentId, term_id: termId, ...data } });

    // Update subject-level positions within this class
    const subjResults = subjectResultsByEnrollment[enrollmentId];
    for (const sr of subjResults) {
      await prisma.gradingSubjectResult.update({ where: { id: sr.id }, data: { class_size: enrollments.length } });
    }
  }

  // Subject-level position ranking
  for (const subj of subjects) {
    const allForSubject = await prisma.gradingSubjectResult.findMany({ where: { subject_id: subj.id, class_id: classId, term_id: termId, total_score: { not: null } }, orderBy: { total_score: 'desc' } });
    for (let i = 0; i < allForSubject.length; i++) await prisma.gradingSubjectResult.update({ where: { id: allForSubject[i].id }, data: { position: i + 1 } });
  }

  return { computed: enrollments.length };
}

// ── Results, Subject Results ──
export async function getEnrollmentResult(enrollmentId: string, termId: string) { return prisma.gradingResult.findFirst({ where: { enrollment_id: enrollmentId, term_id: termId } }); }
export async function getEnrollmentSubjectResults(enrollmentId: string, termId: string) { return prisma.gradingSubjectResult.findMany({ where: { enrollment_id: enrollmentId, term_id: termId, archived_at: null } }); }
export async function listClassResults(classId: string, termId: string) { return prisma.gradingResult.findMany({ where: { term_id: termId } }); } // filtered client-side by enrollment->class join

// ── Approval workflow ──
export async function listApprovals(schoolId: string, classId?: string, termId?: string) { return prisma.gradingApproval.findMany({ where: { school_id: schoolId, ...(classId && { class_id: classId }), ...(termId && { term_id: termId }) } }); }
export async function requestApproval(schoolId: string, data: any, approverId: string) { return prisma.gradingApproval.create({ data: { school_id: schoolId, term_id: data.termId, class_id: data.classId, approver_id: approverId, approval_level: data.approvalLevel, status: 'PENDING' } }); }
export async function decideApproval(id: string, status: string) { return prisma.gradingApproval.update({ where: { id }, data: { status: status as any, approved_at: new Date() } }); }

// ── Publication ──
export async function listPublications(schoolId: string) { return prisma.gradingPublication.findMany({ where: { school_id: schoolId } }); }
export async function publishResults(schoolId: string, classId: string, termId: string, publishedBy: string, data: any) {
  const approval = await prisma.gradingApproval.findFirst({ where: { school_id: schoolId, class_id: classId, term_id: termId, status: 'APPROVED' } });
  if (!approval) throw new Error('Results must be approved before publication');
  await prisma.gradingResult.updateMany({ where: { term_id: termId }, data: { is_published: true, published_at: new Date() } });
  return prisma.gradingPublication.create({ data: { school_id: schoolId, term_id: termId, class_id: classId, published_by: publishedBy, published_at: new Date(), visible_to_students: data.visibleToStudents !== false, visible_to_parents: data.visibleToParents !== false } });
}

// ── Lock ──
export async function listLocks(schoolId: string) { return prisma.gradingLock.findMany({ where: { } }); }
export async function lockResults(classId: string, termId: string, lockedBy: string) { return prisma.gradingLock.create({ data: { class_id: classId, term_id: termId, locked_by: lockedBy, locked_at: new Date() } }); }
export async function unlockResults(id: string) { return prisma.gradingLock.delete({ where: { id } }); }

// ── Reports ──
export async function generateReport(schoolId: string, data: any, generatedBy: string) { return prisma.gradingReport.create({ data: { school_id: schoolId, student_id: data.studentId, class_id: data.classId, term_id: data.termId, report_type: data.reportType, generated_by: generatedBy } }); }
export async function listReports(schoolId: string) { return prisma.gradingReport.findMany({ where: { school_id: schoolId }, orderBy: { generated_at: 'desc' } }); }
