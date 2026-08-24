import {
  Request,
  Response,
  NextFunction,
} from 'express';
import { withTenantContext } from '../lib/tenantContext';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Error]', err.message);

  withTenantContext(
    undefined,
    tx => tx.systemErrorLog.create({
      data: {
        error_type: err.name || 'Error',
        message: err.message || 'Unknown error',
        stack_trace: err.stack || null,
        module_name: req.path,
      },
    })
  ).catch(e => {
    console.error(
      '[ErrorLog write failed]',
      e.message
    );
  });

  res.status(500).json({
    error:
      err.message ||
      'Internal server error',
  });
}
