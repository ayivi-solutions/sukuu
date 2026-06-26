import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './staffx.controller';

export const staffRouter = Router();

staffRouter.get('/', authenticate, ctrl.getStaffList);
staffRouter.post('/', authenticate, ctrl.postStaffMember);
staffRouter.get('/roles', authenticate, ctrl.getRoles);
staffRouter.post('/roles', authenticate, ctrl.postRole);
staffRouter.patch('/roles/:id/archive', authenticate, ctrl.patchArchiveRole);
staffRouter.get('/leave', authenticate, ctrl.getAllLeave);
staffRouter.patch('/leave/:id/decide', authenticate, ctrl.patchDecideLeave);

staffRouter.get('/:staffId', authenticate, ctrl.getStaffMember);
staffRouter.patch('/:staffId', authenticate, ctrl.patchStaffMember);
staffRouter.patch('/:staffId/archive', authenticate, ctrl.patchArchiveStaffMember);

staffRouter.get('/:staffId/employments', authenticate, ctrl.getEmployments);
staffRouter.post('/:staffId/employments', authenticate, ctrl.postEmployment);
staffRouter.patch('/:staffId/employments/:id', authenticate, ctrl.patchEmployment);

staffRouter.get('/:staffId/department-assignments', authenticate, ctrl.getDepartmentAssignments);
staffRouter.post('/:staffId/department-assignments', authenticate, ctrl.postDepartmentAssignment);

staffRouter.get('/:staffId/subject-assignments', authenticate, ctrl.getSubjectAssignments);
staffRouter.post('/:staffId/subject-assignments', authenticate, ctrl.postSubjectAssignment);
staffRouter.patch('/:staffId/subject-assignments/:id/archive', authenticate, ctrl.patchArchiveSubjectAssignment);

staffRouter.get('/:staffId/documents', authenticate, ctrl.getDocuments);
staffRouter.post('/:staffId/documents', authenticate, ctrl.postDocument);

staffRouter.get('/:staffId/qualifications', authenticate, ctrl.getQualifications);
staffRouter.post('/:staffId/qualifications', authenticate, ctrl.postQualification);
staffRouter.patch('/:staffId/qualifications/:id/verify', authenticate, ctrl.patchVerifyQualification);
staffRouter.patch('/:staffId/qualifications/:id/archive', authenticate, ctrl.patchArchiveQualification);

staffRouter.get('/:staffId/compliance', authenticate, ctrl.getCompliance);
staffRouter.post('/:staffId/compliance', authenticate, ctrl.postCompliance);
staffRouter.patch('/:staffId/compliance/:id', authenticate, ctrl.patchCompliance);
staffRouter.patch('/:staffId/compliance/:id/archive', authenticate, ctrl.patchArchiveCompliance);

staffRouter.get('/:staffId/leave', authenticate, ctrl.getLeaveForStaff);
staffRouter.post('/:staffId/leave', authenticate, ctrl.postLeaveRequest);

staffRouter.get('/:staffId/attendance', authenticate, ctrl.getAttendance);
staffRouter.post('/:staffId/attendance/check-in', authenticate, ctrl.postCheckIn);
staffRouter.post('/:staffId/attendance/check-out', authenticate, ctrl.postCheckOut);

staffRouter.get('/:staffId/bank-details', authenticate, ctrl.getBankDetails);
staffRouter.post('/:staffId/bank-details', authenticate, ctrl.postBankDetails);
staffRouter.patch('/:staffId/bank-details/:id', authenticate, ctrl.patchBankDetails);
staffRouter.patch('/:staffId/bank-details/:id/archive', authenticate, ctrl.patchArchiveBankDetails);

staffRouter.get('/:staffId/emergency-contacts', authenticate, ctrl.getEmergencyContacts);
staffRouter.post('/:staffId/emergency-contacts', authenticate, ctrl.postEmergencyContact);
staffRouter.patch('/:staffId/emergency-contacts/:id', authenticate, ctrl.patchEmergencyContact);
staffRouter.patch('/:staffId/emergency-contacts/:id/archive', authenticate, ctrl.patchArchiveEmergencyContact);

staffRouter.get('/:staffId/contracts', authenticate, ctrl.getContracts);
staffRouter.post('/:staffId/contracts', authenticate, ctrl.postContract);
staffRouter.patch('/:staffId/contracts/:id', authenticate, ctrl.patchContract);

staffRouter.get('/:staffId/disciplinary-records', authenticate, ctrl.getDisciplinaryRecords);
staffRouter.post('/:staffId/disciplinary-records', authenticate, ctrl.postDisciplinaryRecord);

staffRouter.get('/:staffId/performance-reviews', authenticate, ctrl.getPerformanceReviews);
staffRouter.post('/:staffId/performance-reviews', authenticate, ctrl.postPerformanceReview);

staffRouter.get('/:staffId/training', authenticate, ctrl.getTraining);
staffRouter.post('/:staffId/training', authenticate, ctrl.postTraining);

staffRouter.get('/:staffId/leave-balances', authenticate, ctrl.getLeaveBalances);
staffRouter.put('/:staffId/leave-balances', authenticate, ctrl.putLeaveBalance);

staffRouter.get('/:staffId/exit-records', authenticate, ctrl.getExitRecords);
staffRouter.post('/:staffId/exit-records', authenticate, ctrl.postExitRecord);
