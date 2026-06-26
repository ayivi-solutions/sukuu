import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { logAuditEvent } from '../system/system.service';
import * as svc from './student.service';

async function assertOwnership(req: AuthRequest, studentId: string | undefined): Promise<boolean> {
  if (!studentId || !req.schoolId) return false;
  return svc.verifyStudentInSchool(studentId, req.schoolId);
}

function wrap(resolveSid: (req: AuthRequest) => Promise<string | undefined>, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const sid = await resolveSid(req);
      if (!(await assertOwnership(req, sid))) return res.status(403).json({ error: 'Not authorized for this student record' });
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
      if (!(await assertOwnership(req, sid))) return res.status(403).json({ error: 'Not authorized for this student record' });
      const result = await fn(req);
      if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', action, 'students', result?.id);
      res.status(201).json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapCreateNoCheck(action: string, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const result = await fn(req);
      if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', action, 'students', result?.id);
      res.status(201).json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapMutate(action: string, resolveSid: (req: AuthRequest) => Promise<string | undefined>, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const sid = await resolveSid(req);
      if (!(await assertOwnership(req, sid))) return res.status(403).json({ error: 'Not authorized for this student record' });
      const result = await fn(req);
      if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', action, 'students', req.params.id || req.params.studentId);
      res.json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}

const fromParamsSid = async (req: AuthRequest) => req.params.studentId;

export const getStudents = wrapNoCheck(req => svc.listStudents(req.schoolId || ''));
export const getStudent = wrap(fromParamsSid, req => svc.getStudent(req.params.studentId));
export const postStudent = wrapCreateNoCheck('CREATE_STUDENT', req => svc.createStudent(req.schoolId || '', req.body));
export const patchStudent = wrapMutate('UPDATE_STUDENT', fromParamsSid, req => svc.updateStudent(req.params.studentId, req.body, req.userId || ''));
export const patchArchiveStudent = wrapMutate('ARCHIVE_STUDENT', fromParamsSid, req => svc.archiveStudent(req.params.studentId, req.userId || '', req.body?.reason));

export const getGuardians = wrap(fromParamsSid, req => svc.listGuardians(req.params.studentId));
export const postGuardian = wrapCreate('CREATE_GUARDIAN', fromParamsSid, req => svc.createGuardian(req.params.studentId, req.schoolId || '', req.body));
export const patchGuardian = wrapMutate('UPDATE_GUARDIAN', fromParamsSid, req => svc.updateGuardian(req.params.id, req.body));
export const patchArchiveGuardian = wrapMutate('ARCHIVE_GUARDIAN', fromParamsSid, req => svc.archiveGuardian(req.params.id));

export const getEnrollments = wrap(fromParamsSid, req => svc.listEnrollments(req.params.studentId));
export const postEnrollment = wrapCreate('CREATE_ENROLLMENT', fromParamsSid, req => svc.createEnrollment(req.params.studentId, req.schoolId || '', req.body));
export const patchEnrollment = wrapMutate('UPDATE_ENROLLMENT', fromParamsSid, req => svc.updateEnrollment(req.params.id, req.body));

export const getMedical = wrap(fromParamsSid, req => svc.getMedical(req.params.studentId));
export const putMedical = wrapMutate('UPDATE_MEDICAL', fromParamsSid, req => svc.upsertMedical(req.params.studentId, req.body));

export const getDocuments = wrap(fromParamsSid, req => svc.listDocuments(req.params.studentId));
export const postDocument = wrapCreate('CREATE_DOCUMENT', fromParamsSid, req => svc.createDocument(req.params.studentId, req.body, req.userId || ''));

export const getStatusHistory = wrap(fromParamsSid, req => svc.listStatusHistory(req.params.studentId));

export const getTransfers = wrap(fromParamsSid, req => svc.listTransfers(req.params.studentId));
export const postTransfer = wrapCreate('CREATE_TRANSFER', fromParamsSid, req => svc.createTransfer(req.params.studentId, req.body));

export const getGraduations = wrap(fromParamsSid, req => svc.listGraduations(req.params.studentId));
export const postGraduation = wrapCreate('CREATE_GRADUATION', fromParamsSid, req => svc.createGraduation(req.params.studentId, req.schoolId || '', req.body));

export const getAddresses = wrap(fromParamsSid, req => svc.listAddresses(req.params.studentId));
export const postAddress = wrapCreate('CREATE_ADDRESS', fromParamsSid, req => svc.createAddress(req.params.studentId, req.body));
export const patchAddress = wrapMutate('UPDATE_ADDRESS', fromParamsSid, req => svc.updateAddress(req.params.id, req.body));
export const patchArchiveAddress = wrapMutate('ARCHIVE_ADDRESS', fromParamsSid, req => svc.archiveAddress(req.params.id));

export const getContacts = wrap(fromParamsSid, req => svc.listContacts(req.params.studentId));
export const postContact = wrapCreate('CREATE_CONTACT', fromParamsSid, req => svc.createContact(req.params.studentId, req.body));
export const patchContact = wrapMutate('UPDATE_CONTACT', fromParamsSid, req => svc.updateContact(req.params.id, req.body));
export const patchArchiveContact = wrapMutate('ARCHIVE_CONTACT', fromParamsSid, req => svc.archiveContact(req.params.id));

export const getIdentityDocuments = wrap(fromParamsSid, req => svc.listIdentityDocuments(req.params.studentId));
export const postIdentityDocument = wrapCreate('CREATE_IDENTITY_DOCUMENT', fromParamsSid, req => svc.createIdentityDocument(req.params.studentId, req.body));
export const patchIdentityDocument = wrapMutate('UPDATE_IDENTITY_DOCUMENT', fromParamsSid, req => svc.updateIdentityDocument(req.params.id, req.body));
export const patchArchiveIdentityDocument = wrapMutate('ARCHIVE_IDENTITY_DOCUMENT', fromParamsSid, req => svc.archiveIdentityDocument(req.params.id));

export const getHealthIncidents = wrap(fromParamsSid, req => svc.listHealthIncidents(req.params.studentId));
export const postHealthIncident = wrapCreate('CREATE_HEALTH_INCIDENT', fromParamsSid, req => svc.createHealthIncident(req.params.studentId, req.schoolId || '', req.body, req.userId || ''));

export const getBehaviorRecords = wrap(fromParamsSid, req => svc.listBehaviorRecords(req.params.studentId));
export const postBehaviorRecord = wrapCreate('CREATE_BEHAVIOR_RECORD', fromParamsSid, req => svc.createBehaviorRecord(req.params.studentId, req.body, req.userId || ''));

export const getAttendanceSummaries = wrap(fromParamsSid, req => svc.listAttendanceSummaries(req.params.studentId));
export const putAttendanceSummary = wrapMutate('UPDATE_ATTENDANCE_SUMMARY', fromParamsSid, req => svc.upsertAttendanceSummary(req.params.studentId, req.body));

export const getFeeProfiles = wrap(fromParamsSid, req => svc.listFeeProfiles(req.params.studentId));
export const postFeeProfile = wrapCreate('CREATE_FEE_PROFILE', fromParamsSid, req => svc.createFeeProfile(req.params.studentId, req.body));
export const patchFeeProfile = wrapMutate('UPDATE_FEE_PROFILE', fromParamsSid, req => svc.updateFeeProfile(req.params.id, req.body));
export const patchArchiveFeeProfile = wrapMutate('ARCHIVE_FEE_PROFILE', fromParamsSid, req => svc.archiveFeeProfile(req.params.id));

export const getPortalAccess = wrap(fromParamsSid, req => svc.getPortalAccess(req.params.studentId));
export const putPortalAccess = wrapMutate('TOGGLE_PORTAL_ACCESS', fromParamsSid, req => svc.togglePortalAccess(req.params.studentId, req.body.userId, !!req.body.isEnabled));

export const getNotes = wrap(fromParamsSid, req => svc.listNotes(req.params.studentId));
export const postNote = wrapCreate('CREATE_NOTE', fromParamsSid, req => svc.createNote(req.params.studentId, req.body, req.userId || ''));

export const getTags = wrap(fromParamsSid, req => svc.listTags(req.params.studentId));
export const postTag = wrapCreate('CREATE_TAG', fromParamsSid, req => svc.createTag(req.params.studentId, req.body, req.userId || ''));
export const patchArchiveTag = wrapMutate('ARCHIVE_TAG', fromParamsSid, req => svc.archiveTag(req.params.id));

export const getScholarships = wrap(fromParamsSid, req => svc.listScholarships(req.params.studentId));
export const postScholarship = wrapCreate('CREATE_SCHOLARSHIP', fromParamsSid, req => svc.createScholarship(req.params.studentId, req.body));
export const patchScholarship = wrapMutate('UPDATE_SCHOLARSHIP', fromParamsSid, req => svc.updateScholarship(req.params.id, req.body));
export const patchArchiveScholarship = wrapMutate('ARCHIVE_SCHOLARSHIP', fromParamsSid, req => svc.archiveScholarship(req.params.id));

export const getHouses = wrap(fromParamsSid, req => svc.listHouses(req.params.studentId));
export const postHouse = wrapCreate('ASSIGN_HOUSE', fromParamsSid, req => svc.assignHouse(req.params.studentId, req.schoolId || '', req.body.houseName));

export const getTransportAssignments = wrap(fromParamsSid, req => svc.listTransportAssignments(req.params.studentId));
export const postTransportAssignment = wrapCreate('CREATE_TRANSPORT_ASSIGNMENT', fromParamsSid, req => svc.createTransportAssignment(req.params.studentId, req.body));
export const patchToggleTransportAssignment = wrapMutate('TOGGLE_TRANSPORT_ASSIGNMENT', fromParamsSid, req => svc.toggleTransportAssignment(req.params.id, !!req.body.isActive));
