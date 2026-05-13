import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { requireAdmin } from '../middleware/roleGuard';
import { createNotification } from '../services/notificationService';

const router = Router();

// GET /api/tasks?weekId=
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const weekId = (req.query['weekId'] as string) ?? '';

  try {
    let query = supabase.from('tasks').select('*');
    if (weekId) {
      query = query.eq('week_id', weekId);
    }

    const { data: tasks, error } = await query.order('name');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Fetch completions for these tasks
    const taskIds = (tasks ?? []).map((t) => t.id as string);
    const { data: completions } = taskIds.length > 0
      ? await supabase
          .from('task_completions')
          .select('*')
          .in('task_id', taskIds)
      : { data: [] };

    const result = (tasks ?? []).map((t) => ({
      id: t.id,
      weekId: t.week_id,
      name: t.name,
      points: t.points,
      assignedTo: t.assigned_to ?? undefined,
      completions: (completions ?? [])
        .filter((c) => c.task_id === t.id)
        .map((c) => ({
          id: c.id,
          taskId: c.task_id,
          ragazzoId: c.ragazzo_id,
          day: c.day,
          completedAt: c.completed_at,
          markedByAdmin: c.marked_by_admin,
        })),
    }));

    res.json({ data: result });
  } catch {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks — create task (admin only)
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { weekId, name, points, assignedTo } = req.body as {
    weekId: string;
    name: string;
    points: number;
    assignedTo?: string;
  };

  if (!weekId || !name || points === undefined) {
    res.status(400).json({ error: 'weekId, name, and points are required' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        week_id: weekId,
        name,
        points,
        assigned_to: assignedTo ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      res.status(500).json({ error: error?.message ?? 'Failed to create task' });
      return;
    }

    res.status(201).json({
      data: {
        id: data.id,
        weekId: data.week_id,
        name: data.name,
        points: data.points,
        assignedTo: data.assigned_to ?? undefined,
        completions: [],
      },
    });
  } catch {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// DELETE /api/tasks/:id — delete task (admin only)
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    // Delete completions first
    await supabase.from('task_completions').delete().eq('task_id', req.params['id']);

    const { error } = await supabase.from('tasks').delete().eq('id', req.params['id']);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: null });
  } catch {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// POST /api/tasks/:id/complete — mark task complete for a day
router.post('/:id/complete', async (req: Request, res: Response): Promise<void> => {
  const { ragazzoId, day } = req.body as { ragazzoId: string; day: number };
  const taskId = req.params['id'] ?? '';

  if (!ragazzoId || day === undefined) {
    res.status(400).json({ error: 'ragazzoId and day are required' });
    return;
  }

  // If ragazzo, verify it's their own
  if (req.user.role === 'ragazzo' && req.user.ragazzoId !== ragazzoId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('task_completions')
      .insert({
        task_id: taskId,
        ragazzo_id: ragazzoId,
        day,
        marked_by_admin: req.user.role === 'admin',
      })
      .select()
      .single();

    if (error || !data) {
      res.status(500).json({ error: error?.message ?? 'Failed to complete task' });
      return;
    }

    // Notify on task completion
    try {
      // Get task name and ragazzo name for the notification
      const { data: task } = await supabase.from('tasks').select('name').eq('id', taskId).single();
      const { data: ragazzo } = await supabase
        .from('ragazzi')
        .select('first_name, last_name')
        .eq('id', ragazzoId)
        .single();

      if (task && ragazzo) {
        // Notify admins
        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin');

        for (const admin of admins ?? []) {
          await createNotification(
            admin.id,
            `${ragazzo.first_name} ${ragazzo.last_name} ha completato "${task.name}"`
          );
        }
      }
    } catch {
      // Non-critical: notification failure shouldn't fail the completion
    }

    res.status(201).json({
      data: {
        id: data.id,
        taskId: data.task_id,
        ragazzoId: data.ragazzo_id,
        day: data.day,
        completedAt: data.completed_at,
        markedByAdmin: data.marked_by_admin,
      },
    });
  } catch {
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// POST /api/tasks/:id/book — ragazzo assigns self to unassigned task
router.post('/:id/book', async (req: Request, res: Response): Promise<void> => {
  if (req.user.role !== 'ragazzo' || !req.user.ragazzoId) {
    res.status(403).json({ error: 'Only ragazzi can book tasks' });
    return;
  }

  const taskId = req.params['id'] ?? '';

  try {
    // Check task is unassigned
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (fetchError || !task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (task.assigned_to) {
      res.status(409).json({ error: 'Task is already assigned' });
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({ assigned_to: req.user.ragazzoId })
      .eq('id', taskId)
      .select()
      .single();

    if (error || !data) {
      res.status(500).json({ error: error?.message ?? 'Failed to book task' });
      return;
    }

    // Notify admins
    try {
      const { data: ragazzo } = await supabase
        .from('ragazzi')
        .select('first_name, last_name')
        .eq('id', req.user.ragazzoId)
        .single();

      if (ragazzo) {
        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin');

        for (const admin of admins ?? []) {
          await createNotification(
            admin.id,
            `${ragazzo.first_name} ${ragazzo.last_name} ha prenotato "${data.name}"`
          );
        }
      }
    } catch {
      // Non-critical
    }

    res.json({
      data: {
        id: data.id,
        weekId: data.week_id,
        name: data.name,
        points: data.points,
        assignedTo: data.assigned_to ?? undefined,
        completions: [],
      },
    });
  } catch {
    res.status(500).json({ error: 'Failed to book task' });
  }
});

export default router;
