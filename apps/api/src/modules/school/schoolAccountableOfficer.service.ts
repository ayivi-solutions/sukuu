import { withTenantContext } from '../../lib/tenantContext';

export const REQUIRED_ACCOUNTABLE_OFFICER_TYPES = ['HEAD_OF_SCHOOL'] as const;

export type SchoolOfficerType =
  | 'HEAD_OF_SCHOOL'
  | 'COMPLIANCE_OFFICER'
  | 'DATA_PROTECTION_OFFICER';

export class DuplicateAccountableOfficerError extends Error {
  constructor(officerType: string) {
    super(`An active ${officerType} is already assigned for this school.`);
    this.name = 'DuplicateAccountableOfficerError';
  }
}

export async function listAccountableOfficers(schoolId: string) {
  return withTenantContext(undefined, async (tx) => {
    return tx.schoolAccountableOfficer.findMany({
      where: { school_id: schoolId, removed_at: null },
      orderBy: { created_at: 'asc' },
    });
  });
}

export async function appointAccountableOfficer(input: {
  schoolId: string;
  officerType: SchoolOfficerType;
  fullName: string;
  email: string;
  phone?: string;
  appointedBy: string;
}) {
  return withTenantContext(undefined, async (tx) => {
    const existing = await tx.schoolAccountableOfficer.findFirst({
      where: {
        school_id: input.schoolId,
        officer_type: input.officerType,
        removed_at: null,
      },
    });
    if (existing) {
      throw new DuplicateAccountableOfficerError(input.officerType);
    }

    return tx.schoolAccountableOfficer.create({
      data: {
        school_id: input.schoolId,
        officer_type: input.officerType,
        full_name: input.fullName,
        email: input.email,
        phone: input.phone,
        appointed_by: input.appointedBy,
        appointed_at: new Date(),
      },
    });
  });
}

export async function removeAccountableOfficer(input: {
  schoolId: string;
  officerId: string;
  removedBy: string;
}) {
  return withTenantContext(undefined, async (tx) => {
    return tx.schoolAccountableOfficer.updateMany({
      where: { id: input.officerId, school_id: input.schoolId, removed_at: null },
      data: { removed_at: new Date(), removed_by: input.removedBy },
    });
  });
}

/**
 * Go-live gate for GAP-016: an institution cannot transition
 * UNDER_VERIFICATION -> ACTIVE without at least one active officer for
 * every required accountable-officer type. Called from
 * transitionSchoolLifecycle inside the same transaction so the check is
 * atomic with the transition itself.
 */
export async function hasRequiredAccountableOfficers(
  tx: any,
  schoolId: string
): Promise<boolean> {
  const active = await tx.schoolAccountableOfficer.findMany({
    where: { school_id: schoolId, removed_at: null },
    select: { officer_type: true },
  });
  const activeTypes = new Set(active.map((o: any) => o.officer_type));
  return REQUIRED_ACCOUNTABLE_OFFICER_TYPES.every((t) => activeTypes.has(t));
}
