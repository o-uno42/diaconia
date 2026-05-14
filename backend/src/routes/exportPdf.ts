import { Router, Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { supabase } from '../lib/supabase';
import { requireAdmin } from '../middleware/roleGuard';

const router = Router();

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const PAGE_MARGIN = 30;
const HEADER_BG = '#4338ca';
const ROW_BG_ODD = '#f5f5f4';
const ROW_MIN_HEIGHT = 22;

type PdfDoc = InstanceType<typeof PDFDocument>;

function initDoc(res: Response, filename: string): PdfDoc {
  const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  return doc;
}

function drawTitle(doc: PdfDoc, title: string, subtitle: string): number {
  const usableWidth = doc.page.width - PAGE_MARGIN * 2;
  doc.font('Helvetica-Bold').fontSize(15).fillColor('#1e1b4b')
    .text(title, PAGE_MARGIN, PAGE_MARGIN, { width: usableWidth, align: 'center' });
  doc.font('Helvetica').fontSize(10).fillColor('#6366f1')
    .text(subtitle, PAGE_MARGIN, doc.y + 3, { width: usableWidth, align: 'center' });
  return doc.y + 14;
}

function drawTable(
  doc: PdfDoc,
  headers: string[],
  rows: string[][],
  colWidths: number[],
  startY: number,
): void {
  const usableWidth = colWidths.reduce((a, b) => a + b, 0);
  let y = startY;

  const headerH = 20;
  doc.rect(PAGE_MARGIN, y, usableWidth, headerH).fill(HEADER_BG);
  let cx = PAGE_MARGIN;
  doc.font('Helvetica-Bold').fontSize(8).fillColor('white');
  headers.forEach((h, i) => {
    doc.text(h, cx + 3, y + 6, { width: colWidths[i] - 6, align: i === 0 ? 'left' : 'center', lineBreak: false });
    cx += colWidths[i];
  });
  y += headerH;

  rows.forEach((row, ri) => {
    doc.font('Helvetica').fontSize(7.5);
    const cellW = row.map((_, ci) => Math.max(colWidths[ci] - 8, 10));
    const cellTextH = row.map((cell, ci) =>
      cell ? doc.heightOfString(cell, { width: cellW[ci] }) : 0,
    );
    const rowH = Math.max(...cellTextH.map((h) => h + 12), ROW_MIN_HEIGHT);

    doc.rect(PAGE_MARGIN, y, usableWidth, rowH).fill(ri % 2 === 0 ? ROW_BG_ODD : '#ffffff');
    doc.rect(PAGE_MARGIN, y, usableWidth, rowH).stroke('#d6d3d1');

    cx = PAGE_MARGIN;
    colWidths.forEach((w) => { cx += w; doc.moveTo(cx, y).lineTo(cx, y + rowH).stroke('#d6d3d1'); });

    cx = PAGE_MARGIN;
    doc.font('Helvetica').fontSize(7.5).fillColor('#1c1917');
    row.forEach((cell, ci) => {
      if (cell) {
        const textY = y + (rowH - cellTextH[ci]) / 2;
        doc.text(cell, cx + 4, textY, { width: cellW[ci], align: 'center', lineBreak: true });
      }
      cx += colWidths[ci];
    });

    y += rowH;
    if (y > doc.page.height - PAGE_MARGIN - 30) { doc.addPage(); y = PAGE_MARGIN; }
  });
}

router.get('/tasks-pdf', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const weekId = req.query['weekId'] as string | undefined;
  const weekLabel = req.query['weekLabel'] as string | undefined;
  if (!weekId) { res.status(400).json({ error: 'weekId is required' }); return; }

  try {
    const { data: tasks, error: tasksErr } = await supabase
      .from('tasks').select('*').eq('week_id', weekId).eq('owner_admin_id', req.user.id).order('name');
    if (tasksErr) { res.status(500).json({ error: tasksErr.message }); return; }

    const taskIds = (tasks ?? []).map((t) => t.id as string);
    const { data: completions } = taskIds.length > 0
      ? await supabase.from('task_completions').select('*').in('task_id', taskIds)
      : { data: [] };

    const ragazziIds = [...new Set((completions ?? []).map((c) => c.ragazzo_id as string))];
    const { data: ragazzi } = ragazziIds.length > 0
      ? await supabase.from('ragazzi').select('id, first_name, last_name').in('id', ragazziIds)
      : { data: [] };
    const ragazziMap = new Map((ragazzi ?? []).map((r) => [r.id as string, r.first_name as string]));

    const colWidths = [134, 30, 53, 53, 53, 53, 53, 53, 53];
    const headers = ['Attività', 'Pt', ...DAY_LABELS];

    const rows = (tasks ?? []).map((t) => {
      const dayCells = DAY_LABELS.map((_, di) => {
        const dayCompletions = (completions ?? []).filter((c) => c.task_id === t.id && c.day === di);
        return dayCompletions.map((c) => ragazziMap.get(c.ragazzo_id) ?? '?').join(', ');
      });
      return [t.name as string, String(t.points), ...dayCells];
    });

    const doc = initDoc(res, `task-calendar-${weekId}.pdf`);
    const tableY = drawTitle(doc, 'Calendario Task', weekLabel ?? weekId);
    drawTable(doc, headers, rows, colWidths, tableY);
    doc.end();
  } catch { res.status(500).json({ error: 'Failed to generate PDF' }); }
});

