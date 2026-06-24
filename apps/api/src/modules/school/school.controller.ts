import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { getSchoolProfile, updateSchoolProfile, getSchoolSettings } from './school.service';

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
