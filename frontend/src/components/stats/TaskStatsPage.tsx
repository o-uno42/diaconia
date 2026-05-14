import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../../store/AppContext';
import { useTaskTemplates } from '../../hooks/useTaskTemplates';
import { apiGet } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import { MOCK_RAGAZZI, getMockTasks } from '../../lib/mockData';
import { t } from '../../i18n/translations';
import type { Language } from '@shared/types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import NotificationBell from '../layout/NotificationBell';
import type { Ragazzo, Task } from '@shared/types';
import DownloadPDFFAB from '../ui/DownloadPDFFAB';
const weekOffset = 0;

// Returns the [start, end) instants of the month at `offset` (0 = current month)
// plus a localized "Maggio 2026"-style label.
function getMonthRange(offset: number, lang: Language) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  const raw = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(start);
  const label = raw.charAt(0).toUpperCase() + raw.slice(1);
  return { start, end, label };
}

// Fixed 30-color palette; templates beyond 30 cycle through it.
const TASK_PALETTE = [
  '#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#3b82f6', '#a855f7',
  '#22c55e', '#eab308', '#06b6d4', '#d946ef', '#f43f5e',
  '#84cc16', '#0ea5e9', '#facc15', '#a3e635', '#fb7185',
  '#2dd4bf', '#fb923c', '#60a5fa', '#c084fc', '#34d399',
  '#fbbf24', '#fde047', '#67e8f9', '#f0abfc', '#fda4af',
];

const hexToRgba = (hex: string, alpha = 1) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface TooltipEntry { name: string; value: number; fill: string; }
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  lang: Language;
}

function CustomTooltip({ active, payload, label, lang }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const done = payload.filter((p) => p.value > 0);
  const never = payload.filter((p) => p.value === 0);
  return (
    <div style={{
      backgroundColor: 'rgba(255,255,255,0.97)',
      border: '1px solid rgba(212,207,202,0.4)',
      borderRadius: 12,
      padding: '10px 14px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      maxWidth: 240,
    }}>
      <p style={{ color: '#57514f', fontWeight: 600, marginBottom: 8, fontSize: 13 }}>{label}</p>
      {done.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: p.fill, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#57514f', flex: 1 }}>{p.name}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#57514f' }}>{p.value}</span>
        </div>
      ))}
      {never.length > 0 && (
        <>
          <p style={{ fontSize: 10, color: '#a8a29e', fontWeight: 600, marginTop: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t('stats_never_done', lang)}
          </p>
          {never.map((p) => (
            <p key={p.name} style={{ fontSize: 11, color: '#a8a29e', marginBottom: 2 }}>{p.name}</p>
          ))}
        </>
      )}
    </div>
  );
}

export default function TaskStatsPage() {
  const { state, dispatch } = useAppContext();
  const lang = state.language;
  const { templates, fetchTemplates } = useTaskTemplates();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);
  const monthRange = useMemo(() => getMonthRange(monthOffset, lang), [monthOffset, lang]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (isMockMode) {
        dispatch({ type: 'SET_RAGAZZI', payload: MOCK_RAGAZZI });
        setTasks(getMockTasks(''));
      } else {
        const [ragazziRes, tasksRes] = await Promise.all([
          apiGet<Ragazzo[]>('/api/ragazzi'),
          apiGet<Task[]>('/api/tasks'),
        ]);
        if (ragazziRes.data) dispatch({ type: 'SET_RAGAZZI', payload: ragazziRes.data });
        if (tasksRes.data) setTasks(tasksRes.data);
      }
      setLoading(false);
    };
    load();
  }, [dispatch]);

  const chartData = useMemo(() => {
    const { start, end } = monthRange;
    const startMs = start.getTime();
    const endMs = end.getTime();
    const templateNames = new Set(templates.map((tpl) => tpl.name));
    return state.ragazzi.map((r) => {
      const row: Record<string, string | number> = { name: r.firstName };
      templates.forEach((tpl) => { row[tpl.name] = 0; });
      tasks.forEach((task) => {
        if (!templateNames.has(task.name)) return;
        const count = task.completions.filter((c) => {
          if (c.ragazzoId !== r.id) return false;
          const ts = new Date(c.completedAt).getTime();
          return ts >= startMs && ts < endMs;
        }).length;
        if (count > 0) row[task.name] = (row[task.name] as number) + count;
      });
      return row;
    });
  }, [state.ragazzi, tasks, templates, monthRange]);

  const colorOf = (templateIndex: number) => TASK_PALETTE[templateIndex % TASK_PALETTE.length] as string;

  const isEmpty = state.ragazzi.length === 0 || templates.length === 0;

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-800">
          {t('stats_title', lang)}{' '}
          <span className="text-sm text-[17px] text-violet-800">({monthRange.label})</span>
        </h1>
        <NotificationBell />
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => setMonthOffset(monthOffset - 1)}>
          ← {t('stats_prev_month', lang)}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setMonthOffset(0)}>
          {t('stats_current_month', lang)}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setMonthOffset(monthOffset + 1)}>
          {t('stats_next_month', lang)} →
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-stone-800/40 py-12">{t('common_loading', lang)}</div>
      ) : isEmpty ? (
        <div className="text-center text-stone-800/40 py-12">{t('common_no_data', lang)}</div>
      ) : (
        <div className="glass-card flex-1 min-h-0 p-6 flex flex-col">
          <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
            <div className="lg:flex-[2] min-h-[300px] lg:min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 113, 108, 0.2)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#78716c', fontSize: 12, fontWeight: 500 }}
                    axisLine={{ stroke: '#d6d3d1' }}
                    interval={0}
                  />
                  <YAxis
                    allowDecimals={false}
                    width={34}
                    tick={{ fill: '#78716c', fontSize: 12, fontWeight: 500 }}
                    axisLine={{ stroke: '#d6d3d1' }}
                    domain={[0, (dataMax: number) => Math.max(dataMax, 30)]}
                  />
                  <Tooltip content={<CustomTooltip lang={lang} />} />
                  {templates.map((tpl, i) => (
                    <Bar key={tpl.id} dataKey={tpl.name} stackId="a" fill={colorOf(i)} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:flex-1 min-h-0">
              <Card className="h-64 lg:h-full overflow-y-auto">
                <p className="text-md font-semibold text-stone-600 uppercase tracking-wide mb-3">{t('stats_legend', lang)}</p>
                <div className="space-y-2">
                  {templates.map((tpl, i) => (
                    <div key={tpl.id} className="flex items-center gap-3">
                      <div style={{ backgroundColor: colorOf(i) }} className="w-4 h-4 rounded-sm shrink-0" />
                      <div 
                       style={{ backgroundColor: hexToRgba(colorOf(i), 0.22) }}
                      className="text-sm text-stone-800 flex-1 truncate">{tpl.name}</div>
                      <div className="rounded px-2 py-1 text-sm text-stone-800">
                        {tpl.points}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
      {/* <DownloadPDFFAB weekOffset={weekOffset} lang={lang} /> */}
    </div>
  );
}
