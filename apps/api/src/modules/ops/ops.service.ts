import type { Prisma } from '@prisma/client';
import { withTenantContext } from '../../lib/tenantContext';

async function inContext<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return withTenantContext<T>(undefined, fn);
}

// Configuration
export async function listConfig() {
  return inContext(tx =>
    tx.systemConfiguration.findMany()
  );
}

export async function upsertConfig(
  key: string,
  value: string
) {
  return inContext(async tx => {
    const existing =
      await tx.systemConfiguration.findFirst({
        where: { config_key: key },
      });

    if (existing) {
      return tx.systemConfiguration.update({
        where: { id: existing.id },
        data: { config_value: value },
      });
    }

    return tx.systemConfiguration.create({
      data: {
        config_key: key,
        config_value: value,
      },
    });
  });
}

// Environment
export async function listEnvironments() {
  return inContext(tx =>
    tx.systemEnvironment.findMany()
  );
}

// Department
export async function listDepartments() {
  return inContext(tx =>
    tx.systemDepartment.findMany()
  );
}

export async function createDepartment(
  name: string,
  description?: string
) {
  return inContext(tx =>
    tx.systemDepartment.create({
      data: { name, description },
    })
  );
}

// Integration
export async function listIntegrations() {
  return inContext(tx =>
    tx.systemIntegration.findMany()
  );
}

export async function createIntegration(
  name: string,
  type: string,
  config?: string
) {
  return inContext(tx =>
    tx.systemIntegration.create({
      data: {
        name,
        type,
        config,
        is_active: true,
      },
    })
  );
}

export async function toggleIntegration(
  id: string,
  isActive: boolean
) {
  return inContext(tx =>
    tx.systemIntegration.update({
      where: { id },
      data: { is_active: isActive },
    })
  );
}

// Backup
export async function listBackups() {
  return inContext(tx =>
    tx.systemBackup.findMany({
      orderBy: { started_at: 'desc' },
      take: 50,
    })
  );
}

export async function listBackupLogs() {
  return inContext(tx =>
    tx.systemBackupLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
    })
  );
}

// Job queue
export async function listJobs() {
  return inContext(tx =>
    tx.systemJobQueue.findMany({
      orderBy: { queued_at: 'desc' },
      take: 50,
    })
  );
}

export async function listJobExecutions() {
  return inContext(tx =>
    tx.systemJobExecution.findMany({
      orderBy: { started_at: 'desc' },
      take: 50,
    })
  );
}

// Health check
export async function recordHealthCheck() {
  return inContext(async tx => {
    const start = Date.now();
    let dbStatus = 'ok';

    try {
      await tx.systemUser.count();
    } catch {
      dbStatus = 'error';
    }

    const latencyMs = Date.now() - start;

    return tx.systemHealthCheck.create({
      data: {
        metric_name: 'database_status',
        metric_value: `${latencyMs}ms`,
        status: dbStatus,
      },
    });
  });
}

export async function listHealthChecks() {
  return inContext(tx =>
    tx.systemHealthCheck.findMany({
      orderBy: { checked_at: 'desc' },
      take: 20,
    })
  );
}

// Rate limits
export async function listRateLimits() {
  return inContext(tx =>
    tx.systemRateLimit.findMany()
  );
}

export async function createRateLimit(
  endpoint: string,
  maxRequests: number,
  windowSeconds: number
) {
  return inContext(tx =>
    tx.systemRateLimit.create({
      data: {
        endpoint,
        max_requests: maxRequests,
        time_window_seconds: windowSeconds,
      },
    })
  );
}

// Data retention
export async function listRetentionPolicies() {
  return inContext(tx =>
    tx.systemDataRetention.findMany()
  );
}

export async function createRetentionPolicy(
  policyName: string,
  retentionYears: number,
  description?: string
) {
  return inContext(tx =>
    tx.systemDataRetention.create({
      data: {
        policy_name: policyName,
        retention_years: retentionYears,
        description,
      },
    })
  );
}

// Error log
export async function logError(
  errorType: string,
  message: string,
  stackTrace?: string,
  moduleName?: string
) {
  return inContext(tx =>
    tx.systemErrorLog.create({
      data: {
        error_type: errorType,
        message,
        stack_trace: stackTrace,
        module_name: moduleName,
      },
    })
  );
}

export async function listErrors() {
  return inContext(tx =>
    tx.systemErrorLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
    })
  );
}

// Services
export async function listServices() {
  return inContext(tx =>
    tx.systemService.findMany()
  );
}

export async function listServiceStatuses() {
  return inContext(tx =>
    tx.systemServiceStatus.findMany({
      orderBy: { last_check: 'desc' },
    })
  );
}
