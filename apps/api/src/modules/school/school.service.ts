import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getSchoolProfile(schoolId: string) {
  return prisma.schoolSchool.findUnique({ where: { id: schoolId } });
}

export async function updateSchoolProfile(schoolId: string, data: Record<string, any>) {
  const allowed = ['name', 'address', 'city', 'region', 'country', 'phone', 'email', 'website', 'logo_url'];
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
