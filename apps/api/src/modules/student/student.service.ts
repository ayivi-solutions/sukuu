import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ── Student ──────────────────────────────────────────────
export async function listStudents(schoolId: string) {
  return prisma.studentsStudent.findMany({ where: { school_id: schoolId } });
}
export async function getStudent(id: string) {
  return prisma.studentsStudent.findUnique({ where: { id } });
}
export async function createStudent(schoolId: string, data: any) {
  return prisma.studentsStudent.create({
    data: {
      school_id: schoolId, student_id: data.studentId, first_name: data.firstName, middle_name: data.middleName,
      last_name: data.lastName, gender: data.gender, date_of_birth: data.dateOfBirth, nationality: data.nationality,
      photo_url: data.photoUrl, status: 'ACTIVE', admission_date: data.admissionDate,
    },
  });
}
export async function updateStudent(id: string, data: any, changedBy: string) {
  const current = await prisma.studentsStudent.findUnique({ where: { id } });
  const updated = await prisma.studentsStudent.update({
    where: { id },
    data: {
      ...(data.firstName && { first_name: data.firstName }), ...(data.middleName !== undefined && { middle_name: data.middleName }),
      ...(data.lastName && { last_name: data.lastName }), ...(data.gender && { gender: data.gender }),
      ...(data.nationality && { nationality: data.nationality }), ...(data.photoUrl !== undefined && { photo_url: data.photoUrl }),
      ...(data.status && { status: data.status }),
    },
  });
  if (data.status && current && data.status !== current.status) {
    await prisma.studentsStatusHistory.create({
      data: { student_id: id, from_status: current.status, to_status: data.status, reason: data.statusReason, changed_by: changedBy, changed_at: new Date() },
    });
  }
  return updated;
}
export async function archiveStudent(id: string, changedBy: string, reason?: string) {
  const current = await prisma.studentsStudent.findUnique({ where: { id } });
  const updated = await prisma.studentsStudent.update({ where: { id }, data: { status: 'WITHDRAWN' } });
  await prisma.studentsStatusHistory.create({
    data: { student_id: id, from_status: current?.status || '', to_status: 'WITHDRAWN', reason, changed_by: changedBy, changed_at: new Date() },
  });
  return updated;
}

