import { Request, Response } from 'express';
import {
  loginUser,
  refreshAccessToken,
  logoutSession,
  changeOwnPassword,
} from './auth.service';
import { getMyModuleAccess } from '../../lib/roleGrants';
import { AuthRequest } from '../../middleware/authenticate';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await loginUser(email, password, {
      ipAddress: req.ip || null,
      userAgent: req.get('user-agent') || null,
    });

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

export async function logout(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });
    await logoutSession(req.userId, req.sessionId);
    res.json({ success: true, message: 'Logged out' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Logout failed' });
  }
}

export async function me(req: AuthRequest, res: Response) {
  res.json({
    userId: req.userId,
    schoolId: req.schoolId,
    roleKey: req.roleKey,
    staffId: req.staffId,
    sessionId: req.sessionId,
  });
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword required' });
    }
    if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });

    const result = await changeOwnPassword(
      req.userId,
      currentPassword,
      newPassword,
      req.sessionId
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Could not change password' });
  }
}

export async function myAccess(req: AuthRequest, res: Response) {
  try {
    if (!req.userId || !req.schoolId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const access = await getMyModuleAccess(req.userId, req.schoolId);
    res.json(access);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
