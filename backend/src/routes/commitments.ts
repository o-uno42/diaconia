import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { requireAdmin } from '../middleware/roleGuard';

const router = Router();

// GET /api/commitments?weekId=
router.get('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const weekId = req.query['weekId'] as string | undefined;
  try {
    let query = supabase.from('commitments').select('*');
    if (weekId) query = query.eq('week_id', weekId);
    const { data, error } = await query.order('day');
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: (data ?? []).map((c) => ({
      id: c.id, ragazzoId: c.ragazzo_id, weekId: c.week_id, day: c.day, text: c.text,
    }))});
  } catch { res.status(500).json({ error: 'Failed to fetch commitments' }); }
});

// POST /api/commitments
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { ragazzoId, weekId, day, text } = req.body as { ragazzoId: string; weekId: string; day: number; text: string };
  if (!ragazzoId || !weekId || day === undefined || !text) {
    res.status(400).json({ error: 'ragazzoId, weekId, day, and text are required' }); return;
  }
  try {
    const { data, error } = await supabase.from('commitments').insert({
      ragazzo_id: ragazzoId, week_id: weekId, day, text,
    }).select().single();
    if (error || !data) { res.status(500).json({ error: error?.message ?? 'Failed' }); return; }
    res.status(201).json({ data: { id: data.id, ragazzoId: data.ragazzo_id, weekId: data.week_id, day: data.day, text: data.text }});
  } catch { res.status(500).json({ error: 'Failed to create commitment' }); }
});

// PATCH /api/commitments/:id
router.patch('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { text } = req.body as { text: string };
  try {
    const { data, error } = await supabase.from('commitments').update({ text }).eq('id', req.params['id']).select().single();
    if (error || !data) { res.status(500).json({ error: error?.message ?? 'Failed' }); return; }
    res.json({ data: { id: data.id, ragazzoId: data.ragazzo_id, weekId: data.week_id, day: data.day, text: data.text }});
  } catch { res.status(500).json({ error: 'Failed to update commitment' }); }
});

// DELETE /api/commitments/:id
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = await supabase.from('commitments').delete().eq('id', req.params['id']);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: null });
  } catch { res.status(500).json({ error: 'Failed to delete commitment' }); }
});

export default router;
