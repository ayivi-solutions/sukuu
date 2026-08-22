import { prisma } from '../../lib/prisma';

// ── Multi-tenancy guard ──────────────────────────────────
export async function verifyApplicantInSchool(applicantId: string, schoolId: string): Promise<boolean> {
  const a = await prisma.admissionApplicant.findUnique({ where: { id: applicantId } });
  return !!a && a.school_id === schoolId;
}

// ── Applicants ───────────────────────────────────────────
export async function listApplicants(schoolId: string) {
  return prisma.admissionApplicant.findMany({ where: { school_id: schoolId } });
}
export async function getApplicant(id: string) {
  return prisma.admissionApplicant.findUnique({ where: { id } });
}
export async function createApplicant(schoolId: string, data: any) {
  return prisma.admissionApplicant.create({
    data: {
      school_id: schoolId, admission_batch_id: data.admissionBatchId, first_name: data.firstName, last_name: data.lastName,
      gender: data.gender, date_of_birth: data.dateOfBirth, nationality: data.nationality, applying_for_class_id: data.applyingForClassId,
      guardian_name: data.guardianName, guardian_phone: data.guardianPhone, status: 'PENDING', applied_date: new Date(),
    },
  });
}
export async function updateApplicant(id: string, data: any, changedBy: string) {
  const current = await prisma.admissionApplicant.findUnique({ where: { id } });
  const updated = await prisma.admissionApplicant.update({
    where: { id },
    data: { ...(data.firstName && { first_name: data.firstName }), ...(data.lastName && { last_name: data.lastName }), ...(data.guardianPhone && { guardian_phone: data.guardianPhone }), ...(data.status && { status: data.status }) },
  });
  if (data.status && current && data.status !== current.status) {
    await prisma.admissionStatusHistory.create({ data: { applicant_id: id, from_status: current.status, to_status: data.status, changed_by: changedBy, change_reason: data.statusReason, changed_at: new Date() } });
  }
  return updated;
}
export async function archiveApplicant(id: string, changedBy: string, reason?: string) {
  const current = await prisma.admissionApplicant.findUnique({ where: { id } });
  const updated = await prisma.admissionApplicant.update({ where: { id }, data: { status: 'WITHDRAWN' } });
  await prisma.admissionStatusHistory.create({ data: { applicant_id: id, from_status: current?.status || '', to_status: 'WITHDRAWN', changed_by: changedBy, change_reason: reason, changed_at: new Date() } });
  return updated;
}

// ── Interviews ───────────────────────────────────────────
export async function listInterviews(applicantId: string) {
  return prisma.admissionInterview.findMany({ where: { applicant_id: applicantId } });
}
export async function createInterview(applicantId: string, data: any) {
  return prisma.admissionInterview.create({ data: { applicant_id: applicantId, interviewer_id: data.interviewerId, scheduled_date: data.scheduledDate, max_score: data.maxScore, status: 'SCHEDULED' } });
}
export async function updateInterview(id: string, data: any) {
  return prisma.admissionInterview.update({
    where: { id },
    data: { ...(data.score !== undefined && { score: data.score }), ...(data.remarks !== undefined && { remarks: data.remarks }), ...(data.recommendation && { recommendation: data.recommendation }), ...(data.status && { status: data.status }) },
  });
}

// ── Offers ───────────────────────────────────────────────
export async function listOffers(applicantId: string) {
  return prisma.admissionOffer.findMany({ where: { applicant_id: applicantId } });
}
export async function createOffer(applicantId: string, schoolId: string, data: any) {
  return prisma.admissionOffer.create({
    data: { applicant_id: applicantId, school_id: schoolId, class_id: data.classId, stream_id: data.streamId, academic_year_id: data.academicYearId, status: 'PENDING', issued_date: new Date(), expiry_date: data.expiryDate },
  });
}
export async function updateOfferStatus(id: string, status: string) {
  return prisma.admissionOffer.update({ where: { id }, data: { status: status as any, ...(status === 'ACCEPTED' && { accepted_date: new Date() }) } });
}

