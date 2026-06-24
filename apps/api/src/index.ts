import * as dotenv from 'dotenv';
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

app.get('/', (_req, res) => {
  res.json({ service: 'sukuu-api', status: 'ok', docs: 'https://sukuux.com' });
});

app.use('/api/v1/auth', authRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log('Sukuu API running on port ' + PORT + ' [' + (process.env.NODE_ENV || 'development') + ']');
});
