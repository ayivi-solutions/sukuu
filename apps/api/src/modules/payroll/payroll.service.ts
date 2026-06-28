import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ── Ownership lookups ──
export async function getStaffSchoolId(staffId: string) { return (await prisma.staffStaff.findUnique({ where: { id: staffId } }))?.school_id; }
export async function getStructureSchoolId(id: string) { return (await prisma.payrollSalaryStructure.findUnique({ where: { id } }))?.school_id; }
export async function getComponentSchoolId(id: string) {
  const c = await prisma.payrollSalaryComponent.findUnique({ where: { id } });
  if (!c) return undefined;
  return getStructureSchoolId(c.structure_id);
}
export async function getSalarySchoolId(id: string) { return (await prisma.payrollSalary.findUnique({ where: { id } }))?.school_id; }
export async function getAllowanceSchoolId(id: string) {
  const a = await prisma.payrollAllowance.findUnique({ where: { id } });
  if (!a) return undefined;
  return getStaffSchoolId(a.staff_id);
}
export async function getDeductionSchoolId(id: string) {
  const d = await prisma.payrollDeduction.findUnique({ where: { id } });
  if (!d) return undefined;
  return getStaffSchoolId(d.staff_id);
}
export async function getBonusSchoolId(id: string) {
  const b = await prisma.payrollBonus.findUnique({ where: { id } });
  if (!b) return undefined;
  return getStaffSchoolId(b.staff_id);
}
export async function getPeriodSchoolId(id: string) { return (await prisma.payrollPeriod.findUnique({ where: { id } }))?.school_id; }
export async function getRunSchoolId(id: string) { return (await prisma.payrollRun.findUnique({ where: { id } }))?.school_id; }
export async function getPayslipSchoolId(id: string) {
  const p = await prisma.payrollPayslip.findUnique({ where: { id } });
  if (!p) return undefined;
  return getRunSchoolId(p.payroll_run_id);
}
export async function getPaymentSchoolId(id: string) {
  const p = await prisma.payrollPayment.findUnique({ where: { id } });
  if (!p) return undefined;
  return getPayslipSchoolId(p.payslip_id);
}
export async function getBatchSchoolId(id: string) { return (await prisma.payrollPaymentBatch.findUnique({ where: { id } }))?.school_id; }
export async function getLoanSchoolId(id: string) { return (await prisma.payrollLoan.findUnique({ where: { id } }))?.school_id; }
export async function getRepaymentSchoolId(id: string) {
  const r = await prisma.payrollLoanRepayment.findUnique({ where: { id } });
  if (!r) return undefined;
  return getLoanSchoolId(r.loan_id);
}
export async function getReimbursementSchoolId(id: string) { return (await prisma.payrollReimbursement.findUnique({ where: { id } }))?.school_id; }

// ── Salary Structures & Components ──
export async function listStructures(schoolId: string) { return prisma.payrollSalaryStructure.findMany({ where: { school_id: schoolId, archived_at: null } }); }
export async function createStructure(schoolId: string, data: any) { return prisma.payrollSalaryStructure.create({ data: { school_id: schoolId, structure_name: data.structureName, description: data.description } }); }
export async function archiveStructure(id: string) { return prisma.payrollSalaryStructure.update({ where: { id }, data: { archived_at: new Date() } }); }
export async function listComponents(structureId: string) { return prisma.payrollSalaryComponent.findMany({ where: { structure_id: structureId, archived_at: null } }); }
export async function createComponent(structureId: string, data: any) { return prisma.payrollSalaryComponent.create({ data: { structure_id: structureId, component_name: data.componentName, component_type: data.componentType, amount: data.amount } }); }
export async function archiveComponent(id: string) { return prisma.payrollSalaryComponent.update({ where: { id }, data: { archived_at: new Date() } }); }

// ── Staff Salary Assignment ──
export async function listStaffSalary(staffId: string) { return prisma.payrollSalary.findMany({ where: { staff_id: staffId } }); }
export async function assignSalary(staffId: string, schoolId: string, approvedBy: string, data: any) {
  await prisma.payrollSalary.updateMany({ where: { staff_id: staffId, is_current: true }, data: { is_current: false, effective_to: data.effectiveFrom } });
  return prisma.payrollSalary.create({ data: { staff_id: staffId, school_id: schoolId, structure_id: data.structureId, base_salary: data.baseSalary, effective_from: data.effectiveFrom, is_current: true, approved_by: approvedBy } });
}

