import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getDashboardSummary(schoolId: string) {
  const school = await prisma.schoolSchool.findUnique({ where: { id: schoolId } });
  const staffCount = await prisma.staffStaff.count({ where: { school_id: schoolId } });
  const activeStaffCount = await prisma.staffStaff.count({
    where: { school_id: schoolId, employment_status: 'ACTIVE' },
  });

  return {
    school: school ? { id: school.id, name: school.name, code: school.code } : null,
    staff: { total: staffCount, active: activeStaffCount },
    note: 'Student, finance, attendance, and other module data not yet available — modules pending build-out.',
  };
}
