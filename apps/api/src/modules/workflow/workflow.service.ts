import { prisma } from '../../lib/prisma';

export async function listDefinitions(schoolId: string) { return prisma.workflowDefinition.findMany({ where: { school_id: schoolId } }); }
export async function createDefinition(schoolId: string, data: any) {
  return prisma.workflowDefinition.create({ data: { school_id: schoolId, name: data.name, entity_type: data.entityType, description: data.description, is_active: true } });
}
export async function getDefinitionSchoolId(id: string) { return (await prisma.workflowDefinition.findUnique({ where: { id } }))?.school_id; }

export async function listSteps(schoolId: string, workflowId?: string) { return prisma.workflowStep.findMany({ where: { school_id: schoolId, ...(workflowId && { workflow_id: workflowId }) }, orderBy: { step_order: 'asc' } }); }
export async function createStep(schoolId: string, data: any) {
  return prisma.workflowStep.create({ data: { school_id: schoolId, workflow_id: data.workflowId, step_order: data.stepOrder, step_name: data.stepName, approver_role: data.approverRole, is_mandatory: data.isMandatory !== false } });
}

export async function listInstances(schoolId: string, workflowId?: string) { return prisma.workflowInstance.findMany({ where: { school_id: schoolId, ...(workflowId && { workflow_id: workflowId }) } }); }
export async function createInstance(schoolId: string, initiatedBy: string, data: any) {
  return prisma.workflowInstance.create({ data: { school_id: schoolId, workflow_id: data.workflowId, entity_id: data.entityId, entity_type: data.entityType, status: 'PENDING', initiated_by: initiatedBy, initiated_at: new Date() } });
}
export async function getInstanceSchoolId(id: string) { return (await prisma.workflowInstance.findUnique({ where: { id } }))?.school_id; }

export async function listApprovals(schoolId: string, instanceId?: string) { return prisma.workflowApproval.findMany({ where: { school_id: schoolId, ...(instanceId && { instance_id: instanceId }) } }); }
export async function createApproval(schoolId: string, approvedBy: string, data: any) {
  const approval = await prisma.workflowApproval.create({ data: { school_id: schoolId, instance_id: data.instanceId, step_id: data.stepId, approved_by: approvedBy, decision: data.decision, decision_date: new Date(), comments: data.comments } });
  if (data.decision === 'REJECTED') await prisma.workflowInstance.update({ where: { id: data.instanceId }, data: { status: 'REJECTED', completed_at: new Date() } });
  else if (data.decision === 'APPROVED' && data.isFinalStep) await prisma.workflowInstance.update({ where: { id: data.instanceId }, data: { status: 'APPROVED', completed_at: new Date() } });
  return approval;
}

export async function getWorkflowSummary(schoolId: string) {
  const [activeDefinitions, pendingInstances, approvedThisMonth, rejectedThisMonth] = await Promise.all([
    prisma.workflowDefinition.count({ where: { school_id: schoolId, is_active: true } }),
    prisma.workflowInstance.count({ where: { school_id: schoolId, status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    prisma.workflowInstance.count({ where: { school_id: schoolId, status: 'APPROVED', completed_at: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    prisma.workflowInstance.count({ where: { school_id: schoolId, status: 'REJECTED', completed_at: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
  ]);
  return { activeDefinitions, pendingInstances, approvedThisMonth, rejectedThisMonth };
}