// ── Allowances & Deductions ──
export async function listAllowances(staffId: string) { return prisma.payrollAllowance.findMany({ where: { staff_id: staffId } }); }
export async function createAllowance(staffId: string, data: any) { return prisma.payrollAllowance.create({ data: { staff_id: staffId, allowance_type: data.allowanceType, label: data.label, amount: data.amount, is_taxable: !!data.isTaxable, effective_from: data.effectiveFrom } }); }
export async function endAllowance(id: string, effectiveTo: string) { return prisma.payrollAllowance.update({ where: { id }, data: { effective_to: effectiveTo } }); }
export async function listDeductions(staffId: string) { return prisma.payrollDeduction.findMany({ where: { staff_id: staffId } }); }
export async function createDeduction(staffId: string, data: any) { return prisma.payrollDeduction.create({ data: { staff_id: staffId, deduction_type: data.deductionType, label: data.label, amount: data.amount, percentage: data.percentage, is_recurring: !!data.isRecurring, effective_from: data.effectiveFrom } }); }
export async function endDeduction(id: string, effectiveTo: string) { return prisma.payrollDeduction.update({ where: { id }, data: { effective_to: effectiveTo } }); }

// ── Statutory tables (global) ──
export async function listStatutoryDeductions() { return prisma.payrollStatutoryDeduction.findMany(); }
export async function createStatutoryDeduction(data: any) { return prisma.payrollStatutoryDeduction.create({ data: { deduction_name: data.deductionName, percentage: data.percentage, is_active: true } }); }
export async function listTaxRules() { return prisma.payrollTaxRule.findMany({ orderBy: { income_from: 'asc' } }); }
export async function createTaxRule(data: any) { return prisma.payrollTaxRule.create({ data: { effective_year: data.effectiveYear, band_label: data.bandLabel, income_from: data.incomeFrom, income_to: data.incomeTo, rate_pct: data.ratePct } }); }
export async function listSsnitRules() { return prisma.payrollSsnitRule.findMany(); }
export async function createSsnitRule(data: any) { return prisma.payrollSsnitRule.create({ data: { effective_from: data.effectiveFrom, employee_rate_pct: data.employeeRatePct, employer_rate_pct: data.employerRatePct, is_active: true } }); }

// ── Pay Periods ──
export async function listPeriods(schoolId: string) { return prisma.payrollPeriod.findMany({ where: { school_id: schoolId } }); }
export async function createPeriod(schoolId: string, data: any) { return prisma.payrollPeriod.create({ data: { school_id: schoolId, month: data.month, year: data.year, start_date: data.startDate, end_date: data.endDate, status: 'OPEN' } }); }

// ── Bonuses ──
export async function listBonuses(staffId: string) { return prisma.payrollBonus.findMany({ where: { staff_id: staffId } }); }
export async function createBonus(staffId: string, approvedBy: string, data: any) { return prisma.payrollBonus.create({ data: { staff_id: staffId, amount: data.amount, bonus_type: data.bonusType, reason: data.reason, date_awarded: data.dateAwarded, approved_by: approvedBy } }); }

// ── Loans ──
export async function listLoans(schoolId: string) { return prisma.payrollLoan.findMany({ where: { school_id: schoolId } }); }
export async function createLoan(staffId: string, schoolId: string, data: any) { return prisma.payrollLoan.create({ data: { staff_id: staffId, school_id: schoolId, loan_amount: data.loanAmount, interest_rate: data.interestRate || 0, loan_date: data.loanDate, outstanding_balance: data.loanAmount, status: 'ACTIVE' } }); }
export async function listLoanRepayments(loanId: string) { return prisma.payrollLoanRepayment.findMany({ where: { loan_id: loanId } }); }
export async function recordLoanRepayment(loanId: string, data: any) {
  const loan = await prisma.payrollLoan.findUnique({ where: { id: loanId } });
  if (!loan) throw new Error('Loan not found');
  const repayment = await prisma.payrollLoanRepayment.create({ data: { loan_id: loanId, repayment_amount: data.repaymentAmount, repayment_date: data.repaymentDate, payslip_id: data.payslipId } });
  const newBalance = Math.max(0, Number(loan.outstanding_balance) - Number(data.repaymentAmount));
  await prisma.payrollLoan.update({ where: { id: loanId }, data: { outstanding_balance: newBalance, status: newBalance <= 0 ? 'CLOSED' : 'ACTIVE' } });
  return repayment;
}

