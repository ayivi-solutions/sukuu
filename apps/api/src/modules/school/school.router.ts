import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireSchoolAction } from '../../middleware/requireSchoolAction';
import * as ctrl from './school.controller';
import * as canonical from './school.canonical.controller';

export const schoolRouter = Router();
const A = requireSchoolAction;

schoolRouter.get('/capabilities', authenticate, A('view', 'schoolx-capabilities'), ctrl.getCapabilities);
schoolRouter.get('/profile', authenticate, A('view', 'schoolx-profile-view'), ctrl.getProfile);
schoolRouter.patch('/profile', authenticate, A('correct', 'schoolx-profile-correct'), ctrl.patchProfile);

schoolRouter.get('/settings', authenticate, A('view', 'schoolx-settings-view'), ctrl.getSettings);

schoolRouter.get('/accreditations', authenticate, A('view', 'schoolx-accreditation-view'), ctrl.getAccreditations);
schoolRouter.post('/accreditations', authenticate, A('create', 'schoolx-accreditation-create'), ctrl.postAccreditation);
schoolRouter.patch('/accreditations/:accreditationId/archive', authenticate, A('cancel', 'schoolx-accreditation-archive'), ctrl.patchArchiveAccreditation);
schoolRouter.put('/accreditations/:accreditationId', authenticate, A('correct', 'schoolx-accreditation-correct'), ctrl.patchAccreditation);
schoolRouter.get('/audit-log', authenticate, A('view', 'schoolx-audit-view'), ctrl.getSchoolAuditLog);
schoolRouter.get('/contacts', authenticate, A('view', 'schoolx-contact-view'), ctrl.getContacts);
schoolRouter.post('/contacts', authenticate, A('create', 'schoolx-contact-create'), ctrl.postContact);
schoolRouter.patch('/contacts/:id', authenticate, A('correct', 'schoolx-contact-correct'), ctrl.patchContact);
schoolRouter.get('/branding', authenticate, A('view', 'schoolx-branding-view'), ctrl.getBrandingHandler);
schoolRouter.put('/branding', authenticate, A('correct', 'schoolx-branding-correct'), ctrl.putBranding);
schoolRouter.get('/campuses', authenticate, A('view', 'schoolx-campus-view'), ctrl.getCampuses);
schoolRouter.post('/campuses', authenticate, A('create', 'schoolx-campus-create'), ctrl.postCampus);
schoolRouter.patch('/campuses/:id', authenticate, A('correct', 'schoolx-campus-status-correct'), ctrl.patchCampus);
schoolRouter.put('/campuses/:id', authenticate, A('correct', 'schoolx-campus-correct'), ctrl.patchCampusDetails);

schoolRouter.get('/term-policy', authenticate, A('view', 'schoolx-term-policy-view'), ctrl.getTermPolicyHandler);

schoolRouter.get('/documents', authenticate, A('view', 'schoolx-document-view'), ctrl.getDocuments);
schoolRouter.post('/documents', authenticate, A('create', 'schoolx-document-create'), ctrl.postDocument);

schoolRouter.get('/subscription', authenticate, A('view', 'schoolx-subscription-view'), ctrl.getSubscriptionHandler);

schoolRouter.get('/summary', authenticate, A('view', 'schoolx-summary-view'), ctrl.getSummary);

schoolRouter.get('/departments', authenticate, A('view', 'schoolx-department-view'), canonical.getDepartments);
schoolRouter.post('/departments', authenticate, A('create', 'schoolx-department-create'), canonical.postDepartment);
schoolRouter.put('/departments/:id', authenticate, A('correct', 'schoolx-department-correct'), canonical.putDepartment);
schoolRouter.patch('/departments/:id/archive', authenticate, A('cancel', 'schoolx-department-archive'), canonical.archiveDepartment);

schoolRouter.get('/configuration', authenticate, A('view', 'schoolx-configuration-view'), canonical.getConfiguration);
schoolRouter.put('/configuration/timezone', authenticate, A('correct', 'schoolx-timezone-correct'), canonical.putTimezone);
schoolRouter.put('/configuration/currency', authenticate, A('correct', 'schoolx-currency-correct'), canonical.putCurrency);

schoolRouter.get('/calendar', authenticate, A('view', 'schoolx-calendar-view'), canonical.getCalendar);
schoolRouter.post('/holidays', authenticate, A('create', 'schoolx-holiday-create'), canonical.postHoliday);
schoolRouter.put('/holidays/:id', authenticate, A('correct', 'schoolx-holiday-correct'), canonical.putHoliday);
schoolRouter.patch('/holidays/:id/archive', authenticate, A('cancel', 'schoolx-holiday-archive'), canonical.archiveHoliday);

schoolRouter.get('/readiness', authenticate, A('view', 'schoolx-readiness-view'), canonical.getReadiness);
schoolRouter.put('/readiness/:step', authenticate, A('correct', 'schoolx-readiness-correct'), canonical.putReadinessWorkItem);

schoolRouter.get('/lifecycle', authenticate, A('view', 'schoolx-lifecycle-view'), ctrl.getLifecycle);
schoolRouter.post('/lifecycle/submit-verification', authenticate, A('submit', 'schoolx-verification-submit'), ctrl.submitVerification);
schoolRouter.post('/lifecycle/return', authenticate, A('correct', 'schoolx-verification-return'), ctrl.returnVerification);
schoolRouter.post('/lifecycle/suspend', authenticate, A('approve', 'schoolx-suspend'), ctrl.suspendSchool);
schoolRouter.post('/lifecycle/reactivate', authenticate, A('approve', 'schoolx-reactivate'), ctrl.reactivateSchool);
schoolRouter.post('/lifecycle/archive', authenticate, A('administer', 'schoolx-archive'), ctrl.archiveSchool);
