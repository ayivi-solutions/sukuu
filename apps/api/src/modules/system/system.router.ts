import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import {
  getRoles, getPermissions, getRolePermissionsHandler,
  getUsers, postUser, patchSuspend, patchReinstate,
  getFlags, patchFlag, getAuditLog, getSessions, patchRevoke, getAuthLog,
  patchUser, patchArchiveUser, patchRole,
} from './system.controller';
export const systemRouter = Router();
systemRouter.get('/roles', authenticate, getRoles);
systemRouter.get('/permissions', authenticate, getPermissions);
systemRouter.get('/roles/:roleId/permissions', authenticate, getRolePermissionsHandler);
systemRouter.patch('/roles/:roleId', authenticate, patchRole);
systemRouter.get('/users', authenticate, getUsers);
systemRouter.post('/users', authenticate, postUser);
systemRouter.patch('/users/:userId', authenticate, patchUser);
systemRouter.patch('/users/:userId/suspend', authenticate, patchSuspend);
systemRouter.patch('/users/:userId/reinstate', authenticate, patchReinstate);
systemRouter.patch('/users/:userId/archive', authenticate, patchArchiveUser);
systemRouter.get('/flags', authenticate, getFlags);
systemRouter.patch('/flags/:flagId', authenticate, patchFlag);
systemRouter.get('/audit-log', authenticate, getAuditLog);
systemRouter.get('/sessions', authenticate, getSessions);
systemRouter.patch('/sessions/:sessionId/revoke', authenticate, patchRevoke);
systemRouter.get('/auth-log', authenticate, getAuthLog);
