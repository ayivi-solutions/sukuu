import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { logAuditEvent } from '../system/system.service';
import * as svc from './student.service';

function wrap(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try { res.json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapCreate(action: string, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const result = await fn(req);
      if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', action, 'students', result?.id);
      res.status(201).json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapMutate(action: string, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const result = await fn(req);
      if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', action, 'students', req.params.id || req.params.studentId);
      res.json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}

export const getStudents = wrap(req => svc.listStudents(req.schoolId || ''));
export const getStudent = wrap(req => svc.getStudent(req.params.studentId));
export const postStudent = wrapCreate('CREATE_STUDENT', req => svc.createStudent(req.schoolId || '', req.body));
export const patchStudent = wrapMutate('UPDATE_STUDENT', req => svc.updateStudent(req.params.studentId, req.body, req.userId || ''));
export const patchArchiveStudent = wrapMutate('ARCHIVE_STUDENT', req => svc.archiveStudent(req.params.studentId, req.userId || '', req.body?.reason));

export const getGuardians = wrap(req => svc.listGuardians(req.params.studentId));
export const postGuardian = wrapCreate('CREATE_GUARDIAN', req => svc.createGuardian(req.params.studentId, req.schoolId || '', req.body));
export const patchGuardian = wrapMutate('UPDATE_GUARDIAN', req => svc.updateGuardian(req.params.id, req.body));
export const patchArchiveGuardian = wrapMutate('ARCHIVE_GUARDIAN', req => svc.archiveGuardian(req.params.id));

export const getEnrollments = wrap(req => svc.listEnrollments(req.params.studentId));
export const postEnrollment = wrapCreate('CREATE_ENROLLMENT', req => svc.createEnrollment(req.params.studentId, req.schoolId || '', req.body));
export const patchEnrollment = wrapMutate('UPDATE_ENROLLMENT', req => svc.updateEnrollment(req.params.id, req.body));

export const getMedical = wrap(req => svc.getMedical(req.params.studentId));
export const putMedical = wrapMutate('UPDATE_MEDICAL', req => svc.upsertMedical(req.params.studentId, req.body));

export const getDocuments = wrap(req => svc.listDocuments(req.params.studentId));
export const postDocument = wrapCreate('CREATE_DOCUMENT', req => svc.createDocument(req.params.studentId, req.body, req.userId || ''));

export const getStatusHistory = wrap(req => svc.listStatusHistory(req.params.studentId));

export const getTransfers = wrap(req => svc.listTransfers(req.params.studentId));
export const postTransfer = wrapCreate('CREATE_TRANSFER', req => svc.createTransfer(req.params.studentId, req.body));

export const getGraduations = wrap(req => svc.listGraduations(req.params.studentId));
export const postGraduation = wrapCreate('CREATE_GRADUATION', req => svc.createGraduation(req.params.studentId, req.schoolId || '', req.body));

export const getAddresses = wrap(req => svc.listAddresses(req.params.studentId));
export const postAddress = wrapCreate('CREATE_ADDRESS', req => svc.createAddress(req.params.studentId, req.body));
export const patchArchiveAddress = wrapMutate('ARCHIVE_ADDRESS', req => svc.archiveAddress(req.params.id));

export const getContacts = wrap(req => svc.listContacts(req.params.studentId));
export const postContact = wrapCreate('CREATE_CONTACT', req => svc.createContact(req.params.studentId, req.body));
export const patchArchiveContact = wrapMutate('ARCHIVE_CONTACT', req => svc.archiveContact(req.params.id));

export const getIdentityDocuments = wrap(req => svc.listIdentityDocuments(req.params.studentId));
export const postIdentityDocument = wrapCreate('CREATE_IDENTITY_DOCUMENT', req => svc.createIdentityDocument(req.params.studentId, req.body));
export const patchArchiveIdentityDocument = wrapMutate('ARCHIVE_IDENTITY_DOCUMENT', req => svc.archiveIdentityDocument(req.params.id));

export const getHealthIncidents = wrap(req => svc.listHealthIncidents(req.params.studentId));
export const postHealthIncident = wrapCreate('CREATE_HEALTH_INCIDENT', req => svc.createHealthIncident(req.params.studentId, req.schoolId || '', req.body, req.userId || ''));

export const getBehaviorRecords = wrap(req => svc.listBehaviorRecords(req.params.studentId));
export const postBehaviorRecord = wrapCreate('CREATE_BEHAVIOR_RECORD', req => svc.createBehaviorRecord(req.params.studentId, req.body, req.userId || ''));

export const getAttendanceSummaries = wrap(req => svc.listAttendanceSummaries(req.params.studentId));
export const putAttendanceSummary = wrapMutate('UPDATE_ATTENDANCE_SUMMARY', req => svc.upsertAttendanceSummary(req.params.studentId, req.body));

export const getFeeProfiles = wrap(req => svc.listFeeProfiles(req.params.studentId));
export const postFeeProfile = wrapCreate('CREATE_FEE_PROFILE', req => svc.createFeeProfile(req.params.studentId, req.body));
export const patchArchiveFeeProfile = wrapMutate('ARCHIVE_FEE_PROFILE', req => svc.archiveFeeProfile(req.params.id));

export const getPortalAccess = wrap(req => svc.getPortalAccess(req.params.studentId));
export const putPortalAccess = wrapMutate('TOGGLE_PORTAL_ACCESS', req => svc.togglePortalAccess(req.params.studentId, req.body.userId, !!req.body.isEnabled));

export const getNotes = wrap(req => svc.listNotes(req.params.studentId));
export const postNote = wrapCreate('CREATE_NOTE', req => svc.createNote(req.params.studentId, req.body, req.userId || ''));

export const getTags = wrap(req => svc.listTags(req.params.studentId));
export const postTag = wrapCreate('CREATE_TAG', req => svc.createTag(req.params.studentId, req.body, req.userId || ''));
export const patchArchiveTag = wrapMutate('ARCHIVE_TAG', req => svc.archiveTag(req.params.id));

export const getScholarships = wrap(req => svc.listScholarships(req.params.studentId));
export const postScholarship = wrapCreate('CREATE_SCHOLARSHIP', req => svc.createScholarship(req.params.studentId, req.body));
export const patchArchiveScholarship = wrapMutate('ARCHIVE_SCHOLARSHIP', req => svc.archiveScholarship(req.params.id));

export const getHouses = wrap(req => svc.listHouses(req.params.studentId));
export const postHouse = wrapCreate('ASSIGN_HOUSE', req => svc.assignHouse(req.params.studentId, req.schoolId || '', req.body.houseName));

export const getTransportAssignments = wrap(req => svc.listTransportAssignments(req.params.studentId));
export const postTransportAssignment = wrapCreate('CREATE_TRANSPORT_ASSIGNMENT', req => svc.createTransportAssignment(req.params.studentId, req.body));
export const patchToggleTransportAssignment = wrapMutate('TOGGLE_TRANSPORT_ASSIGNMENT', req => svc.toggleTransportAssignment(req.params.id, !!req.body.isActive));
