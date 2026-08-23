import { prisma } from '../../lib/prisma';

export async function listRecords(schoolId: string, enrollmentId?: string) { return prisma.transcriptRecord.findMany({ where: { school_id: schoolId, ...(enrollmentId && { enrollment_id: enrollmentId }) } }); }
export async function createRecord(schoolId: string, data: any) {
  return prisma.transcriptRecord.create({ data: { school_id: schoolId, enrollment_id: data.enrollmentId, term_id: data.termId, gpa: data.gpa, cgpa: data.cgpa, is_locked: false } });
}
export async function lockRecord(id: string, lockedBy: string, reason?: string) {
  await prisma.transcriptRecord.update({ where: { id }, data: { is_locked: true } });
  return prisma.transcriptLock.create({ data: { transcript_id: id, locked_by: lockedBy, locked_at: new Date(), reason } });
}
export async function getRecordSchoolId(id: string) { return (await prisma.transcriptRecord.findUnique({ where: { id } }))?.school_id; }

export async function listCourseRecords(transcriptRecordId: string) { return prisma.transcriptCourseRecord.findMany({ where: { transcript_record_id: transcriptRecordId } }); }
export async function createCourseRecord(data: any) {
  return prisma.transcriptCourseRecord.create({ data: { transcript_record_id: data.transcriptRecordId, subject_id: data.subjectId, score: data.score, grade: data.grade, grade_point: data.gradePoint, credit_hours: data.creditHours, remarks: data.remarks } });
}

export async function listGpaSummaries(schoolId: string, enrollmentId?: string) {
  const records = enrollmentId ? await prisma.transcriptRecord.findMany({ where: { school_id: schoolId, enrollment_id: enrollmentId } }) : await prisma.transcriptRecord.findMany({ where: { school_id: schoolId } });
  const enrollmentIds = [...new Set(records.map(r => r.enrollment_id))];
  return prisma.transcriptGpaSummary.findMany({ where: { enrollment_id: { in: enrollmentIds } } });
}
export async function createGpaSummary(data: any) {
  return prisma.transcriptGpaSummary.create({ data: { enrollment_id: data.enrollmentId, term_id: data.termId, term_gpa: data.termGpa, cumulative_gpa: data.cumulativeGpa, total_credits_attempted: data.totalCreditsAttempted, total_credits_earned: data.totalCreditsEarned } });
}

export async function listGraduationStatuses(schoolId: string) {
  const records = await prisma.transcriptRecord.findMany({ where: { school_id: schoolId }, select: { enrollment_id: true } });
  return prisma.transcriptGraduationStatus.findMany({ where: { enrollment_id: { in: [...new Set(records.map(r => r.enrollment_id))] } } });
}
export async function upsertGraduationStatus(data: any) {
  const existing = await prisma.transcriptGraduationStatus.findFirst({ where: { enrollment_id: data.enrollmentId } });
  if (existing) return prisma.transcriptGraduationStatus.update({ where: { id: existing.id }, data: { status: data.status, graduation_date: data.graduationDate, final_cgpa: data.finalCgpa, honours: data.honours, awarded_by: data.awardedBy } });
  return prisma.transcriptGraduationStatus.create({ data: { enrollment_id: data.enrollmentId, status: data.status, graduation_date: data.graduationDate, final_cgpa: data.finalCgpa, honours: data.honours, awarded_by: data.awardedBy } });
}

export async function listRequests(schoolId: string) { return prisma.transcriptRequest.findMany({ where: { school_id: schoolId } }); }
export async function createRequest(schoolId: string, data: any) {
  return prisma.transcriptRequest.create({ data: { school_id: schoolId, student_id: data.studentId, request_date: new Date(), purpose: data.purpose, recipient_institution: data.recipientInstitution, copies_requested: data.copiesRequested || 1, status: 'PENDING', fee_paid: !!data.feePaid } });
}
export async function updateRequestStatus(id: string, status: string) { return prisma.transcriptRequest.update({ where: { id }, data: { status: status as any } }); }
export async function getRequestSchoolId(id: string) { return (await prisma.transcriptRequest.findUnique({ where: { id } }))?.school_id; }

export async function listIssueLogs(requestId: string) { return prisma.transcriptIssueLog.findMany({ where: { request_id: requestId } }); }
export async function createIssueLog(issuedBy: string, data: any) {
  await prisma.transcriptRequest.update({ where: { id: data.requestId }, data: { status: 'ISSUED' } });
  return prisma.transcriptIssueLog.create({ data: { request_id: data.requestId, issued_by: issuedBy, issued_date: new Date(), delivery_method: data.deliveryMethod, recipient_name: data.recipientName, tracking_reference: data.trackingReference } });
}

export async function listVerifications(transcriptId?: string) { return prisma.transcriptVerification.findMany({ where: transcriptId ? { transcript_id: transcriptId } : {} }); }
export async function createVerification(data: any) {
  return prisma.transcriptVerification.create({ data: { transcript_id: data.transcriptId, verification_method: data.verificationMethod, verifying_institution: data.verifyingInstitution, verified_by: data.verifiedBy, verified_at: new Date(), is_authentic: !!data.isAuthentic } });
}

export async function listTemplates(schoolId: string) { return prisma.transcriptTemplate.findMany({ where: { school_id: schoolId } }); }
export async function createTemplate(schoolId: string, data: any) {
  return prisma.transcriptTemplate.create({ data: { school_id: schoolId, name: data.name, layout_config: data.layoutConfig || '{}', is_default: !!data.isDefault, is_active: true } });
}
export async function getTemplateSchoolId(id: string) { return (await prisma.transcriptTemplate.findUnique({ where: { id } }))?.school_id; }

