import { prisma } from '../../lib/prisma';

export async function listKpis(schoolId: string, metricName?: string) { return prisma.analyticsKpi.findMany({ where: { school_id: schoolId, ...(metricName && { metric_name: metricName }) }, orderBy: { snapshot_date: 'desc' } }); }
export async function createKpi(schoolId: string, data: any) {
  return prisma.analyticsKpi.create({ data: { school_id: schoolId, metric_name: data.metricName, metric_value: data.metricValue, snapshot_date: data.snapshotDate, dimension: data.dimension, dimension_value: data.dimensionValue } });
}

export async function listStudentRisks(schoolId: string, studentId?: string) { return prisma.analyticsStudentRisk.findMany({ where: { school_id: schoolId, ...(studentId && { student_id: studentId }) }, orderBy: { generated_at: 'desc' } }); }
export async function createStudentRisk(schoolId: string, data: any) {
  return prisma.analyticsStudentRisk.create({ data: { school_id: schoolId, student_id: data.studentId, risk_score: data.riskScore, risk_category: data.riskCategory || 'LOW', contributing_factors: data.contributingFactors, generated_at: new Date(), term_id: data.termId } });
}
export async function acknowledgeRisk(id: string) { return prisma.analyticsStudentRisk.findUnique({ where: { id } }); }

export async function listReports(schoolId: string) { return prisma.analyticsReport.findMany({ where: { school_id: schoolId }, orderBy: { generated_at: 'desc' } }); }
export async function createReport(schoolId: string, generatedBy: string, data: any) {
  return prisma.analyticsReport.create({ data: { school_id: schoolId, report_name: data.reportName, report_type: data.reportType, parameters: data.parameters, generated_by: generatedBy, generated_at: new Date(), file_url: data.fileUrl, expires_at: data.expiresAt ? new Date(data.expiresAt) : null } });
}

export async function listEvents(schoolId: string, eventType?: string) { return prisma.analyticsEvent.findMany({ where: { school_id: schoolId, ...(eventType && { event_type: eventType }) }, orderBy: { event_timestamp: 'desc' }, take: 200 }); }
export async function logEvent(schoolId: string, data: any) {
  return prisma.analyticsEvent.create({ data: { school_id: schoolId, event_type: data.eventType, entity_type: data.entityType, entity_id: data.entityId, properties: data.properties, event_timestamp: new Date(), academic_year_id: data.academicYearId, term_id: data.termId } });
}

export async function getAnalyticsSummary(schoolId: string) {
  const [totalReports, highRiskStudents, kpiCount, eventsToday] = await Promise.all([
    prisma.analyticsReport.count({ where: { school_id: schoolId } }),
    prisma.analyticsStudentRisk.count({ where: { school_id: schoolId, risk_category: { in: ['HIGH', 'CRITICAL'] } } }),
    prisma.analyticsKpi.count({ where: { school_id: schoolId } }),
    prisma.analyticsEvent.count({ where: { school_id: schoolId, event_timestamp: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
  ]);
  return { totalReports, highRiskStudents, kpiCount, eventsToday };
}
