import { prisma } from '../../lib/prisma';
import { getMyModuleAccess } from '../../lib/roleGrants';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Every section below is genuinely optional in the response — a Head of
 * Department has no 'finance' or 'admission' grant, so those keys simply
 * don't exist on what comes back, and the frontend only renders what it's
 * given. This is the same principle Nexus EFOS's dashboard uses (fetch
 * per-permission, silently drop what 403s) implemented as one grant check
 * or a full "everyone sees everything" screen with no accessible middle.
 */
export async function getDashboardSummary(schoolId: string, userId: string) {
  const access = await getMyModuleAccess(userId, schoolId);

  // Context — visible to everyone regardless of role. This is "what
  // school and term am I in," not school *configuration* (which is what
  // the 'school' module grant actually gates), so it's deliberately not
  // conditioned on any module access.
  const [school, activeYear, activeTerm] = await Promise.all([
    prisma.schoolSchool.findUnique({ where: { id: schoolId } }),
    prisma.academicsAcademicYear.findFirst({ where: { school_id: schoolId, is_active: true } }),
    prisma.academicsTerm.findFirst({ where: { school_id: schoolId, is_active: true } }),
  ]);

  const result: any = {
    school: school ? { id: school.id, name: school.name, code: school.code } : null,
    term: activeTerm ? activeTerm.name : null,
    academicYear: activeYear ? activeYear.name : null,
    needsAttention: {},
  };

  if ('student' in access) {
    const [total, active] = await Promise.all([
      prisma.studentsStudent.count({ where: { school_id: schoolId } }),
      prisma.studentsStudent.count({ where: { school_id: schoolId, status: 'ACTIVE' } }),
    ]);
    result.students = { total, active };
  }

  if ('staff' in access) {
    const schoolStaffIds = await prisma.staffStaff.findMany({ where: { school_id: schoolId }, select: { id: true } });
    const staffIdList = schoolStaffIds.map(s => s.id);
    const [active, leavePending] = await Promise.all([
      prisma.staffStaff.count({ where: { school_id: schoolId, employment_status: 'ACTIVE' } }),
      staffIdList.length > 0
        ? prisma.staffLeave.count({ where: { status: 'PENDING', staff_id: { in: staffIdList } } })
        : Promise.resolve(0),
    ]);
    result.staff = { total: staffIdList.length, active };
    if (leavePending > 0) result.needsAttention.leavePending = leavePending;
  }

  if ('attendance' in access) {
    const todaySessions = await prisma.attendanceSession.findMany({
      where: { school_id: schoolId, session_date: today(), archived_at: null },
      select: { id: true },
    });
    let attendance = { presentToday: 0, markedToday: 0, ratePct: null as number | null };
    if (todaySessions.length > 0) {
      const sessionIds = todaySessions.map(s => s.id);
      const [marked, present] = await Promise.all([
        prisma.attendanceStudent.count({ where: { session_id: { in: sessionIds }, archived_at: null } }),
        prisma.attendanceStudent.count({ where: { session_id: { in: sessionIds }, archived_at: null, status: 'present' } }),
      ]);
      attendance = { presentToday: present, markedToday: marked, ratePct: marked > 0 ? Math.round((present / marked) * 1000) / 10 : null };
    }
    result.attendance = attendance;
  }

  if ('finance' in access) {
    const [invoiceAgg, overdueInvoices, paymentsThisMonth] = await Promise.all([
      prisma.financeInvoice.aggregate({
        where: { school_id: schoolId, status: { in: ['ISSUED', 'OVERDUE', 'PARTIAL'] } },
        _sum: { balance_due: true },
      }),
      prisma.financeInvoice.count({ where: { school_id: schoolId, status: 'OVERDUE' } }),
      prisma.financePayment.aggregate({
        where: { school_id: schoolId, status: 'CONFIRMED', paid_date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
        _sum: { amount: true },
      }),
    ]);
    result.finance = {
      outstandingBalance: Number(invoiceAgg._sum.balance_due ?? 0),
      overdueInvoices,
      collectedThisMonth: Number(paymentsThisMonth._sum.amount ?? 0),
    };
    if (overdueInvoices > 0) result.needsAttention.overdueInvoices = overdueInvoices;
  }

  if ('admission' in access) {
    const admissionsPending = await prisma.admissionApplicant.count({
      where: { school_id: schoolId, status: { in: ['PENDING', 'UNDER_REVIEW'] } },
    });
    result.admissionsPending = admissionsPending;
    if (admissionsPending > 0) result.needsAttention.admissionsPending = admissionsPending;
  }

  return result;
}
