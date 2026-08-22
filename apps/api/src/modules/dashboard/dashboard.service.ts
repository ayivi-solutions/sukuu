import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getDashboardSummary(schoolId: string) {
  // StaffLeave stores a raw staff_id with no Prisma relation to StaffStaff,
  // so school-scoping requires resolving this school's staff ids first.
  const schoolStaffIds = await prisma.staffStaff.findMany({
    where: { school_id: schoolId },
    select: { id: true },
  });
  const staffIdList = schoolStaffIds.map((s) => s.id);

  const [
    school,
    activeYear,
    activeTerm,
    staffTotal,
    staffActive,
    studentsTotal,
    studentsActive,
    admissionsPending,
    leavePending,
    invoiceAgg,
    overdueInvoices,
    paymentsThisMonth,
    todaySessions,
  ] = await Promise.all([
    prisma.schoolSchool.findUnique({ where: { id: schoolId } }),
    prisma.academicsAcademicYear.findFirst({ where: { school_id: schoolId, is_active: true } }),
    prisma.academicsTerm.findFirst({ where: { school_id: schoolId, is_active: true } }),
    Promise.resolve(staffIdList.length), // staffTotal already known from the fetch above
    prisma.staffStaff.count({ where: { school_id: schoolId, employment_status: 'ACTIVE' } }),
    prisma.studentsStudent.count({ where: { school_id: schoolId } }),
    prisma.studentsStudent.count({ where: { school_id: schoolId, status: 'ACTIVE' } }),
    prisma.admissionApplicant.count({ where: { school_id: schoolId, status: { in: ['PENDING', 'UNDER_REVIEW'] } } }),
    staffIdList.length > 0
      ? prisma.staffLeave.count({ where: { status: 'PENDING', staff_id: { in: staffIdList } } })
      : Promise.resolve(0),
    prisma.financeInvoice.aggregate({
      where: { school_id: schoolId, status: { in: ['ISSUED', 'OVERDUE', 'PARTIAL'] } },
      _sum: { balance_due: true },
    }),
    prisma.financeInvoice.count({ where: { school_id: schoolId, status: 'OVERDUE' } }),
    prisma.financePayment.aggregate({
      where: {
        school_id: schoolId,
        status: 'CONFIRMED',
        paid_date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { amount: true },
    }),
    prisma.attendanceSession.findMany({
      where: { school_id: schoolId, session_date: today(), archived_at: null },
      select: { id: true },
    }),
  ]);

  let attendance: { presentToday: number; markedToday: number; ratePct: number | null } = {
    presentToday: 0,
    markedToday: 0,
    ratePct: null,
  };
  if (todaySessions.length > 0) {
    const sessionIds = todaySessions.map((s) => s.id);
    const [marked, present] = await Promise.all([
      prisma.attendanceStudent.count({ where: { session_id: { in: sessionIds }, archived_at: null } }),
      prisma.attendanceStudent.count({ where: { session_id: { in: sessionIds }, archived_at: null, status: 'present' } }),
    ]);
    attendance = {
      presentToday: present,
      markedToday: marked,
      ratePct: marked > 0 ? Math.round((present / marked) * 1000) / 10 : null,
    };
  }

  return {
    school: school ? { id: school.id, name: school.name, code: school.code } : null,
    term: activeTerm ? activeTerm.name : null,
    academicYear: activeYear ? activeYear.name : null,
    staff: { total: staffTotal, active: staffActive },
    students: { total: studentsTotal, active: studentsActive },
    attendance,
    finance: {
      outstandingBalance: Number(invoiceAgg._sum.balance_due ?? 0),
      overdueInvoices,
      collectedThisMonth: Number(paymentsThisMonth._sum.amount ?? 0),
    },
    needsAttention: {
      admissionsPending,
      leavePending,
      overdueInvoices,
    },
  };
}
