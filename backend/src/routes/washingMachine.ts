import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { requireAdmin } from '../middleware/roleGuard';
import type { WashingMachineEntry, WashingMachineEntryType } from '../../../packages/shared/types';

const router = Router();

const ENTRY_TYPES: WashingMachineEntryType[] = ['V', 'LA'];

function mapRow(row: Record<string, unknown>): WashingMachineEntry {
  return {
    id: row['id'] as string,
    ragazzoId: row['ragazzo_id'] as string,
    date: row['date'] as string,
    entryType: row['entry_type'] as WashingMachineEntryType,
  };
}

// GET /api/washing-machine?year=2026&month=5
// Returns every X mark for the admin's ragazzi in the requested month.
// Month is 1–12. Both params required.
router.get('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const year = Number(req.query['year']);
  const month = Number(req.query['month']);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    res.status(400).json({ error: 'year and month (1-12) are required' });
    return;
  }

  // Month bounds, inclusive start / exclusive end.
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  try {
    const { data, error } = await supabase
      .from('washing_machine_entries')
      .select('id, ragazzo_id, date, entry_type')
      .eq('owner_admin_id', req.user.id)
      .gte('date', start)
      .lt('date', nextMonth)
      .order('date');

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch washing machine entries' });
  }
});

// POST /api/washing-machine — add an X. Idempotent: upserts on the unique
// (ragazzo_id, date, entry_type) key.
router.post('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { ragazzoId, date, entryType } = req.body as {
    ragazzoId?: string;
    date?: string;
    entryType?: WashingMachineEntryType;
  };

  if (!ragazzoId || !date || !entryType || !ENTRY_TYPES.includes(entryType)) {
    res.status(400).json({ error: 'ragazzoId, date and entryType (V|LA) are required' });
    return;
  }

  // Cross-tenant guard: the ragazzo must belong to the calling admin.
  try {
    const { data: rag } = await supabase
      .from('ragazzi')
      .select('owner_admin_id')
      .eq('id', ragazzoId)
      .single();
    if (!rag || rag.owner_admin_id !== req.user.id) {
      res.status(404).json({ error: 'Ragazzo not found' });
      return;
    }

    const { data, error } = await supabase
      .from('washing_machine_entries')
      .upsert(
        {
          ragazzo_id: ragazzoId,
          date,
          entry_type: entryType,
          owner_admin_id: req.user.id,
        },
        { onConflict: 'ragazzo_id,date,entry_type' },
      )
      .select('id, ragazzo_id, date, entry_type')
      .single();

    if (error || !data) {
      res.status(500).json({ error: error?.message ?? 'Failed to create entry' });
      return;
    }

    res.status(201).json({ data: mapRow(data as Record<string, unknown>) });
  } catch {
    res.status(500).json({ error: 'Failed to create washing machine entry' });
  }
});

// DELETE /api/washing-machine?ragazzoId=...&date=...&entryType=...
// Removes the X for the matching cell. 200 even if nothing was deleted, so
// the UI can call this freely after an optimistic uncheck.
router.delete('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const ragazzoId = req.query['ragazzoId'] as string | undefined;
  const date = req.query['date'] as string | undefined;
  const entryType = req.query['entryType'] as WashingMachineEntryType | undefined;

  if (!ragazzoId || !date || !entryType || !ENTRY_TYPES.includes(entryType)) {
    res.status(400).json({ error: 'ragazzoId, date and entryType (V|LA) are required' });
    return;
  }

  try {
    const { error } = await supabase
      .from('washing_machine_entries')
      .delete()
      .eq('owner_admin_id', req.user.id)
      .eq('ragazzo_id', ragazzoId)
      .eq('date', date)
      .eq('entry_type', entryType);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: null });
  } catch {
    res.status(500).json({ error: 'Failed to delete washing machine entry' });
  }
});

export default router;