// ── Application Stages ───────────────────────────────────
export async function listStages(applicantId: string) {
  return prisma.admissionApplicationStage.findMany({ where: { applicant_id: applicantId }, orderBy: { stage_order: 'asc' } });
}
export async function createStage(applicantId: string, data: any) {
  return prisma.admissionApplicationStage.create({ data: { applicant_id: applicantId, stage_name: data.stageName, stage_order: data.stageOrder, status: 'PENDING', notes: data.notes } });
}
export async function updateStage(id: string, data: any) {
  return prisma.admissionApplicationStage.update({ where: { id }, data: { ...(data.status && { status: data.status }), ...(data.notes !== undefined && { notes: data.notes }), ...(data.status && ['PASSED', 'FAILED', 'SKIPPED'].includes(data.status) && { completed_at: new Date() }) } });
}

// ── Documents ─────────────────────────────────────────────
export async function listDocuments(applicantId: string) {
  return prisma.admissionApplicationDocument.findMany({ where: { applicant_id: applicantId } });
}
export async function createDocument(applicantId: string, data: any) {
  return prisma.admissionApplicationDocument.create({ data: { applicant_id: applicantId, document_type: data.documentType, file_url: data.fileUrl, is_verified: false, uploaded_at: new Date() } });
}
export async function verifyDocument(id: string, verifiedBy: string, isVerified: boolean) {
  return prisma.admissionApplicationDocument.update({ where: { id }, data: { is_verified: isVerified, verified_by: verifiedBy } });
}

// ── Reviews ───────────────────────────────────────────────
export async function listReviews(applicantId: string) {
  return prisma.admissionApplicationReview.findMany({ where: { applicant_id: applicantId } });
}
export async function createReview(applicantId: string, reviewedBy: string, data: any) {
  return prisma.admissionApplicationReview.create({ data: { applicant_id: applicantId, reviewed_by: reviewedBy, review_date: new Date(), decision: data.decision, notes: data.notes } });
}

// ── Status History (read-only) ───────────────────────────
export async function listStatusHistory(applicantId: string) {
  return prisma.admissionStatusHistory.findMany({ where: { applicant_id: applicantId }, orderBy: { changed_at: 'desc' } });
}

// ── Decisions ─────────────────────────────────────────────
export async function listDecisions(applicantId: string) {
  return prisma.admissionDecision.findMany({ where: { applicant_id: applicantId } });
}
export async function createDecision(applicantId: string, decidedBy: string, data: any) {
  const decision = await prisma.admissionDecision.create({ data: { applicant_id: applicantId, decision: data.decision, decided_by: decidedBy, decision_date: new Date(), notes: data.notes, aggregate_score: data.aggregateScore } });
  const statusMap: Record<string, string> = { ADMIT: 'OFFERED', REJECT: 'REJECTED', WAITLIST: 'UNDER_REVIEW' };
  const current = await prisma.admissionApplicant.findUnique({ where: { id: applicantId } });
  if (current && statusMap[data.decision]) {
    await prisma.admissionApplicant.update({ where: { id: applicantId }, data: { status: statusMap[data.decision] as any } });
    await prisma.admissionStatusHistory.create({ data: { applicant_id: applicantId, from_status: current.status, to_status: statusMap[data.decision], changed_by: decidedBy, change_reason: 'Admission decision recorded', changed_at: new Date() } });
  }
  return decision;
}

// ── Batches ───────────────────────────────────────────────
export async function listBatches(schoolId: string) {
  return prisma.admissionBatch.findMany({ where: { school_id: schoolId } });
}
export async function createBatch(schoolId: string, data: any) {
  return prisma.admissionBatch.create({ data: { school_id: schoolId, academic_year_id: data.academicYearId, name: data.name, open_date: data.openDate, close_date: data.closeDate, target_enrolment: data.targetEnrolment, status: 'OPEN' } });
}
export async function updateBatch(id: string, data: any) {
  return prisma.admissionBatch.update({ where: { id }, data: { ...(data.status && { status: data.status }), ...(data.targetEnrolment !== undefined && { target_enrolment: data.targetEnrolment }) } });
}

