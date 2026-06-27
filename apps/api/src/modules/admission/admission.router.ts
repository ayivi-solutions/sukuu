import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './admission.controller';

export const admissionRouter = Router();

admissionRouter.get('/', authenticate, ctrl.getApplicants);
admissionRouter.post('/', authenticate, ctrl.postApplicant);
admissionRouter.get('/batches', authenticate, ctrl.getBatches);
admissionRouter.post('/batches', authenticate, ctrl.postBatch);
admissionRouter.patch('/batches/:id', authenticate, ctrl.patchBatch);
admissionRouter.get('/waitlist', authenticate, ctrl.getWaitlist);
admissionRouter.patch('/waitlist/:id', authenticate, ctrl.patchWaitlistStatus);
admissionRouter.get('/requirements', authenticate, ctrl.getRequirements);
admissionRouter.post('/requirements', authenticate, ctrl.postRequirement);
admissionRouter.patch('/requirements/:id', authenticate, ctrl.patchRequirement);
admissionRouter.patch('/requirements/:id/archive', authenticate, ctrl.patchArchiveRequirement);

admissionRouter.get('/:applicantId', authenticate, ctrl.getApplicant);
admissionRouter.patch('/:applicantId', authenticate, ctrl.patchApplicant);
admissionRouter.patch('/:applicantId/archive', authenticate, ctrl.patchArchiveApplicant);
admissionRouter.post('/:applicantId/convert', authenticate, ctrl.postConvert);

admissionRouter.get('/:applicantId/interviews', authenticate, ctrl.getInterviews);
admissionRouter.post('/:applicantId/interviews', authenticate, ctrl.postInterview);
admissionRouter.patch('/:applicantId/interviews/:id', authenticate, ctrl.patchInterview);

admissionRouter.get('/:applicantId/offers', authenticate, ctrl.getOffers);
admissionRouter.post('/:applicantId/offers', authenticate, ctrl.postOffer);
admissionRouter.patch('/:applicantId/offers/:id', authenticate, ctrl.patchOfferStatus);

admissionRouter.get('/:applicantId/stages', authenticate, ctrl.getStages);
admissionRouter.post('/:applicantId/stages', authenticate, ctrl.postStage);
admissionRouter.patch('/:applicantId/stages/:id', authenticate, ctrl.patchStage);

admissionRouter.get('/:applicantId/documents', authenticate, ctrl.getDocuments);
admissionRouter.post('/:applicantId/documents', authenticate, ctrl.postDocument);
admissionRouter.patch('/:applicantId/documents/:id/verify', authenticate, ctrl.patchVerifyDocument);

admissionRouter.get('/:applicantId/reviews', authenticate, ctrl.getReviews);
admissionRouter.post('/:applicantId/reviews', authenticate, ctrl.postReview);

admissionRouter.get('/:applicantId/status-history', authenticate, ctrl.getStatusHistory);

admissionRouter.get('/:applicantId/decisions', authenticate, ctrl.getDecisions);
admissionRouter.post('/:applicantId/decisions', authenticate, ctrl.postDecision);

admissionRouter.post('/:applicantId/waitlist', authenticate, ctrl.postWaitlistEntry);
