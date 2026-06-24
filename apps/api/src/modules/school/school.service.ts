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
