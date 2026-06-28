import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ── Ownership lookups for sub-resources lacking direct school_id ──
export async function getFeeStructureSchoolId(id: string) { return (await prisma.financeFeeStructure.findUnique({ where: { id } }))?.school_id; }
export async function getFeeComponentSchoolId(id: string) {
  const c = await prisma.financeFeeComponent.findUnique({ where: { id } });
  if (!c) return undefined;
  return getFeeStructureSchoolId(c.fee_structure_id);
}
export async function getFeeAssignmentSchoolId(id: string) {
  const a = await prisma.financeFeeAssignment.findUnique({ where: { id } });
  if (!a) return undefined;
  return getFeeStructureSchoolId(a.fee_structure_id);
}
export async function getInvoiceItemSchoolId(id: string) {
  const item = await prisma.financeInvoiceItem.findUnique({ where: { id } });
  if (!item) return undefined;
  return (await prisma.financeInvoice.findUnique({ where: { id: item.invoice_id } }))?.school_id;
}
export async function getPaymentSchoolId(id: string) { return (await prisma.financePayment.findUnique({ where: { id } }))?.school_id; }
export async function getReceiptSchoolId(id: string) {
  const r = await prisma.financeReceipt.findUnique({ where: { id } });
  if (!r) return undefined;
  return getPaymentSchoolId(r.payment_id);
}
export async function getRefundSchoolId(id: string) {
  const r = await prisma.financeRefund.findUnique({ where: { id } });
  if (!r) return undefined;
  return getPaymentSchoolId(r.payment_id);
}
export async function getInvoiceSchoolId(id: string) { return (await prisma.financeInvoice.findUnique({ where: { id } }))?.school_id; }
export async function getJournalSchoolId(id: string) { return (await prisma.financeJournal.findUnique({ where: { id } }))?.school_id; }
export async function getLedgerEntrySchoolId(id: string) { return (await prisma.financeLedgerEntry.findUnique({ where: { id } }))?.school_id; }

// ── Accounts ──
export async function listAccounts(schoolId: string) { return prisma.financeAccount.findMany({ where: { school_id: schoolId } }); }
export async function createAccount(schoolId: string, data: any) {
  return prisma.financeAccount.create({ data: { school_id: schoolId, name: data.name, account_code: data.accountCode, account_type: data.accountType, parent_account_id: data.parentAccountId, current_balance: data.currentBalance || 0, is_active: true } });
}
export async function updateAccount(id: string, data: any) {
  return prisma.financeAccount.update({ where: { id }, data: { ...(data.name && { name: data.name }), ...(data.accountCode && { account_code: data.accountCode }), ...(data.isActive !== undefined && { is_active: data.isActive }) } });
}

// ── Financial Years ──
export async function listFinancialYears(schoolId: string) { return prisma.financeFinancialYear.findMany({ where: { school_id: schoolId } }); }
export async function createFinancialYear(schoolId: string, data: any) {
  return prisma.financeFinancialYear.create({ data: { school_id: schoolId, name: data.name, start_date: data.startDate, end_date: data.endDate, is_active: true, is_closed: false } });
}
export async function closeFinancialYear(id: string) { return prisma.financeFinancialYear.update({ where: { id }, data: { is_closed: true, is_active: false } }); }

// ── Fee Structures ──
export async function listFeeStructures(schoolId: string) { return prisma.financeFeeStructure.findMany({ where: { school_id: schoolId } }); }
export async function createFeeStructure(schoolId: string, data: any) {
  return prisma.financeFeeStructure.create({ data: { school_id: schoolId, name: data.name, class_id: data.classId, term_id: data.termId, total_amount: data.totalAmount, due_date: data.dueDate, is_active: true } });
}
export async function updateFeeStructure(id: string, data: any) {
  return prisma.financeFeeStructure.update({ where: { id }, data: { ...(data.name && { name: data.name }), ...(data.totalAmount !== undefined && { total_amount: data.totalAmount }), ...(data.dueDate && { due_date: data.dueDate }) } });
}
export async function archiveFeeStructure(id: string) { return prisma.financeFeeStructure.update({ where: { id }, data: { is_active: false } }); }

// ── Fee Components ──
export async function listFeeComponents(structureId: string) { return prisma.financeFeeComponent.findMany({ where: { fee_structure_id: structureId, archived_at: null } }); }
export async function createFeeComponent(structureId: string, data: any) {
  return prisma.financeFeeComponent.create({ data: { fee_structure_id: structureId, name: data.name, amount: data.amount, is_compulsory: !!data.isCompulsory, account_id: data.accountId } });
}
export async function archiveFeeComponent(id: string) { return prisma.financeFeeComponent.update({ where: { id }, data: { archived_at: new Date() } }); }

