import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { logAuditEvent } from '../system/system.service';
import * as svc from './staffx.service';

async function assertOwnership(req: AuthRequest, staffId: string | undefined): Promise<boolean> {
  if (!staffId || !req.schoolId) return false;
  return svc.verifyStaffInSchool(staffId, req.schoolId);
}
const fromParamsSid = async (req: AuthRequest) => req.params.staffId;

function wrap(resolveSid: (req: AuthRequest) => Promise<string | undefined>, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const sid = await resolveSid(req);
      if (!(await assertOwnership(req, sid))) return res.status(403).json({ error: 'Not authorized for this staff record' });
      res.json(await fn(req));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapNoCheck(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try { res.json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapCreate(action: string, resolveSid: (req: AuthRequest) => Promise<string | undefined>, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const sid = await resolveSid(req);
      if (!(await assertOwnership(req, sid))) return res.status(403).json({ error: 'Not authorized for this staff record' });
      const result = await fn(req);
      if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', action, 'staff', result?.id);
      res.status(201).json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapCreateNoCheck(action: string, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const result = await fn(req);
      if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', action, 'staff', result?.id);
      res.status(201).json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapMutate(action: string, resolveSid: (req: AuthRequest) => Promise<string | undefined>, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const sid = await resolveSid(req);
      if (!(await assertOwnership(req, sid))) return res.status(403).json({ error: 'Not authorized for this staff record' });
      const result = await fn(req);
      if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', action, 'staff', req.params.id || req.params.staffId);
      res.json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}

export const getStaffList = wrapNoCheck(req => svc.listStaff(req.schoolId || ''));
export const getStaffMember = wrap(fromParamsSid, req => svc.getStaffMember(req.params.staffId));
export const postStaffMember = wrapCreateNoCheck('CREATE_STAFF', req => svc.createStaffMember(req.schoolId || '', req.body.userId || '', req.body));
export const patchStaffMember = wrapMutate('UPDATE_STAFF', fromParamsSid, req => svc.updateStaffMember(req.params.staffId, req.body));
export const patchArchiveStaffMember = wrapMutate('ARCHIVE_STAFF', fromParamsSid, req => svc.archiveStaffMember(req.params.staffId));

export const getEmployments = wrap(fromParamsSid, req => svc.listEmployments(req.params.staffId));
export const postEmployment = wrapCreate('CREATE_EMPLOYMENT', fromParamsSid, req => svc.createEmployment(req.params.staffId, req.schoolId || '', req.body));
export const patchEmployment = wrapMutate('UPDATE_EMPLOYMENT', fromParamsSid, req => svc.updateEmployment(req.params.id, req.body));

export const getRoles = wrapNoCheck(req => svc.listRoles(req.schoolId || ''));
export const postRole = wrapCreateNoCheck('CREATE_STAFF_ROLE', req => svc.createRole(req.schoolId || '', req.body));
export const patchArchiveRole = async (req: AuthRequest, res: Response) => {
  try {
    const roleSchoolId = await svc.getRoleSchoolId(req.params.id);
    if (!roleSchoolId || roleSchoolId !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this role' });
    const result = await svc.archiveRole(req.params.id);
    if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'ARCHIVE_STAFF_ROLE', 'staff', req.params.id);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};
export const patchRole = async (req: AuthRequest, res: Response) => {
  try {
    const roleSchoolId = await svc.getRoleSchoolId(req.params.id);
    if (!roleSchoolId || roleSchoolId !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this role' });
    const result = await svc.updateRole(req.params.id, req.body);
    if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'UPDATE_STAFF_ROLE', 'staff', req.params.id);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getDepartmentAssignments = wrap(fromParamsSid, req => svc.listDepartmentAssignments(req.params.staffId));
export const postDepartmentAssignment = wrapCreate('CREATE_DEPT_ASSIGNMENT', fromParamsSid, req => svc.createDepartmentAssignment(req.params.staffId, req.body));

export const getSubjectAssignments = wrap(fromParamsSid, req => svc.listSubjectAssignments(req.params.staffId));
export const postSubjectAssignment = wrapCreate('CREATE_STAFF_SUBJECT_ASSIGNMENT', fromParamsSid, req => svc.createSubjectAssignment(req.params.staffId, req.schoolId || '', req.body));
export const patchArchiveSubjectAssignment = wrapMutate('ARCHIVE_STAFF_SUBJECT_ASSIGNMENT', fromParamsSid, req => svc.archiveSubjectAssignment(req.params.id));

export const getDocuments = wrap(fromParamsSid, req => svc.listDocuments(req.params.staffId));
export const postDocument = wrapCreate('CREATE_STAFF_DOCUMENT', fromParamsSid, req => svc.createDocument(req.params.staffId, req.body, req.userId || ''));

export const getQualifications = wrap(fromParamsSid, req => svc.listQualifications(req.params.staffId));
export const postQualification = wrapCreate('CREATE_QUALIFICATION', fromParamsSid, req => svc.createQualification(req.params.staffId, req.body));
export const patchVerifyQualification = wrapMutate('VERIFY_QUALIFICATION', fromParamsSid, req => svc.verifyQualification(req.params.id, !!req.body.isVerified));
export const patchArchiveQualification = wrapMutate('ARCHIVE_QUALIFICATION', fromParamsSid, req => svc.archiveQualification(req.params.id));

export const getCompliance = wrap(fromParamsSid, req => svc.listCompliance(req.params.staffId));
export const postCompliance = wrapCreate('CREATE_COMPLIANCE', fromParamsSid, req => svc.createCompliance(req.params.staffId, req.body));
export const patchCompliance = wrapMutate('UPDATE_COMPLIANCE', fromParamsSid, req => svc.updateCompliance(req.params.id, req.body));
export const patchArchiveCompliance = wrapMutate('ARCHIVE_COMPLIANCE', fromParamsSid, req => svc.archiveCompliance(req.params.id));

export const getLeaveForStaff = wrap(fromParamsSid, req => svc.listLeaveForStaff(req.params.staffId));
export const getAllLeave = wrapNoCheck(req => svc.listAllLeave(req.schoolId || ''));
export const postLeaveRequest = wrapCreate('CREATE_LEAVE_REQUEST', fromParamsSid, req => svc.createLeaveRequest(req.params.staffId, req.body));
export const patchDecideLeave = async (req: AuthRequest, res: Response) => {
  try {
    const leaveStaffId = await svc.getLeaveStaffId(req.params.id);
    if (!leaveStaffId || !req.schoolId || !(await svc.verifyStaffInSchool(leaveStaffId, req.schoolId))) return res.status(403).json({ error: 'Not authorized for this leave request' });
    const result = await svc.decideLeave(req.params.id, req.body.decision, req.userId || '', req.body.comments);
    if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', `LEAVE_${req.body.decision}`, 'staff', req.params.id);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};
export const getLeaveApprovals = wrap(async (req) => svc.getLeaveStaffId(req.params.id) as any, req => svc.listLeaveApprovals(req.params.id));

export const getAttendance = wrap(fromParamsSid, req => svc.listAttendance(req.params.staffId));
export const postCheckIn = wrapCreate('STAFF_CHECK_IN', fromParamsSid, req => svc.checkIn(req.params.staffId, req.body.date));
export const postCheckOut = wrapCreate('STAFF_CHECK_OUT', fromParamsSid, req => svc.checkOut(req.params.staffId, req.body.date));

export const getBankDetails = wrap(fromParamsSid, req => svc.listBankDetails(req.params.staffId));
export const postBankDetails = wrapCreate('CREATE_BANK_DETAILS', fromParamsSid, req => svc.createBankDetails(req.params.staffId, req.body));
export const patchBankDetails = wrapMutate('UPDATE_BANK_DETAILS', fromParamsSid, req => svc.updateBankDetails(req.params.id, req.body));
export const patchArchiveBankDetails = wrapMutate('ARCHIVE_BANK_DETAILS', fromParamsSid, req => svc.archiveBankDetails(req.params.id));

export const getEmergencyContacts = wrap(fromParamsSid, req => svc.listEmergencyContacts(req.params.staffId));
export const postEmergencyContact = wrapCreate('CREATE_EMERGENCY_CONTACT', fromParamsSid, req => svc.createEmergencyContact(req.params.staffId, req.body));
export const patchEmergencyContact = wrapMutate('UPDATE_EMERGENCY_CONTACT', fromParamsSid, req => svc.updateEmergencyContact(req.params.id, req.body));
export const patchArchiveEmergencyContact = wrapMutate('ARCHIVE_EMERGENCY_CONTACT', fromParamsSid, req => svc.archiveEmergencyContact(req.params.id));

export const getContracts = wrap(fromParamsSid, req => svc.listContracts(req.params.staffId));
export const postContract = wrapCreate('CREATE_CONTRACT', fromParamsSid, req => svc.createContract(req.params.staffId, req.body));
export const patchContract = wrapMutate('UPDATE_CONTRACT', fromParamsSid, req => svc.updateContract(req.params.id, req.body));

export const getDisciplinaryRecords = wrap(fromParamsSid, req => svc.listDisciplinaryRecords(req.params.staffId));
export const postDisciplinaryRecord = wrapCreate('CREATE_DISCIPLINARY_RECORD', fromParamsSid, req => svc.createDisciplinaryRecord(req.params.staffId, req.body, req.userId || ''));

export const getPerformanceReviews = wrap(fromParamsSid, req => svc.listPerformanceReviews(req.params.staffId));
export const postPerformanceReview = wrapCreate('CREATE_PERFORMANCE_REVIEW', fromParamsSid, req => svc.createPerformanceReview(req.params.staffId, req.body, req.userId || ''));

export const getTraining = wrap(fromParamsSid, req => svc.listTraining(req.params.staffId));
export const postTraining = wrapCreate('CREATE_TRAINING', fromParamsSid, req => svc.createTraining(req.params.staffId, req.body));

export const getLeaveBalances = wrap(fromParamsSid, req => svc.listLeaveBalances(req.params.staffId));
export const putLeaveBalance = wrapMutate('UPDATE_LEAVE_BALANCE', fromParamsSid, req => svc.upsertLeaveBalance(req.params.staffId, req.body));

export const getExitRecords = wrap(fromParamsSid, req => svc.listExitRecords(req.params.staffId));
export const postExitRecord = wrapCreate('CREATE_EXIT_RECORD', fromParamsSid, req => svc.createExitRecord(req.params.staffId, req.body));

export const patchDepartmentAssignment = wrapMutate('UPDATE_DEPT_ASSIGNMENT', fromParamsSid, req => svc.updateDepartmentAssignment(req.params.id, req.body));
export const patchQualificationDetails = wrapMutate('UPDATE_QUALIFICATION', fromParamsSid, req => svc.updateQualificationDetails(req.params.id, req.body));