router.get('/weekly-activities-pdf', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const weekId = req.query['weekId'] as string | undefined;
  const weekLabel = req.query['weekLabel'] as string | undefined;
  if (!weekId) { res.status(400).json({ error: 'weekId is required' }); return; }

  try {
    const { data: activities, error: actErr } = await supabase
      .from('weekly_activities').select('*').eq('owner_admin_id', req.user.id).order('created_at');
    if (actErr) { res.status(500).json({ error: actErr.message }); return; }

    const actIds = (activities ?? []).map((a) => a.id as string);
    const { data: entries } = actIds.length > 0
      ? await supabase.from('weekly_activity_entries').select('*').eq('week_id', weekId).in('activity_id', actIds)
      : { data: [] };

    const colWidths = [115, 60, 60, 60, 60, 60, 60, 60];
    const headers = ['Attività', ...DAY_LABELS];

    const rows = (activities ?? []).map((a) => {
      const dayCells = DAY_LABELS.map((_, di) => {
        const entry = (entries ?? []).find((e) => e.activity_id === a.id && e.day === di);
        return entry?.text ?? '';
      });
      return [a.name as string, ...dayCells];
    });

    const doc = initDoc(res, `weekly-activities-${weekId}.pdf`);
    const tableY = drawTitle(doc, 'Attività Settimanali', weekLabel ?? weekId);
    drawTable(doc, headers, rows, colWidths, tableY);
    doc.end();
  } catch { res.status(500).json({ error: 'Failed to generate PDF' }); }
});

router.get('/commitments-pdf', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const weekId = req.query['weekId'] as string | undefined;
  const weekLabel = req.query['weekLabel'] as string | undefined;
  if (!weekId) { res.status(400).json({ error: 'weekId is required' }); return; }

  try {
    const { data: ragazzi, error: ragErr } = await supabase
      .from('ragazzi').select('id, first_name, last_name').eq('owner_admin_id', req.user.id).order('last_name');
    if (ragErr) { res.status(500).json({ error: ragErr.message }); return; }

    const ragazziIds = (ragazzi ?? []).map((r) => r.id as string);
    const { data: commitments } = ragazziIds.length > 0
      ? await supabase.from('commitments').select('*').eq('week_id', weekId).in('ragazzo_id', ragazziIds)
      : { data: [] };

    const colWidths = [115, 60, 60, 60, 60, 60, 60, 60];
    const headers = ['Ragazzo', ...DAY_LABELS];

    const rows = (ragazzi ?? []).map((r) => {
      const dayCells = DAY_LABELS.map((_, di) => {
        const commits = (commitments ?? []).filter((c) => c.ragazzo_id === r.id && c.day === di);
        return commits.map((c) => c.text as string).join('\n');
      });
      return [`${r.first_name} ${r.last_name}`, ...dayCells];
    });

    const doc = initDoc(res, `commitments-${weekId}.pdf`);
    const tableY = drawTitle(doc, 'Impegni Settimanali', weekLabel ?? weekId);
    drawTable(doc, headers, rows, colWidths, tableY);
    doc.end();
  } catch { res.status(500).json({ error: 'Failed to generate PDF' }); }
});