// ── Fee Assignments ──
export async function listFeeAssignments(studentId: string) { return prisma.financeFeeAssignment.findMany({ where: { student_id: studentId, archived_at: null } }); }
export async function createFeeAssignment(studentId: string, data: any) {
  return prisma.financeFeeAssignment.create({ data: { student_id: studentId, fee_structure_id: data.feeStructureId, override_amount: data.overrideAmount, assignment_reason: data.assignmentReason, assigned_at: new Date() } });
}
export async function archiveFeeAssignment(id: string) { return prisma.financeFeeAssignment.update({ where: { id }, data: { archived_at: new Date() } }); }

// ── Discounts ──
export async function listDiscounts(schoolId: string) { return prisma.financeDiscount.findMany({ where: { school_id: schoolId } }); }
export async function createDiscount(schoolId: string, data: any) {
  return prisma.financeDiscount.create({ data: { school_id: schoolId, name: data.name, discount_type: data.discountType, value: data.value, applicable_to: data.applicableTo, is_active: true } });
}
export async function archiveDiscount(id: string) { return prisma.financeDiscount.update({ where: { id }, data: { is_active: false } }); }

// ── Scholarships ──
export async function listScholarships(schoolId: string) { return prisma.financeScholarship.findMany({ where: { school_id: schoolId } }); }
export async function createScholarship(schoolId: string, data: any) {
  return prisma.financeScholarship.create({ data: { school_id: schoolId, name: data.name, sponsor: data.sponsor, coverage_type: data.coverageType, coverage_pct: data.coveragePct, max_beneficiaries: data.maxBeneficiaries, is_active: true } });
}
export async function archiveScholarship(id: string) { return prisma.financeScholarship.update({ where: { id }, data: { is_active: false } }); }

// ── Invoices (with line-item generation from a fee structure) ──
export async function listInvoices(schoolId: string) { return prisma.financeInvoice.findMany({ where: { school_id: schoolId } }); }
export async function getInvoice(id: string) { return prisma.financeInvoice.findUnique({ where: { id } }); }
export async function listInvoiceItems(invoiceId: string) { return prisma.financeInvoiceItem.findMany({ where: { invoice_id: invoiceId } }); }

export async function generateInvoiceFromAssignment(schoolId: string, data: any) {
  const assignment = await prisma.financeFeeAssignment.findUnique({ where: { id: data.feeAssignmentId } });
  if (!assignment) throw new Error('Fee assignment not found');
  const structure = await prisma.financeFeeStructure.findUnique({ where: { id: assignment.fee_structure_id } });
  if (!structure) throw new Error('Fee structure not found');
  const components = await prisma.financeFeeComponent.findMany({ where: { fee_structure_id: structure.id, archived_at: null } });
  const total = assignment.override_amount ? Number(assignment.override_amount) : Number(structure.total_amount);

  const enrollment = await prisma.studentsEnrollment.findFirst({ where: { student_id: assignment.student_id }, orderBy: { created_at: 'desc' } });
  if (!enrollment) throw new Error('Student has no enrollment record - cannot generate invoice');

  const invoice = await prisma.financeInvoice.create({
    data: {
      school_id: schoolId, student_id: assignment.student_id, enrollment_id: enrollment.id, term_id: structure.term_id,
      invoice_number: `INV-${Date.now()}`, total_amount: total, amount_paid: 0, balance_due: total, due_date: structure.due_date, status: 'ISSUED',
    },
  });
  for (const c of components) {
    await prisma.financeInvoiceItem.create({ data: { invoice_id: invoice.id, fee_component_id: c.id, description: c.name, amount: c.amount, is_adjustment: false } });
  }
  return invoice;
}

export async function addInvoiceAdjustment(invoiceId: string, data: any) {
  const item = await prisma.financeInvoiceItem.create({ data: { invoice_id: invoiceId, description: data.description, amount: data.amount, is_adjustment: true } });
  const invoice = await prisma.financeInvoice.findUnique({ where: { id: invoiceId } });
  if (invoice) {
    const newTotal = Number(invoice.total_amount) + Number(data.amount);
    await prisma.financeInvoice.update({ where: { id: invoiceId }, data: { total_amount: newTotal, balance_due: Number(invoice.balance_due) + Number(data.amount) } });
  }
  return item;
}

export async function updateInvoiceStatus(id: string, status: string) {
  return prisma.financeInvoice.update({ where: { id }, data: { status: status as any } });
}

// ── Payments (auto-updates invoice balance + status, auto-issues receipt) ──
export async function listPayments(schoolId: string) { return prisma.financePayment.findMany({ where: { school_id: schoolId } }); }
export async function listPaymentsForInvoice(invoiceId: string) { return prisma.financePayment.findMany({ where: { invoice_id: invoiceId } }); }

