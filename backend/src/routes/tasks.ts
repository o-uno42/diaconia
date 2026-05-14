import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { requireAdmin } from '../middleware/roleGuard';
import { createNotification } from '../services/notificationService';

const router = Router();

// GET /api/tasks?weekId=
// Returns tasks for the current admin (or the ragazzo's admin when called by a
// ragazzo). Cross-admin reads are not possible — ragazzi only see tasks created
// by the admin they belong to.
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const weekId = (req.query['weekId'] as string) ?? '';

  try {
    // Resolve which admin's tasks the caller can see
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

    if (!ownerAdminId) {
      res.json({ data: [] });
      return;
    }

    let query = supabase.from('tasks').select('*').eq('owner_admin_id', ownerAdminId);
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
          adminConfirmed: c.admin_confirmed,
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
    // If the admin assigns the task to a ragazzo, ensure that ragazzo is theirs.
    if (assignedTo) {
      const { data: rag } = await supabase
        .from('ragazzi')
        .select('owner_admin_id')
        .eq('id', assignedTo)
        .single();
      if (!rag || rag.owner_admin_id !== req.user.id) {
        res.status(403).json({ error: 'Cannot assign task to a ragazzo you do not own' });
        return;
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        week_id: weekId,
        owner_admin_id: req.user.id,
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

// PATCH /api/tasks/:id — rename task (admin only)
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
      .from('tasks')
      .update(update)
      .eq('id', req.params['id'])
      .eq('owner_admin_id', req.user.id)
      .select()
      .single();
    if (error || !data) { res.status(404).json({ error: error?.message ?? 'Task not found' }); return; }

    // Re-fetch completions so the response shape matches GET
    const { data: completions } = await supabase
      .from('task_completions')
      .select('*')
      .eq('task_id', data.id);

    res.json({
      data: {
        id: data.id,
        weekId: data.week_id,
        name: data.name,
        points: data.points,
        assignedTo: data.assigned_to ?? undefined,
        completions: (completions ?? []).map((c) => ({
          id: c.id, taskId: c.task_id, ragazzoId: c.ragazzo_id,
          day: c.day, completedAt: c.completed_at, markedByAdmin: c.marked_by_admin,
          adminConfirmed: c.admin_confirmed,
        })),
      },
    });
  } catch { res.status(500).json({ error: 'Failed to update task' }); }
});

// DELETE /api/tasks/:id — delete task (admin only, must own it)
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify ownership before doing the destructive cascade
    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', req.params['id'])
      .eq('owner_admin_id', req.user.id)
      .single();
    if (!existing) { res.status(404).json({ error: 'Task not found' }); return; }

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
    // Verify task + ragazzo are in the same tenant. The ragazzo's owning admin
    // must match the task's owner_admin_id; otherwise the caller is trying to
    // mix data across admins.
    const [taskOwnerRes, ragazzoOwnerRes] = await Promise.all([
      supabase.from('tasks').select('owner_admin_id').eq('id', taskId).single(),
      supabase.from('ragazzi').select('owner_admin_id').eq('id', ragazzoId).single(),
    ]);
    const taskOwner = taskOwnerRes.data?.owner_admin_id as string | undefined;
    const ragazzoOwner = ragazzoOwnerRes.data?.owner_admin_id as string | undefined;
    if (!taskOwner || !ragazzoOwner || taskOwner !== ragazzoOwner) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    // If the caller is an admin, they must own that tenant.
    if (req.user.role === 'admin' && taskOwner !== req.user.id) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const isAdmin = req.user.role === 'admin';
    const { data, error } = await supabase
      .from('task_completions')
      .insert({
        task_id: taskId,
        ragazzo_id: ragazzoId,
        day,
        marked_by_admin: isAdmin,
        admin_confirmed: isAdmin,
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
        // Notify only the admin owning this ragazzo — other admins manage their
        // own ragazzi and should not see cross-tenant activity.
        await createNotification(
          taskOwner,
          `${ragazzo.first_name} ${ragazzo.last_name} ha completato "${task.name}"`
        );
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
        adminConfirmed: data.admin_confirmed,
      },
    });
  } catch {
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// PATCH /api/tasks/completions/:completionId/confirm — admin confirms a ragazzo-submitted completion
router.patch('/completions/:completionId/confirm', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const completionId = req.params['completionId'] ?? '';
  try {
    // Verify the completion belongs to a ragazzo owned by this admin
    const { data: existing } = await supabase
      .from('task_completions')
      .select('ragazzo_id')
      .eq('id', completionId)
      .single();
    if (!existing) { res.status(404).json({ error: 'Completion not found' }); return; }
    const { data: rag } = await supabase
      .from('ragazzi')
      .select('owner_admin_id')
      .eq('id', existing.ragazzo_id)
      .single();
    if (!rag || rag.owner_admin_id !== req.user.id) {
      res.status(404).json({ error: 'Completion not found' });
      return;
    }

    const { data, error } = await supabase
      .from('task_completions')
      .update({ admin_confirmed: true })
      .eq('id', completionId)
      .select()
      .single();
    if (error || !data) { res.status(500).json({ error: error?.message ?? 'Failed to confirm completion' }); return; }
    res.json({
      data: {
        id: data.id,
        taskId: data.task_id,
        ragazzoId: data.ragazzo_id,
        day: data.day,
        completedAt: data.completed_at,
        markedByAdmin: data.marked_by_admin,
        adminConfirmed: data.admin_confirmed,
      },
    });
  } catch { res.status(500).json({ error: 'Failed to confirm completion' }); }
});

// DELETE /api/tasks/completions/:completionId — admin rejects/removes a completion
router.delete('/completions/:completionId', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const completionId = req.params['completionId'] ?? '';
  try {
    // Verify the completion belongs to a ragazzo owned by this admin
    const { data: existing } = await supabase
      .from('task_completions')
      .select('ragazzo_id')
      .eq('id', completionId)
      .single();
    if (!existing) { res.status(404).json({ error: 'Completion not found' }); return; }
    const { data: rag } = await supabase
      .from('ragazzi')
      .select('owner_admin_id')
      .eq('id', existing.ragazzo_id)
      .single();
    if (!rag || rag.owner_admin_id !== req.user.id) {
      res.status(404).json({ error: 'Completion not found' });
      return;
    }

    const { error } = await supabase
      .from('task_completions')
      .delete()
      .eq('id', completionId);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: null });
  } catch { res.status(500).json({ error: 'Failed to delete completion' }); }
});

// POST /api/tasks/:id/book — ragazzo assigns self to unassigned task
router.post('/:id/book', async (req: Request, res: Response): Promise<void> => {
  if (req.user.role !== 'ragazzo' || !req.user.ragazzoId) {
    res.status(403).json({ error: 'Only ragazzi can book tasks' });
    return;
  }

  const taskId = req.params['id'] ?? '';

  try {
    // Check task exists, is unassigned, and belongs to the ragazzo's admin
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

    // Cross-tenant booking guard: a ragazzo can only book tasks created by
    // their own admin.
    const { data: rag } = await supabase
      .from('ragazzi')
      .select('owner_admin_id')
      .eq('id', req.user.ragazzoId)
      .single();
    if (!rag || rag.owner_admin_id !== task.owner_admin_id) {
      res.status(404).json({ error: 'Task not found' });
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
        // Notify only the admin owning this task.
        await createNotification(
          task.owner_admin_id,
          `${ragazzo.first_name} ${ragazzo.last_name} ha prenotato "${data.name}"`
        );
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
