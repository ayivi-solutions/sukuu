import { Router } from 'express';
import multer from 'multer';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { authenticate, AuthRequest } from '../../middleware/authenticate';
import { Response } from 'express';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
let supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!supabase) supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
  return supabase;
}

export const uploadRouter = Router();

uploadRouter.post('/', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const schoolId = req.schoolId || 'unassigned';
    const ext = req.file.originalname.split('.').pop();
    const path = `${schoolId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await getSupabase().storage.from('sukuu-uploads').upload(path, req.file.buffer, { contentType: req.file.mimetype });
    if (error) return res.status(500).json({ error: error.message });
    const { data } = getSupabase().storage.from('sukuu-uploads').getPublicUrl(path);
    res.json({ url: data.publicUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
