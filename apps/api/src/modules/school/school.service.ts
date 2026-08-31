import { prisma } from '../../lib/prisma';
import { withTenantContext } from '../../lib/tenantContext';
import { randomUUID } from 'crypto';

export async function getSchoolProfile(schoolId: string) {
  return prisma.schoolSchool.findUnique({ where: { id: schoolId } });
}

export async function updateSchoolProfile(schoolId: string, data: Record<string, any>) {
  // Institution activation is a governed lifecycle transition, not profile CRUD.
  const allowed = ['name', 'short_name', 'address', 'city', 'region', 'country', 'phone', 'email', 'website', 'logo_url', 'ownership_type', 'founding_date', 'founder_name', 'registration_number', 'school_type'];
  const update: Record<string, any> = {};
  for (const key of allowed) if (data[key] !== undefined) update[key] = data[key];
  return prisma.schoolSchool.update({ where: { id: schoolId }, data: update });
}

export async function getSchoolSettings(schoolId: string) {
  return prisma.schoolSettings.findMany({ where: { school_id: schoolId, archived_at: null } });
}

export async function listAccreditations(schoolId: string) {
  return prisma.schoolAccreditation.findMany({ where: { school_id: schoolId, archived_at: null } });
}

export async function createAccreditation(schoolId: string, data: {
  authority: string; accreditationNumber: string; issueDate: string; expiryDate: string;
}) {
  return prisma.schoolAccreditation.create({
    data: {
      school_id: schoolId, authority: data.authority,
      accreditation_number: data.accreditationNumber,
      issue_date: data.issueDate, expiry_date: data.expiryDate,
    },
  });
}

export async function archiveAccreditation(schoolId: string, id: string) {
  return withTenantContext(undefined, async (tx) => {
    const result = await tx.schoolAccreditation.updateMany({
      where: { id, school_id: schoolId, archived_at: null },
      data: { archived_at: new Date() },
    });
    if (result.count === 0) return null;
    return tx.schoolAccreditation.findFirst({ where: { id, school_id: schoolId } });
  });
}

export async function listSchoolAuditLog(schoolId: string) {
  return prisma.schoolAuditLog.findMany({ where: { school_id: schoolId }, orderBy: { created_at: 'desc' }, take: 100 });
}

export async function logSchoolAudit(schoolId: string, action: string, performedBy: string) {
  return prisma.schoolAuditLog.create({ data: { school_id: schoolId, action, performed_by: performedBy } });
}

// Contacts
export async function listContacts(schoolId: string) {
  return prisma.schoolContact.findMany({ where: { school_id: schoolId } });
}
export async function createContact(schoolId: string, data: { contactType: any; value: string; label?: string; isPrimary?: boolean }) {
  return prisma.schoolContact.create({ data: { school_id: schoolId, contact_type: data.contactType, value: data.value, label: data.label, is_primary: !!data.isPrimary } });
}
export async function updateContact(schoolId: string, id: string, data: { value?: string; label?: string; isPrimary?: boolean }) {
  return withTenantContext(undefined, async (tx) => {
    const result = await tx.schoolContact.updateMany({
      where: { id, school_id: schoolId },
      data: {
        ...(data.value !== undefined && { value: data.value }),
        ...(data.label !== undefined && { label: data.label }),
        ...(data.isPrimary !== undefined && { is_primary: data.isPrimary }),
      },
    });
    if (result.count === 0) return null;
    return tx.schoolContact.findFirst({ where: { id, school_id: schoolId } });
  });
}

// Branding (single row per school)
export async function getBranding(schoolId: string) {
  return prisma.schoolBranding.findFirst({ where: { school_id: schoolId } });
}
export async function upsertBranding(schoolId: string, data: any) {
  const existing = await prisma.schoolBranding.findFirst({ where: { school_id: schoolId } });
  if (existing) return prisma.schoolBranding.update({ where: { id: existing.id }, data });
  return prisma.schoolBranding.create({ data: { school_id: schoolId, ...data } });
}

