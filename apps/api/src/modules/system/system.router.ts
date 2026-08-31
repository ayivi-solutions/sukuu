import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { attachTenantContext } from '../../middleware/attachTenantContext';
import { requireStepUp } from '../../middleware/requireStepUp';
import { requireSystemAction } from '../../middleware/requireSystemAction';
import * as ctrl from './system.controller';

export const systemRouter = Router();

systemRouter.use(
  authenticate,
  attachTenantContext
);

const V = requireSystemAction('view', 'system-record-view');
const C = requireSystemAction('create', 'system-record-create');
const SUB = requireSystemAction('submit', 'system-change-submit');
const APP = requireSystemAction('approve', 'system-consequential-approve');
const COR = requireSystemAction('correct', 'system-record-correct');
const EXP = requireSystemAction('export', 'system-governed-export');
const ADM = requireSystemAction('administer', 'system-security-administer');
const S = requireStepUp;

systemRouter.get('/capabilities', V, ctrl.getCapabilities);
systemRouter.get('/roles', V, ctrl.getRoles);
systemRouter.get('/permissions', V, ctrl.getPermissions);
systemRouter.get('/roles/:roleId/permissions', V, ctrl.getRolePermissionsHandler);
systemRouter.post('/roles/:roleId/permissions', ADM, S, ctrl.postAssignPermission);
systemRouter.delete('/roles/:roleId/permissions/:permissionId', ADM, S, ctrl.deleteRemovePermission);
systemRouter.patch('/roles/:roleId', ADM, S, ctrl.patchRole);
systemRouter.post('/roles', C, S, ctrl.postRole);

systemRouter.get('/users/:userId/role-assignments', V, ctrl.getUserRoleAssignments);
systemRouter.post('/users/:userId/role-assignments', ADM, S, ctrl.postUserRoleAssignment);
systemRouter.patch('/role-assignments/:assignmentId/revoke', ADM, S, ctrl.patchRevokeRoleAssignment);

systemRouter.get('/users', V, ctrl.getUsers);
systemRouter.post('/users', APP, S, ctrl.postUser);
systemRouter.get('/staff-roster/unlinked', V, ctrl.getUnlinkedStaff);
systemRouter.post('/staff-roster', C, S, ctrl.postRosterEntry);
systemRouter.patch('/users/:userId', COR, S, ctrl.patchUser);
systemRouter.patch('/users/:userId/suspend', APP, S, ctrl.patchSuspend);
systemRouter.patch('/users/:userId/reinstate', APP, S, ctrl.patchReinstate);
systemRouter.patch('/users/:userId/archive', APP, S, ctrl.patchArchiveUser);
systemRouter.patch('/users/:userId/status', APP, S, ctrl.patchUserStatus);
systemRouter.patch('/users/:userId/reset-password', ADM, S, ctrl.patchResetPassword);
systemRouter.get('/users/:userId/identities', V, ctrl.getUserIdentities);
systemRouter.post('/users/:userId/identities', ADM, S, ctrl.postUserIdentity);

systemRouter.get('/flags', V, ctrl.getFlags);
systemRouter.patch('/flags/:flagId', ADM, S, ctrl.patchFlag);
systemRouter.post('/flags', C, S, ctrl.postFlag);

systemRouter.get('/audit-log', V, ctrl.getAuditLog);
systemRouter.get('/sessions', V, ctrl.getSessions);
systemRouter.patch('/sessions/:sessionId/revoke', ADM, S, ctrl.patchRevoke);
systemRouter.get('/auth-log', V, ctrl.getAuthLog);

systemRouter.get('/password-policy', V, ctrl.getPwdPolicy);
systemRouter.put('/password-policy', ADM, S, ctrl.putPwdPolicy);
systemRouter.get('/security-policies', V, ctrl.getSecPolicies);
systemRouter.put('/security-policies', ADM, S, ctrl.putSecPolicy);

systemRouter.get('/api-keys', V, ctrl.getApiKeys);
systemRouter.post('/api-keys', ADM, S, ctrl.postApiKey);
systemRouter.patch('/api-keys/:id/revoke', ADM, S, ctrl.patchRevokeApiKey);
systemRouter.get('/webhooks', V, ctrl.getWebhooks);
systemRouter.post('/webhooks', ADM, S, ctrl.postWebhook);
systemRouter.patch('/webhooks/:id', ADM, S, ctrl.patchWebhook);

systemRouter.get('/summary', V, ctrl.getSummary);

systemRouter.post('/users/bulk/preview', SUB, ctrl.postBulkPreview);
systemRouter.post('/users/bulk/commit', APP, S, ctrl.postBulkCommit);

systemRouter.get('/reports/user-role-register', EXP, ctrl.getReportUserRoleRegister);
systemRouter.get('/reports/privileged-access-review', EXP, ctrl.getReportPrivilegedAccess);
systemRouter.get('/reports/active-session-register', EXP, ctrl.getReportActiveSessions);
systemRouter.get('/reports/failed-login-trend', EXP, ctrl.getReportFailedLoginTrend);
systemRouter.get('/reports/feature-flag-history', EXP, ctrl.getReportFeatureFlagHistory);
systemRouter.get('/reports/audit-export', EXP, ctrl.getReportAuditExport);

systemRouter.get('/events', V, ctrl.getEvents);
