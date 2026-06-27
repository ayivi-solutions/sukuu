import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { logAuditEvent } from '../system/system.service';
import * as svc from './admission.service';

async function assertOwnership(req: AuthRequest, applicantId: string | undefined): Promise<boolean> {
  if (!applicantId || !req.schoolId) return false;
  return svc.verifyApplicantInSchool(applicantId, req.schoolId);
}
const fromParamsAid = async (req: AuthRequest) => req.params.applicantId;

function wrap(resolveAid: (req: AuthRequest) => Promise<string | undefined>, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const aid = await resolveAid(req);
      if (!(await assertOwnership(req, aid))) return res.status(403).json({ error: 'Not authorized for this applicant record' });
      res.json(await fn(req));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapNoCheck(fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try { res.json(await fn(req)); } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapCreate(action: string, resolveAid: (req: AuthRequest) => Promise<string | undefined>, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const aid = await resolveAid(req);
      if (!(await assertOwnership(req, aid))) return res.status(403).json({ error: 'Not authorized for this applicant record' });
      const result = await fn(req);
      if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', action, 'admission', result?.id);
      res.status(201).json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapCreateNoCheck(action: string, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const result = await fn(req);
      if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', action, 'admission', result?.id);
      res.status(201).json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapMutate(action: string, resolveAid: (req: AuthRequest) => Promise<string | undefined>, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const aid = await resolveAid(req);
      if (!(await assertOwnership(req, aid))) return res.status(403).json({ error: 'Not authorized for this applicant record' });
      const result = await fn(req);
      if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', action, 'admission', req.params.id || req.params.applicantId);
      res.json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}
function wrapMutateNoCheck(action: string, fn: (req: AuthRequest) => Promise<any>) {
  return async (req: AuthRequest, res: Response) => {
    try {
      const result = await fn(req);
      if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', action, 'admission', req.params.id);
      res.json(result);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  };
}

export const getApplicants = wrapNoCheck(req => svc.listApplicants(req.schoolId || ''));
export const getApplicant = wrap(fromParamsAid, req => svc.getApplicant(req.params.applicantId));
export const postApplicant = wrapCreateNoCheck('CREATE_APPLICANT', req => svc.createApplicant(req.schoolId || '', req.body));
export const patchApplicant = wrapMutate('UPDATE_APPLICANT', fromParamsAid, req => svc.updateApplicant(req.params.applicantId, req.body, req.userId || ''));
export const patchArchiveApplicant = wrapMutate('ARCHIVE_APPLICANT', fromParamsAid, req => svc.archiveApplicant(req.params.applicantId, req.userId || '', req.body?.reason));

export const getInterviews = wrap(fromParamsAid, req => svc.listInterviews(req.params.applicantId));
export const postInterview = wrapCreate('CREATE_INTERVIEW', fromParamsAid, req => svc.createInterview(req.params.applicantId, req.body));
export const patchInterview = wrapMutate('UPDATE_INTERVIEW', fromParamsAid, req => svc.updateInterview(req.params.id, req.body));

export const getOffers = wrap(fromParamsAid, req => svc.listOffers(req.params.applicantId));
export const postOffer = wrapCreate('CREATE_OFFER', fromParamsAid, req => svc.createOffer(req.params.applicantId, req.schoolId || '', req.body));
export const patchOfferStatus = wrapMutate('UPDATE_OFFER_STATUS', fromParamsAid, req => svc.updateOfferStatus(req.params.id, req.body.status));

export const getStages = wrap(fromParamsAid, req => svc.listStages(req.params.applicantId));
export const postStage = wrapCreate('CREATE_STAGE', fromParamsAid, req => svc.createStage(req.params.applicantId, req.body));
export const patchStage = wrapMutate('UPDATE_STAGE', fromParamsAid, req => svc.updateStage(req.params.id, req.body));

export const getDocuments = wrap(fromParamsAid, req => svc.listDocuments(req.params.applicantId));
export const postDocument = wrapCreate('CREATE_APPLICATION_DOCUMENT', fromParamsAid, req => svc.createDocument(req.params.applicantId, req.body));
export const patchVerifyDocument = wrapMutate('VERIFY_APPLICATION_DOCUMENT', fromParamsAid, req => svc.verifyDocument(req.params.id, req.userId || '', !!req.body.isVerified));

export const getReviews = wrap(fromParamsAid, req => svc.listReviews(req.params.applicantId));
export const postReview = wrapCreate('CREATE_REVIEW', fromParamsAid, req => svc.createReview(req.params.applicantId, req.userId || '', req.body));

export const getStatusHistory = wrap(fromParamsAid, req => svc.listStatusHistory(req.params.applicantId));

export const getDecisions = wrap(fromParamsAid, req => svc.listDecisions(req.params.applicantId));
export const postDecision = wrapCreate('CREATE_DECISION', fromParamsAid, req => svc.createDecision(req.params.applicantId, req.userId || '', req.body));

export const getBatches = wrapNoCheck(req => svc.listBatches(req.schoolId || ''));
export const postBatch = wrapCreateNoCheck('CREATE_BATCH', req => svc.createBatch(req.schoolId || '', req.body));
export const patchBatch = async (req: AuthRequest, res: Response) => {
  try {
    const sid = await svc.getBatchSchoolId(req.params.id);
    if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this batch' });
    const result = await svc.updateBatch(req.params.id, req.body);
    if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'UPDATE_BATCH', 'admission', req.params.id);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getWaitlist = wrapNoCheck(req => svc.listWaitlist(req.schoolId || ''));
export const postWaitlistEntry = wrapCreate('CREATE_WAITLIST_ENTRY', fromParamsAid, req => svc.createWaitlistEntry(req.params.applicantId, req.schoolId || '', req.body));
export const patchWaitlistStatus = async (req: AuthRequest, res: Response) => {
  try {
    const sid = await svc.getWaitlistSchoolId(req.params.id);
    if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this waitlist entry' });
    const result = await svc.updateWaitlistStatus(req.params.id, req.body.status);
    if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'UPDATE_WAITLIST_STATUS', 'admission', req.params.id);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getRequirements = wrapNoCheck(req => svc.listRequirements(req.schoolId || ''));
export const postRequirement = wrapCreateNoCheck('CREATE_REQUIREMENT', req => svc.createRequirement(req.schoolId || '', req.body));
export const patchRequirement = async (req: AuthRequest, res: Response) => {
  try {
    const sid = await svc.getRequirementSchoolId(req.params.id);
    if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this requirement' });
    const result = await svc.updateRequirement(req.params.id, req.body);
    if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'UPDATE_REQUIREMENT', 'admission', req.params.id);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};
export const patchArchiveRequirement = async (req: AuthRequest, res: Response) => {
  try {
    const sid = await svc.getRequirementSchoolId(req.params.id);
    if (!sid || sid !== req.schoolId) return res.status(403).json({ error: 'Not authorized for this requirement' });
    const result = await svc.archiveRequirement(req.params.id);
    if (req.schoolId) await logAuditEvent(req.schoolId, req.userId || '', 'ARCHIVE_REQUIREMENT', 'admission', req.params.id);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const postConvert = wrapCreate('CONVERT_TO_STUDENT', fromParamsAid, req => svc.convertApplicantToStudent(req.params.applicantId, req.body.offerId, req.userId || ''));
