import { prisma } from '../../lib/prisma';
import { withTenantContext } from '../../lib/tenantContext';

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
