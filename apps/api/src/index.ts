import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { rateLimiter } from './middleware/rateLimiter';
import { authRouter } from './modules/auth/auth.router';
import { systemRouter } from './modules/system/system.router';
import { schoolRouter } from './modules/school/school.router';
import { dashboardRouter } from './modules/dashboard/dashboard.router';
import { opsRouter } from './modules/ops/ops.router';
import { academicRouter } from './modules/academic/academic.router';
import { studentRouter } from './modules/student/student.router';
import { staffRouter } from './modules/staff/staffx.router';
import { payrollRouter } from './modules/payroll/payroll.router';
import { scheduleRouter } from './modules/schedule/schedule.router';
import { attendanceRouter } from './modules/attendance/attendance.router';
import { gradingRouter } from './modules/grading/grading.router';
import { financeRouter } from './modules/finance/finance.router';
import { uploadRouter } from './modules/upload/upload.router';
import { admissionRouter } from './modules/admission/admission.router';
import { examRouter } from './modules/exam/exam.router';
import { learnRouter } from './modules/learn/learn.router';
import { transcriptRouter } from './modules/transcript/transcript.router';
import { disciplineRouter } from './modules/discipline/discipline.router';
import { hostelRouter } from './modules/hostel/hostel.router';
import { clinicRouter } from './modules/clinic/clinic.router';
import { libraryRouter } from './modules/library/library.router';
import { transportRouter } from './modules/transport/transport.router';
import { inventoryRouter } from './modules/inventory/inventory.router';
import { workflowRouter } from './modules/workflow/workflow.router';
import { notificationRouter } from './modules/notification/notification.router';
import { communicationRouter } from './modules/communication/communication.router';
import { analyticsRouter } from './modules/analytics/analytics.router';

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
app.use('/api/v1/system', systemRouter);
app.use('/api/v1/school', schoolRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/ops', opsRouter);
app.use('/api/v1/academic', academicRouter);
app.use('/api/v1/students', studentRouter);
app.use('/api/v1/staff', staffRouter);
app.use('/api/v1/admissions', admissionRouter);
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/finance', financeRouter);
app.use('/api/v1/payroll', payrollRouter);
app.use('/api/v1/schedule', scheduleRouter);
app.use('/api/v1/attendance', attendanceRouter);
app.use('/api/v1/grading', gradingRouter);
app.use('/api/v1/exam', examRouter);
app.use('/api/v1/learn', learnRouter);
app.use('/api/v1/transcript', transcriptRouter);
app.use('/api/v1/discipline', disciplineRouter);
app.use('/api/v1/hostel', hostelRouter);
app.use('/api/v1/clinic', clinicRouter);
app.use('/api/v1/library', libraryRouter);
app.use('/api/v1/transport', transportRouter);
app.use('/api/v1/inventory', inventoryRouter);
app.use('/api/v1/workflow', workflowRouter);
app.use('/api/v1/notification', notificationRouter);
app.use('/api/v1/communication', communicationRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log('Sukuu API running on port ' + PORT + ' [' + (process.env.NODE_ENV || 'development') + ']');
});
