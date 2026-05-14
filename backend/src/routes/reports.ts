import { Router, Request, Response } from 'express';
import {
  Document, Paragraph, TextRun, HeadingLevel, Packer, BorderStyle,
  Table, TableRow, TableCell, WidthType, ShadingType,
} from 'docx';
import { supabase } from '../lib/supabase';
import { requireAdminOwnsRagazzo } from '../middleware/roleGuard';

const AREA_LABELS: Record<string, string> = {
  dailyArea: 'Area quotidiana',
  health: 'Salute',
  familyArea: 'Area familiare',
  socialRelational: 'Socio-relazionale',
  psychoAffective: 'Psico-affettivo',
  cognitiveArea: 'Area cognitiva',
  individualSession: 'Colloquio individuale',
};

const AREA_ORDER = ['dailyArea', 'health', 'familyArea', 'socialRelational', 'psychoAffective', 'cognitiveArea', 'individualSession'];


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

const AREA_DB_KEY: Record<string, string> = {
  dailyArea: 'daily_area', health: 'health', familyArea: 'family_area',
  socialRelational: 'social_relational', psychoAffective: 'psycho_affective',
  cognitiveArea: 'cognitive_area', individualSession: 'individual_session',
};

function detailsTable(rows: [string, string][]): Table {
  const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' };
  const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Informazioni Generali', bold: true, size: 20, color: 'FFFFFF' })] })],
            shading: { fill: '4338CA', type: ShadingType.CLEAR, color: 'auto' },
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders,
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Dettagli', bold: true, size: 20, color: 'FFFFFF' })] })],
            shading: { fill: '4338CA', type: ShadingType.CLEAR, color: 'auto' },
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders,
          }),
        ],
      }),
      ...rows.map(([label, value]) => new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20 })] })],
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders,
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: value, size: 20 })] })],
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders,
          }),
        ],
      })),
    ],
  });
}

// GET /api/ragazzi/:id/report/export/docx?year=YYYY&month=MM (1-based)
router.get('/:id/report/export/docx', requireAdminOwnsRagazzo, async (req: Request, res: Response): Promise<void> => {
  const year = parseInt(req.query['year'] as string);
  const month = parseInt(req.query['month'] as string);
  if (!year || !month) { res.status(400).json({ error: 'year and month are required' }); return; }

  try {
    const { data: ragazzo } = await supabase
      .from('ragazzi').select('first_name, last_name').eq('id', req.params['id']).single();
    if (!ragazzo) { res.status(404).json({ error: 'Ragazzo not found' }); return; }

    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const { data: entries, error } = await supabase
      .from('report_entries').select('*').eq('ragazzo_id', req.params['id'])
      .gte('date', monthStart).lt('date', nextMonth).order('date', { ascending: true });
    if (error) { res.status(500).json({ error: error.message }); return; }

    const monthName = new Intl.DateTimeFormat('it-IT', { month: 'long' }).format(new Date(year, month - 1, 1));
    const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    const fullName = `${ragazzo.first_name} ${ragazzo.last_name}`;
    const today = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());

    const sectionChildren: (Paragraph | Table)[] = [
      new Paragraph({
        text: `Report del mese di ${monthLabel} di ${fullName}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 },
      }),
      new Paragraph({
        text: 'Dettagli del Soggetto e del Relatore',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 120 },
      }),
      detailsTable([
        ['Soggetto Monitorato', fullName],
        ['Data di Redazione', today],
        ['Periodo di Riferimento', `${monthLabel} ${year}`],
      ]),

      new Paragraph({ children: [], spacing: { after: 240 } }),
    ];

    const allEntries = entries ?? [];

    for (const areaKey of AREA_ORDER) {
      const dbKey = AREA_DB_KEY[areaKey];
      const areaEntries = allEntries.filter((e) => (e[dbKey] as string)?.trim());
      if (areaEntries.length === 0) continue;

      sectionChildren.push(new Paragraph({
        text: AREA_LABELS[areaKey] ?? areaKey,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 160 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'C7D2FE' } },
      }));

      for (const entry of areaEntries) {
        const text = (entry[dbKey] as string)?.trim();
        if (!text) continue;
        const dateObj = new Date(entry.date + 'T00:00:00');
        const day = dateObj.getDate();
        const mn = new Intl.DateTimeFormat('it-IT', { month: 'long' }).format(dateObj);
        const mnCap = mn.charAt(0).toUpperCase() + mn.slice(1);

        sectionChildren.push(new Paragraph({
          children: [new TextRun({ text: `${day} ${mnCap}: ${text}`, size: 20 })],
          bullet: { level: 0 },
          spacing: { after: 60 },
        }));
      }
    }

    const doc = new Document({ sections: [{ children: sectionChildren }] });
    const buffer = await Packer.toBuffer(doc);

    const filename = `report-${fullName.replace(/\s+/g, '-')}-${monthLabel}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('[report/docx]', err);
    res.status(500).json({ error: 'Failed to generate DOCX' });
  }
});

export default router;
