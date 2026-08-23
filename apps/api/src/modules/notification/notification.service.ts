import { prisma } from '../../lib/prisma';

export async function listNotifications(userId: string) { return prisma.notificationNotification.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' } }); }
export async function createNotification(schoolId: string, data: any) {
  return prisma.notificationNotification.create({ data: { user_id: data.userId, school_id: schoolId, event_type: data.eventType, title: data.title, body: data.body, entity_type: data.entityType, entity_id: data.entityId, is_read: false } });
}
export async function markRead(id: string) { return prisma.notificationNotification.update({ where: { id }, data: { is_read: true, read_at: new Date() } }); }
export async function getNotificationUserId(id: string) { return (await prisma.notificationNotification.findUnique({ where: { id } }))?.user_id; }

export async function listTemplates(schoolId: string) { return prisma.notificationTemplate.findMany({ where: { OR: [{ school_id: schoolId }, { school_id: null }] } }); }
export async function createTemplate(schoolId: string, data: any) {
  return prisma.notificationTemplate.create({ data: { school_id: schoolId, event_type: data.eventType, channel: data.channel, subject: data.subject, body_template: data.bodyTemplate, is_active: true } });
}

export async function listDeliveries(notificationId?: string) { return prisma.notificationDelivery.findMany({ where: notificationId ? { notification_id: notificationId } : {} }); }
export async function createDelivery(data: any) {
  return prisma.notificationDelivery.create({ data: { notification_id: data.notificationId, channel: data.channel, status: data.status || 'PENDING', provider_reference: data.providerReference, attempted_at: new Date() } });
}

export async function listChannels(schoolId: string) { return prisma.notificationChannel.findMany({ where: { school_id: schoolId } }); }
export async function upsertChannel(schoolId: string, data: any) {
  const existing = await prisma.notificationChannel.findFirst({ where: { school_id: schoolId, channel: data.channel } });
  if (existing) return prisma.notificationChannel.update({ where: { id: existing.id }, data: { is_enabled: !!data.isEnabled, config: data.config } });
  return prisma.notificationChannel.create({ data: { school_id: schoolId, channel: data.channel, is_enabled: !!data.isEnabled, config: data.config } });
}

export async function listPreferences(userId: string) { return prisma.notificationPreference.findMany({ where: { user_id: userId } }); }
export async function upsertPreference(userId: string, data: any) {
  const existing = await prisma.notificationPreference.findFirst({ where: { user_id: userId, event_type: data.eventType } });
  if (existing) return prisma.notificationPreference.update({ where: { id: existing.id }, data: { in_app: !!data.inApp, sms: !!data.sms, email: !!data.email, push: !!data.push } });
  return prisma.notificationPreference.create({ data: { user_id: userId, event_type: data.eventType, in_app: !!data.inApp, sms: !!data.sms, email: !!data.email, push: !!data.push } });
}

export async function listQueue(schoolId: string) { return prisma.notificationQueue.findMany({ orderBy: { scheduled_at: 'asc' }, take: 200 }); }
export async function updateQueueStatus(id: string, status: string) { return prisma.notificationQueue.update({ where: { id }, data: { status: status as any } }); }

export async function listSmsLogs(schoolId: string) { return prisma.notificationSmsLog.findMany({ where: { school_id: schoolId }, orderBy: { sent_at: 'desc' }, take: 100 }); }
export async function listEmailLogs(schoolId: string) { return prisma.notificationEmailLog.findMany({ where: { school_id: schoolId }, orderBy: { sent_at: 'desc' }, take: 100 }); }

export async function getNotificationSummary(schoolId: string) {
  const [totalSent, failedQueue, queuedCount, activeChannels] = await Promise.all([
    prisma.notificationNotification.count({ where: { school_id: schoolId } }),
    prisma.notificationQueue.count({ where: { status: 'FAILED' } }),
    prisma.notificationQueue.count({ where: { status: 'QUEUED' } }),
    prisma.notificationChannel.count({ where: { school_id: schoolId, is_enabled: true } }),
  ]);
  return { totalSent, failedQueue, queuedCount, activeChannels };
}
