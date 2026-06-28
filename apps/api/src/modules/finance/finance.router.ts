import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './finance.controller';

export const financeRouter = Router();

financeRouter.get('/accounts', authenticate, ctrl.getAccounts);
financeRouter.post('/accounts', authenticate, ctrl.postAccount);
financeRouter.patch('/accounts/:id', authenticate, ctrl.patchAccount);

financeRouter.get('/financial-years', authenticate, ctrl.getFinancialYears);
financeRouter.post('/financial-years', authenticate, ctrl.postFinancialYear);
financeRouter.patch('/financial-years/:id/close', authenticate, ctrl.patchCloseFinancialYear);

financeRouter.get('/fee-structures', authenticate, ctrl.getFeeStructures);
financeRouter.post('/fee-structures', authenticate, ctrl.postFeeStructure);
financeRouter.patch('/fee-structures/:id', authenticate, ctrl.patchFeeStructure);
financeRouter.patch('/fee-structures/:id/archive', authenticate, ctrl.patchArchiveFeeStructure);
financeRouter.get('/fee-structures/:structureId/components', authenticate, ctrl.getFeeComponents);
financeRouter.post('/fee-structures/:structureId/components', authenticate, ctrl.postFeeComponent);

financeRouter.patch('/fee-components/:id/archive', authenticate, ctrl.patchArchiveFeeComponent);

financeRouter.get('/students/:studentId/fee-assignments', authenticate, ctrl.getFeeAssignments);
financeRouter.post('/students/:studentId/fee-assignments', authenticate, ctrl.postFeeAssignment);
financeRouter.patch('/fee-assignments/:id/archive', authenticate, ctrl.patchArchiveFeeAssignment);

financeRouter.get('/discounts', authenticate, ctrl.getDiscounts);
financeRouter.post('/discounts', authenticate, ctrl.postDiscount);
financeRouter.patch('/discounts/:id/archive', authenticate, ctrl.patchArchiveDiscount);

financeRouter.get('/scholarships', authenticate, ctrl.getScholarships);
financeRouter.post('/scholarships', authenticate, ctrl.postScholarship);
financeRouter.patch('/scholarships/:id/archive', authenticate, ctrl.patchArchiveScholarship);

financeRouter.get('/invoices', authenticate, ctrl.getInvoices);
financeRouter.get('/invoices/:id', authenticate, ctrl.getInvoice);
financeRouter.get('/invoices/:id/items', authenticate, ctrl.getInvoiceItems);
financeRouter.post('/invoices/generate', authenticate, ctrl.postGenerateInvoice);
financeRouter.post('/invoices/:id/adjustments', authenticate, ctrl.postInvoiceAdjustment);
financeRouter.patch('/invoices/:id/status', authenticate, ctrl.patchInvoiceStatus);
financeRouter.get('/invoices/:id/payments', authenticate, ctrl.getInvoicePayments);

financeRouter.get('/payments', authenticate, ctrl.getPayments);
financeRouter.post('/payments', authenticate, ctrl.postPayment);
financeRouter.patch('/payments/:id/reverse', authenticate, ctrl.patchReversePayment);
financeRouter.get('/payments/:id/receipts', authenticate, ctrl.getPaymentReceipts);
financeRouter.get('/payments/:id/refunds', authenticate, ctrl.getPaymentRefunds);
financeRouter.post('/payments/:id/refunds', authenticate, ctrl.postRefund);

financeRouter.patch('/refunds/:id/status', authenticate, ctrl.patchRefundStatus);

financeRouter.get('/budgets', authenticate, ctrl.getBudgets);
financeRouter.post('/budgets', authenticate, ctrl.postBudget);
financeRouter.patch('/budgets/:id/status', authenticate, ctrl.patchBudgetStatus);

financeRouter.get('/expenses', authenticate, ctrl.getExpenses);
financeRouter.post('/expenses', authenticate, ctrl.postExpense);
financeRouter.patch('/expenses/:id/archive', authenticate, ctrl.patchArchiveExpense);

financeRouter.get('/journals', authenticate, ctrl.getJournals);
financeRouter.post('/journals', authenticate, ctrl.postJournal);
financeRouter.get('/journals/:id/entries', authenticate, ctrl.getJournalEntries);
financeRouter.post('/journals/:id/entries', authenticate, ctrl.postLedgerEntry);
financeRouter.patch('/journals/:id/post', authenticate, ctrl.patchPostJournal);

financeRouter.get('/reconciliations', authenticate, ctrl.getReconciliations);
financeRouter.post('/reconciliations', authenticate, ctrl.postReconciliation);
financeRouter.patch('/reconciliations/:id/reconcile', authenticate, ctrl.patchMarkReconciled);

financeRouter.get('/transactions', authenticate, ctrl.getTransactions);
financeRouter.post('/transactions', authenticate, ctrl.postTransaction);

financeRouter.get('/audit-log', authenticate, ctrl.getFinanceAuditLog);
