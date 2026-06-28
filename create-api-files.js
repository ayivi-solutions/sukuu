const fs = require('fs');
const path = require('path');

const base = process.cwd();

const files = {
  'apps/api/src/index.ts': `import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { rateLimiter } from './middleware/rateLimiter';
import { authRouter } from './modules/auth/auth.router';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim());
    if (allowed.includes(origin)) return callback(null, true);
    callback(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));

app.use(express.json());
app.use(rateLimiter);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'sukuu-api',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/auth', authRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log('Sukuu API running on port ' + PORT + ' [' + (process.env.NODE_ENV || 'development') + ']');
});
`,

  'apps/api/src/middleware/authenticate.ts': `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?:   string;
  schoolId?: string;
  roleKey?:  string;
  staffId?:  string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = auth.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.userId   = decoded.userId;
    req.schoolId = decoded.schoolId;
    req.roleKey  = decoded.roleKey;
    req.staffId  = decoded.staffId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
`,

  'apps/api/src/middleware/schoolScope.ts': `import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';

export function schoolScope(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.schoolId) {
    return res.status(403).json({ error: 'No school context in token' });
  }
  next();
}
`,

  'apps/api/src/middleware/authorize.ts': `import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';

export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.roleKey || !roles.includes(req.roleKey)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.roleKey || 'none',
      });
    }
    next();
  };
}
`,

  'apps/api/src/middleware/rateLimiter.ts': `import { Request, Response, NextFunction } from 'express';

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
`,

  'apps/api/src/middleware/errorHandler.ts': `import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Error]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
}
`,

  'apps/api/src/middleware/notFound.ts': `import { Request, Response } from 'express';

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: 'Route not found: ' + req.method + ' ' + req.path });
}
`,

  'apps/api/src/lib/idGenerator.ts': `export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
`,

  'apps/api/src/lib/validateRequest.ts': `import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}
`,

  'apps/api/src/modules/auth/auth.router.ts': `import { Router } from 'express';
import { login, refresh, logout, me } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';

export const authRouter = Router();

authRouter.post('/login',   login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout',  authenticate, logout);
authRouter.get('/me',       authenticate, me);
`,

  'apps/api/src/modules/auth/auth.controller.ts': `import { Request, Response } from 'express';
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
`,

  'apps/api/src/modules/auth/auth.service.ts': `import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function loginUser(email: string, password: string) {
  const user = await prisma.systemUser.findFirst({ where: { email, is_active: true } });
  if (!user) throw new Error('Invalid credentials');

  if (user.locked_until && user.locked_until > new Date()) {
    const secs = Math.ceil((user.locked_until.getTime() - Date.now()) / 1000);
    throw new Error('Account locked — try again in ' + secs + ' seconds');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const count = (user.failed_login_count || 0) + 1;
    const backoffMs = count >= 5 ? Math.min(Math.pow(2, count) * 1000, 3600000) : 0;
    await prisma.systemUser.update({
      where: { id: user.id },
      data: {
        failed_login_count: count,
        locked_until: backoffMs > 0 ? new Date(Date.now() + backoffMs) : null,
      },
    });
    throw new Error('Invalid credentials');
  }

  await prisma.systemUser.update({
    where: { id: user.id },
    data: { failed_login_count: 0, locked_until: null, last_login_at: new Date() },
  });

  const staff = await prisma.staffStaff.findFirst({ where: { user_id: user.id } });
  const employment = staff
    ? await prisma.staffEmployment.findFirst({ where: { staff_id: staff.id, is_current: true } })
    : null;
  const role = employment
    ? await prisma.systemRole.findFirst({ where: { id: employment.role_id } })
    : null;

  const schoolId = employment?.school_id || '';
  const roleKey  = role?.name || 'school_admin';

  const accessToken = jwt.sign(
    { userId: user.id, schoolId, roleKey, staffId: staff?.id || null },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
  );

  if (schoolId) {
    await prisma.systemLog.create({
      data: {
        event_type:  'LOGIN',
        entity_type: 'system_user',
        entity_id:   user.id,
        user_id:     user.id,
        school_id:   schoolId,
        ip_address:  '',
        payload:     { email, roleKey },
      },
    });
  }

  return {
    accessToken,
    refreshToken,
    user: {
      id:        user.id,
      email:     user.email,
      firstName: staff?.first_name  || null,
      lastName:  staff?.last_name   || null,
      staffId:   staff?.id          || null,
      roleKey,
      roleLabel: role?.label || roleKey,
    },
    school: { id: schoolId },
  };
}

export async function refreshAccessToken(token: string) {
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
  const user = await prisma.systemUser.findUnique({ where: { id: decoded.userId } });
  if (!user || !user.is_active) throw new Error('User not found or inactive');

  const staff = await prisma.staffStaff.findFirst({ where: { user_id: user.id } });
  const employment = staff
    ? await prisma.staffEmployment.findFirst({ where: { staff_id: staff.id, is_current: true } })
    : null;
  const role = employment
    ? await prisma.systemRole.findFirst({ where: { id: employment.role_id } })
    : null;

  const accessToken = jwt.sign(
    {
      userId:   user.id,
      schoolId: employment?.school_id || '',
      roleKey:  role?.name || 'school_admin',
      staffId:  staff?.id || null,
    },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
  );

  return { accessToken };
}
`,
};

let created = 0;
for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(base, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('✓ ' + filePath);
  created++;
}
console.log('\nDone. ' + created + ' files created.');
