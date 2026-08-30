import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { TenantCtx } from '../../lib/tenantContext';
import * as svc from './system.service';

function ctxFrom(req: AuthRequest): TenantCtx {
  return {
    sessionId: req.sessionId,
    schoolId: req.schoolId || '',
    userId: req.userId || '',
    role: req.roleKey || '',
  };
}

function safeFailure(res: Response) {
  return res.status(500).json({ error: 'Request failed' });
}

function handle(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      res.json(await fn(req));
    } catch (err: unknown) {
      if (err instanceof svc.InvalidTransitionError) {
        return res.status(409).json({
          error: 'Invalid state transition',
          currentState: err.currentState,
          attemptedState: err.attemptedState,
        });
      }
      return safeFailure(res);
    }
  };
}

function handleCreate(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      res.status(201).json(await fn(req));
    } catch {
      return safeFailure(res);
    }
  };
}

export const getRoles = handle(req => svc.listRoles(ctxFrom(req)));
export const getPermissions = handle(req => svc.listPermissions(ctxFrom(req)));
export const getRolePermissionsHandler = handle(req => svc.getRolePermissions(ctxFrom(req), req.params.roleId));
export const postAssignPermission = handleCreate(req => svc.assignPermission(ctxFrom(req), req.params.roleId, req.body.permissionId));
export const deleteRemovePermission = handle(req => svc.removePermission(ctxFrom(req), req.params.roleId, req.params.permissionId));
export const patchRole = handle(req => svc.updateRole(ctxFrom(req), req.params.roleId, req.body));
export const postRole = handleCreate(req => svc.createRole(ctxFrom(req), req.body.name, req.body.label, req.body.description));
export const getUserRoleAssignments = handle(req => svc.listUserRoleAssignments(ctxFrom(req), req.params.userId));
export const postUserRoleAssignment = handleCreate(req => svc.assignRoleToUser(ctxFrom(req), req.params.userId, req.body.roleId, req.body.expiresAt));
export const patchRevokeRoleAssignment = handle(req => svc.revokeRoleAssignment(ctxFrom(req), req.params.assignmentId));
export const patchResetPassword = handle(req => svc.adminResetPassword(ctxFrom(req), req.params.userId));

export const getUsers = handle(req => {
  if (!req.schoolId) throw new Error('Missing authenticated school context');
  return svc.listUsers(ctxFrom(req));
});
export const getUnlinkedStaff = handle(req => svc.listUnlinkedStaff(ctxFrom(req)));
export const postRosterEntry = handleCreate(req => svc.addStaffRosterEntry(ctxFrom(req), req.body));

export const postUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const { staffId, email, roleId } = req.body;
    if (!staffId) return res.status(400).json({ error: 'staffId is required' });
    const operationId = req.header('X-Operation-Id') || req.body.operationId;
    if (!operationId) return res.status(400).json({ error: 'X-Operation-Id header or operationId is required' });
    const { result, replayed } = await svc.withIdempotency(
      ctxFrom(req), operationId, 'GrantSystemAccess',
      () => svc.grantSystemAccess(ctxFrom(req), staffId, email, roleId)
    );
    return res.status(replayed ? 200 : 201).json({
      user: { id: result.user.id, email: result.user.email },
      staffName: result.staffName,
      tempPassword: result.tempPassword,
      replayed,
    });
  } catch {
    return safeFailure(res);
  }
};

export const patchUser = handle(req => svc.updateUser(ctxFrom(req), req.params.userId, req.body));
export const patchSuspend = handle(req => svc.transitionUserStatus(ctxFrom(req), req.params.userId, 'SUSPENDED', req.body.reason || 'Suspended by administrator'));
export const patchReinstate = handle(req => svc.transitionUserStatus(ctxFrom(req), req.params.userId, 'ACTIVE', req.body.reason || 'Reinstated by administrator'));
export const patchArchiveUser = handle(req => svc.archiveUser(ctxFrom(req), req.params.userId));
export const patchUserStatus = handle(req => svc.transitionUserStatus(ctxFrom(req), req.params.userId, req.body.status, req.body.reason || 'Manual transition'));
export const getUserIdentities = handle(req => svc.listUserIdentities(ctxFrom(req), req.params.userId));
export const postUserIdentity = handleCreate(req => svc.createUserIdentity(ctxFrom(req), req.params.userId, req.body.identityType, req.body.identityId));

export const getFlags = handle(req => svc.listFeatureFlags(ctxFrom(req)));
export const patchFlag = handle(req => svc.toggleFeatureFlag(ctxFrom(req), req.params.flagId, req.body.isEnabled));
export const postFlag = handleCreate(req => svc.createFeatureFlag(ctxFrom(req), req.body.flagKey, req.body.description));

export const getAuditLog = handle(req => svc.listAuditEvents(ctxFrom(req)));
export const getSessions = handle(req => svc.listSessions(ctxFrom(req), ((req.query.userIds as string) || '').split(',').filter(Boolean)));
export const patchRevoke = handle(req => svc.revokeSession(ctxFrom(req), req.params.sessionId));
export const getAuthLog = handle(req => svc.listAuthLog(ctxFrom(req), req.query.limit ? Number(req.query.limit) : undefined));

export const getPwdPolicy = handle(req => svc.getPasswordPolicy(ctxFrom(req)));
export const putPwdPolicy = handleCreate(req => svc.upsertPasswordPolicy(ctxFrom(req), req.body));
export const getSecPolicies = handle(req => svc.listSecurityPolicies(ctxFrom(req)));
export const putSecPolicy = handleCreate(req => svc.upsertSecurityPolicy(ctxFrom(req), req.body.policyName, req.body.policyValue));

export const getApiKeys = handle(req => svc.listApiKeys(ctxFrom(req)));
export const postApiKey = handleCreate(req => svc.createApiKey(ctxFrom(req), req.body.label, req.body.scopes));
export const patchRevokeApiKey = handle(req => svc.revokeApiKey(ctxFrom(req), req.params.id));
export const getWebhooks = handle(req => svc.listWebhooks(ctxFrom(req)));
export const postWebhook = handleCreate(req => svc.createWebhook(ctxFrom(req), req.body.url, req.body.events));
export const patchWebhook = handle(req => svc.toggleWebhook(ctxFrom(req), req.params.id, req.body.isActive));

export const getSummary = handle(req => svc.getSystemSummary(ctxFrom(req)));
export const postBulkPreview = handle(req => svc.previewBulkUserImport(ctxFrom(req), req.body.rows));
export const postBulkCommit = handle(req => svc.commitBulkUserImport(ctxFrom(req), req.body.rows));

export const getReportUserRoleRegister = handle(req => svc.reportUserAndRoleRegister(ctxFrom(req)));
export const getReportPrivilegedAccess = handle(req => svc.reportPrivilegedAccessReview(ctxFrom(req)));
export const getReportActiveSessions = handle(req => svc.reportActiveSessionRegister(ctxFrom(req)));
export const getReportFailedLoginTrend = handle(req => svc.reportFailedLoginTrend(ctxFrom(req)));
export const getReportFeatureFlagHistory = handle(req => svc.reportFeatureFlagHistory(ctxFrom(req)));
export const getReportAuditExport = handle(req => svc.reportAuditExport(ctxFrom(req), {
  entityType: req.query.entityType as string | undefined,
  action: req.query.action as string | undefined,
  fromDate: req.query.fromDate as string | undefined,
  toDate: req.query.toDate as string | undefined,
}));
export const getEvents = handle(req => svc.listDomainEvents(ctxFrom(req), req.query.limit ? Number(req.query.limit) : undefined));