// Campuses
export async function listCampuses(schoolId: string) {
  return prisma.schoolCampus.findMany({ where: { school_id: schoolId } });
}
export async function createCampus(schoolId: string, data: { name: string; code: string; address?: string; phone?: string; isPrimary?: boolean }) {
  return prisma.schoolCampus.create({ data: { school_id: schoolId, name: data.name, code: data.code, address: data.address, phone: data.phone, is_primary: !!data.isPrimary, is_active: true } });
}
export async function toggleCampus(schoolId: string, id: string, isActive: boolean) {
  return withTenantContext(undefined, async (tx) => {
    const result = await tx.schoolCampus.updateMany({
      where: { id, school_id: schoolId },
      data: { is_active: isActive },
    });
    if (result.count === 0) return null;
    return tx.schoolCampus.findFirst({ where: { id, school_id: schoolId } });
  });
}

// Term policy (single row per school)
export async function getTermPolicy(schoolId: string) {
  return prisma.schoolTermPolicy.findFirst({ where: { school_id: schoolId } });
}
export async function upsertTermPolicy(schoolId: string, data: any) {
  const existing = await prisma.schoolTermPolicy.findFirst({ where: { school_id: schoolId } });
  if (existing) return prisma.schoolTermPolicy.update({ where: { id: existing.id }, data });
  return prisma.schoolTermPolicy.create({ data: { school_id: schoolId, ...data } });
}

// Documents (append-only)
export async function listDocuments(schoolId: string) {
  return prisma.schoolDocument.findMany({ where: { school_id: schoolId }, orderBy: { uploaded_at: 'desc' } });
}
export async function createDocument(schoolId: string, data: { documentType: string; fileUrl: string; issueDate?: string; expiryDate?: string; uploadedBy: string }) {
  return prisma.schoolDocument.create({
    data: { school_id: schoolId, document_type: data.documentType, file_url: data.fileUrl, issue_date: data.issueDate, expiry_date: data.expiryDate, uploaded_by: data.uploadedBy, uploaded_at: new Date() },
  });
}

// Subscription (read + status update, single row per school)
export async function getSubscription(schoolId: string) {
  return prisma.schoolSubscription.findFirst({ where: { school_id: schoolId } });
}
export async function updateSubscriptionStatus(schoolId: string, status: any) {
  const existing = await prisma.schoolSubscription.findFirst({ where: { school_id: schoolId } });
  if (existing) return prisma.schoolSubscription.update({ where: { id: existing.id }, data: { status } });
  return null;
}

// Settings create/update (was read-only)
export async function upsertSetting(schoolId: string, key: string, value: string, updatedBy: string) {
  const existing = await prisma.schoolSettings.findFirst({ where: { school_id: schoolId, key } });
  if (existing) return prisma.schoolSettings.update({ where: { id: existing.id }, data: { value, updated_by: updatedBy } });
  return prisma.schoolSettings.create({ data: { school_id: schoolId, key, value, updated_by: updatedBy } });
}

export async function updateCampus(schoolId: string, id: string, data: { name?: string; address?: string; phone?: string }) {
  return withTenantContext(undefined, async (tx) => {
    const result = await tx.schoolCampus.updateMany({ where: { id, school_id: schoolId }, data });
    if (result.count === 0) return null;
    return tx.schoolCampus.findFirst({ where: { id, school_id: schoolId } });
  });
}
export async function updateAccreditation(schoolId: string, id: string, data: { authority?: string; accreditationNumber?: string; issueDate?: string; expiryDate?: string }) {
  return withTenantContext(undefined, async (tx) => {
    const result = await tx.schoolAccreditation.updateMany({
      where: { id, school_id: schoolId, archived_at: null },
      data: {
        ...(data.authority !== undefined && { authority: data.authority }),
        ...(data.accreditationNumber !== undefined && { accreditation_number: data.accreditationNumber }),
        ...(data.issueDate !== undefined && { issue_date: data.issueDate }),
        ...(data.expiryDate !== undefined && { expiry_date: data.expiryDate }),
      },
    });
    if (result.count === 0) return null;
    return tx.schoolAccreditation.findFirst({ where: { id, school_id: schoolId, archived_at: null } });
  });
}