// ── Waitlist ──────────────────────────────────────────────
export async function listWaitlist(schoolId: string) {
  return prisma.admissionWaitlist.findMany({ where: { school_id: schoolId }, orderBy: { position: 'asc' } });
}
export async function createWaitlistEntry(applicantId: string, schoolId: string, data: any) {
  return prisma.admissionWaitlist.create({ data: { applicant_id: applicantId, school_id: schoolId, class_id: data.classId, position: data.position, added_at: new Date(), status: 'WAITING' } });
}
export async function updateWaitlistStatus(id: string, status: string) {
  return prisma.admissionWaitlist.update({ where: { id }, data: { status: status as any } });
}

// ── Requirements ──────────────────────────────────────────
export async function listRequirements(schoolId: string) {
  return prisma.admissionRequirement.findMany({ where: { school_id: schoolId, archived_at: null } });
}
export async function createRequirement(schoolId: string, data: any) {
  return prisma.admissionRequirement.create({ data: { school_id: schoolId, batch_id: data.batchId, requirement_type: data.requirementType, description: data.description, is_mandatory: !!data.isMandatory } });
}
export async function updateRequirement(id: string, data: any) {
  return prisma.admissionRequirement.update({ where: { id }, data: { ...(data.description && { description: data.description }), ...(data.isMandatory !== undefined && { is_mandatory: data.isMandatory }) } });
}
export async function archiveRequirement(id: string) {
  return prisma.admissionRequirement.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Conversion to StudentX ────────────────────────────────
export async function convertApplicantToStudent(applicantId: string, offerId: string, convertedBy: string) {
  const applicant = await prisma.admissionApplicant.findUnique({ where: { id: applicantId } });
  const offer = await prisma.admissionOffer.findUnique({ where: { id: offerId } });
  if (!applicant || !offer) throw new Error('Applicant or offer not found');
  if (offer.status !== 'ACCEPTED') throw new Error('Offer must be accepted before conversion');

  const student = await prisma.studentsStudent.create({
    data: {
      school_id: applicant.school_id, student_id: `STU-${Date.now()}`, first_name: applicant.first_name, last_name: applicant.last_name,
      gender: applicant.gender, date_of_birth: applicant.date_of_birth, nationality: applicant.nationality, status: 'ACTIVE',
      admission_date: new Date().toISOString().slice(0, 10),
    },
  });
  const enrollment = await prisma.studentsEnrollment.create({
    data: { student_id: student.id, school_id: applicant.school_id, academic_year_id: offer.academic_year_id, class_id: offer.class_id, stream_id: offer.stream_id, admission_date: new Date().toISOString().slice(0, 10), enrollment_status: 'ACTIVE' },
  });
  await prisma.admissionApplicant.update({ where: { id: applicantId }, data: { status: 'ENROLLED' } });
  await prisma.admissionStatusHistory.create({ data: { applicant_id: applicantId, from_status: applicant.status, to_status: 'ENROLLED', changed_by: convertedBy, change_reason: 'Converted to StudentX', changed_at: new Date() } });
  return { student, enrollment };
}

// ── School-ownership lookups for school-scoped-by-id mutations ──
export async function getBatchSchoolId(id: string) { return (await prisma.admissionBatch.findUnique({ where: { id } }))?.school_id; }
export async function getWaitlistSchoolId(id: string) { return (await prisma.admissionWaitlist.findUnique({ where: { id } }))?.school_id; }
export async function getRequirementSchoolId(id: string) { return (await prisma.admissionRequirement.findUnique({ where: { id } }))?.school_id; }
