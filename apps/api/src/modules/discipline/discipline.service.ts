import { prisma } from '../../lib/prisma';

export async function listIncidents(schoolId: string, studentId?: string) { return prisma.disciplineIncident.findMany({ where: { school_id: schoolId, ...(studentId && { student_id: studentId }) } }); }
export async function createIncident(schoolId: string, reportedBy: string, data: any) {
  return prisma.disciplineIncident.create({ data: { school_id: schoolId, student_id: data.studentId, reported_by: reportedBy, incident_type: data.incidentType, severity: data.severity || 'LOW', description: data.description, incident_date: data.incidentDate } });
}
export async function getIncidentSchoolId(id: string) { return (await prisma.disciplineIncident.findUnique({ where: { id } }))?.school_id; }

export async function listActions(schoolId: string, incidentId?: string) { return prisma.disciplineAction.findMany({ where: { school_id: schoolId, ...(incidentId && { incident_id: incidentId }) } }); }
export async function createAction(schoolId: string, assignedBy: string, data: any) {
  return prisma.disciplineAction.create({ data: { school_id: schoolId, incident_id: data.incidentId, action_type: data.actionType, assigned_by: assignedBy, start_date: data.startDate, end_date: data.endDate, status: data.status || 'PENDING' } });
}
export async function updateActionStatus(id: string, status: string) { return prisma.disciplineAction.update({ where: { id }, data: { status: status as any } }); }
export async function getActionSchoolId(id: string) { return (await prisma.disciplineAction.findUnique({ where: { id } }))?.school_id; }

export async function listSuspensions(schoolId: string, studentId?: string) { return prisma.disciplineSuspension.findMany({ where: { school_id: schoolId, ...(studentId && { student_id: studentId }) } }); }
export async function createSuspension(schoolId: string, approvedBy: string, data: any) {
  return prisma.disciplineSuspension.create({ data: { school_id: schoolId, student_id: data.studentId, reason: data.reason, start_date: data.startDate, end_date: data.endDate, approved_by: approvedBy, parent_notified: !!data.parentNotified } });
}
export async function getSuspensionSchoolId(id: string) { return (await prisma.disciplineSuspension.findUnique({ where: { id } }))?.school_id; }

export async function listCommendations(schoolId: string, studentId?: string) { return prisma.disciplineCommendation.findMany({ where: { school_id: schoolId, ...(studentId && { student_id: studentId }) } }); }
export async function createCommendation(schoolId: string, awardedBy: string, data: any) {
  return prisma.disciplineCommendation.create({ data: { school_id: schoolId, student_id: data.studentId, commendation_type: data.commendationType, awarded_by: awardedBy, award_date: data.awardDate, remarks: data.remarks } });
}
export async function getCommendationSchoolId(id: string) { return (await prisma.disciplineCommendation.findUnique({ where: { id } }))?.school_id; }

export async function listBehaviorScores(schoolId: string, studentId?: string) { return prisma.disciplineBehaviorScore.findMany({ where: { school_id: schoolId, ...(studentId && { student_id: studentId }) } }); }
export async function createBehaviorScore(schoolId: string, data: any) {
  return prisma.disciplineBehaviorScore.create({ data: { school_id: schoolId, student_id: data.studentId, term_id: data.termId, score: data.score, risk_level: data.riskLevel || 'LOW', generated_at: new Date() } });
}
export async function getBehaviorScoreSchoolId(id: string) { return (await prisma.disciplineBehaviorScore.findUnique({ where: { id } }))?.school_id; }

export async function getDisciplineSummary(schoolId: string) {
  const [openIncidents, totalIncidents, activeSuspensions, criticalRisk, commendationsThisTerm] = await Promise.all([
    prisma.disciplineAction.count({ where: { school_id: schoolId, status: 'PENDING' } }),
    prisma.disciplineIncident.count({ where: { school_id: schoolId } }),
    prisma.disciplineSuspension.count({ where: { school_id: schoolId, end_date: { gte: new Date().toISOString().slice(0, 10) } } }),
    prisma.disciplineBehaviorScore.count({ where: { school_id: schoolId, risk_level: 'CRITICAL' } }),
    prisma.disciplineCommendation.count({ where: { school_id: schoolId } }),
  ]);
  return { openIncidents, totalIncidents, activeSuspensions, criticalRisk, commendationsThisTerm };
}
