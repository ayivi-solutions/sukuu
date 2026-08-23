import { prisma } from '../../lib/prisma';

export async function listConversations(schoolId: string, userId: string) {
  const participantRows = await prisma.communicationParticipant.findMany({ where: { user_id: userId, is_active: true }, select: { conversation_id: true } });
  const ids = participantRows.map(p => p.conversation_id);
  return prisma.communicationConversation.findMany({ where: { school_id: schoolId, id: { in: ids } }, orderBy: { last_message_at: 'desc' } });
}
export async function createConversation(schoolId: string, createdBy: string, data: any) {
  const convo = await prisma.communicationConversation.create({ data: { school_id: schoolId, subject: data.subject, conversation_type: data.conversationType || 'DIRECT', created_by: createdBy, is_archived: false } });
  const participantIds: string[] = [createdBy, ...(data.participantIds || [])];
  await prisma.communicationParticipant.createMany({ data: [...new Set(participantIds)].map(uid => ({ conversation_id: convo.id, user_id: uid, role: uid === createdBy ? 'INITIATOR' : 'PARTICIPANT', joined_at: new Date(), is_active: true, muted: false })) });
  return convo;
}
export async function getConversationSchoolId(id: string) { return (await prisma.communicationConversation.findUnique({ where: { id } }))?.school_id; }

export async function listMessages(conversationId: string) { return prisma.communicationMessage.findMany({ where: { conversation_id: conversationId, is_deleted: false }, orderBy: { created_at: 'asc' } }); }
export async function createMessage(schoolId: string, senderId: string, data: any) {
  const msg = await prisma.communicationMessage.create({ data: { conversation_id: data.conversationId, school_id: schoolId, sender_id: senderId, message_type: data.messageType || 'TEXT', content: data.content, is_edited: false, is_deleted: false } });
  await prisma.communicationConversation.update({ where: { id: data.conversationId }, data: { last_message_at: new Date() } });
  return msg;
}
export async function getMessageSchoolId(id: string) { return (await prisma.communicationMessage.findUnique({ where: { id } }))?.school_id; }

export async function markMessageRead(messageId: string, userId: string) {
  const existing = await prisma.communicationRead.findFirst({ where: { message_id: messageId, user_id: userId } });
  if (existing) return existing;
  return prisma.communicationRead.create({ data: { message_id: messageId, user_id: userId, read_at: new Date() } });
}

export async function listParticipants(conversationId: string) { return prisma.communicationParticipant.findMany({ where: { conversation_id: conversationId } }); }

export async function listBroadcasts(schoolId: string) { return prisma.communicationBroadcast.findMany({ where: { school_id: schoolId }, orderBy: { sent_at: 'desc' } }); }
export async function createBroadcast(schoolId: string, sentBy: string, data: any) {
  return prisma.communicationBroadcast.create({ data: { school_id: schoolId, title: data.title, body: data.body, audience_type: data.audienceType || 'ALL', class_id: data.classId || null, sent_by: sentBy, sent_at: new Date(), delivery_count: data.deliveryCount || 0 } });
}
export async function getBroadcastSchoolId(id: string) { return (await prisma.communicationBroadcast.findUnique({ where: { id } }))?.school_id; }

export async function listDeliveries(broadcastId: string) { return prisma.communicationDelivery.findMany({ where: { broadcast_id: broadcastId } }); }

export async function getCommunicationSummary(schoolId: string, userId: string) {
  const myParticipations = await prisma.communicationParticipant.findMany({ where: { user_id: userId, is_active: true }, select: { conversation_id: true } });
  const [activeConversations, broadcastsSent, totalMessages] = await Promise.all([
    prisma.communicationConversation.count({ where: { school_id: schoolId, id: { in: myParticipations.map(p => p.conversation_id) }, is_archived: false } }),
    prisma.communicationBroadcast.count({ where: { school_id: schoolId } }),
    prisma.communicationMessage.count({ where: { school_id: schoolId, is_deleted: false } }),
  ]);
  return { activeConversations, broadcastsSent, totalMessages };
}
