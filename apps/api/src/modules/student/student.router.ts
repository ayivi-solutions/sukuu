import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './student.controller';

export const studentRouter = Router();

studentRouter.get('/', authenticate, ctrl.getStudents);
studentRouter.post('/', authenticate, ctrl.postStudent);
studentRouter.get('/:studentId', authenticate, ctrl.getStudent);
studentRouter.patch('/:studentId', authenticate, ctrl.patchStudent);
studentRouter.patch('/:studentId/archive', authenticate, ctrl.patchArchiveStudent);

studentRouter.get('/:studentId/guardians', authenticate, ctrl.getGuardians);
studentRouter.post('/:studentId/guardians', authenticate, ctrl.postGuardian);
studentRouter.patch('/guardians/:id', authenticate, ctrl.patchGuardian);
studentRouter.patch('/guardians/:id/archive', authenticate, ctrl.patchArchiveGuardian);

studentRouter.get('/:studentId/enrollments', authenticate, ctrl.getEnrollments);
studentRouter.post('/:studentId/enrollments', authenticate, ctrl.postEnrollment);
studentRouter.patch('/enrollments/:id', authenticate, ctrl.patchEnrollment);

studentRouter.get('/:studentId/medical', authenticate, ctrl.getMedical);
studentRouter.put('/:studentId/medical', authenticate, ctrl.putMedical);

studentRouter.get('/:studentId/documents', authenticate, ctrl.getDocuments);
studentRouter.post('/:studentId/documents', authenticate, ctrl.postDocument);

studentRouter.get('/:studentId/status-history', authenticate, ctrl.getStatusHistory);

studentRouter.get('/:studentId/transfers', authenticate, ctrl.getTransfers);
studentRouter.post('/:studentId/transfers', authenticate, ctrl.postTransfer);

studentRouter.get('/:studentId/graduations', authenticate, ctrl.getGraduations);
studentRouter.post('/:studentId/graduations', authenticate, ctrl.postGraduation);

studentRouter.get('/:studentId/addresses', authenticate, ctrl.getAddresses);
studentRouter.post('/:studentId/addresses', authenticate, ctrl.postAddress);
studentRouter.patch('/addresses/:id/archive', authenticate, ctrl.patchArchiveAddress);

studentRouter.get('/:studentId/contacts', authenticate, ctrl.getContacts);
studentRouter.post('/:studentId/contacts', authenticate, ctrl.postContact);
studentRouter.patch('/contacts/:id/archive', authenticate, ctrl.patchArchiveContact);

studentRouter.get('/:studentId/identity-documents', authenticate, ctrl.getIdentityDocuments);
studentRouter.post('/:studentId/identity-documents', authenticate, ctrl.postIdentityDocument);
studentRouter.patch('/identity-documents/:id/archive', authenticate, ctrl.patchArchiveIdentityDocument);

studentRouter.get('/:studentId/health-incidents', authenticate, ctrl.getHealthIncidents);
studentRouter.post('/:studentId/health-incidents', authenticate, ctrl.postHealthIncident);

studentRouter.get('/:studentId/behavior-records', authenticate, ctrl.getBehaviorRecords);
studentRouter.post('/:studentId/behavior-records', authenticate, ctrl.postBehaviorRecord);

studentRouter.get('/:studentId/attendance-summaries', authenticate, ctrl.getAttendanceSummaries);
studentRouter.put('/:studentId/attendance-summaries', authenticate, ctrl.putAttendanceSummary);

studentRouter.get('/:studentId/fee-profiles', authenticate, ctrl.getFeeProfiles);
studentRouter.post('/:studentId/fee-profiles', authenticate, ctrl.postFeeProfile);
studentRouter.patch('/fee-profiles/:id/archive', authenticate, ctrl.patchArchiveFeeProfile);

studentRouter.get('/:studentId/portal-access', authenticate, ctrl.getPortalAccess);
studentRouter.put('/:studentId/portal-access', authenticate, ctrl.putPortalAccess);

studentRouter.get('/:studentId/notes', authenticate, ctrl.getNotes);
studentRouter.post('/:studentId/notes', authenticate, ctrl.postNote);

studentRouter.get('/:studentId/tags', authenticate, ctrl.getTags);
studentRouter.post('/:studentId/tags', authenticate, ctrl.postTag);
studentRouter.patch('/tags/:id/archive', authenticate, ctrl.patchArchiveTag);

studentRouter.get('/:studentId/scholarships', authenticate, ctrl.getScholarships);
studentRouter.post('/:studentId/scholarships', authenticate, ctrl.postScholarship);
studentRouter.patch('/scholarships/:id/archive', authenticate, ctrl.patchArchiveScholarship);

studentRouter.get('/:studentId/houses', authenticate, ctrl.getHouses);
studentRouter.post('/:studentId/houses', authenticate, ctrl.postHouse);

studentRouter.get('/:studentId/transport-assignments', authenticate, ctrl.getTransportAssignments);
studentRouter.post('/:studentId/transport-assignments', authenticate, ctrl.postTransportAssignment);
studentRouter.patch('/transport-assignments/:id', authenticate, ctrl.patchToggleTransportAssignment);
