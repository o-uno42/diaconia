import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { requireAdminOwnsRagazzo } from '../middleware/roleGuard';

const router = Router();

// GET /api/ragazzi/:id/report
router.get('/:id/report', requireAdminOwnsRagazzo, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('report_entries')
      .select('*')
      .eq('ragazzo_id', req.params['id'])
      .order('date', { ascending: false });

    if (error) { res.status(500).json({ error: error.message }); return; }

    const entries = (data ?? []).map((r) => ({
      id: r.id, ragazzoId: r.ragazzo_id, date: r.date,
      sections: {
        dailyArea: r.daily_area ?? '', health: r.health ?? '',
        familyArea: r.family_area ?? '', socialRelational: r.social_relational ?? '',
        psychoAffective: r.psycho_affective ?? '', cognitiveArea: r.cognitive_area ?? '',
        individualSession: r.individual_session ?? '',
      },
      createdAt: r.created_at, updatedAt: r.updated_at,
    }));
    res.json({ data: entries });
  } catch { res.status(500).json({ error: 'Failed to fetch reports' }); }
});

// POST /api/ragazzi/:id/report
router.post('/:id/report', requireAdminOwnsRagazzo, async (req: Request, res: Response): Promise<void> => {
  const { date, sections } = req.body as { date: string; sections: Record<string, string> };
  if (!date) { res.status(400).json({ error: 'date is required' }); return; }

  try {
    const { data, error } = await supabase.from('report_entries').insert({
      ragazzo_id: req.params['id'], date,
      daily_area: sections?.dailyArea ?? '', health: sections?.health ?? '',
      family_area: sections?.familyArea ?? '', social_relational: sections?.socialRelational ?? '',
      psycho_affective: sections?.psychoAffective ?? '', cognitive_area: sections?.cognitiveArea ?? '',
      individual_session: sections?.individualSession ?? '',
    }).select().single();

    if (error || !data) { res.status(500).json({ error: error?.message ?? 'Failed' }); return; }

    res.status(201).json({ data: {
      id: data.id, ragazzoId: data.ragazzo_id, date: data.date,
      sections: { dailyArea: data.daily_area ?? '', health: data.health ?? '', familyArea: data.family_area ?? '',
        socialRelational: data.social_relational ?? '', psychoAffective: data.psycho_affective ?? '',
        cognitiveArea: data.cognitive_area ?? '', individualSession: data.individual_session ?? '' },
      createdAt: data.created_at, updatedAt: data.updated_at,
    }});
  } catch { res.status(500).json({ error: 'Failed to create report' }); }
});

// PATCH /api/ragazzi/:id/report/:entryId
router.patch('/:id/report/:entryId', requireAdminOwnsRagazzo, async (req: Request, res: Response): Promise<void> => {
  const { sections } = req.body as { sections: Record<string, string> };
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (sections) {
    if (sections['dailyArea'] !== undefined) updateData['daily_area'] = sections['dailyArea'];
    if (sections['health'] !== undefined) updateData['health'] = sections['health'];
    if (sections['familyArea'] !== undefined) updateData['family_area'] = sections['familyArea'];
    if (sections['socialRelational'] !== undefined) updateData['social_relational'] = sections['socialRelational'];
    if (sections['psychoAffective'] !== undefined) updateData['psycho_affective'] = sections['psychoAffective'];
    if (sections['cognitiveArea'] !== undefined) updateData['cognitive_area'] = sections['cognitiveArea'];
    if (sections['individualSession'] !== undefined) updateData['individual_session'] = sections['individualSession'];
  }

  try {
    const { data, error } = await supabase.from('report_entries').update(updateData)
      .eq('id', req.params['entryId']).eq('ragazzo_id', req.params['id']).select().single();
    if (error || !data) { res.status(500).json({ error: error?.message ?? 'Failed' }); return; }

    res.json({ data: {
      id: data.id, ragazzoId: data.ragazzo_id, date: data.date,
      sections: { dailyArea: data.daily_area ?? '', health: data.health ?? '', familyArea: data.family_area ?? '',
        socialRelational: data.social_relational ?? '', psychoAffective: data.psycho_affective ?? '',
        cognitiveArea: data.cognitive_area ?? '', individualSession: data.individual_session ?? '' },
      createdAt: data.created_at, updatedAt: data.updated_at,
    }});
  } catch { res.status(500).json({ error: 'Failed to update report' }); }
});

// DELETE /api/ragazzi/:id/report/:entryId
router.delete('/:id/report/:entryId', requireAdminOwnsRagazzo, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = await supabase.from('report_entries').delete()
      .eq('id', req.params['entryId']).eq('ragazzo_id', req.params['id']);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ data: null });
  } catch { res.status(500).json({ error: 'Failed to delete report' }); }
});

export default router;
