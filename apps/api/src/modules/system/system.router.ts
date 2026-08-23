import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { attachTenantContext } from '../../middleware/attachTenantContext';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './system.controller';

export const systemRouter = Router();

// Every route needs tenant context now (system.* tables are FORCE RLS —
// no context means no rows, by design), so it's applied once here rather
// than per-route.
systemRouter.use(authenticate, attachTenantContext);

const R = requireModuleAccess('system', 'read');
const F = requireModuleAccess('system', 'full');

systemRouter.get('/roles', R, ctrl.getRoles);
systemRouter.get('/permissions', R, ctrl.getPermissions);
systemRouter.get('/roles/:roleId/permissions', R, ctrl.getRolePermissionsHandler);
systemRouter.post('/roles/:roleId/permissions', F, ctrl.postAssignPermission);
systemRouter.delete('/roles/:roleId/permissions/:permissionId', F, ctrl.deleteRemovePermission);
systemRouter.patch('/roles/:roleId', F, ctrl.patchRole);
systemRouter.post('/roles', F, ctrl.postRole);

// User role assignment — multi-role, temporary (expiresAt optional)
systemRouter.get('/users/:userId/role-assignments', R, ctrl.getUserRoleAssignments);
systemRouter.post('/users/:userId/role-assignments', F, ctrl.postUserRoleAssignment);
systemRouter.patch('/role-assignments/:assignmentId/revoke', F, ctrl.patchRevokeRoleAssignment);

systemRouter.get('/users', R, ctrl.getUsers);
systemRouter.post('/users', F, ctrl.postUser);
systemRouter.get('/staff-roster/unlinked', R, ctrl.getUnlinkedStaff);
systemRouter.post('/staff-roster', F, ctrl.postRosterEntry);
systemRouter.patch('/users/:userId', F, ctrl.patchUser);
systemRouter.patch('/users/:userId/suspend', F, ctrl.patchSuspend);
systemRouter.patch('/users/:userId/reinstate', F, ctrl.patchReinstate);
systemRouter.patch('/users/:userId/archive', F, ctrl.patchArchiveUser);
systemRouter.patch('/users/:userId/status', F, ctrl.patchUserStatus);
systemRouter.patch('/users/:userId/reset-password', F, ctrl.patchResetPassword);
systemRouter.get('/users/:userId/identities', R, ctrl.getUserIdentities);
systemRouter.post('/users/:userId/identities', F, ctrl.postUserIdentity);

systemRouter.get('/flags', R, ctrl.getFlags);
systemRouter.patch('/flags/:flagId', F, ctrl.patchFlag);
systemRouter.post('/flags', F, ctrl.postFlag);

systemRouter.get('/audit-log', R, ctrl.getAuditLog);
systemRouter.get('/sessions', R, ctrl.getSessions);
systemRouter.patch('/sessions/:sessionId/revoke', F, ctrl.patchRevoke);
systemRouter.get('/auth-log', R, ctrl.getAuthLog);

systemRouter.get('/password-policy', R, ctrl.getPwdPolicy);
systemRouter.put('/password-policy', F, ctrl.putPwdPolicy);
systemRouter.get('/security-policies', R, ctrl.getSecPolicies);
systemRouter.put('/security-policies', F, ctrl.putSecPolicy);

systemRouter.get('/api-keys', R, ctrl.getApiKeys);
systemRouter.post('/api-keys', F, ctrl.postApiKey);
systemRouter.patch('/api-keys/:id/revoke', F, ctrl.patchRevokeApiKey);
systemRouter.get('/webhooks', R, ctrl.getWebhooks);
systemRouter.post('/webhooks', F, ctrl.postWebhook);
systemRouter.patch('/webhooks/:id', F, ctrl.patchWebhook);

systemRouter.get('/summary', R, ctrl.getSummary);

// Bulk import (EFS-SYS-0020)
systemRouter.post('/users/bulk/preview', F, ctrl.postBulkPreview);
systemRouter.post('/users/bulk/commit', F, ctrl.postBulkCommit);

// Six named governed reports (EFS-SYS-0040)
systemRouter.get('/reports/user-role-register', R, ctrl.getReportUserRoleRegister);
systemRouter.get('/reports/privileged-access-review', R, ctrl.getReportPrivilegedAccess);
systemRouter.get('/reports/active-session-register', R, ctrl.getReportActiveSessions);
systemRouter.get('/reports/failed-login-trend', R, ctrl.getReportFailedLoginTrend);
systemRouter.get('/reports/feature-flag-history', R, ctrl.getReportFeatureFlagHistory);
systemRouter.get('/reports/audit-export', R, ctrl.getReportAuditExport);

// Event log viewer
systemRouter.get('/events', R, ctrl.getEvents);
