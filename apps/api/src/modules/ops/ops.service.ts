import { prisma } from '../../lib/prisma';

// Configuration
export async function listConfig() { return prisma.systemConfiguration.findMany(); }
export async function upsertConfig(key: string, value: string) {
  const existing = await prisma.systemConfiguration.findFirst({ where: { config_key: key } });
  if (existing) return prisma.systemConfiguration.update({ where: { id: existing.id }, data: { config_value: value } });
  return prisma.systemConfiguration.create({ data: { config_key: key, config_value: value } });
}

// Environment
export async function listEnvironments() { return prisma.systemEnvironment.findMany(); }

// Department (platform-level)
export async function listDepartments() { return prisma.systemDepartment.findMany(); }
export async function createDepartment(name: string, description?: string) {
  return prisma.systemDepartment.create({ data: { name, description } });
}

// Integration
export async function listIntegrations() { return prisma.systemIntegration.findMany(); }
export async function createIntegration(name: string, type: string, config?: string) {
  return prisma.systemIntegration.create({ data: { name, type, config, is_active: true } });
}
export async function toggleIntegration(id: string, isActive: boolean) {
  return prisma.systemIntegration.update({ where: { id }, data: { is_active: isActive } });
}

// Backup
export async function listBackups() { return prisma.systemBackup.findMany({ orderBy: { started_at: 'desc' }, take: 50 }); }
export async function listBackupLogs() { return prisma.systemBackupLog.findMany({ orderBy: { created_at: 'desc' }, take: 50 }); }

// Job queue
export async function listJobs() { return prisma.systemJobQueue.findMany({ orderBy: { queued_at: 'desc' }, take: 50 }); }
export async function listJobExecutions() { return prisma.systemJobExecution.findMany({ orderBy: { started_at: 'desc' }, take: 50 }); }

// Health check
export async function recordHealthCheck() {
  const start = Date.now();
  let dbStatus = 'ok';
  try { await prisma.systemUser.count(); } catch { dbStatus = 'error'; }
  const latencyMs = Date.now() - start;
  return prisma.systemHealthCheck.create({
    data: { metric_name: 'database_status', metric_value: `${latencyMs}ms`, status: dbStatus },
  });
}
export async function listHealthChecks() {
  return prisma.systemHealthCheck.findMany({ orderBy: { checked_at: 'desc' }, take: 20 });
}

// Rate limits
export async function listRateLimits() { return prisma.systemRateLimit.findMany(); }
export async function createRateLimit(endpoint: string, maxRequests: number, windowSeconds: number) {
  return prisma.systemRateLimit.create({ data: { endpoint, max_requests: maxRequests, time_window_seconds: windowSeconds } });
}

// Data retention
export async function listRetentionPolicies() { return prisma.systemDataRetention.findMany(); }
export async function createRetentionPolicy(policyName: string, retentionYears: number, description?: string) {
  return prisma.systemDataRetention.create({ data: { policy_name: policyName, retention_years: retentionYears, description } });
}

// Error log
export async function logError(errorType: string, message: string, stackTrace?: string, moduleName?: string) {
  return prisma.systemErrorLog.create({ data: { error_type: errorType, message, stack_trace: stackTrace, module_name: moduleName } });
}
export async function listErrors() { return prisma.systemErrorLog.findMany({ orderBy: { created_at: 'desc' }, take: 50 }); }

// Services
export async function listServices() { return prisma.systemService.findMany(); }
export async function listServiceStatuses() { return prisma.systemServiceStatus.findMany({ orderBy: { last_check: 'desc' } }); }
