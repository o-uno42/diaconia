import { supabase } from '../lib/supabase';
import type { WeeklyPoints } from '../../../packages/shared/types';

/**
 * Compute weekly points on-the-fly from task_completions + tasks.
 * No materialized table — aggregation query each time.
 */
export async function getWeeklyPoints(ragazzoId: string): Promise<WeeklyPoints[]> {
  const { data, error } = await supabase.rpc('get_weekly_points', { p_ragazzo_id: ragazzoId });

  // Fallback: if RPC doesn't exist, use raw query via REST
  if (error) {
    const { data: completions } = await supabase
      .from('task_completions')
      .select('task_id, tasks(week_id, points)')
      .eq('ragazzo_id', ragazzoId);

    if (!completions) return [];

    const weekMap = new Map<string, number>();
    for (const c of completions) {
      const task = c.tasks as unknown as { week_id: string; points: number } | null;
      if (!task) continue;
      const current = weekMap.get(task.week_id) ?? 0;
      weekMap.set(task.week_id, current + Number(task.points));
    }

    const weeks = Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekId, points]) => ({
        weekId,
        weekLabel: formatWeekLabel(weekId),
        points,
      }));

    return weeks;
  }

  return ((data as Array<{ week_id: string; points: number }>) ?? []).map((row) => ({
    weekId: row.week_id,
    weekLabel: formatWeekLabel(row.week_id),
    points: Number(row.points),
  }));
}

/**
 * Convert "2025-W20" to a human-readable label like "12–18 Mag"
 */
function formatWeekLabel(weekId: string): string {
  const match = weekId.match(/^(\d{4})-W(\d{1,2})$/);
  if (!match) return weekId;

  const year = parseInt(match[1] ?? '2025', 10);
  const week = parseInt(match[2] ?? '1', 10);

  // ISO week date: Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // Monday = 1
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

  const mDay = monday.getDate();
  const sDay = sunday.getDate();
  const mMonth = months[monday.getMonth()] ?? '';
  const sMonth = months[sunday.getMonth()] ?? '';

  if (mMonth === sMonth) {
    return `${mDay}–${sDay} ${mMonth}`;
  }
  return `${mDay} ${mMonth}–${sDay} ${sMonth}`;
}
