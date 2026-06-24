import { Request, Response, NextFunction } from 'express';

const windows: Record<string, { count: number; resetAt: number }> = {};

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  if (!windows[key] || windows[key].resetAt < now) {
    windows[key] = { count: 0, resetAt: now + 60000 };
  }
  windows[key].count++;
  if (windows[key].count > 100) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
}
