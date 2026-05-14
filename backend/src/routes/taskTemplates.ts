import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { requireAdmin } from '../middleware/roleGuard';

const router = Router();

// GET /api/task-templates — list catalog (admin sees own; ragazzo sees their admin's)
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
      .from('task_templates')
      .select('*')
      .eq('owner_admin_id', ownerAdminId)
      .order('created_at', { ascending: true });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: (data ?? []).map((t) => ({
      id: t.id, name: t.name, points: t.points, createdAt: t.created_at,
    }))});
  } catch { res.status(500).json({ error: 'Failed to fetch task templates' }); }
});

// POST /api/task-templates — admin only
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name, points } = req.body as { name: string; points: number };
  if (!name?.trim() || points === undefined) {
    res.status(400).json({ error: 'name and points are required' }); return;
  }
  try {
    const { data, error } = await supabase
      .from('task_templates')
      .insert({ name: name.trim(), points, owner_admin_id: req.user.id })
      .select()
      .single();
    if (error || !data) { res.status(500).json({ error: error?.message ?? 'Failed' }); return; }
    res.status(201).json({ data: {
      id: data.id, name: data.name, points: data.points, createdAt: data.created_at,
    }});
  } catch { res.status(500).json({ error: 'Failed to create task template' }); }
});

// PATCH /api/task-templates/:id — admin only
router.patch('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name, points } = req.body as { name?: string; points?: number };
  const update: Record<string, unknown> = {};
  if (typeof name === 'string' && name.trim()) update['name'] = name.trim();
  if (typeof points === 'number') update['points'] = points;
  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: 'name or points required' }); return;
  }
  try {
    const { data, error } = await supabase
      .from('task_templates')
      .update(update)
      .eq('id', req.params['id'])
      .eq('owner_admin_id', req.user.id)
      .select()
      .single();
    if (error || !data) { res.status(404).json({ error: error?.message ?? 'Task template not found' }); return; }
    res.json({ data: {
      id: data.id, name: data.name, points: data.points, createdAt: data.created_at,
    }});
  } catch { res.status(500).json({ error: 'Failed to update task template' }); }
});

// DELETE /api/task-templates/:id — admin only
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = await supabase
      .from('task_templates')
      .delete()
      .eq('id', req.params['id'])
      .eq('owner_admin_id', req.user.id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: null });
  } catch { res.status(500).json({ error: 'Failed to delete task template' }); }
});

export default router;