// ── Reimbursements ──
export async function listReimbursements(schoolId: string) { return prisma.payrollReimbursement.findMany({ where: { school_id: schoolId } }); }
export async function createReimbursement(staffId: string, schoolId: string, data: any) { return prisma.payrollReimbursement.create({ data: { staff_id: staffId, school_id: schoolId, expense_type: data.expenseType, amount: data.amount, status: 'PENDING' } }); }
export async function decideReimbursement(id: string, approvedBy: string, status: string) { return prisma.payrollReimbursement.update({ where: { id }, data: { status: status as any, approved_by: approvedBy, approved_at: new Date() } }); }

// ── Payroll Run Engine (core business logic) ──
export async function listRuns(schoolId: string) { return prisma.payrollRun.findMany({ where: { school_id: schoolId } }); }

async function computeIncomeTax(annualGross: number): Promise<number> {
  const bands = await prisma.payrollTaxRule.findMany({ orderBy: { income_from: 'asc' } });
  if (bands.length === 0) return 0;
  let tax = 0;
  for (const band of bands) {
    const from = Number(band.income_from);
    const to = band.income_to ? Number(band.income_to) : Infinity;
    if (annualGross <= from) continue;
    const taxableInThisBand = Math.min(annualGross, to) - from;
    if (taxableInThisBand > 0) tax += taxableInThisBand * (Number(band.rate_pct) / 100);
  }
  return tax / 12; // monthly equivalent
}

export async function runPayroll(schoolId: string, periodId: string, runBy: string) {
  const period = await prisma.payrollPeriod.findUnique({ where: { id: periodId } });
  if (!period) throw new Error('Pay period not found');

  const ssnitRule = await prisma.payrollSsnitRule.findFirst({ where: { is_active: true }, orderBy: { effective_from: 'desc' } });
  const employeeSsnitRate = ssnitRule ? Number(ssnitRule.employee_rate_pct) / 100 : 0.055;
  const employerSsnitRate = ssnitRule ? Number(ssnitRule.employer_rate_pct) / 100 : 0.13;

  const run = await prisma.payrollRun.create({ data: { school_id: schoolId, period_id: periodId, status: 'PROCESSING', total_gross: 0, total_deductions: 0, total_net: 0, staff_count: 0, run_by: runBy, run_at: new Date() } });

  const activeSalaries = await prisma.payrollSalary.findMany({ where: { school_id: schoolId, is_current: true } });
  let totalGross = 0, totalDeductions = 0, totalNet = 0, count = 0;

  for (const sal of activeSalaries) {
    const allowances = await prisma.payrollAllowance.findMany({ where: { staff_id: sal.staff_id, effective_to: null } });
    const deductions = await prisma.payrollDeduction.findMany({ where: { staff_id: sal.staff_id, effective_to: null } });
    const bonuses = await prisma.payrollBonus.findMany({ where: { staff_id: sal.staff_id, date_awarded: { gte: period.start_date, lte: period.end_date } } });
    const activeLoans = await prisma.payrollLoan.findMany({ where: { staff_id: sal.staff_id, status: 'ACTIVE' } });

    const totalAllowances = allowances.reduce((s, a) => s + Number(a.amount), 0);
    const totalBonuses = bonuses.reduce((s, b) => s + Number(b.amount), 0);
    const gross = Number(sal.base_salary) + totalAllowances + totalBonuses;

    const ssnitEmployee = gross * employeeSsnitRate;
    const ssnitEmployer = gross * employerSsnitRate;
    const taxableIncome = gross - ssnitEmployee;
    const incomeTax = await computeIncomeTax(taxableIncome * 12);
    const otherDeductions = deductions.reduce((s, d) => s + (d.amount ? Number(d.amount) : (d.percentage ? gross * Number(d.percentage) / 100 : 0)), 0);
    const loanDeduction = Math.min(activeLoans.reduce((s, l) => s + Number(l.outstanding_balance), 0), gross * 0.3);

    const totalDed = ssnitEmployee + incomeTax + otherDeductions + loanDeduction;
    const net = gross - totalDed;

    const payslip = await prisma.payrollPayslip.create({ data: { payroll_run_id: run.id, staff_id: sal.staff_id, gross_salary: gross, total_allowances: totalAllowances, total_deductions: totalDed, net_salary: net, ssnit_employee: ssnitEmployee, ssnit_employer: ssnitEmployer, income_tax: incomeTax, is_paid: false } });

    await prisma.payrollPayslipItem.create({ data: { payslip_id: payslip.id, component_name: 'Basic Salary', amount: sal.base_salary } });
    for (const a of allowances) await prisma.payrollPayslipItem.create({ data: { payslip_id: payslip.id, component_name: a.label, amount: a.amount } });
    for (const b of bonuses) await prisma.payrollPayslipItem.create({ data: { payslip_id: payslip.id, component_name: b.bonus_type, amount: b.amount } });
    await prisma.payrollPayslipItem.create({ data: { payslip_id: payslip.id, component_name: 'SSNIT (Employee)', amount: -ssnitEmployee } });
    await prisma.payrollPayslipItem.create({ data: { payslip_id: payslip.id, component_name: 'PAYE Income Tax', amount: -incomeTax } });
    for (const d of deductions) await prisma.payrollPayslipItem.create({ data: { payslip_id: payslip.id, component_name: d.label, amount: -(d.amount ? Number(d.amount) : gross * Number(d.percentage || 0) / 100) } });
    if (loanDeduction > 0) {
      await prisma.payrollPayslipItem.create({ data: { payslip_id: payslip.id, component_name: 'Loan Repayment', amount: -loanDeduction } });
      const loan = activeLoans[0];
      if (loan) await recordLoanRepayment(loan.id, { repaymentAmount: loanDeduction, repaymentDate: period.end_date, payslipId: payslip.id });
    }

    await prisma.payrollHistory.create({ data: { staff_id: sal.staff_id, payslip_id: payslip.id, month: period.month, year: period.year, gross_salary: gross, net_salary: net } });

    totalGross += gross; totalDeductions += totalDed; totalNet += net; count++;
  }

  await prisma.payrollPeriod.update({ where: { id: periodId }, data: { status: 'PROCESSING' } });
  return prisma.payrollRun.update({ where: { id: run.id }, data: { status: 'PENDING_APPROVAL', total_gross: totalGross, total_deductions: totalDeductions, total_net: totalNet, staff_count: count } });
}