export async function recordPayment(schoolId: string, receivedBy: string, data: any) {
  const invoice = await prisma.financeInvoice.findUnique({ where: { id: data.invoiceId } });
  if (!invoice) throw new Error('Invoice not found');

  const payment = await prisma.financePayment.create({
    data: { invoice_id: data.invoiceId, school_id: schoolId, amount: data.amount, payment_method: data.paymentMethod, paystack_reference: data.paystackReference, paid_date: new Date(), received_by: receivedBy, status: 'CONFIRMED' },
  });

  const newAmountPaid = Number(invoice.amount_paid) + Number(data.amount);
  const newBalance = Number(invoice.total_amount) - newAmountPaid;
  const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';
  await prisma.financeInvoice.update({ where: { id: data.invoiceId }, data: { amount_paid: newAmountPaid, balance_due: Math.max(0, newBalance), status: newStatus as any } });

  const receipt = await prisma.financeReceipt.create({ data: { payment_id: payment.id, receipt_number: `RCT-${Date.now()}`, issued_to: invoice.student_id, issued_at: new Date() } });
  return { payment, receipt };
}

export async function reversePayment(id: string) {
  const payment = await prisma.financePayment.findUnique({ where: { id } });
  if (!payment) throw new Error('Payment not found');
  const invoice = await prisma.financeInvoice.findUnique({ where: { id: payment.invoice_id } });
  if (invoice) {
    const newAmountPaid = Math.max(0, Number(invoice.amount_paid) - Number(payment.amount));
    const newBalance = Number(invoice.total_amount) - newAmountPaid;
    await prisma.financeInvoice.update({ where: { id: invoice.id }, data: { amount_paid: newAmountPaid, balance_due: newBalance, status: (newAmountPaid > 0 ? 'PARTIAL' : 'ISSUED') as any } });
  }
  return prisma.financePayment.update({ where: { id }, data: { status: 'REVERSED' } });
}

// ── Receipts (read-only, append-only) ──
export async function listReceiptsForPayment(paymentId: string) { return prisma.financeReceipt.findMany({ where: { payment_id: paymentId } }); }

// ── Refunds ──
export async function listRefundsForPayment(paymentId: string) { return prisma.financeRefund.findMany({ where: { payment_id: paymentId } }); }
export async function createRefund(paymentId: string, studentId: string, processedBy: string, data: any) {
  return prisma.financeRefund.create({ data: { student_id: studentId, payment_id: paymentId, amount: data.amount, refund_date: new Date(), reason: data.reason, refund_method: data.refundMethod, processed_by: processedBy, status: 'PENDING' } as any });
}
export async function updateRefundStatus(id: string, status: string) { return prisma.financeRefund.update({ where: { id }, data: { status: status as any } }); }

// ── Budgets ──
export async function listBudgets(schoolId: string) { return prisma.financeBudget.findMany({ where: { school_id: schoolId } }); }
export async function createBudget(schoolId: string, data: any) {
  return prisma.financeBudget.create({ data: { school_id: schoolId, department_id: data.departmentId, financial_year_id: data.financialYearId, budget_name: data.budgetName, budgeted_amount: data.budgetedAmount, spent_amount: 0, remaining_amount: data.budgetedAmount, status: 'DRAFT' } });
}
export async function updateBudgetStatus(id: string, status: string) { return prisma.financeBudget.update({ where: { id }, data: { status: status as any } }); }

// ── Expenses (decrements budget) ──
export async function listExpenses(schoolId: string) { return prisma.financeExpense.findMany({ where: { school_id: schoolId, archived_at: null } }); }
export async function createExpense(schoolId: string, approvedBy: string, data: any) {
  const expense = await prisma.financeExpense.create({ data: { school_id: schoolId, account_id: data.accountId, budget_id: data.budgetId, description: data.description, amount: data.amount, expense_date: data.expenseDate, receipt_url: data.receiptUrl, approved_by: approvedBy } });
  if (data.budgetId) {
    const budget = await prisma.financeBudget.findUnique({ where: { id: data.budgetId } });
    if (budget) {
      const newSpent = Number(budget.spent_amount) + Number(data.amount);
      await prisma.financeBudget.update({ where: { id: data.budgetId }, data: { spent_amount: newSpent, remaining_amount: Number(budget.budgeted_amount) - newSpent } });
    }
  }
  return expense;
}
export async function archiveExpense(id: string) { return prisma.financeExpense.update({ where: { id }, data: { archived_at: new Date() } }); }