export async function archiveSetting(schoolId: string, id: string) {
  return withTenantContext(undefined, async (tx) => {
    const result = await tx.schoolSettings.updateMany({
      where: { id, school_id: schoolId, archived_at: null },
      data: { archived_at: new Date() },
    });
    if (result.count === 0) return null;
    return tx.schoolSettings.findFirst({ where: { id, school_id: schoolId } });
  });
}
export async function getSchoolSummary(schoolId: string) {
  const now = new Date();
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const [campuses, accreditations, documents, subscription] = await Promise.all([
    prisma.schoolCampus.findMany({ where: { school_id: schoolId } }),
    prisma.schoolAccreditation.findMany({ where: { school_id: schoolId, archived_at: null } }),
    prisma.schoolDocument.findMany({ where: { school_id: schoolId } }),
    prisma.schoolSubscription.findFirst({ where: { school_id: schoolId } }),
  ]);

  const expiringAccreditations = accreditations.filter(a => {
    const exp = new Date(a.expiry_date);
    return !isNaN(exp.getTime()) && exp >= now && exp <= in60Days;
  });
  const expiringDocuments = documents.filter(d => {
    if (!d.expiry_date) return false;
    const exp = new Date(d.expiry_date);
    return !isNaN(exp.getTime()) && exp >= now && exp <= in60Days;
  });

  return {
    campuses: { total: campuses.length, active: campuses.filter(c => c.is_active).length },
    accreditations: { total: accreditations.length, expiringWithin60d: expiringAccreditations.length },
    documents: { total: documents.length, expiringWithin60d: expiringDocuments.length },
    subscription: subscription
      ? {
          plan: subscription.plan_name,
          status: subscription.status,
          nextBillingDate: subscription.next_billing_date,
          amountGhs: Number(subscription.amount_ghs),
        }
      : null,
  };
}


// ═══════════════════════════════════════════════════════════════════════
// SCHOOLX INSTITUTION LIFECYCLE — EFS-SCH-0032..0035 / EEAS-SCH lifecycle
// ═══════════════════════════════════════════════════════════════════════

export type SchoolLifecycleStatus =
  | 'DRAFT'
  | 'UNDER_VERIFICATION'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'ARCHIVED';

const SCHOOL_LIFECYCLE_TRANSITIONS: Record<SchoolLifecycleStatus, SchoolLifecycleStatus[]> = {
  DRAFT: ['UNDER_VERIFICATION', 'ARCHIVED'],
  UNDER_VERIFICATION: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
  ACTIVE: ['SUSPENDED', 'ARCHIVED'],
  SUSPENDED: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: [],
};

export class InvalidSchoolLifecycleTransitionError extends Error {
  constructor(public currentState: string, public attemptedState: string) {
    super(
      'School lifecycle transition is not permitted from ' +
      currentState + ' to ' + attemptedState
    );
    this.name = 'InvalidSchoolLifecycleTransitionError';
  }
}

export class SchoolMakerCheckerError extends Error {
  constructor() {
    super('Segregation of duties requires a different authorised actor to approve institution verification.');
    this.name = 'SchoolMakerCheckerError';
  }
}

export class ProviderSchoolAuthorityRequiredError extends Error {
  constructor() {
    super('Initial institution verification approval requires authorised AYIVI provider authority.');
    this.name = 'ProviderSchoolAuthorityRequiredError';
  }
}

export class SchoolLifecycleConflictError extends Error {
  constructor() {
    super('Institution lifecycle changed concurrently; reload the authoritative state before retrying.');
    this.name = 'SchoolLifecycleConflictError';
  }
}

function schoolLifecycleEvent(prior: SchoolLifecycleStatus, next: SchoolLifecycleStatus): string {
  if (prior === 'DRAFT' && next === 'UNDER_VERIFICATION') return 'SchoolVerificationSubmitted';
  if (prior === 'UNDER_VERIFICATION' && next === 'ACTIVE') return 'SchoolVerified';
  if (prior === 'ACTIVE' && next === 'SUSPENDED') return 'SchoolSuspended';
  if (prior === 'SUSPENDED' && next === 'ACTIVE') return 'SchoolReactivated';
  if (next === 'ARCHIVED') return 'SchoolArchived';
  if (next === 'DRAFT') return 'SchoolVerificationReturned';
  return 'SchoolLifecycleChanged';
}

export async function getSchoolLifecycle(schoolId: string) {
  return withTenantContext(undefined, async (tx) => {
    const school = await tx.schoolSchool.findFirst({
      where: { id: schoolId },
      select: {
        id: true,
        status: true,
        row_version: true,
        is_active: true,
        verified_at: true,
        verified_by: true,
        activated_at: true,
        suspended_at: true,
        archived_at: true,
      },
    });
    if (!school) return null;
    const history = await tx.schoolLifecycleTransition.findMany({
      where: { school_id: schoolId },
      orderBy: { created_at: 'desc' },
      take: 25,
    });
    return { ...school, history };
  });
}