// ── Guardian ─────────────────────────────────────────────
export async function listGuardians(studentId: string) {
  return prisma.studentsGuardian.findMany({ where: { student_id: studentId, archived_at: null } });
}
export async function createGuardian(studentId: string, schoolId: string, data: any) {
  return prisma.studentsGuardian.create({
    data: { student_id: studentId, school_id: schoolId, full_name: data.fullName, relationship: data.relationship, phone: data.phone, email: data.email, occupation: data.occupation, is_primary: !!data.isPrimary, is_financial_responsible: !!data.isFinancialResponsible, has_portal_access: !!data.hasPortalAccess },
  });
}
export async function updateGuardian(id: string, data: any) {
  return prisma.studentsGuardian.update({ where: { id }, data });
}
export async function archiveGuardian(id: string) {
  return prisma.studentsGuardian.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Enrollment ───────────────────────────────────────────
export async function listEnrollments(studentId: string) {
  return prisma.studentsEnrollment.findMany({ where: { student_id: studentId } });
}
export async function createEnrollment(studentId: string, schoolId: string, data: any) {
  return prisma.studentsEnrollment.create({
    data: { student_id: studentId, school_id: schoolId, academic_year_id: data.academicYearId, class_id: data.classId, stream_id: data.streamId, admission_date: data.admissionDate, enrollment_status: data.enrollmentStatus || 'ACTIVE', roll_number: data.rollNumber },
  });
}
export async function updateEnrollment(id: string, data: any) {
  return prisma.studentsEnrollment.update({ where: { id }, data: { ...(data.enrollmentStatus && { enrollment_status: data.enrollmentStatus }), ...(data.rollNumber !== undefined && { roll_number: data.rollNumber }) } });
}

// ── Medical (1:1 upsert) ─────────────────────────────────
export async function getMedical(studentId: string) {
  return prisma.studentsMedical.findFirst({ where: { student_id: studentId } });
}
export async function upsertMedical(studentId: string, data: any) {
  const existing = await prisma.studentsMedical.findFirst({ where: { student_id: studentId } });
  const payload = {
    blood_group: data.bloodGroup, allergies: data.allergies, chronic_conditions: data.chronicConditions,
    current_medications: data.currentMedications, emergency_contact_name: data.emergencyContactName,
    emergency_contact_phone: data.emergencyContactPhone, emergency_contact_relationship: data.emergencyContactRelationship,
    notes: data.notes,
  };
  if (existing) return prisma.studentsMedical.update({ where: { id: existing.id }, data: payload });
  return prisma.studentsMedical.create({ data: { student_id: studentId, ...payload } });
}

// ── Documents (append-only) ──────────────────────────────
export async function listDocuments(studentId: string) {
  return prisma.studentsDocument.findMany({ where: { student_id: studentId } });
}
export async function createDocument(studentId: string, data: any, uploadedBy: string) {
  return prisma.studentsDocument.create({ data: { student_id: studentId, document_type: data.documentType, file_url: data.fileUrl, upload_date: new Date(), uploaded_by: uploadedBy } });
}

// ── Status History (read-only, auto-written) ────────────
export async function listStatusHistory(studentId: string) {
  return prisma.studentsStatusHistory.findMany({ where: { student_id: studentId }, orderBy: { changed_at: 'desc' } });
}

// ── Transfers (append-only) ──────────────────────────────
export async function listTransfers(studentId: string) {
  return prisma.studentsTransfer.findMany({ where: { student_id: studentId } });
}
export async function createTransfer(studentId: string, data: any) {
  return prisma.studentsTransfer.create({ data: { student_id: studentId, transfer_type: data.transferType, from_school: data.fromSchool, to_school: data.toSchool, transfer_date: data.transferDate, reason: data.reason, transfer_letter_url: data.transferLetterUrl } });
}

// ── Graduation (append-only) ─────────────────────────────
export async function listGraduations(studentId: string) {
  return prisma.studentsGraduation.findMany({ where: { student_id: studentId } });
}
export async function createGraduation(studentId: string, schoolId: string, data: any) {
  return prisma.studentsGraduation.create({ data: { student_id: studentId, school_id: schoolId, graduation_date: data.graduationDate, final_class_id: data.finalClassId, final_gpa: data.finalGpa, honours: data.honours, certificate_url: data.certificateUrl } });
}

// ── Addresses ────────────────────────────────────────────
export async function listAddresses(studentId: string) {
  return prisma.studentsAddress.findMany({ where: { student_id: studentId, archived_at: null } });
}
export async function createAddress(studentId: string, data: any) {
  return prisma.studentsAddress.create({ data: { student_id: studentId, address_type: data.addressType, street: data.street, city: data.city, region: data.region, digital_address: data.digitalAddress, is_primary: !!data.isPrimary } });
}
export async function archiveAddress(id: string) {
  return prisma.studentsAddress.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Contacts ─────────────────────────────────────────────
export async function listContacts(studentId: string) {
  return prisma.studentsContact.findMany({ where: { student_id: studentId, archived_at: null } });
}
export async function createContact(studentId: string, data: any) {
  return prisma.studentsContact.create({ data: { student_id: studentId, contact_type: data.contactType, value: data.value, label: data.label } });
}
export async function archiveContact(id: string) {
  return prisma.studentsContact.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Identity Documents ───────────────────────────────────
export async function listIdentityDocuments(studentId: string) {
  return prisma.studentsIdentityDocument.findMany({ where: { student_id: studentId, archived_at: null } });
}
export async function createIdentityDocument(studentId: string, data: any) {
  return prisma.studentsIdentityDocument.create({ data: { student_id: studentId, document_type: data.documentType, document_number: data.documentNumber, issue_date: data.issueDate, expiry_date: data.expiryDate, verified: !!data.verified } });
}
export async function archiveIdentityDocument(id: string) {
  return prisma.studentsIdentityDocument.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Health Incidents (append-only) ───────────────────────
export async function listHealthIncidents(studentId: string) {
  return prisma.studentsHealthIncident.findMany({ where: { student_id: studentId } });
}
export async function createHealthIncident(studentId: string, schoolId: string, data: any, recordedBy: string) {
  return prisma.studentsHealthIncident.create({ data: { student_id: studentId, school_id: schoolId, incident_date: new Date(), description: data.description, action_taken: data.actionTaken, parent_notified: !!data.parentNotified, recorded_by: recordedBy } });
}

// ── Behavior Profile (append-only) ───────────────────────
export async function listBehaviorRecords(studentId: string) {
  return prisma.studentsBehaviorProfile.findMany({ where: { student_id: studentId } });
}
export async function createBehaviorRecord(studentId: string, data: any, recordedBy: string) {
  return prisma.studentsBehaviorProfile.create({ data: { student_id: studentId, record_type: data.recordType, description: data.description, action_taken: data.actionTaken, recorded_by: recordedBy, incident_date: data.incidentDate, parent_notified: !!data.parentNotified } });
}

// ── Attendance Summary (upsert per term) ─────────────────
export async function listAttendanceSummaries(studentId: string) {
  return prisma.studentsAttendanceSummary.findMany({ where: { student_id: studentId } });
}
export async function upsertAttendanceSummary(studentId: string, data: any) {
  const existing = await prisma.studentsAttendanceSummary.findFirst({ where: { student_id: studentId, term_id: data.termId } });
  const payload = { total_school_days: data.totalSchoolDays, days_present: data.daysPresent, days_absent: data.daysAbsent, days_late: data.daysLate, attendance_pct: data.attendancePct };
  if (existing) return prisma.studentsAttendanceSummary.update({ where: { id: existing.id }, data: payload });
  return prisma.studentsAttendanceSummary.create({ data: { student_id: studentId, term_id: data.termId, ...payload } });
}

// ── Fee Profile ──────────────────────────────────────────
export async function listFeeProfiles(studentId: string) {
  return prisma.studentsFeeProfile.findMany({ where: { student_id: studentId, archived_at: null } });
}
export async function createFeeProfile(studentId: string, data: any) {
  return prisma.studentsFeeProfile.create({ data: { student_id: studentId, fee_structure_id: data.feeStructureId, scholarship_id: data.scholarshipId, discount_id: data.discountId, notes: data.notes, assigned_at: new Date() } });
}
export async function archiveFeeProfile(id: string) {
  return prisma.studentsFeeProfile.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Portal Access (1:1 toggle) ───────────────────────────
export async function getPortalAccess(studentId: string) {
  return prisma.studentsPortalAccess.findFirst({ where: { student_id: studentId } });
}
export async function togglePortalAccess(studentId: string, userId: string, isEnabled: boolean) {
  const existing = await prisma.studentsPortalAccess.findFirst({ where: { student_id: studentId } });
  if (existing) return prisma.studentsPortalAccess.update({ where: { id: existing.id }, data: { is_enabled: isEnabled, ...(isEnabled && { enabled_at: new Date() }) } });
  return prisma.studentsPortalAccess.create({ data: { student_id: studentId, user_id: userId, is_enabled: isEnabled, enabled_at: isEnabled ? new Date() : null } });
}

// ── Notes (append-only) ──────────────────────────────────
export async function listNotes(studentId: string) {
  return prisma.studentsNotes.findMany({ where: { student_id: studentId } });
}
export async function createNote(studentId: string, data: any, createdBy: string) {
  return prisma.studentsNotes.create({ data: { student_id: studentId, note: data.note, category: data.category, is_confidential: !!data.isConfidential, created_by: createdBy } });
}

// ── Tags ─────────────────────────────────────────────────
export async function listTags(studentId: string) {
  return prisma.studentsTag.findMany({ where: { student_id: studentId, archived_at: null } });
}
export async function createTag(studentId: string, data: any, taggedBy: string) {
  return prisma.studentsTag.create({ data: { student_id: studentId, tag: data.tag, tagged_by: taggedBy, tagged_at: new Date() } });
}
export async function archiveTag(id: string) {
  return prisma.studentsTag.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Scholarship ──────────────────────────────────────────
export async function listScholarships(studentId: string) {
  return prisma.studentsScholarship.findMany({ where: { student_id: studentId, archived_at: null } });
}
export async function createScholarship(studentId: string, data: any) {
  return prisma.studentsScholarship.create({ data: { student_id: studentId, scholarship_name: data.scholarshipName, sponsor: data.sponsor, coverage_type: data.coverageType, coverage_pct: data.coveragePct, start_date: data.startDate, end_date: data.endDate } });
}
export async function archiveScholarship(id: string) {
  return prisma.studentsScholarship.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── House ────────────────────────────────────────────────
export async function listHouses(studentId: string) {
  return prisma.studentsHouse.findMany({ where: { student_id: studentId } });
}
export async function assignHouse(studentId: string, schoolId: string, houseName: string) {
  await prisma.studentsHouse.updateMany({ where: { student_id: studentId, is_current: true }, data: { is_current: false } });
  return prisma.studentsHouse.create({ data: { student_id: studentId, school_id: schoolId, house_name: houseName, assigned_at: new Date(), is_current: true } });
}

// ── Transport Assignment ─────────────────────────────────
export async function listTransportAssignments(studentId: string) {
  return prisma.studentsTransportAssignment.findMany({ where: { student_id: studentId } });
}
export async function createTransportAssignment(studentId: string, data: any) {
  return prisma.studentsTransportAssignment.create({ data: { student_id: studentId, route_name: data.routeName, pickup_point: data.pickupPoint, dropoff_point: data.dropoffPoint, is_active: true, assigned_at: new Date() } });
}
export async function toggleTransportAssignment(id: string, isActive: boolean) {
  return prisma.studentsTransportAssignment.update({ where: { id }, data: { is_active: isActive } });
}
