import { prisma } from '../../lib/prisma';

export async function listVisits(schoolId: string, studentId?: string) { return prisma.clinicVisit.findMany({ where: { school_id: schoolId, ...(studentId && { student_id: studentId }) } }); }
export async function createVisit(schoolId: string, attendedBy: string, data: any) {
  return prisma.clinicVisit.create({ data: { school_id: schoolId, student_id: data.studentId, visit_date: new Date(), complaint: data.complaint, diagnosis: data.diagnosis, treatment: data.treatment, attended_by: attendedBy } });
}
export async function updateVisit(id: string, data: any) { return prisma.clinicVisit.update({ where: { id }, data: { diagnosis: data.diagnosis, treatment: data.treatment } }); }
export async function getVisitSchoolId(id: string) { return (await prisma.clinicVisit.findUnique({ where: { id } }))?.school_id; }

export async function listMedications(schoolId: string) { return prisma.clinicMedication.findMany({ where: { school_id: schoolId } }); }
export async function createMedication(schoolId: string, data: any) {
  return prisma.clinicMedication.create({ data: { school_id: schoolId, name: data.name, dosage: data.dosage, stock_quantity: data.stockQuantity || 0, reorder_level: data.reorderLevel || 0, is_active: true } });
}
export async function getMedicationSchoolId(id: string) { return (await prisma.clinicMedication.findUnique({ where: { id } }))?.school_id; }

export async function listPrescriptions(schoolId: string, visitId?: string) { return prisma.clinicPrescription.findMany({ where: { school_id: schoolId, ...(visitId && { visit_id: visitId }) } }); }
export async function createPrescription(schoolId: string, data: any) {
  const med = await prisma.clinicMedication.findUnique({ where: { id: data.medicationId } });
  if (med && med.stock_quantity > 0) await prisma.clinicMedication.update({ where: { id: data.medicationId }, data: { stock_quantity: { decrement: 1 } } });
  return prisma.clinicPrescription.create({ data: { school_id: schoolId, visit_id: data.visitId, medication_id: data.medicationId, dosage: data.dosage, duration_days: data.durationDays, instructions: data.instructions } });
}
export async function getPrescriptionSchoolId(id: string) { return (await prisma.clinicPrescription.findUnique({ where: { id } }))?.school_id; }

export async function listReferrals(schoolId: string, visitId?: string) { return prisma.clinicReferral.findMany({ where: { school_id: schoolId, ...(visitId && { visit_id: visitId }) } }); }
export async function createReferral(schoolId: string, data: any) {
  return prisma.clinicReferral.create({ data: { school_id: schoolId, visit_id: data.visitId, hospital_name: data.hospitalName, reason: data.reason, referral_date: data.referralDate, referral_letter_url: data.referralLetterUrl, parent_notified: !!data.parentNotified } });
}
export async function getReferralSchoolId(id: string) { return (await prisma.clinicReferral.findUnique({ where: { id } }))?.school_id; }

export async function listImmunizations(schoolId: string, studentId?: string) { return prisma.clinicImmunization.findMany({ where: { school_id: schoolId, ...(studentId && { student_id: studentId }) } }); }
export async function createImmunization(schoolId: string, data: any) {
  return prisma.clinicImmunization.create({ data: { school_id: schoolId, student_id: data.studentId, vaccine_name: data.vaccineName, date_administered: data.dateAdministered, administered_by: data.administeredBy, next_due_date: data.nextDueDate } });
}
export async function getImmunizationSchoolId(id: string) { return (await prisma.clinicImmunization.findUnique({ where: { id } }))?.school_id; }

export async function getClinicSummary(schoolId: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [visitsToday, totalVisits, activeMeds, pendingReferrals, upcomingImmunizations] = await Promise.all([
    prisma.clinicVisit.count({ where: { school_id: schoolId, visit_date: { gte: today } } }),
    prisma.clinicVisit.count({ where: { school_id: schoolId } }),
    prisma.clinicMedication.findMany({ where: { school_id: schoolId, is_active: true }, select: { stock_quantity: true, reorder_level: true } }),
    prisma.clinicReferral.count({ where: { school_id: schoolId } }),
    prisma.clinicImmunization.count({ where: { school_id: schoolId, next_due_date: { not: null } } }),
  ]);
  // Column-to-column comparison (stock <= reorder level) isn't expressible in a Prisma `where`, so filter in JS.
  const lowStockMeds = activeMeds.filter(m => m.stock_quantity <= m.reorder_level).length;
  return { visitsToday, totalVisits, lowStockMeds, pendingReferrals, upcomingImmunizations };
}
