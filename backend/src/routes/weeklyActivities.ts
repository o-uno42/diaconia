import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { requireAdmin } from '../middleware/roleGuard';

const router = Router();

// ─── Catalog: weekly_activities ────────────────────────────────────

// GET /api/weekly-activities — list slot catalog (admin sees own; ragazzo sees their admin's)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    let ownerAdminId: string | undefined;
    if (req.user.role === 'admin') {
      ownerAdminId = req.user.id;
    } else if (req.user.role === 'ragazzo' && req.user.ragazzoId) {
      const { data: rag } = await supabase
        .from('ragazzi')
        .select('owner_admin_id')
        .eq('id', req.user.ragazzoId)
        .single();
      ownerAdminId = rag?.owner_admin_id;
    }
    if (!ownerAdminId) { res.json({ data: [] }); return; }

    const { data, error } = await supabase
      .from('weekly_activities')
      .select('*')
      .eq('owner_admin_id', ownerAdminId)
      .order('created_at', { ascending: true });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: (data ?? []).map((a) => ({
      id: a.id, name: a.name, createdAt: a.created_at,
    }))});
  } catch { res.status(500).json({ error: 'Failed to fetch weekly activities' }); }
});

// POST /api/weekly-activities
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body as { name: string };
  if (!name?.trim()) { res.status(400).json({ error: 'name is required' }); return; }
  try {
    const { data, error } = await supabase
      .from('weekly_activities')
      .insert({ name: name.trim(), owner_admin_id: req.user.id })
      .select()
      .single();
    if (error || !data) { res.status(500).json({ error: error?.message ?? 'Failed' }); return; }
    res.status(201).json({ data: { id: data.id, name: data.name, createdAt: data.created_at }});
  } catch { res.status(500).json({ error: 'Failed to create weekly activity' }); }
});

// PATCH /api/weekly-activities/:id
router.patch('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body as { name: string };
  if (!name?.trim()) { res.status(400).json({ error: 'name is required' }); return; }
  try {
    const { data, error } = await supabase
      .from('weekly_activities')
      .update({ name: name.trim() })
      .eq('id', req.params['id'])
      .eq('owner_admin_id', req.user.id)
      .select()
      .single();
    if (error || !data) { res.status(404).json({ error: error?.message ?? 'Weekly activity not found' }); return; }
    res.json({ data: { id: data.id, name: data.name, createdAt: data.created_at }});
  } catch { res.status(500).json({ error: 'Failed to update weekly activity' }); }
});

// DELETE /api/weekly-activities/:id — cascades to entries via FK
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = await supabase
      .from('weekly_activities')
      .delete()
      .eq('id', req.params['id'])
      .eq('owner_admin_id', req.user.id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: null });
  } catch { res.status(500).json({ error: 'Failed to delete weekly activity' }); }
});

// ─── Cell content: weekly_activity_entries ─────────────────────────

// GET /api/weekly-activities/entries?weekId=
router.get('/entries/list', async (req: Request, res: Response): Promise<void> => {
  const weekId = req.query['weekId'] as string | undefined;
  if (!weekId) { res.status(400).json({ error: 'weekId is required' }); return; }
  try {
    // Resolve tenant
    let ownerAdminId: string | undefined;
    if (req.user.role === 'admin') {
      ownerAdminId = req.user.id;
    } else if (req.user.role === 'ragazzo' && req.user.ragazzoId) {
      const { data: rag } = await supabase
        .from('ragazzi').select('owner_admin_id').eq('id', req.user.ragazzoId).single();
      ownerAdminId = rag?.owner_admin_id;
    }
    if (!ownerAdminId) { res.json({ data: [] }); return; }

    // Only return entries whose parent activity belongs to the tenant
    const { data: activities } = await supabase
      .from('weekly_activities').select('id').eq('owner_admin_id', ownerAdminId);
    const activityIds = (activities ?? []).map((a) => a.id as string);
    if (activityIds.length === 0) { res.json({ data: [] }); return; }

    const { data, error } = await supabase
      .from('weekly_activity_entries')
      .select('*')
      .eq('week_id', weekId)
      .in('activity_id', activityIds);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: (data ?? []).map((e) => ({
      id: e.id, activityId: e.activity_id, weekId: e.week_id, day: e.day, text: e.text,
    }))});
  } catch { res.status(500).json({ error: 'Failed to fetch entries' }); }
});

// POST /api/weekly-activities/entries
router.post('/entries', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { activityId, weekId, day, text } = req.body as { activityId: string; weekId: string; day: number; text: string };
  if (!activityId || !weekId || day === undefined || !text?.trim()) {
    res.status(400).json({ error: 'activityId, weekId, day, and text are required' }); return;
  }
  try {
    // Cross-tenant guard: the activity must belong to this admin
    const { data: act } = await supabase
      .from('weekly_activities').select('owner_admin_id').eq('id', activityId).single();
    if (!act || act.owner_admin_id !== req.user.id) {
      res.status(404).json({ error: 'Weekly activity not found' });
      return;
    }

    const { data, error } = await supabase
      .from('weekly_activity_entries')
      .insert({ activity_id: activityId, week_id: weekId, day, text: text.trim() })
      .select()
      .single();
    if (error || !data) { res.status(500).json({ error: error?.message ?? 'Failed' }); return; }
    res.status(201).json({ data: {
      id: data.id, activityId: data.activity_id, weekId: data.week_id, day: data.day, text: data.text,
    }});
  } catch { res.status(500).json({ error: 'Failed to create entry' }); }
});

// PATCH /api/weekly-activities/entries/:id
router.patch('/entries/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { text } = req.body as { text: string };
  try {
    // Resolve the entry's parent activity owner
    const { data: entry } = await supabase
      .from('weekly_activity_entries').select('activity_id').eq('id', req.params['id']).single();
    if (!entry) { res.status(404).json({ error: 'Entry not found' }); return; }
    const { data: act } = await supabase
      .from('weekly_activities').select('owner_admin_id').eq('id', entry.activity_id).single();
    if (!act || act.owner_admin_id !== req.user.id) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }

    const { data, error } = await supabase
      .from('weekly_activity_entries')
      .update({ text })
      .eq('id', req.params['id'])
      .select()
      .single();
    if (error || !data) { res.status(500).json({ error: error?.message ?? 'Failed' }); return; }
    res.json({ data: {
      id: data.id, activityId: data.activity_id, weekId: data.week_id, day: data.day, text: data.text,
    }});
  } catch { res.status(500).json({ error: 'Failed to update entry' }); }
});

// DELETE /api/weekly-activities/entries/:id
router.delete('/entries/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    // Resolve the entry's parent activity owner
    const { data: entry } = await supabase
      .from('weekly_activity_entries').select('activity_id').eq('id', req.params['id']).single();
    if (!entry) { res.status(404).json({ error: 'Entry not found' }); return; }
    const { data: act } = await supabase
      .from('weekly_activities').select('owner_admin_id').eq('id', entry.activity_id).single();
    if (!act || act.owner_admin_id !== req.user.id) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }

    const { error } = await supabase
      .from('weekly_activity_entries')
      .delete()
      .eq('id', req.params['id']);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: null });
  } catch { res.status(500).json({ error: 'Failed to delete entry' }); }
});

export default router;
