import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './student.controller';

export const studentRouter = Router();
const R = requireModuleAccess('student', 'read');
const F = requireModuleAccess('student', 'full');

studentRouter.get('/', authenticate, R, ctrl.getStudents);
studentRouter.post('/', authenticate, F, ctrl.postStudent);
studentRouter.get('/:studentId', authenticate, R, ctrl.getStudent);
studentRouter.patch('/:studentId', authenticate, F, ctrl.patchStudent);
studentRouter.patch('/:studentId/archive', authenticate, F, ctrl.patchArchiveStudent);

studentRouter.get('/:studentId/guardians', authenticate, R, ctrl.getGuardians);
studentRouter.post('/:studentId/guardians', authenticate, F, ctrl.postGuardian);
studentRouter.patch('/:studentId/guardians/:id', authenticate, F, ctrl.patchGuardian);
studentRouter.patch('/:studentId/guardians/:id/archive', authenticate, F, ctrl.patchArchiveGuardian);

studentRouter.get('/:studentId/enrollments', authenticate, R, ctrl.getEnrollments);
studentRouter.post('/:studentId/enrollments', authenticate, F, ctrl.postEnrollment);
studentRouter.patch('/:studentId/enrollments/:id', authenticate, F, ctrl.patchEnrollment);

studentRouter.get('/:studentId/medical', authenticate, R, ctrl.getMedical);
studentRouter.put('/:studentId/medical', authenticate, F, ctrl.putMedical);

studentRouter.get('/:studentId/documents', authenticate, R, ctrl.getDocuments);
studentRouter.post('/:studentId/documents', authenticate, F, ctrl.postDocument);

studentRouter.get('/:studentId/status-history', authenticate, R, ctrl.getStatusHistory);

studentRouter.get('/:studentId/transfers', authenticate, R, ctrl.getTransfers);
studentRouter.post('/:studentId/transfers', authenticate, F, ctrl.postTransfer);

studentRouter.get('/:studentId/graduations', authenticate, R, ctrl.getGraduations);
studentRouter.post('/:studentId/graduations', authenticate, F, ctrl.postGraduation);

studentRouter.get('/:studentId/addresses', authenticate, R, ctrl.getAddresses);
studentRouter.post('/:studentId/addresses', authenticate, F, ctrl.postAddress);
studentRouter.patch('/:studentId/addresses/:id', authenticate, F, ctrl.patchAddress);
studentRouter.patch('/:studentId/addresses/:id/archive', authenticate, F, ctrl.patchArchiveAddress);

studentRouter.get('/:studentId/contacts', authenticate, R, ctrl.getContacts);
studentRouter.post('/:studentId/contacts', authenticate, F, ctrl.postContact);
studentRouter.patch('/:studentId/contacts/:id', authenticate, F, ctrl.patchContact);
studentRouter.patch('/:studentId/contacts/:id/archive', authenticate, F, ctrl.patchArchiveContact);

studentRouter.get('/:studentId/identity-documents', authenticate, R, ctrl.getIdentityDocuments);
studentRouter.post('/:studentId/identity-documents', authenticate, F, ctrl.postIdentityDocument);
studentRouter.patch('/:studentId/identity-documents/:id', authenticate, F, ctrl.patchIdentityDocument);
studentRouter.patch('/:studentId/identity-documents/:id/archive', authenticate, F, ctrl.patchArchiveIdentityDocument);

studentRouter.get('/:studentId/health-incidents', authenticate, R, ctrl.getHealthIncidents);
studentRouter.post('/:studentId/health-incidents', authenticate, F, ctrl.postHealthIncident);

studentRouter.get('/:studentId/behavior-records', authenticate, R, ctrl.getBehaviorRecords);
studentRouter.post('/:studentId/behavior-records', authenticate, F, ctrl.postBehaviorRecord);

studentRouter.get('/:studentId/fee-profiles', authenticate, R, ctrl.getFeeProfiles);
studentRouter.post('/:studentId/fee-profiles', authenticate, F, ctrl.postFeeProfile);
studentRouter.patch('/:studentId/fee-profiles/:id', authenticate, F, ctrl.patchFeeProfile);
studentRouter.patch('/:studentId/fee-profiles/:id/archive', authenticate, F, ctrl.patchArchiveFeeProfile);

studentRouter.get('/:studentId/portal-access', authenticate, R, ctrl.getPortalAccess);
studentRouter.put('/:studentId/portal-access', authenticate, F, ctrl.putPortalAccess);

studentRouter.get('/:studentId/notes', authenticate, R, ctrl.getNotes);
studentRouter.post('/:studentId/notes', authenticate, F, ctrl.postNote);

studentRouter.get('/:studentId/tags', authenticate, R, ctrl.getTags);
studentRouter.post('/:studentId/tags', authenticate, F, ctrl.postTag);
studentRouter.patch('/:studentId/tags/:id/archive', authenticate, F, ctrl.patchArchiveTag);

studentRouter.get('/:studentId/scholarships', authenticate, R, ctrl.getScholarships);
studentRouter.post('/:studentId/scholarships', authenticate, F, ctrl.postScholarship);
studentRouter.patch('/:studentId/scholarships/:id', authenticate, F, ctrl.patchScholarship);
studentRouter.patch('/:studentId/scholarships/:id/archive', authenticate, F, ctrl.patchArchiveScholarship);

studentRouter.get('/:studentId/houses', authenticate, R, ctrl.getHouses);
studentRouter.post('/:studentId/houses', authenticate, F, ctrl.postHouse);

studentRouter.get('/:studentId/transport-assignments', authenticate, R, ctrl.getTransportAssignments);
studentRouter.post('/:studentId/transport-assignments', authenticate, F, ctrl.postTransportAssignment);
studentRouter.patch('/:studentId/transport-assignments/:id', authenticate, F, ctrl.patchToggleTransportAssignment);
