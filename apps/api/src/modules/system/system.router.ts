import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { getRoles, getPermissions, getRolePermissionsHandler } from './system.controller';

export const systemRouter = Router();

systemRouter.get('/roles', authenticate, getRoles);
systemRouter.get('/permissions', authenticate, getPermissions);
systemRouter.get('/roles/:roleId/permissions', authenticate, getRolePermissionsHandler);
