import { Response } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { getSchoolProfile, updateSchoolProfile, getSchoolSettings, listAccreditations, createAccreditation, archiveAccreditation, listSchoolAuditLog, logSchoolAudit, listContacts, createContact, updateContact, getBranding, upsertBranding, listCampuses, createCampus, toggleCampus, getTermPolicy, upsertTermPolicy, listDocuments, createDocument, getSubscription, updateSubscriptionStatus, upsertSetting } from './school.service';

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
    const archived = await archiveAccreditation(req.params.accreditationId);
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
    const r = await updateContact(req.params.id, req.body);
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
    const r = await toggleCampus(req.params.id, !!req.body.isActive);
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