function drawWashingMachineTable(
  doc: PdfDoc,
  ragazzi: { id: string; first_name: string; last_name: string }[],
  daysInMonth: number,
  year: number,
  month: number,
  checked: Set<string>,
  startY: number,
): void {
  const now = new Date();
  const todayDay = (now.getFullYear() === year && now.getMonth() + 1 === month) ? now.getDate() : -1;

  const usableW = 535;
  const dayColW = 35;
  const n = ragazzi.length;
  const subColW = n > 0 ? Math.floor((usableW - dayColW) / n / 2) : 40;
  const ragW = subColW * 2;
  const totalW = dayColW + n * ragW;
  const H1 = 18;
  const H2 = 14;
  const ROW = 17;
  let y = startY;

  doc.rect(PAGE_MARGIN, y, totalW, H1 + H2).fill(HEADER_BG);
  doc.font('Helvetica-Bold').fontSize(8).fillColor('white');
  doc.text('Giorno', PAGE_MARGIN + 2, y + (H1 + H2) / 2 - 4, { width: dayColW - 4, align: 'center', lineBreak: false });

  let cx = PAGE_MARGIN + dayColW;
  ragazzi.forEach((r) => {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('white');
    doc.text(`${r.first_name} ${r.last_name}`, cx + 2, y + 4, { width: ragW - 4, align: 'center', lineBreak: false });
    cx += ragW;
  });

  doc.moveTo(PAGE_MARGIN + dayColW, y + H1).lineTo(PAGE_MARGIN + totalW, y + H1)
    .strokeColor('rgba(255,255,255,0.25)').lineWidth(0.5).stroke();

  cx = PAGE_MARGIN + dayColW;
  ragazzi.forEach(() => {
    doc.font('Helvetica').fontSize(7).fillColor('white');
    doc.text('V',     cx,            y + H1 + 3, { width: subColW, align: 'center', lineBreak: false });
    doc.text('L e A', cx + subColW,  y + H1 + 3, { width: subColW, align: 'center', lineBreak: false });
    cx += ragW;
  });

  cx = PAGE_MARGIN + dayColW;
  ragazzi.forEach(() => {
    doc.moveTo(cx + subColW, y + H1).lineTo(cx + subColW, y + H1 + H2)
      .strokeColor('rgba(255,255,255,0.25)').lineWidth(0.5).stroke();
    doc.moveTo(cx + ragW, y).lineTo(cx + ragW, y + H1 + H2)
      .strokeColor('rgba(255,255,255,0.25)').lineWidth(0.5).stroke();
    cx += ragW;
  });

  y += H1 + H2;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = day === todayDay;

    doc.rect(PAGE_MARGIN, y, dayColW, ROW).fill(isToday ? '#fde68a' : '#e8e6e3');

    cx = PAGE_MARGIN + dayColW;
    ragazzi.forEach((_, ri) => {
      doc.rect(cx, y, ragW, ROW).fill(isToday ? '#fef9c3' : (ri % 2 === 0 ? '#ffffff' : '#f4f3f2'));
      cx += ragW;
    });

    doc.rect(PAGE_MARGIN, y, totalW, ROW).stroke('#d6d3d1');

    doc.font('Helvetica-Bold').fontSize(8).fillColor('#374151');
    doc.text(String(day), PAGE_MARGIN + 2, y + (ROW - 8) / 2, { width: dayColW - 4, align: 'center', lineBreak: false });

    cx = PAGE_MARGIN + dayColW;
    ragazzi.forEach((r) => {
      const vOk  = checked.has(`${r.id}|${dateStr}|V`);
      const laOk = checked.has(`${r.id}|${dateStr}|LA`);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#4338ca');
      if (vOk)  doc.text('×', cx,            y + (ROW - 10) / 2, { width: subColW, align: 'center', lineBreak: false });
      if (laOk) doc.text('×', cx + subColW,  y + (ROW - 10) / 2, { width: subColW, align: 'center', lineBreak: false });
      doc.moveTo(cx + subColW, y).lineTo(cx + subColW, y + ROW).strokeColor('#d6d3d1').lineWidth(0.5).stroke();
      doc.moveTo(cx + ragW,    y).lineTo(cx + ragW,    y + ROW).strokeColor('#d6d3d1').lineWidth(0.5).stroke();
      cx += ragW;
    });

    y += ROW;
    if (y > doc.page.height - PAGE_MARGIN - 20) { doc.addPage(); y = PAGE_MARGIN; }
  }
}

router.get('/washing-machine-pdf', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const year  = parseInt(req.query['year']  as string);
  const month = parseInt(req.query['month'] as string);
  const monthLabel = req.query['monthLabel'] as string | undefined;
  if (!year || !month) { res.status(400).json({ error: 'year and month are required' }); return; }

  try {
    const { data: ragazzi } = await supabase
      .from('ragazzi').select('id, first_name, last_name')
      .eq('owner_admin_id', req.user.id).order('last_name');

    const start    = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMon  = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const { data: entries } = await supabase
      .from('washing_machine_entries').select('ragazzo_id, date, entry_type')
      .eq('owner_admin_id', req.user.id).gte('date', start).lt('date', nextMon);

    const daysInMonth = new Date(year, month, 0).getDate();
    const checked = new Set((entries ?? []).map((e) => `${e.ragazzo_id}|${e.date}|${e.entry_type}`));

    const doc = initDoc(res, `lavatrice-${year}-${String(month).padStart(2, '0')}.pdf`);
    const tableY = drawTitle(doc, 'Lavatrice', monthLabel ?? `${year}/${month}`);
    drawWashingMachineTable(doc, ragazzi ?? [], daysInMonth, year, month, checked, tableY);
    doc.end();
  } catch { res.status(500).json({ error: 'Failed to generate PDF' }); }
});

export default router;
