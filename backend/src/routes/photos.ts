import { Router, Request, Response } from 'express';
import multer from 'multer';
import { supabase } from '../lib/supabase';
import { requireAdminOrOwn } from '../middleware/roleGuard';
import crypto from 'crypto';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

// GET /api/ragazzi/:id/photos
router.get('/:id/photos', requireAdminOrOwn, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase.from('ragazzo_photos').select('*')
      .eq('ragazzo_id', req.params['id']).order('uploaded_at', { ascending: false });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: (data ?? []).map((p) => ({
      id: p.id, ragazzoId: p.ragazzo_id, fileName: p.file_name,
      storagePath: p.storage_path, mimeType: p.mime_type, uploadedAt: p.uploaded_at,
    }))});
  } catch { res.status(500).json({ error: 'Failed to fetch photos' }); }
});

// POST /api/ragazzi/:id/photos — multipart upload
router.post('/:id/photos', requireAdminOrOwn, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  const file = req.file;
  if (!file) { res.status(400).json({ error: 'No file provided' }); return; }

  const ragazzoId = req.params['id'] ?? '';
  const photoId = crypto.randomUUID();
  const storagePath = `${ragazzoId}/${photoId}-${file.originalname}`;

  try {
    const { error: uploadError } = await supabase.storage.from('ragazzo-photos')
      .upload(storagePath, file.buffer, { contentType: file.mimetype });
    if (uploadError) { res.status(500).json({ error: uploadError.message }); return; }

    const { data, error } = await supabase.from('ragazzo_photos').insert({
      ragazzo_id: ragazzoId, file_name: file.originalname,
      storage_path: storagePath, mime_type: file.mimetype,
    }).select().single();

    if (error || !data) { res.status(500).json({ error: error?.message ?? 'Failed' }); return; }
    res.status(201).json({ data: {
      id: data.id, ragazzoId: data.ragazzo_id, fileName: data.file_name,
      storagePath: data.storage_path, mimeType: data.mime_type, uploadedAt: data.uploaded_at,
    }});
  } catch { res.status(500).json({ error: 'Failed to upload photo' }); }
});

// DELETE /api/ragazzi/:id/photos/:photoId
router.delete('/:id/photos/:photoId', requireAdminOrOwn, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: photo } = await supabase.from('ragazzo_photos').select('storage_path')
      .eq('id', req.params['photoId']).single();
    if (photo) { await supabase.storage.from('ragazzo-photos').remove([photo.storage_path]); }

    const { error } = await supabase.from('ragazzo_photos').delete().eq('id', req.params['photoId']);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: null });
  } catch { res.status(500).json({ error: 'Failed to delete photo' }); }
});

// GET /api/ragazzi/:id/photos/:photoId/url — signed URL (60s)
router.get('/:id/photos/:photoId/url', requireAdminOrOwn, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: photo } = await supabase.from('ragazzo_photos').select('storage_path')
      .eq('id', req.params['photoId']).single();
    if (!photo) { res.status(404).json({ error: 'Photo not found' }); return; }

    const { data, error } = await supabase.storage.from('ragazzo-photos')
      .createSignedUrl(photo.storage_path, 60);
    if (error || !data) { res.status(500).json({ error: error?.message ?? 'Failed' }); return; }
    res.json({ data: { url: data.signedUrl } });
  } catch { res.status(500).json({ error: 'Failed to generate URL' }); }
});

export default router;
