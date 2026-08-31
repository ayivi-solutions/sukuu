import { Response } from 'express';
import type {
  Request,
} from 'express';
import type {
  ProviderAuthRequest,
} from '../../middleware/authenticateProvider';
import {
  beginProviderLogin,
  beginProviderRegistration,
  completeProviderLogin,
  completeProviderRegistration,
} from './providerAuth.service';
import {
  approveProviderSchool,
  createProviderSchool,
  listProviderSchools,
  nominateProviderDelegate,
} from './providerSchool.service';
import {
  beginDelegateAcceptance,
  completeDelegateAcceptance,
} from './providerDelegate.service';
import {
  clearProviderAuthCookie,
  writeProviderAuthCookie,
} from '../../lib/providerBrowserTransport';
import {
  withProviderContext,
} from '../../lib/providerContext';

function ipAddress(req: Request) {
  return (
    req.ip ||
    req.socket?.remoteAddress ||
    null
  );
}

export async function providerRegistrationOptions(
  req: Request,
  res: Response
) {
  try {
    const result =
      await beginProviderRegistration(
        req.body?.loginName,
        req.body?.bootstrapToken
      );

    res.json(result);
  } catch {
    res.status(400).json({
      error:
        'Provider enrollment authorization failed',
    });
  }
}

export async function providerRegistrationVerify(
  req: Request,
  res: Response
) {
  try {
    const result =
      await completeProviderRegistration(
        req.body?.loginName,
        req.body?.bootstrapToken,
        req.body?.challengeId,
        req.body?.response
      );

    res.json(result);
  } catch {
    res.status(400).json({
      error:
        'Provider security-key enrollment failed',
    });
  }
}

export async function providerLoginOptions(
  req: Request,
  res: Response
) {
  try {
    const result =
      await beginProviderLogin(
        req.body?.loginName
      );

    res.json(result);
  } catch {
    res.status(401).json({
      error:
        'Provider authentication failed',
    });
  }
}

export async function providerLoginVerify(
  req: Request,
  res: Response
) {
  try {
    const result =
      await completeProviderLogin(
        req.body?.loginName,
        req.body?.challengeId,
        req.body?.response,
        {
          ipAddress:
            ipAddress(req),
          userAgent:
            req.headers[
              'user-agent'
            ] || null,
        }
      );

    writeProviderAuthCookie(
      res,
      result.accessToken
    );

    res.json({
      success: true,
      expiresAt:
        result.expiresAt,
      provider:
        result.provider,
    });
  } catch {
    res.status(401).json({
      error:
        'Provider authentication failed',
    });
  }
}

export async function providerLogout(
  _req: ProviderAuthRequest,
  res: Response
) {
  try {
    await withProviderContext(
      undefined,
      tx =>
        tx.$queryRaw`
          SELECT
            system.provider_session_revoke()
        `
    );

    clearProviderAuthCookie(
      res
    );

    res.json({
      success: true,
    });
  } catch {
    res.status(500).json({
      error:
        'Provider sign-out could not be completed',
    });
  }
}

export async function providerMe(
  req: ProviderAuthRequest,
  res: Response
) {
  res.json({
    provider: {
      id: req.providerId,
      authority:
        req.providerAuthority,
      assurance:
        req.providerAssurance,
      sessionId:
        req.providerSessionId,
    },
  });
}

export async function providerSchools(
  _req: ProviderAuthRequest,
  res: Response
) {
  try {
    res.json(
      await listProviderSchools()
    );
  } catch {
    res.status(500).json({
      error:
        'Provider institution register could not be loaded',
    });
  }
}

export async function providerCreateSchool(
  req: ProviderAuthRequest,
  res: Response
) {
  try {
    const result =
      await createProviderSchool(
        req.body || {}
      );

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({
      error:
        error?.message ||
        'Institution creation failed',
    });
  }
}

export async function providerNominateDelegate(
  req: ProviderAuthRequest,
  res: Response
) {
  try {
    const result =
      await nominateProviderDelegate(
        req.params.schoolId,
        req.body || {}
      );

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({
      error:
        error?.message ||
        'Delegate nomination failed',
    });
  }
}

export async function providerApproveSchool(
  req: ProviderAuthRequest,
  res: Response
) {
  try {
    const result =
      await approveProviderSchool(
        req.params.schoolId,
        String(
          req.body?.reason || ''
        )
      );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      error:
        error?.message ||
        'Institution verification approval failed',
    });
  }
}

export async function delegateAcceptanceStart(
  req: Request,
  res: Response
) {
  try {
    res.json(
      await beginDelegateAcceptance(
        req.body?.invitationToken
      )
    );
  } catch {
    res.status(400).json({
      error:
        'Delegate invitation is invalid or expired',
    });
  }
}

export async function delegateAcceptanceComplete(
  req: Request,
  res: Response
) {
  try {
    res.json(
      await completeDelegateAcceptance(
        req.body?.invitationToken,
        req.body?.password,
        req.body?.totpCode
      )
    );
  } catch (error: any) {
    res.status(400).json({
      error:
        error?.message ||
        'Delegate activation failed',
    });
  }
}
