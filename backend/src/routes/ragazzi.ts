import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { requireAdmin, requireAdminOrOwn } from '../middleware/roleGuard';
import { getWeeklyPoints, getTopTask } from '../services/pointsService';

const router = Router();

// GET /api/ragazzi — list ragazzi owned by the current admin
router.get('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('ragazzi')
      .select('*')
      .eq('owner_admin_id', req.user.id)
      .order('last_name');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const ragazzi = (data ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      firstName: r.first_name,
      lastName: r.last_name,
      birthDate: r.birth_date,
      phone: r.phone ?? '',
      email: r.email ?? '',
      taxCode: r.tax_code ?? '',
      language: r.language ?? 'it',
      keywords: r.keywords ?? [],
      photos: [],
      pointsHistory: [],
    }));

    res.json({ data: ragazzi });
  } catch {
    res.status(500).json({ error: 'Failed to fetch ragazzi' });
  }
});

// POST /api/ragazzi — create ragazzo + auth user (admin only)
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, birthDate, phone, email, taxCode, language, keywords, password } =
    req.body as {
      firstName: string;
      lastName: string;
      birthDate?: string;
      phone?: string;
      email: string;
      taxCode?: string;
      language?: string;
      keywords?: string[];
      password: string;
    };

  if (!firstName || !lastName || !email || !password) {
    res.status(400).json({ error: 'firstName, lastName, email, and password are required' });
    return;
  }

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      res.status(400).json({ error: authError.message });
      return;
    }

    const userId = authData.user.id;

    // Create ragazzo record — owned by the admin issuing the request
    const { data: ragazzo, error: ragazzoError } = await supabase
      .from('ragazzi')
      .insert({
        user_id: userId,
        owner_admin_id: req.user.id,
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate ?? null,
        phone: phone ?? null,
        email,
        tax_code: taxCode ?? null,
        language: language ?? 'it',
        keywords: keywords ?? [],
      })
      .select()
      .single();

    if (ragazzoError || !ragazzo) {
      res.status(500).json({ error: ragazzoError?.message ?? 'Failed to create ragazzo' });
      return;
    }

    // Create profile
    await supabase.from('profiles').insert({
      id: userId,
      role: 'ragazzo',
      ragazzo_id: ragazzo.id,
    });

    res.status(201).json({
      data: {
        id: ragazzo.id,
        userId: ragazzo.user_id,
        firstName: ragazzo.first_name,
        lastName: ragazzo.last_name,
        birthDate: ragazzo.birth_date,
        phone: ragazzo.phone ?? '',
        email: ragazzo.email ?? '',
        taxCode: ragazzo.tax_code ?? '',
        language: ragazzo.language ?? 'it',
        keywords: ragazzo.keywords ?? [],
        photos: [],
        pointsHistory: [],
      },
    });
  } catch {
    res.status(500).json({ error: 'Failed to create ragazzo' });
  }
});

// GET /api/ragazzi/:id — get single ragazzo (own admin's, or the ragazzo themselves)
router.get('/:id', requireAdminOrOwn, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('ragazzi')
      .select('*')
      .eq('id', req.params['id'])
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Ragazzo not found' });
      return;
    }

    // An admin can only access their own ragazzi
    if (req.user.role === 'admin' && data.owner_admin_id !== req.user.id) {
      res.status(404).json({ error: 'Ragazzo not found' });
      return;
    }

    // Get photos
    const { data: photos } = await supabase
      .from('ragazzo_photos')
      .select('*')
      .eq('ragazzo_id', data.id)
      .order('uploaded_at', { ascending: false });

    // Get points and top task in parallel
    const [pointsHistory, topTask] = await Promise.all([
      getWeeklyPoints(data.id),
      getTopTask(data.id),
    ]);

    res.json({
      data: {
        id: data.id,
        userId: data.user_id,
        firstName: data.first_name,
        lastName: data.last_name,
        birthDate: data.birth_date,
        phone: data.phone ?? '',
        email: data.email ?? '',
        taxCode: data.tax_code ?? '',
        language: data.language ?? 'it',
        keywords: data.keywords ?? [],
        photos: (photos ?? []).map((p) => ({
          id: p.id,
          ragazzoId: p.ragazzo_id,
          fileName: p.file_name,
          storagePath: p.storage_path,
          mimeType: p.mime_type,
          uploadedAt: p.uploaded_at,
        })),
        pointsHistory,
        topTask,
      },
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch ragazzo' });
  }
});

// PATCH /api/ragazzi/:id — update (admin: all fields, ragazzo: phone/language only)
router.patch('/:id', requireAdminOrOwn, async (req: Request, res: Response): Promise<void> => {
  const isAdmin = req.user.role === 'admin';
  const body = req.body as Record<string, unknown>;

  const updateData: Record<string, unknown> = {};

  if (isAdmin) {
    if (body['firstName'] !== undefined) updateData['first_name'] = body['firstName'];
    if (body['lastName'] !== undefined) updateData['last_name'] = body['lastName'];
    if (body['birthDate'] !== undefined) updateData['birth_date'] = body['birthDate'];
    if (body['taxCode'] !== undefined) updateData['tax_code'] = body['taxCode'];
    if (body['email'] !== undefined) updateData['email'] = body['email'];
    if (body['keywords'] !== undefined) updateData['keywords'] = body['keywords'];
  }

  // Both admin and ragazzo can update phone and language
  if (body['phone'] !== undefined) updateData['phone'] = body['phone'];
  if (body['language'] !== undefined) updateData['language'] = body['language'];

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }

  try {
    // Build update query — admins can only update their own ragazzi
    let query = supabase
      .from('ragazzi')
      .update(updateData)
      .eq('id', req.params['id']);

    if (req.user.role === 'admin') {
      query = query.eq('owner_admin_id', req.user.id);
    }

    const { data, error } = await query.select().single();

    if (error || !data) {
      res.status(404).json({ error: error?.message ?? 'Ragazzo not found' });
      return;
    }

    res.json({
      data: {
        id: data.id,
        userId: data.user_id,
        firstName: data.first_name,
        lastName: data.last_name,
        birthDate: data.birth_date,
        phone: data.phone ?? '',
        email: data.email ?? '',
        taxCode: data.tax_code ?? '',
        language: data.language ?? 'it',
        keywords: data.keywords ?? [],
        photos: [],
        pointsHistory: [],
      },
    });
  } catch {
    res.status(500).json({ error: 'Failed to update ragazzo' });
  }
});

// GET /api/ragazzi/:id/points — weekly points
router.get('/:id/points', requireAdminOrOwn, async (req: Request, res: Response): Promise<void> => {
  try {
    const points = await getWeeklyPoints(req.params['id'] ?? '');
    res.json({ data: points });
  } catch {
    res.status(500).json({ error: 'Failed to fetch points' });
  }
});

export default router;
