import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ── Multi-tenancy guard ──────────────────────────────────
export async function verifyStaffInSchool(staffId: string, schoolId: string): Promise<boolean> {
  const staff = await prisma.staffStaff.findUnique({ where: { id: staffId } });
  return !!staff && staff.school_id === schoolId;
}

// ── Staff ────────────────────────────────────────────────
export async function listStaff(schoolId: string) {
  return prisma.staffStaff.findMany({ where: { school_id: schoolId } });
}
export async function getStaffMember(id: string) {
  return prisma.staffStaff.findUnique({ where: { id } });
}
export async function createStaffMember(schoolId: string, userId: string, data: any) {
  return prisma.staffStaff.create({
    data: {
      school_id: schoolId, staff_id: data.staffId, user_id: userId, first_name: data.firstName, last_name: data.lastName,
      gender: data.gender, date_of_birth: data.dateOfBirth, phone: data.phone, email: data.email, address: data.address,
      ssnit_id: data.ssnitId, tax_identification_number: data.tin, employment_status: 'ACTIVE',
    },
  });
}
export async function updateStaffMember(id: string, data: any) {
  return prisma.staffStaff.update({
    where: { id },
    data: { ...(data.firstName && { first_name: data.firstName }), ...(data.lastName && { last_name: data.lastName }), ...(data.phone && { phone: data.phone }), ...(data.email && { email: data.email }), ...(data.address !== undefined && { address: data.address }), ...(data.employmentStatus && { employment_status: data.employmentStatus }) },
  });
}
export async function archiveStaffMember(id: string) {
  return prisma.staffStaff.update({ where: { id }, data: { employment_status: 'TERMINATED' } });
}

// ── Employment ───────────────────────────────────────────
export async function listEmployments(staffId: string) {
  return prisma.staffEmployment.findMany({ where: { staff_id: staffId } });
}
export async function createEmployment(staffId: string, schoolId: string, data: any) {
  await prisma.staffEmployment.updateMany({ where: { staff_id: staffId, is_current: true }, data: { is_current: false } });
  return prisma.staffEmployment.create({ data: { staff_id: staffId, school_id: schoolId, role_id: data.roleId, department_id: data.departmentId, employment_type: data.employmentType, start_date: data.startDate, is_current: true } });
}
export async function updateEmployment(id: string, data: any) {
  return prisma.staffEmployment.update({ where: { id }, data: { ...(data.endDate !== undefined && { end_date: data.endDate }), ...(data.isCurrent !== undefined && { is_current: data.isCurrent }) } });
}

