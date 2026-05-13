import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/notifications — own user
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase.from('notifications').select('*')
      .eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(50);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: (data ?? []).map((n) => ({
      id: n.id, userId: n.user_id, message: n.message, read: n.read, createdAt: n.created_at,
    }))});
  } catch { res.status(500).json({ error: 'Failed to fetch notifications' }); }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = await supabase.from('notifications').update({ read: true })
      .eq('user_id', req.user.id).eq('read', false);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: { message: 'All notifications marked as read' } });
  } catch { res.status(500).json({ error: 'Failed to update notifications' }); }
});

export default router;
