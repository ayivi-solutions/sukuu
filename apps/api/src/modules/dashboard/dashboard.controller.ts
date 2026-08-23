import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { getDashboardSummary } from './dashboard.service';

export async function getSummary(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId || !req.userId) return res.status(400).json({ error: 'No school associated with this user' });
    const summary = await getDashboardSummary(req.schoolId, req.userId);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch dashboard summary' });
  }
}
