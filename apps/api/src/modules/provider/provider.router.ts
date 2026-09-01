import { Router } from 'express';
import {
  createRateLimiter,
} from '../../middleware/rateLimiter';
import {
  authenticateProvider,
} from '../../middleware/authenticateProvider';
import {
  isTrustedProviderBrowserRequest,
} from '../../lib/providerBrowserTransport';
import * as ctrl from './provider.controller';

export const providerRouter = Router();

providerRouter.use(
  (req, res, next) => {
    if (
      !isTrustedProviderBrowserRequest(
        req
      )
    ) {
      return res.status(403).json({
        error:
          'Provider browser request was not trusted',
      });
    }

    next();
  }
);

const providerIpLimiter =
  createRateLimiter({
    name: 'provider-auth-ip',
    windowMs: 5 * 60_000,
    max: 12,
    key: req =>
      `ip:${
        req.ip ||
        req.socket?.remoteAddress ||
        'unknown'
      }`,
  });

const providerIdentityLimiter =
  createRateLimiter({
    name: 'provider-auth-identity',
    windowMs: 5 * 60_000,
    max: 6,
    key: req =>
      `login:${
        String(
          req.body?.loginName ||
          'anonymous'
        )
          .trim()
          .toLowerCase()
      }`,
  });

const delegateLimiter =
  createRateLimiter({
    name: 'provider-delegate-accept',
    windowMs: 10 * 60_000,
    max: 10,
    key: req =>
      `ip:${
        req.ip ||
        req.socket?.remoteAddress ||
        'unknown'
      }`,
  });

providerRouter.post(
  '/auth/registration/options',
  providerIpLimiter,
  providerIdentityLimiter,
  ctrl.providerRegistrationOptions
);

providerRouter.post(
  '/auth/registration/verify',
  providerIpLimiter,
  providerIdentityLimiter,
  ctrl.providerRegistrationVerify
);

providerRouter.post(
  '/auth/options',
  providerIpLimiter,
  providerIdentityLimiter,
  ctrl.providerLoginOptions
);

providerRouter.post(
  '/auth/verify',
  providerIpLimiter,
  providerIdentityLimiter,
  ctrl.providerLoginVerify
);

providerRouter.post(
  '/credential-reset/request',
  providerIpLimiter,
  ctrl.providerCredentialResetRequest
);

providerRouter.get(
  '/credential-reset/pending',
  authenticateProvider,
  ctrl.providerCredentialResetPending
);

providerRouter.post(
  '/credential-reset/:requestId/decide',
  authenticateProvider,
  ctrl.providerCredentialResetDecide
);

providerRouter.post(
  '/delegate/accept/start',
  delegateLimiter,
  ctrl.delegateAcceptanceStart
);

providerRouter.post(
  '/delegate/accept/complete',
  delegateLimiter,
  ctrl.delegateAcceptanceComplete
);

providerRouter.get(
  '/me',
  authenticateProvider,
  ctrl.providerMe
);

providerRouter.post(
  '/logout',
  authenticateProvider,
  ctrl.providerLogout
);

providerRouter.get(
  '/schoolx/institutions',
  authenticateProvider,
  ctrl.providerSchools
);

providerRouter.post(
  '/schoolx/institutions',
  authenticateProvider,
  ctrl.providerCreateSchool
);

providerRouter.post(
  '/schoolx/institutions/:schoolId/delegate',
  authenticateProvider,
  ctrl.providerNominateDelegate
);

providerRouter.post(
  '/schoolx/institutions/:schoolId/approve',
  authenticateProvider,
  ctrl.providerApproveSchool
);
