import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { getSchoolProfile, updateSchoolProfile, getSchoolSettings, listAccreditations, createAccreditation, archiveAccreditation, listSchoolAuditLog, logSchoolAudit } from './school.service';

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const school = await getSchoolProfile(req.schoolId);
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json(school);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch school profile' });
  }
}

export async function patchProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const updated = await updateSchoolProfile(req.schoolId, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update school profile' });
  }
}

export async function getSettings(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const settings = await getSchoolSettings(req.schoolId);
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch school settings' });
  }
}

export async function getAccreditations(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    res.json(await listAccreditations(req.schoolId));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch accreditations' });
  }
}

export async function postAccreditation(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const created = await createAccreditation(req.schoolId, req.body);
    await logSchoolAudit(req.schoolId, `CREATE accreditation: ${req.body.authority}`, req.userId || '');
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create accreditation' });
  }
}

export async function patchArchiveAccreditation(req: AuthRequest, res: Response) {
  try {
    const archived = await archiveAccreditation(req.params.accreditationId);
    if (req.schoolId) await logSchoolAudit(req.schoolId, `ARCHIVE accreditation: ${req.params.accreditationId}`, req.userId || '');
    res.json({ id: archived.id, archived: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to archive accreditation' });
  }
}

export async function getSchoolAuditLog(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    res.json(await listSchoolAuditLog(req.schoolId));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit log' });
  }
}
