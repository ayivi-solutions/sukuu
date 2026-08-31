import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { getSchoolProfile, updateSchoolProfile, getSchoolSettings, listAccreditations, createAccreditation, archiveAccreditation, listSchoolAuditLog, logSchoolAudit, listContacts, createContact, updateContact, getBranding, upsertBranding, listCampuses, createCampus, toggleCampus, getTermPolicy, upsertTermPolicy, listDocuments, createDocument, getSubscription, updateSubscriptionStatus, upsertSetting, updateCampus, updateAccreditation, archiveSetting, getSchoolSummary, getSchoolLifecycle, transitionSchoolLifecycle, InvalidSchoolLifecycleTransitionError, SchoolMakerCheckerError, ProviderSchoolAuthorityRequiredError, SchoolLifecycleConflictError, type SchoolLifecycleStatus } from './school.service';
import { listSchoolCapabilities } from '../../lib/schoolAuthorization';

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const school = await getSchoolProfile(req.schoolId);
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json(school);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch school profile' });
  }
}

export async function patchProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const updated = await updateSchoolProfile(req.schoolId, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update school profile' });
  }
}

export async function getSettings(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const settings = await getSchoolSettings(req.schoolId);
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch school settings' });
  }
}

export async function getAccreditations(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    res.json(await listAccreditations(req.schoolId));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch accreditations' });
  }
}

export async function postAccreditation(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const created = await createAccreditation(req.schoolId, req.body);
    await logSchoolAudit(req.schoolId, `CREATE accreditation: ${req.body.authority}`, req.userId || '');
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create accreditation' });
  }
}

export async function patchArchiveAccreditation(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const archived = await archiveAccreditation(req.schoolId, req.params.accreditationId);
    if (!archived) return res.status(404).json({ error: 'Record not found' });
    if (req.schoolId) await logSchoolAudit(req.schoolId, `ARCHIVE accreditation: ${req.params.accreditationId}`, req.userId || '');
    res.json({ id: archived.id, archived: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to archive accreditation' });
  }
}

export async function getSchoolAuditLog(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    res.json(await listSchoolAuditLog(req.schoolId));
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit log' });
  }
}

