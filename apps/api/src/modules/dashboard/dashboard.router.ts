import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { getSummary } from './dashboard.controller';

export const dashboardRouter = Router();

dashboardRouter.get('/summary', authenticate, getSummary);