// ── Roles ────────────────────────────────────────────────
export async function listRoles(schoolId: string) {
  return prisma.staffRole.findMany({ where: { school_id: schoolId, archived_at: null } });
}
export async function createRole(schoolId: string, data: any) {
  return prisma.staffRole.create({ data: { school_id: schoolId, name: data.name, category: data.category, description: data.description } });
}
export async function archiveRole(id: string) {
  return prisma.staffRole.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Department Assignment ───────────────────────────────
export async function listDepartmentAssignments(staffId: string) {
  return prisma.staffDepartmentAssignment.findMany({ where: { staff_id: staffId } });
}
export async function createDepartmentAssignment(staffId: string, data: any) {
  await prisma.staffDepartmentAssignment.updateMany({ where: { staff_id: staffId, is_current: true }, data: { is_current: false } });
  return prisma.staffDepartmentAssignment.create({ data: { staff_id: staffId, department_id: data.departmentId, role_in_department: data.roleInDepartment, assigned_at: new Date(), is_current: true } });
}

// ── Subject Assignment ───────────────────────────────────
export async function listSubjectAssignments(staffId: string) {
  return prisma.staffSubjectAssignment.findMany({ where: { staff_id: staffId, archived_at: null } });
}
export async function createSubjectAssignment(staffId: string, schoolId: string, data: any) {
  return prisma.staffSubjectAssignment.create({ data: { staff_id: staffId, subject_id: data.subjectId, school_id: schoolId, academic_year_id: data.academicYearId, assigned_at: new Date() } });
}
export async function archiveSubjectAssignment(id: string) {
  return prisma.staffSubjectAssignment.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Documents ─────────────────────────────────────────────
export async function listDocuments(staffId: string) {
  return prisma.staffDocument.findMany({ where: { staff_id: staffId } });
}
export async function createDocument(staffId: string, data: any, uploadedBy: string) {
  return prisma.staffDocument.create({ data: { staff_id: staffId, document_type: data.documentType, file_url: data.fileUrl, uploaded_by: uploadedBy } });
}

// ── Qualifications ────────────────────────────────────────
export async function listQualifications(staffId: string) {
  return prisma.staffQualification.findMany({ where: { staff_id: staffId, archived_at: null } });
}
export async function createQualification(staffId: string, data: any) {
  return prisma.staffQualification.create({ data: { staff_id: staffId, qualification_type: data.qualificationType, title: data.title, institution: data.institution, year_obtained: data.yearObtained, is_verified: false } });
}
export async function verifyQualification(id: string, isVerified: boolean) {
  return prisma.staffQualification.update({ where: { id }, data: { is_verified: isVerified } });
}
export async function archiveQualification(id: string) {
  return prisma.staffQualification.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Compliance ────────────────────────────────────────────
export async function listCompliance(staffId: string) {
  return prisma.staffCompliance.findMany({ where: { staff_id: staffId, archived_at: null } });
}
export async function createCompliance(staffId: string, data: any) {
  return prisma.staffCompliance.create({ data: { staff_id: staffId, compliance_type: data.complianceType, status: data.status || 'PENDING', issue_date: data.issueDate, expiry_date: data.expiryDate, document_url: data.documentUrl } });
}
export async function updateCompliance(id: string, data: any) {
  return prisma.staffCompliance.update({ where: { id }, data: { ...(data.status && { status: data.status }), ...(data.expiryDate !== undefined && { expiry_date: data.expiryDate }) } });
}
export async function archiveCompliance(id: string) {
  return prisma.staffCompliance.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Leave ─────────────────────────────────────────────────
export async function listLeaveForStaff(staffId: string) {
  return prisma.staffLeave.findMany({ where: { staff_id: staffId } });
}
export async function listAllLeave(schoolId: string) {
  const staffIds = (await prisma.staffStaff.findMany({ where: { school_id: schoolId }, select: { id: true } })).map(s => s.id);
  return prisma.staffLeave.findMany({ where: { staff_id: { in: staffIds } }, orderBy: { id: 'desc' } });
}
export async function createLeaveRequest(staffId: string, data: any) {
  return prisma.staffLeave.create({ data: { staff_id: staffId, leave_type: data.leaveType, start_date: data.startDate, end_date: data.endDate, days_requested: data.daysRequested, reason: data.reason, status: 'PENDING' } });
}
export async function decideLeave(id: string, decision: 'APPROVED' | 'REJECTED', approvedBy: string, comments?: string) {
  const updated = await prisma.staffLeave.update({ where: { id }, data: { status: decision } });
  await prisma.staffLeaveApproval.create({ data: { leave_id: id, approved_by: approvedBy, decision, decision_date: new Date(), comments } });
  return updated;
}

// ── Attendance ────────────────────────────────────────────
export async function listAttendance(staffId: string) {
  return prisma.staffAttendance.findMany({ where: { staff_id: staffId }, orderBy: { date: 'desc' } });
}
export async function checkIn(staffId: string, date: string) {
  const existing = await prisma.staffAttendance.findFirst({ where: { staff_id: staffId, date } });
  if (existing) return prisma.staffAttendance.update({ where: { id: existing.id }, data: { check_in: new Date(), status: 'PRESENT' } });
  return prisma.staffAttendance.create({ data: { staff_id: staffId, date, check_in: new Date(), status: 'PRESENT' } });
}
export async function checkOut(staffId: string, date: string) {
  const existing = await prisma.staffAttendance.findFirst({ where: { staff_id: staffId, date } });
  if (existing) return prisma.staffAttendance.update({ where: { id: existing.id }, data: { check_out: new Date() } });
  return prisma.staffAttendance.create({ data: { staff_id: staffId, date, check_out: new Date(), status: 'PRESENT' } });
}

// ── Bank Details ──────────────────────────────────────────
export async function listBankDetails(staffId: string) {
  return prisma.staffBankDetails.findMany({ where: { staff_id: staffId, archived_at: null } });
}
export async function createBankDetails(staffId: string, data: any) {
  return prisma.staffBankDetails.create({ data: { staff_id: staffId, bank_name: data.bankName, account_number: data.accountNumber, account_name: data.accountName, account_type: data.accountType, mobile_money_number: data.mobileMoneyNumber, is_primary: !!data.isPrimary } });
}
export async function updateBankDetails(id: string, data: any) {
  return prisma.staffBankDetails.update({ where: { id }, data: { ...(data.accountNumber && { account_number: data.accountNumber }), ...(data.isPrimary !== undefined && { is_primary: data.isPrimary }) } });
}
export async function archiveBankDetails(id: string) {
  return prisma.staffBankDetails.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Emergency Contact ─────────────────────────────────────
export async function listEmergencyContacts(staffId: string) {
  return prisma.staffEmergencyContact.findMany({ where: { staff_id: staffId, archived_at: null } });
}
export async function createEmergencyContact(staffId: string, data: any) {
  return prisma.staffEmergencyContact.create({ data: { staff_id: staffId, name: data.name, relationship: data.relationship, phone: data.phone, address: data.address } });
}
export async function updateEmergencyContact(id: string, data: any) {
  return prisma.staffEmergencyContact.update({ where: { id }, data: { ...(data.phone && { phone: data.phone }), ...(data.address !== undefined && { address: data.address }) } });
}
export async function archiveEmergencyContact(id: string) {
  return prisma.staffEmergencyContact.update({ where: { id }, data: { archived_at: new Date() } });
}

// ── Contract ──────────────────────────────────────────────
export async function listContracts(staffId: string) {
  return prisma.staffContract.findMany({ where: { staff_id: staffId } });
}
export async function createContract(staffId: string, data: any) {
  return prisma.staffContract.create({ data: { staff_id: staffId, contract_type: data.contractType, start_date: data.startDate, end_date: data.endDate, salary_agreed: data.salaryAgreed, probation_end_date: data.probationEndDate, status: 'ACTIVE' } });
}
export async function updateContract(id: string, data: any) {
  return prisma.staffContract.update({ where: { id }, data: { ...(data.status && { status: data.status }), ...(data.endDate !== undefined && { end_date: data.endDate }) } });
}

// ── Disciplinary ──────────────────────────────────────────
export async function listDisciplinaryRecords(staffId: string) {
  return prisma.staffDisciplinaryRecord.findMany({ where: { staff_id: staffId } });
}
export async function createDisciplinaryRecord(staffId: string, data: any, recordedBy: string) {
  return prisma.staffDisciplinaryRecord.create({ data: { staff_id: staffId, incident_date: data.incidentDate, incident_type: data.incidentType, description: data.description, action_taken: data.actionTaken, recorded_by: recordedBy, recorded_at: new Date() } });
}

// ── Performance Review ────────────────────────────────────
export async function listPerformanceReviews(staffId: string) {
  return prisma.staffPerformanceReview.findMany({ where: { staff_id: staffId } });
}
export async function createPerformanceReview(staffId: string, data: any, reviewerId: string) {
  return prisma.staffPerformanceReview.create({ data: { staff_id: staffId, reviewer_id: reviewerId, review_period: data.reviewPeriod, overall_rating: data.overallRating, comments: data.comments, review_date: data.reviewDate, staff_acknowledged: false } });
}

// ── Training ──────────────────────────────────────────────
export async function listTraining(staffId: string) {
  return prisma.staffTraining.findMany({ where: { staff_id: staffId } });
}
export async function createTraining(staffId: string, data: any) {
  return prisma.staffTraining.create({ data: { staff_id: staffId, training_name: data.trainingName, provider: data.provider, training_type: data.trainingType, start_date: data.startDate, end_date: data.endDate, cost: data.cost } });
}

// ── Leave Balance ─────────────────────────────────────────
export async function listLeaveBalances(staffId: string) {
  return prisma.staffLeaveBalance.findMany({ where: { staff_id: staffId } });
}
export async function upsertLeaveBalance(staffId: string, data: any) {
  const existing = await prisma.staffLeaveBalance.findFirst({ where: { staff_id: staffId, leave_type: data.leaveType, year: data.year } });
  const payload = { entitlement_days: data.entitlementDays, used_days: data.usedDays, remaining_days: data.entitlementDays - data.usedDays };
  if (existing) return prisma.staffLeaveBalance.update({ where: { id: existing.id }, data: payload });
  return prisma.staffLeaveBalance.create({ data: { staff_id: staffId, leave_type: data.leaveType, year: data.year, ...payload } });
}

// ── Exit Record ───────────────────────────────────────────
export async function listExitRecords(staffId: string) {
  return prisma.staffExitRecord.findMany({ where: { staff_id: staffId } });
}
export async function createExitRecord(staffId: string, data: any) {
  return prisma.staffExitRecord.create({ data: { staff_id: staffId, exit_type: data.exitType, exit_date: data.exitDate, notice_given: !!data.noticeGiven, reason: data.reason, clearance_complete: false } });
}
