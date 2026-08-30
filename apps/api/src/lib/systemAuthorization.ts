import {
  getActiveRoleNames,
} from './roleGrants';
import {
  withTenantContext,
} from './tenantContext';

export type SystemAction =
  | 'view'
  | 'create'
  | 'submit'
  | 'approve'
  | 'release'
  | 'correct'
  | 'cancel'
  | 'export'
  | 'administer';

export type SystemDecisionCode =
  | 'ALLOW_SYSTEM_ACTION'
  | 'DENY_MISSING_CONTEXT'
  | 'DENY_MISSING_PURPOSE'
  | 'DENY_ACTION_PERMISSION';

export interface SystemActionDecision {
  granted: boolean;
  code: SystemDecisionCode;
  action: SystemAction;
  purpose: string;
  matchedRole?: string;
}

export async function evaluateSystemAction(input: {
  userId?: string;
  schoolId?: string;
  action: SystemAction;
  purpose: string;
}): Promise<SystemActionDecision> {
  const {
    userId,
    schoolId,
    action,
    purpose,
  } = input;

  if (!userId || !schoolId) {
    return {
      granted: false,
      code: 'DENY_MISSING_CONTEXT',
      action,
      purpose,
    };
  }

  if (!purpose.trim()) {
    return {
      granted: false,
      code: 'DENY_MISSING_PURPOSE',
      action,
      purpose,
    };
  }

  const roleNames =
    await getActiveRoleNames(
      userId,
      schoolId
    );

  if (roleNames.size === 0) {
    return {
      granted: false,
      code: 'DENY_ACTION_PERMISSION',
      action,
      purpose,
    };
  }

  return withTenantContext(
    {
      schoolId,
      userId,
      role: '',
    },
    async tx => {
      const roles =
        await tx.systemRole.findMany({
          where: {
            name: {
              in: [...roleNames],
            },
            archived_at: null,
          } as any,
          select: {
            id: true,
            name: true,
          },
        });

      if (roles.length === 0) {
        return {
          granted: false,
          code: 'DENY_ACTION_PERMISSION',
          action,
          purpose,
        };
      }

      const permissions =
        await tx.systemPermission.findMany({
          where: {
            module: 'system',
            action,
            resource: '*',
          },
          select: { id: true },
        });

      const permissionIds =
        permissions.map(
          permission => permission.id
        );

      if (permissionIds.length === 0) {
        return {
          granted: false,
          code: 'DENY_ACTION_PERMISSION',
          action,
          purpose,
        };
      }

      const grant =
        await tx.systemRolePermission.findFirst({
          where: {
            role_id: {
              in: roles.map(role => role.id),
            },
            permission_id: {
              in: permissionIds,
            },
          },
        });

      if (!grant) {
        return {
          granted: false,
          code: 'DENY_ACTION_PERMISSION',
          action,
          purpose,
        };
      }

      const matchedRole =
        roles.find(
          role => role.id === grant.role_id
        )?.name;

      return {
        granted: true,
        code: 'ALLOW_SYSTEM_ACTION',
        action,
        purpose,
        matchedRole,
      };
    }
  );
}