export async function approveRun(id: string, approvedBy: string) {
  const run = await prisma.payrollRun.update({ where: { id }, data: { status: 'APPROVED', approved_by: approvedBy } });
  await prisma.payrollPeriod.update({ where: { id: run.period_id }, data: { status: 'CLOSED', closed_at: new Date() } });
  return run;
}
export async function reverseRun(id: string) { return prisma.payrollRun.update({ where: { id }, data: { status: 'REVERSED' } }); }

// ── Payslips & Payments ──
export async function listPayslips(runId: string) { return prisma.payrollPayslip.findMany({ where: { payroll_run_id: runId } }); }
export async function listPayslipItems(payslipId: string) { return prisma.payrollPayslipItem.findMany({ where: { payslip_id: payslipId } }); }
export async function listPayments(payslipId: string) { return prisma.payrollPayment.findMany({ where: { payslip_id: payslipId } }); }
export async function recordPayment(payslipId: string, data: any) {
  const payment = await prisma.payrollPayment.create({ data: { payslip_id: payslipId, payment_date: new Date(), payment_method: data.paymentMethod, amount: data.amount, reference_number: data.referenceNumber } });
  await prisma.payrollPayslip.update({ where: { id: payslipId }, data: { is_paid: true, paid_at: new Date() } });
  return payment;
}

// ── Payment Batches ──
export async function listBatches(schoolId: string) { return prisma.payrollPaymentBatch.findMany({ where: { school_id: schoolId } }); }
export async function createBatch(schoolId: string, createdBy: string, data: any) { return prisma.payrollPaymentBatch.create({ data: { school_id: schoolId, batch_name: data.batchName, payment_date: data.paymentDate, created_by: createdBy } }); }

// ── Audit ──
export async function logPayrollAudit(schoolId: string, action: string, entityType: string, entityId: string, performedBy: string, notes?: string) { return prisma.payrollAuditLog.create({ data: { school_id: schoolId, action, entity_type: entityType, entity_id: entityId, performed_by: performedBy, notes } }); }
export async function listPayrollAudit(schoolId: string) { return prisma.payrollAuditLog.findMany({ where: { school_id: schoolId }, orderBy: { timestamp: 'desc' } }); }
