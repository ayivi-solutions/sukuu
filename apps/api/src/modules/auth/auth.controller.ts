import { Request, Response } from 'express';
import {
  loginUser,
  refreshAccessToken,
  logoutSession,
  changeOwnPassword,
} from './auth.service';
import { getMyModuleAccess } from '../../lib/roleGrants';
import {
  activateCredentialWithToken,
} from './credential.service';
import { AuthRequest } from '../../middleware/authenticate';
import {
  getMfaStatus,
  beginTotpEnrollment,
  verifyTotpEnrollment,
  verifyTotpStepUp,
  beginMfaRecovery,
  verifyMfaRecovery,
} from './mfa.service';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await loginUser(email, password, {
      ipAddress: req.ip || null,
      userAgent: req.get('user-agent') || null,
    });

    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Login failed' });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });
    const result = await refreshAccessToken(refreshToken);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Token refresh failed' });
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });
    await logoutSession(req.userId, req.sessionId);
    res.json({ success: true, message: 'Logged out' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Logout failed' });
  }
}

export async function me(req: AuthRequest, res: Response) {
  res.json({
    userId: req.userId,
    schoolId: req.schoolId,
    roleKey: req.roleKey,
    staffId: req.staffId,
    sessionId: req.sessionId,
  });
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword required' });
    }
    if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });

    const result = await changeOwnPassword(
      req.userId,
      currentPassword,
      newPassword,
      req.sessionId
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Could not change password' });
  }
}

export async function myAccess(req: AuthRequest, res: Response) {
  try {
    if (!req.userId || !req.schoolId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const access = await getMyModuleAccess(req.userId, req.schoolId);
    res.json(access);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}


export async function activateCredential(
  req: Request,
  res: Response
) {
  try {
    const {
      activationToken,
      newPassword,
    } = req.body;

    if (
      !activationToken ||
      !newPassword
    ) {
      return res.status(400).json({
        error:
          'activationToken and newPassword required',
      });
    }

    const result =
      await activateCredentialWithToken(
        activationToken,
        newPassword
      );

    res.json(result);

  } catch (err: any) {

    res.status(400).json({
      error:
        err.message ||
        'Could not establish credential',
    });

  }
}


function mfaContext(
  req: AuthRequest
) {

  if (
    !req.userId ||
    !req.schoolId ||
    !req.sessionId ||
    !req.roleKey
  ) {

    throw new Error(
      'A valid authenticated session is required'
    );

  }


  return {
    userId:
      req.userId,
    schoolId:
      req.schoolId,
    sessionId:
      req.sessionId,
    role:
      req.roleKey,
  };

}


export async function mfaStatus(
  req: AuthRequest,
  res: Response
) {

  try {

    const result =
      await getMfaStatus(
        mfaContext(req)
      );


    res.json(
      result
    );

  } catch (err: any) {

    res.status(400).json({
      error:
        err.message ||
        'Could not determine MFA status',
    });

  }

}


export async function mfaEnrollStart(
  req: AuthRequest,
  res: Response
) {

  try {

    const result =
      await beginTotpEnrollment(
        mfaContext(req)
      );


    res.json(
      result
    );

  } catch (err: any) {

    res.status(400).json({
      error:
        err.message ||
        'Could not begin MFA enrollment',
    });

  }

}


export async function mfaEnrollVerify(
  req: AuthRequest,
  res: Response
) {

  try {

    const code =
      String(
        req.body?.code ||
        ''
      )
        .trim();


    if (
      !/^\d{6}$/.test(
        code
      )
    ) {

      return res
        .status(400)
        .json({
          error:
            'A six-digit authenticator code is required',
        });

    }


    const result =
      await verifyTotpEnrollment(
        mfaContext(req),
        code
      );


    res.json(
      result
    );

  } catch (err: any) {

    res.status(400).json({
      error:
        err.message ||
        'Could not verify MFA enrollment',
    });

  }

}


export async function mfaStepUpVerify(
  req: AuthRequest,
  res: Response
) {

  try {

    const code =
      String(
        req.body?.code ||
        ''
      )
        .trim();


    if (
      !/^\d{6}$/.test(
        code
      )
    ) {

      return res
        .status(400)
        .json({
          error:
            'A six-digit authenticator code is required',
        });

    }


    const result =
      await verifyTotpStepUp(
        mfaContext(req),
        code
      );


    res.json(
      result
    );

  } catch (err: any) {

    res.status(400).json({
      error:
        err.message ||
        'Step-up authentication failed',
    });

  }

}


export async function mfaRecoveryStart(
  req: Request,
  res: Response
) {

  try {

    const email =
      String(
        req.body?.email ||
        ''
      ).trim();

    const password =
      String(
        req.body?.password ||
        ''
      );

    const recoveryToken =
      String(
        req.body?.recoveryToken ||
        ''
      ).trim();


    if (
      !email ||
      !password ||
      recoveryToken.length < 32 ||
      recoveryToken.length > 256
    ) {

      return res
        .status(400)
        .json({
          error:
            'MFA recovery authorization failed',
        });

    }


    const result =
      await beginMfaRecovery(
        email,
        password,
        recoveryToken
      );


    res.json(
      result
    );

  } catch {

    res.status(400).json({
      error:
        'MFA recovery authorization failed',
    });

  }

}


export async function mfaRecoveryVerify(
  req: Request,
  res: Response
) {

  try {

    const email =
      String(
        req.body?.email ||
        ''
      ).trim();

    const recoveryToken =
      String(
        req.body?.recoveryToken ||
        ''
      ).trim();

    const code =
      String(
        req.body?.code ||
        ''
      ).trim();


    if (
      !email ||
      recoveryToken.length < 32 ||
      recoveryToken.length > 256 ||
      !/^\d{6}$/.test(
        code
      )
    ) {

      return res
        .status(400)
        .json({
          error:
            'MFA recovery verification failed',
        });

    }


    const result =
      await verifyMfaRecovery(
        email,
        recoveryToken,
        code
      );


    res.json(
      result
    );

  } catch {

    res.status(400).json({
      error:
        'MFA recovery verification failed',
    });

  }

}
