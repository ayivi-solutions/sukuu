import { prisma } from '../../lib/prisma';

export async function listHostels(schoolId: string) { return prisma.hostelHostel.findMany({ where: { school_id: schoolId } }); }
export async function createHostel(schoolId: string, data: any) {
  return prisma.hostelHostel.create({ data: { school_id: schoolId, name: data.name, gender: data.gender, capacity: data.capacity, is_active: true } });
}
export async function getHostelSchoolId(id: string) { return (await prisma.hostelHostel.findUnique({ where: { id } }))?.school_id; }

export async function listDormitories(schoolId: string, hostelId?: string) { return prisma.hostelDormitory.findMany({ where: { school_id: schoolId, ...(hostelId && { hostel_id: hostelId }) } }); }
export async function createDormitory(schoolId: string, data: any) {
  return prisma.hostelDormitory.create({ data: { school_id: schoolId, hostel_id: data.hostelId, name: data.name, capacity: data.capacity, is_active: true } });
}
export async function getDormitorySchoolId(id: string) { return (await prisma.hostelDormitory.findUnique({ where: { id } }))?.school_id; }

export async function listBeds(schoolId: string, dormitoryId?: string) { return prisma.hostelBed.findMany({ where: { school_id: schoolId, ...(dormitoryId && { dormitory_id: dormitoryId }) } }); }
export async function createBed(schoolId: string, data: any) {
  return prisma.hostelBed.create({ data: { school_id: schoolId, dormitory_id: data.dormitoryId, bed_number: data.bedNumber, status: data.status || 'AVAILABLE' } });
}
export async function updateBedStatus(id: string, status: string) { return prisma.hostelBed.update({ where: { id }, data: { status: status as any } }); }
export async function getBedSchoolId(id: string) { return (await prisma.hostelBed.findUnique({ where: { id } }))?.school_id; }

export async function listAssignments(schoolId: string, studentId?: string) { return prisma.hostelAssignment.findMany({ where: { school_id: schoolId, ...(studentId && { student_id: studentId }) } }); }
export async function createAssignment(schoolId: string, data: any) {
  await prisma.hostelBed.update({ where: { id: data.bedId }, data: { status: 'OCCUPIED' } });
  return prisma.hostelAssignment.create({ data: { school_id: schoolId, student_id: data.studentId, bed_id: data.bedId, assigned_date: data.assignedDate } });
}
export async function vacateAssignment(id: string) {
  const a = await prisma.hostelAssignment.update({ where: { id }, data: { vacated_date: new Date().toISOString().slice(0, 10) } });
  await prisma.hostelBed.update({ where: { id: a.bed_id }, data: { status: 'AVAILABLE' } });
  return a;
}
export async function getAssignmentSchoolId(id: string) { return (await prisma.hostelAssignment.findUnique({ where: { id } }))?.school_id; }

export async function listStaffAssignments(schoolId: string, hostelId?: string) { return prisma.hostelStaffAssignment.findMany({ where: { school_id: schoolId, ...(hostelId && { hostel_id: hostelId }) } }); }
export async function createStaffAssignment(schoolId: string, data: any) {
  return prisma.hostelStaffAssignment.create({ data: { school_id: schoolId, hostel_id: data.hostelId, staff_id: data.staffId, role: data.role } });
}
export async function getStaffAssignmentSchoolId(id: string) { return (await prisma.hostelStaffAssignment.findUnique({ where: { id } }))?.school_id; }

export async function listIncidents(schoolId: string, hostelId?: string) { return prisma.hostelIncident.findMany({ where: { school_id: schoolId, ...(hostelId && { hostel_id: hostelId }) } }); }
export async function createIncident(schoolId: string, reportedBy: string, data: any) {
  return prisma.hostelIncident.create({ data: { school_id: schoolId, student_id: data.studentId, hostel_id: data.hostelId, incident_type: data.incidentType, description: data.description, incident_date: data.incidentDate, reported_by: reportedBy } });
}
export async function getIncidentSchoolId(id: string) { return (await prisma.hostelIncident.findUnique({ where: { id } }))?.school_id; }

export async function getHostelSummary(schoolId: string) {
  const [totalHostels, totalBeds, occupiedBeds, availableBeds, recentIncidents] = await Promise.all([
    prisma.hostelHostel.count({ where: { school_id: schoolId, is_active: true } }),
    prisma.hostelBed.count({ where: { school_id: schoolId } }),
    prisma.hostelBed.count({ where: { school_id: schoolId, status: 'OCCUPIED' } }),
    prisma.hostelBed.count({ where: { school_id: schoolId, status: 'AVAILABLE' } }),
    prisma.hostelIncident.count({ where: { school_id: schoolId } }),
  ]);
  return { totalHostels, totalBeds, occupiedBeds, availableBeds, occupancyPct: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 1000) / 10 : null, recentIncidents };
}
