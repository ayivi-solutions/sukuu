import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './finance.service';

function wrap(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try { res.json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapCreate(action: string, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const result = await fn(req);
      if (req.schoolId) await svc.logFinanceAudit(req.schoolId, action, 'finance', result?.id || result?.payment?.id || '', req.userId || '');
      res.status(201).json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapMutateById(action: string, getSchoolId: (id: string) => Promise<string | undefined>, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const sid = await getSchoolId(req.params.id);
      if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this record' });
      const result = await fn(req);
      if (req.schoolId) await svc.logFinanceAudit(req.schoolId, action, 'finance', req.params.id, req.userId || '');
      res.json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}

// Accounts
export const getAccounts = wrap(req => svc.listAccounts(req.schoolId || ''));
export const postAccount = wrapCreate('CREATE_ACCOUNT', req => svc.createAccount(req.schoolId || '', req.body));
export const patchAccount = wrapMutateById('UPDATE_ACCOUNT', svc.getAccountSchoolId, req => svc.updateAccount(req.params.id, req.body));

// Financial Years
export const getFinancialYears = wrap(req => svc.listFinancialYears(req.schoolId || ''));
export const postFinancialYear = wrapCreate('CREATE_FINANCIAL_YEAR', req => svc.createFinancialYear(req.schoolId || '', req.body));
export const patchCloseFinancialYear = wrapMutateById('CLOSE_FINANCIAL_YEAR', svc.getFinancialYearSchoolId, req => svc.closeFinancialYear(req.params.id));

// Fee Structures
export const getFeeStructures = wrap(req => svc.listFeeStructures(req.schoolId || ''));
export const postFeeStructure = wrapCreate('CREATE_FEE_STRUCTURE', req => svc.createFeeStructure(req.schoolId || '', req.body));
export const patchFeeStructure = wrapMutateById('UPDATE_FEE_STRUCTURE', svc.getFeeStructureSchoolId, req => svc.updateFeeStructure(req.params.id, req.body));
export const patchArchiveFeeStructure = wrapMutateById('ARCHIVE_FEE_STRUCTURE', svc.getFeeStructureSchoolId, req => svc.archiveFeeStructure(req.params.id));

// Fee Components
export const getFeeComponents = wrap(req => svc.listFeeComponents(req.params.structureId));
export const postFeeComponent = async (req: AuthRequest, res: Response) => {
  try {
    const sid = await svc.getFeeStructureSchoolId(req.params.structureId);
    if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this fee structure' });
    const result = await svc.createFeeComponent(req.params.structureId, req.body);
    if (req.schoolId) await svc.logFinanceAudit(req.schoolId, 'CREATE_FEE_COMPONENT', 'finance', result.id, req.userId || '');
    res.status(201).json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};
export const patchArchiveFeeComponent = wrapMutateById('ARCHIVE_FEE_COMPONENT', svc.getFeeComponentSchoolId, req => svc.archiveFeeComponent(req.params.id));

// Fee Assignments
export const getFeeAssignments = wrap(req => svc.listFeeAssignments(req.params.studentId));
export const postFeeAssignment = wrapCreate('CREATE_FEE_ASSIGNMENT', req => svc.createFeeAssignment(req.params.studentId, req.body));
export const patchArchiveFeeAssignment = wrapMutateById('ARCHIVE_FEE_ASSIGNMENT', svc.getFeeAssignmentSchoolId, req => svc.archiveFeeAssignment(req.params.id));

// Discounts
export const getDiscounts = wrap(req => svc.listDiscounts(req.schoolId || ''));
export const postDiscount = wrapCreate('CREATE_DISCOUNT', req => svc.createDiscount(req.schoolId || '', req.body));
export const patchArchiveDiscount = wrapMutateById('ARCHIVE_DISCOUNT', svc.getDiscountSchoolId, req => svc.archiveDiscount(req.params.id));

// Scholarships
export const getScholarships = wrap(req => svc.listScholarships(req.schoolId || ''));
export const postScholarship = wrapCreate('CREATE_SCHOLARSHIP', req => svc.createScholarship(req.schoolId || '', req.body));
export const patchArchiveScholarship = wrapMutateById('ARCHIVE_SCHOLARSHIP', svc.getScholarshipSchoolId, req => svc.archiveScholarship(req.params.id));

// Invoices
export const getInvoices = wrap(req => svc.listInvoices(req.schoolId || ''));
export const getInvoice = wrap(req => svc.getInvoice(req.params.id));
export const getInvoiceItems = wrap(req => svc.listInvoiceItems(req.params.id));
export const postGenerateInvoice = wrapCreate('GENERATE_INVOICE', req => svc.generateInvoiceFromAssignment(req.schoolId || '', req.body));
export const postInvoiceAdjustment = wrapMutateById('ADD_INVOICE_ADJUSTMENT', svc.getInvoiceSchoolId, req => svc.addInvoiceAdjustment(req.params.id, req.body));
export const patchInvoiceStatus = wrapMutateById('UPDATE_INVOICE_STATUS', svc.getInvoiceSchoolId, req => svc.updateInvoiceStatus(req.params.id, req.body.status));

// Payments
export const getPayments = wrap(req => svc.listPayments(req.schoolId || ''));
export const getInvoicePayments = wrap(req => svc.listPaymentsForInvoice(req.params.id));
export const postPayment = wrapCreate('RECORD_PAYMENT', req => svc.recordPayment(req.schoolId || '', req.userId || '', req.body));
export const patchReversePayment = wrapMutateById('REVERSE_PAYMENT', svc.getPaymentSchoolId, req => svc.reversePayment(req.params.id));

// Receipts (read-only)
export const getPaymentReceipts = wrap(req => svc.listReceiptsForPayment(req.params.id));

// Refunds
export const getPaymentRefunds = wrap(req => svc.listRefundsForPayment(req.params.id));
export const postRefund = async (req: AuthRequest, res: Response) => {
  try {
    const sid = await svc.getPaymentSchoolId(req.params.id);
    if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this payment' });
    const result = await svc.createRefund(req.params.id, req.body.studentId, req.userId || '', req.body);
    await svc.logFinanceAudit(req.schoolId!, 'CREATE_REFUND', 'finance', result.id, req.userId || '');
    res.status(201).json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};
export const patchRefundStatus = wrapMutateById('UPDATE_REFUND_STATUS', svc.getRefundSchoolId, req => svc.updateRefundStatus(req.params.id, req.body.status));

// Budgets
export const getBudgets = wrap(req => svc.listBudgets(req.schoolId || ''));
export const postBudget = wrapCreate('CREATE_BUDGET', req => svc.createBudget(req.schoolId || '', req.body));
export const patchBudgetStatus = wrapMutateById('UPDATE_BUDGET_STATUS', svc.getBudgetSchoolId, req => svc.updateBudgetStatus(req.params.id, req.body.status));

// Expenses
export const getExpenses = wrap(req => svc.listExpenses(req.schoolId || ''));
export const postExpense = wrapCreate('CREATE_EXPENSE', req => svc.createExpense(req.schoolId || '', req.userId || '', req.body));
export const patchArchiveExpense = wrapMutateById('ARCHIVE_EXPENSE', svc.getExpenseSchoolId, req => svc.archiveExpense(req.params.id));

// Journals & Ledger
export const getJournals = wrap(req => svc.listJournals(req.schoolId || ''));
export const postJournal = wrapCreate('CREATE_JOURNAL', req => svc.createJournal(req.schoolId || '', req.userId || '', req.body));
export const getJournalEntries = wrap(req => svc.listLedgerEntries(req.params.id));
export const postLedgerEntry = wrapMutateById('ADD_LEDGER_ENTRY', svc.getJournalSchoolId, req => svc.addLedgerEntry(req.params.id, req.schoolId || '', req.body));
export const patchPostJournal = wrapMutateById('POST_JOURNAL', svc.getJournalSchoolId, req => svc.postJournal(req.params.id));

// Bank Reconciliation
export const getReconciliations = wrap(req => svc.listReconciliations(req.schoolId || ''));
export const postReconciliation = wrapCreate('CREATE_RECONCILIATION', req => svc.createReconciliation(req.schoolId || '', req.body));
export const patchMarkReconciled = wrapMutateById('MARK_RECONCILED', svc.getReconciliationSchoolId, req => svc.markReconciled(req.params.id, req.userId || ''));

// Transactions
export const getTransactions = wrap(req => svc.listTransactions(req.schoolId || ''));
export const postTransaction = wrapCreate('CREATE_TRANSACTION', req => svc.createTransaction(req.schoolId || '', req.userId || '', req.body));

// Audit (read-only)
export const getFinanceAuditLog = wrap(req => svc.listFinanceAudit(req.schoolId || ''));

export const getSummary = wrap(req => svc.getFinanceSummary(req.schoolId || ''));
