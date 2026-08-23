import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireModuleAccess } from '../../middleware/requireModuleAccess';
import * as ctrl from './admission.controller';

export const admissionRouter = Router();
const R = requireModuleAccess('admission', 'read');
const F = requireModuleAccess('admission', 'full');

admissionRouter.get('/', authenticate, R, ctrl.getApplicants);
admissionRouter.post('/', authenticate, F, ctrl.postApplicant);
admissionRouter.get('/batches', authenticate, R, ctrl.getBatches);
admissionRouter.post('/batches', authenticate, F, ctrl.postBatch);
admissionRouter.patch('/batches/:id', authenticate, F, ctrl.patchBatch);
admissionRouter.get('/waitlist', authenticate, R, ctrl.getWaitlist);
admissionRouter.patch('/waitlist/:id', authenticate, F, ctrl.patchWaitlistStatus);
admissionRouter.get('/requirements', authenticate, R, ctrl.getRequirements);
admissionRouter.post('/requirements', authenticate, F, ctrl.postRequirement);
admissionRouter.patch('/requirements/:id', authenticate, F, ctrl.patchRequirement);
admissionRouter.patch('/requirements/:id/archive', authenticate, F, ctrl.patchArchiveRequirement);

admissionRouter.get('/:applicantId', authenticate, R, ctrl.getApplicant);
admissionRouter.patch('/:applicantId', authenticate, F, ctrl.patchApplicant);
admissionRouter.patch('/:applicantId/archive', authenticate, F, ctrl.patchArchiveApplicant);
admissionRouter.post('/:applicantId/convert', authenticate, F, ctrl.postConvert);

admissionRouter.get('/:applicantId/interviews', authenticate, R, ctrl.getInterviews);
admissionRouter.post('/:applicantId/interviews', authenticate, F, ctrl.postInterview);
admissionRouter.patch('/:applicantId/interviews/:id', authenticate, F, ctrl.patchInterview);

admissionRouter.get('/:applicantId/offers', authenticate, R, ctrl.getOffers);
admissionRouter.post('/:applicantId/offers', authenticate, F, ctrl.postOffer);
admissionRouter.patch('/:applicantId/offers/:id', authenticate, F, ctrl.patchOfferStatus);

admissionRouter.get('/:applicantId/stages', authenticate, R, ctrl.getStages);
admissionRouter.post('/:applicantId/stages', authenticate, F, ctrl.postStage);
admissionRouter.patch('/:applicantId/stages/:id', authenticate, F, ctrl.patchStage);

admissionRouter.get('/:applicantId/documents', authenticate, R, ctrl.getDocuments);
admissionRouter.post('/:applicantId/documents', authenticate, F, ctrl.postDocument);
admissionRouter.patch('/:applicantId/documents/:id/verify', authenticate, F, ctrl.patchVerifyDocument);

admissionRouter.get('/:applicantId/reviews', authenticate, R, ctrl.getReviews);
admissionRouter.post('/:applicantId/reviews', authenticate, F, ctrl.postReview);

admissionRouter.get('/:applicantId/status-history', authenticate, R, ctrl.getStatusHistory);

admissionRouter.get('/:applicantId/decisions', authenticate, R, ctrl.getDecisions);
admissionRouter.post('/:applicantId/decisions', authenticate, F, ctrl.postDecision);

admissionRouter.post('/:applicantId/waitlist', authenticate, F, ctrl.postWaitlistEntry);
