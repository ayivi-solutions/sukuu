import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './staffx.controller';

export const staffRouter = Router();
const R = requireModuleAccess('staff', 'read');
const F = requireModuleAccess('staff', 'full');

staffRouter.get('/', authenticate, R, ctrl.getStaffList);
staffRouter.post('/', authenticate, F, ctrl.postStaffMember);
staffRouter.get('/roles', authenticate, R, ctrl.getRoles);
staffRouter.post('/roles', authenticate, F, ctrl.postRole);
staffRouter.patch('/roles/:id', authenticate, F, ctrl.patchRole);
staffRouter.patch('/roles/:id', authenticate, F, ctrl.patchRole);
staffRouter.patch('/roles/:id/archive', authenticate, F, ctrl.patchArchiveRole);
staffRouter.get('/leave', authenticate, R, ctrl.getAllLeave);
staffRouter.patch('/leave/:id/decide', authenticate, F, ctrl.patchDecideLeave);
staffRouter.get('/leave/:id/approvals', authenticate, R, ctrl.getLeaveApprovals);
staffRouter.get('/leave/:id/approvals', authenticate, R, ctrl.getLeaveApprovals);

staffRouter.get('/:staffId', authenticate, R, ctrl.getStaffMember);
staffRouter.patch('/:staffId', authenticate, F, ctrl.patchStaffMember);
staffRouter.patch('/:staffId/archive', authenticate, F, ctrl.patchArchiveStaffMember);

staffRouter.get('/:staffId/employments', authenticate, R, ctrl.getEmployments);
staffRouter.post('/:staffId/employments', authenticate, F, ctrl.postEmployment);
staffRouter.patch('/:staffId/employments/:id', authenticate, F, ctrl.patchEmployment);

staffRouter.get('/:staffId/department-assignments', authenticate, R, ctrl.getDepartmentAssignments);
staffRouter.post('/:staffId/department-assignments', authenticate, F, ctrl.postDepartmentAssignment);
staffRouter.patch('/:staffId/department-assignments/:id', authenticate, F, ctrl.patchDepartmentAssignment);
staffRouter.patch('/:staffId/department-assignments/:id', authenticate, F, ctrl.patchDepartmentAssignment);

staffRouter.get('/:staffId/subject-assignments', authenticate, R, ctrl.getSubjectAssignments);
staffRouter.post('/:staffId/subject-assignments', authenticate, F, ctrl.postSubjectAssignment);
staffRouter.patch('/:staffId/subject-assignments/:id/archive', authenticate, F, ctrl.patchArchiveSubjectAssignment);

staffRouter.get('/:staffId/documents', authenticate, R, ctrl.getDocuments);
staffRouter.post('/:staffId/documents', authenticate, F, ctrl.postDocument);

staffRouter.get('/:staffId/qualifications', authenticate, R, ctrl.getQualifications);
staffRouter.post('/:staffId/qualifications', authenticate, F, ctrl.postQualification);
staffRouter.patch('/:staffId/qualifications/:id', authenticate, F, ctrl.patchQualificationDetails);
staffRouter.patch('/:staffId/qualifications/:id', authenticate, F, ctrl.patchQualificationDetails);
staffRouter.patch('/:staffId/qualifications/:id/verify', authenticate, F, ctrl.patchVerifyQualification);
staffRouter.patch('/:staffId/qualifications/:id/archive', authenticate, F, ctrl.patchArchiveQualification);

staffRouter.get('/:staffId/compliance', authenticate, R, ctrl.getCompliance);
staffRouter.post('/:staffId/compliance', authenticate, F, ctrl.postCompliance);
staffRouter.patch('/:staffId/compliance/:id', authenticate, F, ctrl.patchCompliance);
staffRouter.patch('/:staffId/compliance/:id/archive', authenticate, F, ctrl.patchArchiveCompliance);

staffRouter.get('/:staffId/leave', authenticate, R, ctrl.getLeaveForStaff);
staffRouter.post('/:staffId/leave', authenticate, F, ctrl.postLeaveRequest);

staffRouter.get('/:staffId/attendance', authenticate, R, ctrl.getAttendance);
staffRouter.post('/:staffId/attendance/check-in', authenticate, F, ctrl.postCheckIn);
staffRouter.post('/:staffId/attendance/check-out', authenticate, F, ctrl.postCheckOut);

staffRouter.get('/:staffId/bank-details', authenticate, R, ctrl.getBankDetails);
staffRouter.post('/:staffId/bank-details', authenticate, F, ctrl.postBankDetails);
staffRouter.patch('/:staffId/bank-details/:id', authenticate, F, ctrl.patchBankDetails);
staffRouter.patch('/:staffId/bank-details/:id/archive', authenticate, F, ctrl.patchArchiveBankDetails);

staffRouter.get('/:staffId/emergency-contacts', authenticate, R, ctrl.getEmergencyContacts);
staffRouter.post('/:staffId/emergency-contacts', authenticate, F, ctrl.postEmergencyContact);
staffRouter.patch('/:staffId/emergency-contacts/:id', authenticate, F, ctrl.patchEmergencyContact);
staffRouter.patch('/:staffId/emergency-contacts/:id/archive', authenticate, F, ctrl.patchArchiveEmergencyContact);

staffRouter.get('/:staffId/contracts', authenticate, R, ctrl.getContracts);
staffRouter.post('/:staffId/contracts', authenticate, F, ctrl.postContract);
staffRouter.patch('/:staffId/contracts/:id', authenticate, F, ctrl.patchContract);

staffRouter.get('/:staffId/disciplinary-records', authenticate, R, ctrl.getDisciplinaryRecords);
staffRouter.post('/:staffId/disciplinary-records', authenticate, F, ctrl.postDisciplinaryRecord);

staffRouter.get('/:staffId/performance-reviews', authenticate, R, ctrl.getPerformanceReviews);
staffRouter.post('/:staffId/performance-reviews', authenticate, F, ctrl.postPerformanceReview);

staffRouter.get('/:staffId/training', authenticate, R, ctrl.getTraining);
staffRouter.post('/:staffId/training', authenticate, F, ctrl.postTraining);

staffRouter.get('/:staffId/leave-balances', authenticate, R, ctrl.getLeaveBalances);
staffRouter.put('/:staffId/leave-balances', authenticate, F, ctrl.putLeaveBalance);

staffRouter.get('/:staffId/exit-records', authenticate, R, ctrl.getExitRecords);
staffRouter.post('/:staffId/exit-records', authenticate, F, ctrl.postExitRecord);
