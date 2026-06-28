import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './payroll.controller';

export const payrollRouter = Router();
const R = requireModuleAccess('payroll', 'read');
const F = requireModuleAccess('payroll', 'full');

payrollRouter.get('/structures', authenticate, R, ctrl.getStructures);
payrollRouter.post('/structures', authenticate, F, ctrl.postStructure);
payrollRouter.patch('/structures/:id/archive', authenticate, F, ctrl.patchArchiveStructure);
payrollRouter.get('/structures/:structureId/components', authenticate, R, ctrl.getComponents);
payrollRouter.post('/structures/:structureId/components', authenticate, F, ctrl.postComponent);
payrollRouter.patch('/components/:id/archive', authenticate, F, ctrl.patchArchiveComponent);

payrollRouter.get('/staff/:staffId/salary', authenticate, R, ctrl.getStaffSalary);
payrollRouter.post('/staff/:staffId/salary', authenticate, F, ctrl.postStaffSalary);

payrollRouter.get('/staff/:staffId/allowances', authenticate, R, ctrl.getAllowances);
payrollRouter.post('/staff/:staffId/allowances', authenticate, F, ctrl.postAllowance);
payrollRouter.patch('/allowances/:id/end', authenticate, F, ctrl.patchEndAllowance);
payrollRouter.get('/staff/:staffId/deductions', authenticate, R, ctrl.getDeductions);
payrollRouter.post('/staff/:staffId/deductions', authenticate, F, ctrl.postDeduction);
payrollRouter.patch('/deductions/:id/end', authenticate, F, ctrl.patchEndDeduction);

payrollRouter.get('/statutory-deductions', authenticate, R, ctrl.getStatutoryDeductions);
payrollRouter.post('/statutory-deductions', authenticate, F, ctrl.postStatutoryDeduction);
payrollRouter.get('/tax-rules', authenticate, R, ctrl.getTaxRules);
payrollRouter.post('/tax-rules', authenticate, F, ctrl.postTaxRule);
payrollRouter.get('/ssnit-rules', authenticate, R, ctrl.getSsnitRules);
payrollRouter.post('/ssnit-rules', authenticate, F, ctrl.postSsnitRule);

payrollRouter.get('/periods', authenticate, R, ctrl.getPeriods);
payrollRouter.post('/periods', authenticate, F, ctrl.postPeriod);

payrollRouter.get('/staff/:staffId/bonuses', authenticate, R, ctrl.getBonuses);
payrollRouter.post('/staff/:staffId/bonuses', authenticate, F, ctrl.postBonus);

payrollRouter.get('/loans', authenticate, R, ctrl.getLoans);
payrollRouter.post('/staff/:staffId/loans', authenticate, F, ctrl.postLoan);
payrollRouter.get('/loans/:id/repayments', authenticate, R, ctrl.getLoanRepayments);
payrollRouter.post('/loans/:id/repayments', authenticate, F, ctrl.postLoanRepayment);

payrollRouter.get('/reimbursements', authenticate, R, ctrl.getReimbursements);
payrollRouter.post('/staff/:staffId/reimbursements', authenticate, F, ctrl.postReimbursement);
payrollRouter.patch('/reimbursements/:id/status', authenticate, F, ctrl.patchReimbursementStatus);

payrollRouter.get('/runs', authenticate, R, ctrl.getRuns);
payrollRouter.post('/runs', authenticate, F, ctrl.postRunPayroll);
payrollRouter.patch('/runs/:id/approve', authenticate, F, ctrl.patchApproveRun);
payrollRouter.patch('/runs/:id/reverse', authenticate, F, ctrl.patchReverseRun);

payrollRouter.get('/runs/:id/payslips', authenticate, R, ctrl.getPayslips);
payrollRouter.get('/payslips/:id/items', authenticate, R, ctrl.getPayslipItems);
payrollRouter.get('/payslips/:id/payments', authenticate, R, ctrl.getPayslipPayments);
payrollRouter.post('/payslips/:id/payments', authenticate, F, ctrl.postPayment);

payrollRouter.get('/batches', authenticate, R, ctrl.getBatches);
payrollRouter.post('/batches', authenticate, F, ctrl.postBatch);

payrollRouter.get('/audit-log', authenticate, R, ctrl.getPayrollAuditLog);
