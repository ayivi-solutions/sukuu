import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getSchoolProfile(schoolId: string) {
  return prisma.schoolSchool.findUnique({ where: { id: schoolId } });
}

export async function updateSchoolProfile(schoolId: string, data: Record<string, any>) {
  const allowed = ['name', 'short_name', 'address', 'city', 'region', 'country', 'phone', 'email', 'website', 'logo_url', 'ownership_type', 'founding_date', 'founder_name'];
  const update: Record<string, any> = {};
  for (const key of allowed) if (data[key] !== undefined) update[key] = data[key];
  return prisma.schoolSchool.update({ where: { id: schoolId }, data: update });
}

export async function getSchoolSettings(schoolId: string) {
  return prisma.schoolSettings.findMany({ where: { school_id: schoolId } });
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

export async function archiveAccreditation(id: string) {
  return prisma.schoolAccreditation.update({ where: { id }, data: { archived_at: new Date() } });
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
export async function updateContact(id: string, data: { value?: string; label?: string; isPrimary?: boolean }) {
  return prisma.schoolContact.update({ where: { id }, data: { ...(data.value && { value: data.value }), ...(data.label && { label: data.label }), ...(data.isPrimary !== undefined && { is_primary: data.isPrimary }) } });
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
export async function toggleCampus(id: string, isActive: boolean) {
  return prisma.schoolCampus.update({ where: { id }, data: { is_active: isActive } });
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

export async function updateCampus(id: string, data: { name?: string; address?: string; phone?: string }) {
  return prisma.schoolCampus.update({ where: { id }, data });
}
export async function updateAccreditation(id: string, data: { authority?: string; accreditationNumber?: string; issueDate?: string; expiryDate?: string }) {
  return prisma.schoolAccreditation.update({
    where: { id },
    data: {
      ...(data.authority && { authority: data.authority }),
      ...(data.accreditationNumber && { accreditation_number: data.accreditationNumber }),
      ...(data.issueDate && { issue_date: data.issueDate }),
      ...(data.expiryDate && { expiry_date: data.expiryDate }),
    },
  });
}
