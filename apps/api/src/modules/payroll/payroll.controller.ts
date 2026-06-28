import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import * as svc from './payroll.service';

function wrap(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try { res.json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapCreate(action: string, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const result = await fn(req);
      if (req.schoolId) await svc.logPayrollAudit(req.schoolId, action, 'payroll', result?.id || '', req.userId || '');
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
      if (req.schoolId) await svc.logPayrollAudit(req.schoolId, action, 'payroll', req.params.id, req.userId || '');
      res.json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapStaffScoped(action: string, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const sid = await svc.getStaffSchoolId(req.params.staffId);
      if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this staff record' });
      const result = await fn(req);
      if (req.schoolId) await svc.logPayrollAudit(req.schoolId, action, 'payroll', result?.id || '', req.userId || '');
      res.status(201).json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}

// Salary Structures
export const getStructures = wrap(req => svc.listStructures(req.schoolId || ''));
export const postStructure = wrapCreate('CREATE_STRUCTURE', req => svc.createStructure(req.schoolId || '', req.body));
export const patchArchiveStructure = wrapMutateById('ARCHIVE_STRUCTURE', svc.getStructureSchoolId, req => svc.archiveStructure(req.params.id));
export const getComponents = wrap(req => svc.listComponents(req.params.structureId));
export const postComponent = async (req: AuthRequest, res: Response) => {
  try {
    const sid = await svc.getStructureSchoolId(req.params.structureId);
    if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this structure' });
    const result = await svc.createComponent(req.params.structureId, req.body);
    res.status(201).json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};
export const patchArchiveComponent = wrapMutateById('ARCHIVE_COMPONENT', svc.getComponentSchoolId, req => svc.archiveComponent(req.params.id));

// Staff Salary
export const getStaffSalary = wrap(req => svc.listStaffSalary(req.params.staffId));
export const postStaffSalary = wrapStaffScoped('ASSIGN_SALARY', req => svc.assignSalary(req.params.staffId, req.schoolId || '', req.userId || '', req.body));

// Allowances & Deductions
export const getAllowances = wrap(req => svc.listAllowances(req.params.staffId));
export const postAllowance = wrapStaffScoped('CREATE_ALLOWANCE', req => svc.createAllowance(req.params.staffId, req.body));
export const patchEndAllowance = wrapMutateById('END_ALLOWANCE', svc.getAllowanceSchoolId, req => svc.endAllowance(req.params.id, req.body.effectiveTo));
export const getDeductions = wrap(req => svc.listDeductions(req.params.staffId));
export const postDeduction = wrapStaffScoped('CREATE_DEDUCTION', req => svc.createDeduction(req.params.staffId, req.body));
export const patchEndDeduction = wrapMutateById('END_DEDUCTION', svc.getDeductionSchoolId, req => svc.endDeduction(req.params.id, req.body.effectiveTo));

// Global statutory tables
export const getStatutoryDeductions = wrap(() => svc.listStatutoryDeductions());
export const postStatutoryDeduction = wrapCreate('CREATE_STATUTORY_DEDUCTION', req => svc.createStatutoryDeduction(req.body));
export const getTaxRules = wrap(() => svc.listTaxRules());
export const postTaxRule = wrapCreate('CREATE_TAX_RULE', req => svc.createTaxRule(req.body));
export const getSsnitRules = wrap(() => svc.listSsnitRules());
export const postSsnitRule = wrapCreate('CREATE_SSNIT_RULE', req => svc.createSsnitRule(req.body));

// Periods
export const getPeriods = wrap(req => svc.listPeriods(req.schoolId || ''));
export const postPeriod = wrapCreate('CREATE_PERIOD', req => svc.createPeriod(req.schoolId || '', req.body));

// Bonuses
export const getBonuses = wrap(req => svc.listBonuses(req.params.staffId));
export const postBonus = wrapStaffScoped('CREATE_BONUS', req => svc.createBonus(req.params.staffId, req.userId || '', req.body));

// Loans
export const getLoans = wrap(req => svc.listLoans(req.schoolId || ''));
export const postLoan = wrapStaffScoped('CREATE_LOAN', req => svc.createLoan(req.params.staffId, req.schoolId || '', req.body));
export const getLoanRepayments = wrap(req => svc.listLoanRepayments(req.params.id));
export const postLoanRepayment = wrapMutateById('RECORD_LOAN_REPAYMENT', svc.getLoanSchoolId, req => svc.recordLoanRepayment(req.params.id, req.body));

// Reimbursements
export const getReimbursements = wrap(req => svc.listReimbursements(req.schoolId || ''));
export const postReimbursement = wrapStaffScoped('CREATE_REIMBURSEMENT', req => svc.createReimbursement(req.params.staffId, req.schoolId || '', req.body));
export const patchReimbursementStatus = wrapMutateById('DECIDE_REIMBURSEMENT', svc.getReimbursementSchoolId, req => svc.decideReimbursement(req.params.id, req.userId || '', req.body.status));

// Payroll Run Engine
export const getRuns = wrap(req => svc.listRuns(req.schoolId || ''));
export const postRunPayroll = wrapCreate('RUN_PAYROLL', req => svc.runPayroll(req.schoolId || '', req.body.periodId, req.userId || ''));
export const patchApproveRun = wrapMutateById('APPROVE_RUN', svc.getRunSchoolId, req => svc.approveRun(req.params.id, req.userId || ''));
export const patchReverseRun = wrapMutateById('REVERSE_RUN', svc.getRunSchoolId, req => svc.reverseRun(req.params.id));

// Payslips & Payments
export const getPayslips = wrap(req => svc.listPayslips(req.params.id));
export const getPayslipItems = wrap(req => svc.listPayslipItems(req.params.id));
export const getPayslipPayments = wrap(req => svc.listPayments(req.params.id));
export const postPayment = wrapMutateById('RECORD_PAYMENT', svc.getPayslipSchoolId, req => svc.recordPayment(req.params.id, req.body));

// Payment Batches
export const getBatches = wrap(req => svc.listBatches(req.schoolId || ''));
export const postBatch = wrapCreate('CREATE_BATCH', req => svc.createBatch(req.schoolId || '', req.userId || '', req.body));

// Audit
export const getPayrollAuditLog = wrap(req => svc.listPayrollAudit(req.schoolId || ''));
