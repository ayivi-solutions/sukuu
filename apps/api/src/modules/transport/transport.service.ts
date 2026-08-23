import { prisma } from '../../lib/prisma';

export async function listVehicles(schoolId: string) { return prisma.transportVehicle.findMany({ where: { school_id: schoolId } }); }
export async function createVehicle(schoolId: string, data: any) {
  return prisma.transportVehicle.create({ data: { school_id: schoolId, registration_number: data.registrationNumber, capacity: data.capacity, vehicle_type: data.vehicleType, status: data.status || 'ACTIVE' } });
}
export async function updateVehicleStatus(id: string, status: string) { return prisma.transportVehicle.update({ where: { id }, data: { status: status as any } }); }
export async function getVehicleSchoolId(id: string) { return (await prisma.transportVehicle.findUnique({ where: { id } }))?.school_id; }

export async function listDrivers(schoolId: string) { return prisma.transportDriver.findMany({ where: { school_id: schoolId } }); }
export async function createDriver(schoolId: string, data: any) {
  return prisma.transportDriver.create({ data: { school_id: schoolId, staff_id: data.staffId, license_number: data.licenseNumber, license_expiry: data.licenseExpiry } });
}
export async function getDriverSchoolId(id: string) { return (await prisma.transportDriver.findUnique({ where: { id } }))?.school_id; }

export async function listRoutes(schoolId: string) { return prisma.transportRoute.findMany({ where: { school_id: schoolId } }); }
export async function createRoute(schoolId: string, data: any) {
  return prisma.transportRoute.create({ data: { school_id: schoolId, name: data.name, start_point: data.startPoint, end_point: data.endPoint, is_active: true } });
}
export async function getRouteSchoolId(id: string) { return (await prisma.transportRoute.findUnique({ where: { id } }))?.school_id; }

export async function listStops(schoolId: string, routeId?: string) { return prisma.transportStop.findMany({ where: { school_id: schoolId, ...(routeId && { route_id: routeId }) }, orderBy: { stop_order: 'asc' } }); }
export async function createStop(schoolId: string, data: any) {
  return prisma.transportStop.create({ data: { school_id: schoolId, route_id: data.routeId, stop_name: data.stopName, pickup_time: data.pickupTime, stop_order: data.stopOrder || 0 } });
}
export async function getStopSchoolId(id: string) { return (await prisma.transportStop.findUnique({ where: { id } }))?.school_id; }

export async function listAssignments(schoolId: string, studentId?: string) { return prisma.transportAssignment.findMany({ where: { school_id: schoolId, ...(studentId && { student_id: studentId }) } }); }
export async function createAssignment(schoolId: string, data: any) {
  return prisma.transportAssignment.create({ data: { school_id: schoolId, student_id: data.studentId, route_id: data.routeId, vehicle_id: data.vehicleId || null, is_active: true } });
}
export async function deactivateAssignment(id: string) { return prisma.transportAssignment.update({ where: { id }, data: { is_active: false } }); }
export async function getAssignmentSchoolId(id: string) { return (await prisma.transportAssignment.findUnique({ where: { id } }))?.school_id; }

export async function listTripLogs(schoolId: string, vehicleId?: string) { return prisma.transportTripLog.findMany({ where: { school_id: schoolId, ...(vehicleId && { vehicle_id: vehicleId }) } }); }
export async function createTripLog(schoolId: string, data: any) {
  return prisma.transportTripLog.create({ data: { school_id: schoolId, vehicle_id: data.vehicleId, driver_id: data.driverId, trip_date: data.tripDate, departure_time: new Date(data.departureTime), arrival_time: data.arrivalTime ? new Date(data.arrivalTime) : null, trip_type: data.tripType } });
}
export async function completeTripLog(id: string) { return prisma.transportTripLog.update({ where: { id }, data: { arrival_time: new Date() } }); }
export async function getTripLogSchoolId(id: string) { return (await prisma.transportTripLog.findUnique({ where: { id } }))?.school_id; }

export async function getTransportSummary(schoolId: string) {
  const [activeVehicles, maintenanceVehicles, activeAssignments, totalRoutes, tripsToday] = await Promise.all([
    prisma.transportVehicle.count({ where: { school_id: schoolId, status: 'ACTIVE' } }),
    prisma.transportVehicle.count({ where: { school_id: schoolId, status: 'MAINTENANCE' } }),
    prisma.transportAssignment.count({ where: { school_id: schoolId, is_active: true } }),
    prisma.transportRoute.count({ where: { school_id: schoolId, is_active: true } }),
    prisma.transportTripLog.count({ where: { school_id: schoolId, trip_date: new Date().toISOString().slice(0, 10) } }),
  ]);
  return { activeVehicles, maintenanceVehicles, activeAssignments, totalRoutes, tripsToday };
}
