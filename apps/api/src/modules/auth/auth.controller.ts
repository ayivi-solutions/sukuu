import { Request, Response } from 'express';
import { loginUser, refreshAccessToken } from './auth.service';
import { AuthRequest } from '../../middleware/authenticate';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const result = await loginUser(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Login failed' });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });
    const result = await refreshAccessToken(refreshToken);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Token refresh failed' });
  }
}

export async function logout(_req: Request, res: Response) {
  res.json({ success: true, message: 'Logged out' });
}

export async function me(req: AuthRequest, res: Response) {
  res.json({
    userId:   req.userId,
    schoolId: req.schoolId,
    roleKey:  req.roleKey,
    staffId:  req.staffId,
  });
}
