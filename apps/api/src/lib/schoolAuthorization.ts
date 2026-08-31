import { getActiveRoleNames } from './roleGrants';
import { withTenantContext } from './tenantContext';

export type SchoolAction =
  | 'view'
  | 'create'
  | 'submit'
  | 'approve'
  | 'release'
  | 'correct'
  | 'cancel'
  | 'export'
  | 'administer';

export const SCHOOL_ACTIONS: readonly SchoolAction[] = [
  'view', 'create', 'submit', 'approve', 'release',
  'correct', 'cancel', 'export', 'administer',
];

export type SchoolDecisionCode =
  | 'ALLOW_SCHOOL_ACTION'
  | 'DENY_MISSING_CONTEXT'
  | 'DENY_MISSING_PURPOSE'
  | 'DENY_ACTION_PERMISSION';

export interface SchoolActionDecision {
  granted: boolean;
  code: SchoolDecisionCode;
  action: SchoolAction;
  purpose: string;
  matchedRole?: string;
}

export async function evaluateSchoolAction(input: {
  userId?: string;
  schoolId?: string;
  action: SchoolAction;
  purpose: string;
}): Promise<SchoolActionDecision> {
  const { userId, schoolId, action, purpose } = input;
  if (!userId || !schoolId) return { granted: false, code: 'DENY_MISSING_CONTEXT', action, purpose };
  if (!purpose.trim()) return { granted: false, code: 'DENY_MISSING_PURPOSE', action, purpose };

  const roleNames = await getActiveRoleNames(userId, schoolId);
  if (roleNames.size === 0) return { granted: false, code: 'DENY_ACTION_PERMISSION', action, purpose };

  return withTenantContext({ schoolId, userId, role: '' }, async tx => {
    const roles = await tx.systemRole.findMany({
      where: { name: { in: [...roleNames] }, archived_at: null } as any,
      select: { id: true, name: true },
    });
    if (roles.length === 0) return { granted: false, code: 'DENY_ACTION_PERMISSION', action, purpose };

    const permissions = await tx.systemPermission.findMany({
      where: { module: 'school', action, resource: '*' },
      select: { id: true },
    });
    if (permissions.length === 0) return { granted: false, code: 'DENY_ACTION_PERMISSION', action, purpose };

    const grant = await tx.systemRolePermission.findFirst({
      where: {
        role_id: { in: roles.map(role => role.id) },
        permission_id: { in: permissions.map(permission => permission.id) },
      },
    });
    if (!grant) return { granted: false, code: 'DENY_ACTION_PERMISSION', action, purpose };

    return {
      granted: true,
      code: 'ALLOW_SCHOOL_ACTION',
      action,
      purpose,
      matchedRole: roles.find(role => role.id === grant.role_id)?.name,
    };
  });
}

export async function listSchoolCapabilities(input: { userId?: string; schoolId?: string }) {
  const actions = Object.fromEntries(
    await Promise.all(SCHOOL_ACTIONS.map(async action => {
      const decision = await evaluateSchoolAction({ ...input, action, purpose: 'schoolx-workspace-disclosure' });
      return [action, decision.granted] as const;
    }))
  ) as Record<SchoolAction, boolean>;

  const roles = input.userId && input.schoolId
    ? [...await getActiveRoleNames(input.userId, input.schoolId)]
    : [];

  return { sourceAuthority: 'SchoolX', schoolId: input.schoolId || null, roles, actions };
}