export async function listGradeScales(schoolId: string) { return prisma.transcriptGradeScale.findMany({ where: { school_id: schoolId }, orderBy: { min_score: 'desc' } }); }
export async function createGradeScale(schoolId: string, data: any) {
  return prisma.transcriptGradeScale.create({ data: { school_id: schoolId, name: data.name, min_score: data.minScore, max_score: data.maxScore, grade: data.grade, grade_point: data.gradePoint } });
}
export async function getGradeScaleSchoolId(id: string) { return (await prisma.transcriptGradeScale.findUnique({ where: { id } }))?.school_id; }

export async function listAcademicStandings(schoolId: string) {
  const records = await prisma.transcriptRecord.findMany({ where: { school_id: schoolId }, select: { enrollment_id: true } });
  return prisma.transcriptAcademicStanding.findMany({ where: { enrollment_id: { in: [...new Set(records.map(r => r.enrollment_id))] } } });
}
export async function createAcademicStanding(data: any) {
  return prisma.transcriptAcademicStanding.create({ data: { enrollment_id: data.enrollmentId, term_id: data.termId, standing: data.standing, remarks: data.remarks, recorded_at: new Date() } });
}

export async function listTransferCredits(studentId?: string) { return prisma.transcriptTransferCredit.findMany({ where: studentId ? { student_id: studentId } : {} }); }
export async function createTransferCredit(approvedBy: string, data: any) {
  return prisma.transcriptTransferCredit.create({ data: { student_id: data.studentId, from_institution: data.fromInstitution, subject_name: data.subjectName, equivalent_subject_id: data.equivalentSubjectId, credit_hours: data.creditHours, grade_obtained: data.gradeObtained, approved_by: approvedBy } });
}

export async function listSignatures(transcriptId: string) { return prisma.transcriptSignature.findMany({ where: { transcript_id: transcriptId } }); }
export async function createSignature(data: any) {
  return prisma.transcriptSignature.create({ data: { transcript_id: data.transcriptId, signer_name: data.signerName, signer_position: data.signerPosition, signature_url: data.signatureUrl, signed_at: new Date() } });
}

export async function listVersions(transcriptId: string) { return prisma.transcriptVersion.findMany({ where: { transcript_id: transcriptId }, orderBy: { version_number: 'desc' } }); }
export async function createVersion(createdBy: string, data: any) {
  const latest = await prisma.transcriptVersion.findFirst({ where: { transcript_id: data.transcriptId }, orderBy: { version_number: 'desc' } });
  return prisma.transcriptVersion.create({ data: { transcript_id: data.transcriptId, version_number: (latest?.version_number || 0) + 1, snapshot: data.snapshot || '{}', created_by: createdBy, change_notes: data.changeNotes } });
}

export async function listGpaPolicies(schoolId: string) { return prisma.transcriptGpaPolicy.findMany({ where: { school_id: schoolId } }); }
export async function createGpaPolicy(schoolId: string, data: any) {
  return prisma.transcriptGpaPolicy.create({ data: { school_id: schoolId, name: data.name, calculation_method: data.calculationMethod, scale_max: data.scaleMax, is_active: true } });
}
export async function getGpaPolicySchoolId(id: string) { return (await prisma.transcriptGpaPolicy.findUnique({ where: { id } }))?.school_id; }

export async function listGraduationRequirements(schoolId: string, classId?: string) { return prisma.transcriptGraduationRequirement.findMany({ where: { school_id: schoolId, ...(classId && { class_id: classId }) } }); }
export async function createGraduationRequirement(schoolId: string, data: any) {
  return prisma.transcriptGraduationRequirement.create({ data: { school_id: schoolId, class_id: data.classId, requirement_type: data.requirementType, description: data.description, threshold_value: data.thresholdValue } });
}
export async function getGraduationRequirementSchoolId(id: string) { return (await prisma.transcriptGraduationRequirement.findUnique({ where: { id } }))?.school_id; }

export async function listAccessLogs(transcriptId: string) { return prisma.transcriptAccessLog.findMany({ where: { transcript_id: transcriptId }, orderBy: { accessed_at: 'desc' } }); }
export async function logAccess(data: any) {
  return prisma.transcriptAccessLog.create({ data: { transcript_id: data.transcriptId, accessed_by: data.accessedBy, access_method: data.accessMethod || 'PORTAL', ip_address: data.ipAddress, accessed_at: new Date() } });
}

export async function getTranscriptSummary(schoolId: string) {
  const requests = await prisma.transcriptRequest.findMany({ where: { school_id: schoolId }, select: { id: true } });
  const requestIds = requests.map(r => r.id);
  const [totalRecords, lockedRecords, pendingRequests, issuedThisMonth, graduatedCount] = await Promise.all([
    prisma.transcriptRecord.count({ where: { school_id: schoolId } }),
    prisma.transcriptRecord.count({ where: { school_id: schoolId, is_locked: true } }),
    prisma.transcriptRequest.count({ where: { school_id: schoolId, status: 'PENDING' } }),
    requestIds.length > 0
      ? prisma.transcriptIssueLog.count({ where: { request_id: { in: requestIds }, issued_date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } })
      : Promise.resolve(0),
    (async () => {
      const records = await prisma.transcriptRecord.findMany({ where: { school_id: schoolId }, select: { enrollment_id: true } });
      return prisma.transcriptGraduationStatus.count({ where: { enrollment_id: { in: [...new Set(records.map(r => r.enrollment_id))] }, status: 'GRADUATED' } });
    })(),
  ]);
  return { totalRecords, lockedRecords, pendingRequests, issuedThisMonth, graduatedCount };
}
