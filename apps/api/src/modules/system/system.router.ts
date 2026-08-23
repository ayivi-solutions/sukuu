import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { attachTenantContext } from '../../middleware/attachTenantContext';
import * as ctrl from './system.controller';

export const systemRouter = Router();

// Every route needs tenant context now (system.* tables are FORCE RLS —
// no context means no rows, by design), so it's applied once here rather
// than per-route.
systemRouter.use(authenticate, attachTenantContext);

systemRouter.get('/roles', ctrl.getRoles);
systemRouter.get('/permissions', ctrl.getPermissions);
systemRouter.get('/roles/:roleId/permissions', ctrl.getRolePermissionsHandler);
systemRouter.post('/roles/:roleId/permissions', ctrl.postAssignPermission);
systemRouter.delete('/roles/:roleId/permissions/:permissionId', ctrl.deleteRemovePermission);
systemRouter.patch('/roles/:roleId', ctrl.patchRole);
systemRouter.post('/roles', ctrl.postRole);

systemRouter.get('/users', ctrl.getUsers);
systemRouter.post('/users', ctrl.postUser);
systemRouter.patch('/users/:userId', ctrl.patchUser);
systemRouter.patch('/users/:userId/suspend', ctrl.patchSuspend);
systemRouter.patch('/users/:userId/reinstate', ctrl.patchReinstate);
systemRouter.patch('/users/:userId/archive', ctrl.patchArchiveUser);
systemRouter.patch('/users/:userId/status', ctrl.patchUserStatus);
systemRouter.get('/users/:userId/identities', ctrl.getUserIdentities);
systemRouter.post('/users/:userId/identities', ctrl.postUserIdentity);

systemRouter.get('/flags', ctrl.getFlags);
systemRouter.patch('/flags/:flagId', ctrl.patchFlag);
systemRouter.post('/flags', ctrl.postFlag);

systemRouter.get('/audit-log', ctrl.getAuditLog);
systemRouter.get('/sessions', ctrl.getSessions);
systemRouter.patch('/sessions/:sessionId/revoke', ctrl.patchRevoke);
systemRouter.get('/auth-log', ctrl.getAuthLog);

systemRouter.get('/password-policy', ctrl.getPwdPolicy);
systemRouter.put('/password-policy', ctrl.putPwdPolicy);
systemRouter.get('/security-policies', ctrl.getSecPolicies);
systemRouter.put('/security-policies', ctrl.putSecPolicy);

systemRouter.get('/api-keys', ctrl.getApiKeys);
systemRouter.post('/api-keys', ctrl.postApiKey);
systemRouter.patch('/api-keys/:id/revoke', ctrl.patchRevokeApiKey);
systemRouter.get('/webhooks', ctrl.getWebhooks);
systemRouter.post('/webhooks', ctrl.postWebhook);
systemRouter.patch('/webhooks/:id', ctrl.patchWebhook);

systemRouter.get('/summary', ctrl.getSummary);

// Bulk import (EFS-SYS-0020)
systemRouter.post('/users/bulk/preview', ctrl.postBulkPreview);
systemRouter.post('/users/bulk/commit', ctrl.postBulkCommit);

// Six named governed reports (EFS-SYS-0040)
systemRouter.get('/reports/user-role-register', ctrl.getReportUserRoleRegister);
systemRouter.get('/reports/privileged-access-review', ctrl.getReportPrivilegedAccess);
systemRouter.get('/reports/active-session-register', ctrl.getReportActiveSessions);
systemRouter.get('/reports/failed-login-trend', ctrl.getReportFailedLoginTrend);
systemRouter.get('/reports/feature-flag-history', ctrl.getReportFeatureFlagHistory);
systemRouter.get('/reports/audit-export', ctrl.getReportAuditExport);

// Event log viewer
systemRouter.get('/events', ctrl.getEvents);