export async function getContacts(req: AuthRequest, res: Response) {
  try { res.json(await listContacts(req.schoolId || '')); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function postContact(req: AuthRequest, res: Response) {
  try {
    const r = await createContact(req.schoolId || '', req.body);
    if (req.schoolId) await logSchoolAudit(req.schoolId, `CREATE contact: ${req.body.contactType}`, req.userId || '');
    res.status(201).json(r);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function patchContact(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const r = await updateContact(req.schoolId, req.params.id, req.body);
    if (!r) return res.status(404).json({ error: 'Record not found' });
    if (req.schoolId) await logSchoolAudit(req.schoolId, `UPDATE contact: ${req.params.id}`, req.userId || '');
    res.json(r);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function getBrandingHandler(req: AuthRequest, res: Response) {
  try { res.json(await getBranding(req.schoolId || '')); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function putBranding(req: AuthRequest, res: Response) {
  try {
    const r = await upsertBranding(req.schoolId || '', req.body);
    if (req.schoolId) await logSchoolAudit(req.schoolId, 'UPDATE branding', req.userId || '');
    res.json(r);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function getCampuses(req: AuthRequest, res: Response) {
  try { res.json(await listCampuses(req.schoolId || '')); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function postCampus(req: AuthRequest, res: Response) {
  try {
    const r = await createCampus(req.schoolId || '', req.body);
    if (req.schoolId) await logSchoolAudit(req.schoolId, `CREATE campus: ${req.body.name}`, req.userId || '');
    res.status(201).json(r);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function patchCampus(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const r = await toggleCampus(req.schoolId, req.params.id, !!req.body.isActive);
    if (!r) return res.status(404).json({ error: 'Record not found' });
    if (req.schoolId) await logSchoolAudit(req.schoolId, `TOGGLE campus: ${req.params.id}`, req.userId || '');
    res.json(r);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function getTermPolicyHandler(req: AuthRequest, res: Response) {
  try { res.json(await getTermPolicy(req.schoolId || '')); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function putTermPolicy(req: AuthRequest, res: Response) {
  try {
    const r = await upsertTermPolicy(req.schoolId || '', req.body);
    if (req.schoolId) await logSchoolAudit(req.schoolId, 'UPDATE term policy', req.userId || '');
    res.json(r);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function getDocuments(req: AuthRequest, res: Response) {
  try { res.json(await listDocuments(req.schoolId || '')); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function postDocument(req: AuthRequest, res: Response) {
  try {
    const r = await createDocument(req.schoolId || '', { ...req.body, uploadedBy: req.userId || '' });
    if (req.schoolId) await logSchoolAudit(req.schoolId, `UPLOAD document: ${req.body.documentType}`, req.userId || '');
    res.status(201).json(r);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function getSubscriptionHandler(req: AuthRequest, res: Response) {
  try { res.json(await getSubscription(req.schoolId || '')); }
  catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function patchSubscription(req: AuthRequest, res: Response) {
  try {
    const r = await updateSubscriptionStatus(req.schoolId || '', req.body.status);
    if (req.schoolId) await logSchoolAudit(req.schoolId, `UPDATE subscription status: ${req.body.status}`, req.userId || '');
    res.json(r);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function putSetting(req: AuthRequest, res: Response) {
  try {
    const r = await upsertSetting(req.schoolId || '', req.body.key, req.body.value, req.userId || '');
    if (req.schoolId) await logSchoolAudit(req.schoolId, `SET setting: ${req.body.key}`, req.userId || '');
    res.json(r);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}

export async function patchCampusDetails(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const r = await updateCampus(req.schoolId, req.params.id, req.body);
    if (!r) return res.status(404).json({ error: 'Record not found' });
    if (req.schoolId) await logSchoolAudit(req.schoolId, `UPDATE campus: ${req.params.id}`, req.userId || '');
    res.json(r);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
export async function patchAccreditation(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const r = await updateAccreditation(req.schoolId, req.params.accreditationId, req.body);
    if (!r) return res.status(404).json({ error: 'Record not found' });
    if (req.schoolId) await logSchoolAudit(req.schoolId, `UPDATE accreditation: ${req.params.accreditationId}`, req.userId || '');
    res.json(r);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}

export async function patchArchiveSetting(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const archived = await archiveSetting(req.schoolId, req.params.id);
    if (!archived) return res.status(404).json({ error: 'Record not found' });
    res.json(archived);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}

export async function getSummary(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const summary = await getSchoolSummary(req.schoolId);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch school summary' });
  }
}


export async function getCapabilities(req: AuthRequest, res: Response) {
  try {
    res.json(await listSchoolCapabilities({ userId: req.userId, schoolId: req.schoolId }));
  } catch {
    res.status(500).json({ error: 'Failed to resolve SchoolX capabilities' });
  }
}

export async function getLifecycle(req: AuthRequest, res: Response) {
  try {
    if (!req.schoolId) return res.status(400).json({ error: 'No school associated with this user' });
    const lifecycle = await getSchoolLifecycle(req.schoolId);
    if (!lifecycle) return res.status(404).json({ error: 'School not found' });
    res.json(lifecycle);
  } catch {
    res.status(500).json({ error: 'Failed to fetch institution lifecycle' });
  }
}

async function executeLifecycle(
  req: AuthRequest,
  res: Response,
  newStatus: SchoolLifecycleStatus,
  action: string
) {
  try {
    if (!req.schoolId || !req.userId) {
      return res.status(400).json({ error: 'Complete authenticated school context is required' });
    }
    const updated = await transitionSchoolLifecycle({
      schoolId: req.schoolId,
      actorId: req.userId,
      actorRole: req.roleKey,
      authorityPlane: 'TENANT',
      newStatus,
      action,
      reason: String(req.body?.reason || ''),
    });
    if (!updated) return res.status(404).json({ error: 'School not found' });
    res.json(updated);
  } catch (err: any) {
    if (err instanceof InvalidSchoolLifecycleTransitionError) {
      return res.status(409).json({
        error: 'Institution lifecycle transition is not permitted',
        currentState: err.currentState,
        attemptedState: err.attemptedState,
      });
    }
    if (err instanceof SchoolMakerCheckerError) {
      return res.status(409).json({ error: err.message, code: 'MAKER_CHECKER_REQUIRED' });
    }
    if (err instanceof ProviderSchoolAuthorityRequiredError) {
      return res.status(403).json({ error: 'Initial institution verification requires authorised AYIVI provider approval', code: 'PROVIDER_AUTHORITY_REQUIRED' });
    }
    if (err instanceof SchoolLifecycleConflictError) {
      return res.status(409).json({ error: err.message, code: 'LIFECYCLE_CONFLICT' });
    }
    if (String(err?.message || '').includes('reason of at least 5 characters')) {
      return res.status(400).json({ error: 'A lifecycle transition reason of at least 5 characters is required' });
    }
    return res.status(500).json({ error: 'Institution lifecycle transition failed' });
  }
}

export const submitVerification = (req: AuthRequest, res: Response) =>
  executeLifecycle(req, res, 'UNDER_VERIFICATION', 'submit');

export const returnVerification = (req: AuthRequest, res: Response) =>
  executeLifecycle(req, res, 'DRAFT', 'correct');

export const suspendSchool = (req: AuthRequest, res: Response) =>
  executeLifecycle(req, res, 'SUSPENDED', 'approve');

export const reactivateSchool = (req: AuthRequest, res: Response) =>
  executeLifecycle(req, res, 'ACTIVE', 'approve');

export const archiveSchool = (req: AuthRequest, res: Response) =>
  executeLifecycle(req, res, 'ARCHIVED', 'administer');