export async function transitionSchoolLifecycle(input: {
  schoolId: string;
  actorId: string;
  actorRole?: string;
  authorityPlane: 'TENANT' | 'PROVIDER';
  newStatus: SchoolLifecycleStatus;
  action: string;
  reason: string;
}) {
  const reason = String(input.reason || '').trim();
  if (reason.length < 5) {
    throw new Error('A lifecycle transition reason of at least 5 characters is required.');
  }

  return withTenantContext(undefined, async (tx) => {
    const school = await tx.schoolSchool.findFirst({ where: { id: input.schoolId } });
    if (!school) return null;

    const current = ((school as any).status || ((school as any).is_active ? 'ACTIVE' : 'SUSPENDED')) as SchoolLifecycleStatus;
    if (!SCHOOL_LIFECYCLE_TRANSITIONS[current]?.includes(input.newStatus)) {
      throw new InvalidSchoolLifecycleTransitionError(current, input.newStatus);
    }

    if (
      current === 'UNDER_VERIFICATION' &&
      input.newStatus === 'ACTIVE' &&
      input.authorityPlane !== 'PROVIDER'
    ) {
      throw new ProviderSchoolAuthorityRequiredError();
    }

    // Maker-checker: the actor who submitted DRAFT -> UNDER_VERIFICATION
    // cannot approve UNDER_VERIFICATION -> ACTIVE, including the later
    // provider-authority execution path.
    if (current === 'UNDER_VERIFICATION' && input.newStatus === 'ACTIVE') {
      const submission = await tx.schoolLifecycleTransition.findFirst({
        where: {
          school_id: input.schoolId,
          new_state: 'UNDER_VERIFICATION',
        },
        orderBy: { created_at: 'desc' },
      });
      if (submission?.actor_id === input.actorId) {
        throw new SchoolMakerCheckerError();
      }
    }

    const now = new Date();
    const correlationId = randomUUID();
    const data: Record<string, any> = {
      status: input.newStatus,
      is_active: input.newStatus === 'ACTIVE',
      row_version: { increment: 1 },
    };

    if (current === 'UNDER_VERIFICATION' && input.newStatus === 'ACTIVE') {
      data.verified_at = now;
      data.verified_by = input.actorId;
      data.activated_at = now;
      data.suspended_at = null;
    } else if (current === 'SUSPENDED' && input.newStatus === 'ACTIVE') {
      data.activated_at = now;
      data.suspended_at = null;
    } else if (input.newStatus === 'SUSPENDED') {
      data.suspended_at = now;
    } else if (input.newStatus === 'ARCHIVED') {
      data.archived_at = now;
    }

    const currentVersion = Number((school as any).row_version || 1);
    const updateResult = await tx.schoolSchool.updateMany({
      where: { id: input.schoolId, row_version: currentVersion },
      data,
    });
    if (updateResult.count !== 1) {
      throw new SchoolLifecycleConflictError();
    }
    const updated = await tx.schoolSchool.findFirst({ where: { id: input.schoolId } });
    if (!updated) {
      throw new SchoolLifecycleConflictError();
    }

    await tx.schoolLifecycleTransition.create({
      data: {
        school_id: input.schoolId,
        prior_state: current,
        new_state: input.newStatus,
        action: input.action,
        actor_id: input.actorId,
        actor_role: input.actorRole || null,
        reason,
        correlation_id: correlationId,
      },
    });

    await tx.schoolAuditLog.create({
      data: {
        school_id: input.schoolId,
        action: 'LIFECYCLE ' + current + ' -> ' + input.newStatus + ': ' + reason,
        performed_by: input.actorId,
      },
    });

    await tx.systemAuditEvent.create({
      data: {
        school_id: input.schoolId,
        user_id: input.actorId,
        action: 'SCHOOL_LIFECYCLE:' + current + '->' + input.newStatus,
        entity_type: 'school_school',
        entity_id: input.schoolId,
        before_state: current,
        after_state: input.newStatus,
      },
    });

    await tx.systemDomainEvent.create({
      data: {
        aggregate_type: 'School',
        aggregate_id: input.schoolId,
        event_type: schoolLifecycleEvent(current, input.newStatus),
        tenant_id: input.schoolId,
        correlation_id: correlationId,
        payload: {
          priorState: current,
          newState: input.newStatus,
          reason,
          actorId: input.actorId,
          actorRole: input.actorRole || null,
        },
        status: 'PENDING',
      },
    });

    return updated;
  });
}
