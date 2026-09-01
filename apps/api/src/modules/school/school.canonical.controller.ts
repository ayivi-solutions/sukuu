import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import {
  SchoolXCanonicalConflictError,
  SchoolXCanonicalValidationError,
  departmentWorkspace,
  createDepartment,
  updateDepartment,
  archiveDepartment as archiveDepartmentService,
  getConfiguration as getConfigurationService,
  putTimezone as putTimezoneService,
  putCurrency as putCurrencyService,
  calendarWorkspace,
  createHoliday,
  updateHoliday,
  archiveHoliday as archiveHolidayService,
  getReadiness as getReadinessService,
  putReadinessWorkItem as putReadinessWorkItemService,
} from './school.canonical.service';

function ctx(req: AuthRequest, res: Response) {
  if (!req.schoolId || !req.userId) {
    res.status(400).json({ error: 'Complete authenticated school context is required.' });
    return null;
  }
  return { schoolId: req.schoolId, userId: req.userId };
}

function fail(res: Response, error: unknown) {
  if (error instanceof SchoolXCanonicalValidationError) {
    return res.status(400).json({ error: error.message, code: 'SCHOOLX_VALIDATION' });
  }
  if (error instanceof SchoolXCanonicalConflictError) {
    return res.status(409).json({ error: error.message, code: 'SCHOOLX_STALE_VERSION' });
  }
  return res.status(500).json({ error: 'SchoolX canonical capability operation failed.' });
}

export async function getDepartments(req: AuthRequest, res: Response) {
  try { const c = ctx(req, res); if (!c) return; res.json(await departmentWorkspace(c.schoolId, String(req.query.q || ''))); }
  catch (e) { fail(res, e); }
}
export async function postDepartment(req: AuthRequest, res: Response) {
  try { const c = ctx(req, res); if (!c) return; res.status(201).json(await createDepartment(c.schoolId, c.userId, req.body || {})); }
  catch (e) { fail(res, e); }
}
export async function putDepartment(req: AuthRequest, res: Response) {
  try { const c = ctx(req, res); if (!c) return; const r = await updateDepartment(c.schoolId, c.userId, req.params.id, req.body || {}); if (!r) return res.status(404).json({ error: 'Department not found.' }); res.json(r); }
  catch (e) { fail(res, e); }
}
export async function archiveDepartment(req: AuthRequest, res: Response) {
  try { const c = ctx(req, res); if (!c) return; const r = await archiveDepartmentService(c.schoolId, c.userId, req.params.id, req.body || {}); if (!r) return res.status(404).json({ error: 'Department not found.' }); res.json(r); }
  catch (e) { fail(res, e); }
}
export async function getConfiguration(req: AuthRequest, res: Response) {
  try { const c = ctx(req, res); if (!c) return; res.json(await getConfigurationService(c.schoolId)); }
  catch (e) { fail(res, e); }
}
export async function putTimezone(req: AuthRequest, res: Response) {
  try { const c = ctx(req, res); if (!c) return; res.json(await putTimezoneService(c.schoolId, c.userId, req.body || {})); }
  catch (e) { fail(res, e); }
}
export async function putCurrency(req: AuthRequest, res: Response) {
  try { const c = ctx(req, res); if (!c) return; res.json(await putCurrencyService(c.schoolId, c.userId, req.body || {})); }
  catch (e) { fail(res, e); }
}
export async function getCalendar(req: AuthRequest, res: Response) {
  try { const c = ctx(req, res); if (!c) return; res.json(await calendarWorkspace(c.schoolId)); }
  catch (e) { fail(res, e); }
}
export async function postHoliday(req: AuthRequest, res: Response) {
  try { const c = ctx(req, res); if (!c) return; res.status(201).json(await createHoliday(c.schoolId, c.userId, req.body || {})); }
  catch (e) { fail(res, e); }
}
export async function putHoliday(req: AuthRequest, res: Response) {
  try { const c = ctx(req, res); if (!c) return; const r = await updateHoliday(c.schoolId, c.userId, req.params.id, req.body || {}); if (!r) return res.status(404).json({ error: 'Holiday not found.' }); res.json(r); }
  catch (e) { fail(res, e); }
}
export async function archiveHoliday(req: AuthRequest, res: Response) {
  try { const c = ctx(req, res); if (!c) return; const r = await archiveHolidayService(c.schoolId, c.userId, req.params.id, req.body || {}); if (!r) return res.status(404).json({ error: 'Holiday not found.' }); res.json(r); }
  catch (e) { fail(res, e); }
}
export async function getReadiness(req: AuthRequest, res: Response) {
  try { const c = ctx(req, res); if (!c) return; const r = await getReadinessService(c.schoolId); if (!r) return res.status(404).json({ error: 'School not found.' }); res.json(r); }
  catch (e) { fail(res, e); }
}
export async function putReadinessWorkItem(req: AuthRequest, res: Response) {
  try { const c = ctx(req, res); if (!c) return; const r = await putReadinessWorkItemService(c.schoolId, c.userId, req.params.step, req.body || {}); if (!r) return res.status(404).json({ error: 'School not found.' }); res.json(r); }
  catch (e) { fail(res, e); }
}