// ── Journals & Ledger (double-entry bookkeeping) ──
export async function listJournals(schoolId: string) { return prisma.financeJournal.findMany({ where: { school_id: schoolId } }); }
export async function createJournal(schoolId: string, createdBy: string, data: any) {
  return prisma.financeJournal.create({ data: { school_id: schoolId, journal_type: data.journalType, reference: data.reference, description: data.description, journal_date: data.journalDate, created_by: createdBy, is_posted: false } });
}
export async function listLedgerEntries(journalId: string) { return prisma.financeLedgerEntry.findMany({ where: { journal_id: journalId } }); }
export async function addLedgerEntry(journalId: string, schoolId: string, data: any) {
  const journal = await prisma.financeJournal.findUnique({ where: { id: journalId } });
  if (journal?.is_posted) throw new Error('Cannot add entries to a posted journal');
  return prisma.financeLedgerEntry.create({ data: { school_id: schoolId, journal_id: journalId, account_id: data.accountId, entry_type: data.entryType, amount: data.amount, description: data.description } });
}
export async function postJournal(id: string) {
  const entries = await prisma.financeLedgerEntry.findMany({ where: { journal_id: id } });
  const debits = entries.filter(e => e.entry_type === 'DEBIT').reduce((s, e) => s + Number(e.amount), 0);
  const credits = entries.filter(e => e.entry_type === 'CREDIT').reduce((s, e) => s + Number(e.amount), 0);
  if (Math.abs(debits - credits) > 0.01) throw new Error(`Journal does not balance: debits ${debits} vs credits ${credits}`);
  for (const e of entries) {
    const account = await prisma.financeAccount.findUnique({ where: { id: e.account_id } });
    if (account) {
      const isDebitNormal = account.account_type === 'ASSET' || account.account_type === 'EXPENSE';
      const signedAmount = e.entry_type === 'DEBIT' ? Number(e.amount) : -Number(e.amount);
      const delta = isDebitNormal ? signedAmount : -signedAmount;
      await prisma.financeAccount.update({ where: { id: e.account_id }, data: { current_balance: Number(account.current_balance) + delta } });
    }
  }
  return prisma.financeJournal.update({ where: { id }, data: { is_posted: true } });
}

// ── Bank Reconciliation ──
export async function listReconciliations(schoolId: string) { return prisma.financeBankReconciliation.findMany({ where: { school_id: schoolId } }); }
export async function createReconciliation(schoolId: string, data: any) {
  const diff = Number(data.statementBalance) - Number(data.bookBalance);
  return prisma.financeBankReconciliation.create({ data: { school_id: schoolId, account_id: data.accountId, period_start: data.periodStart, period_end: data.periodEnd, statement_balance: data.statementBalance, book_balance: data.bookBalance, difference: diff, is_reconciled: Math.abs(diff) < 0.01 } });
}
export async function markReconciled(id: string, reconciledBy: string) { return prisma.financeBankReconciliation.update({ where: { id }, data: { is_reconciled: true, reconciled_by: reconciledBy } }); }

// ── Transactions (simple ledger log, append-only) ──
export async function listTransactions(schoolId: string) { return prisma.financeTransaction.findMany({ where: { school_id: schoolId } }); }
export async function createTransaction(schoolId: string, createdBy: string, data: any) {
  return prisma.financeTransaction.create({ data: { school_id: schoolId, account_id: data.accountId, transaction_type: data.transactionType, amount: data.amount, description: data.description, transaction_date: data.transactionDate, created_by: createdBy } });
}

// ── Audit (append-only) ──
export async function logFinanceAudit(schoolId: string, action: string, entityType: string, entityId: string, performedBy: string, notes?: string) {
  return prisma.financeAudit.create({ data: { school_id: schoolId, action, entity_type: entityType, entity_id: entityId, performed_by: performedBy, performed_at: new Date(), notes } });
}
export async function listFinanceAudit(schoolId: string) { return prisma.financeAudit.findMany({ where: { school_id: schoolId }, orderBy: { performed_at: 'desc' } }); }

// ── Additional ownership lookups (direct school_id, still need by-id guard) ──
export async function getAccountSchoolId(id: string) { return (await prisma.financeAccount.findUnique({ where: { id } }))?.school_id; }
export async function getDiscountSchoolId(id: string) { return (await prisma.financeDiscount.findUnique({ where: { id } }))?.school_id; }
export async function getScholarshipSchoolId(id: string) { return (await prisma.financeScholarship.findUnique({ where: { id } }))?.school_id; }
export async function getBudgetSchoolId(id: string) { return (await prisma.financeBudget.findUnique({ where: { id } }))?.school_id; }
export async function getExpenseSchoolId(id: string) { return (await prisma.financeExpense.findUnique({ where: { id } }))?.school_id; }
export async function getReconciliationSchoolId(id: string) { return (await prisma.financeBankReconciliation.findUnique({ where: { id } }))?.school_id; }
export async function getFinancialYearSchoolId(id: string) { return (await prisma.financeFinancialYear.findUnique({ where: { id } }))?.school_id; }
