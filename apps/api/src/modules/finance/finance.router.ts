import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './finance.controller';

export const financeRouter = Router();
const R = requireModuleAccess('finance', 'read');
const F = requireModuleAccess('finance', 'full');

financeRouter.get('/accounts', authenticate, R, ctrl.getAccounts);
financeRouter.post('/accounts', authenticate, F, ctrl.postAccount);
financeRouter.patch('/accounts/:id', authenticate, F, ctrl.patchAccount);

financeRouter.get('/financial-years', authenticate, R, ctrl.getFinancialYears);
financeRouter.post('/financial-years', authenticate, F, ctrl.postFinancialYear);
financeRouter.patch('/financial-years/:id/close', authenticate, F, ctrl.patchCloseFinancialYear);

financeRouter.get('/fee-structures', authenticate, R, ctrl.getFeeStructures);
financeRouter.post('/fee-structures', authenticate, F, ctrl.postFeeStructure);
financeRouter.patch('/fee-structures/:id', authenticate, F, ctrl.patchFeeStructure);
financeRouter.patch('/fee-structures/:id/archive', authenticate, F, ctrl.patchArchiveFeeStructure);
financeRouter.get('/fee-structures/:structureId/components', authenticate, R, ctrl.getFeeComponents);
financeRouter.post('/fee-structures/:structureId/components', authenticate, F, ctrl.postFeeComponent);

financeRouter.patch('/fee-components/:id/archive', authenticate, F, ctrl.patchArchiveFeeComponent);

financeRouter.get('/students/:studentId/fee-assignments', authenticate, R, ctrl.getFeeAssignments);
financeRouter.post('/students/:studentId/fee-assignments', authenticate, F, ctrl.postFeeAssignment);
financeRouter.patch('/fee-assignments/:id/archive', authenticate, F, ctrl.patchArchiveFeeAssignment);

financeRouter.get('/discounts', authenticate, R, ctrl.getDiscounts);
financeRouter.post('/discounts', authenticate, F, ctrl.postDiscount);
financeRouter.patch('/discounts/:id/archive', authenticate, F, ctrl.patchArchiveDiscount);

financeRouter.get('/scholarships', authenticate, R, ctrl.getScholarships);
financeRouter.post('/scholarships', authenticate, F, ctrl.postScholarship);
financeRouter.patch('/scholarships/:id/archive', authenticate, F, ctrl.patchArchiveScholarship);

financeRouter.get('/invoices', authenticate, R, ctrl.getInvoices);
financeRouter.get('/invoices/:id', authenticate, R, ctrl.getInvoice);
financeRouter.get('/invoices/:id/items', authenticate, R, ctrl.getInvoiceItems);
financeRouter.post('/invoices/generate', authenticate, F, ctrl.postGenerateInvoice);
financeRouter.post('/invoices/:id/adjustments', authenticate, F, ctrl.postInvoiceAdjustment);
financeRouter.patch('/invoices/:id/status', authenticate, F, ctrl.patchInvoiceStatus);
financeRouter.get('/invoices/:id/payments', authenticate, R, ctrl.getInvoicePayments);

financeRouter.get('/payments', authenticate, R, ctrl.getPayments);
financeRouter.post('/payments', authenticate, F, ctrl.postPayment);
financeRouter.patch('/payments/:id/reverse', authenticate, F, ctrl.patchReversePayment);
financeRouter.get('/payments/:id/receipts', authenticate, R, ctrl.getPaymentReceipts);
financeRouter.get('/payments/:id/refunds', authenticate, R, ctrl.getPaymentRefunds);
financeRouter.post('/payments/:id/refunds', authenticate, F, ctrl.postRefund);

financeRouter.patch('/refunds/:id/status', authenticate, F, ctrl.patchRefundStatus);

financeRouter.get('/budgets', authenticate, R, ctrl.getBudgets);
financeRouter.post('/budgets', authenticate, F, ctrl.postBudget);
financeRouter.patch('/budgets/:id/status', authenticate, F, ctrl.patchBudgetStatus);

financeRouter.get('/expenses', authenticate, R, ctrl.getExpenses);
financeRouter.post('/expenses', authenticate, F, ctrl.postExpense);
financeRouter.patch('/expenses/:id/archive', authenticate, F, ctrl.patchArchiveExpense);

financeRouter.get('/journals', authenticate, R, ctrl.getJournals);
financeRouter.post('/journals', authenticate, F, ctrl.postJournal);
financeRouter.get('/journals/:id/entries', authenticate, R, ctrl.getJournalEntries);
financeRouter.post('/journals/:id/entries', authenticate, F, ctrl.postLedgerEntry);
financeRouter.patch('/journals/:id/post', authenticate, F, ctrl.patchPostJournal);

financeRouter.get('/reconciliations', authenticate, R, ctrl.getReconciliations);
financeRouter.post('/reconciliations', authenticate, F, ctrl.postReconciliation);
financeRouter.patch('/reconciliations/:id/reconcile', authenticate, F, ctrl.patchMarkReconciled);

financeRouter.get('/transactions', authenticate, R, ctrl.getTransactions);
financeRouter.post('/transactions', authenticate, F, ctrl.postTransaction);

financeRouter.get('/audit-log', authenticate, R, ctrl.getFinanceAuditLog);
