import { Fragment, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { apiGet, apiPost, apiDelete, apiDownloadFile } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import {
  MOCK_RAGAZZI,
  getMockWashingMachineEntries,
  addMockWashingMachineEntry,
  removeMockWashingMachineEntry,
} from '../../lib/mockData';
import { t } from '../../i18n/translations';
import type { Ragazzo, WashingMachineEntry, WashingMachineEntryType, Language } from '@shared/types';
import Button from '../ui/Button';
import NotificationBell from '../layout/NotificationBell';

interface MonthInfo {
  year: number;
  month: number; // 1-12
  daysInMonth: number;
  label: string;
}

function getMonthInfo(offset: number, lang: Language): MonthInfo {
  const now = new Date();
  const ref = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const year = ref.getFullYear();
  const month = ref.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const raw = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(ref);
  const label = raw.charAt(0).toUpperCase() + raw.slice(1);
  return { year, month, daysInMonth, label };
}

function dateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Index entries by `${ragazzoId}|${date}|${type}` for O(1) lookups.
function indexEntries(entries: WashingMachineEntry[]): Set<string> {
  const set = new Set<string>();
  entries.forEach((e) => set.add(`${e.ragazzoId}|${e.date}|${e.entryType}`));
  return set;
}

export default function WashingMachinePage() {
  const { state, dispatch } = useAppContext();
  const lang = state.language;
  const [monthOffset, setMonthOffset] = useState(0);
  const month = useMemo(() => getMonthInfo(monthOffset, lang), [monthOffset, lang]);
  const [entries, setEntries] = useState<WashingMachineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load ragazzi list once.
  useEffect(() => {
    if (state.ragazzi.length > 0) return;
    if (isMockMode) {
      dispatch({ type: 'SET_RAGAZZI', payload: MOCK_RAGAZZI });
      return;
    }
    apiGet<Ragazzo[]>('/api/ragazzi').then((res) => {
      if (res.data) dispatch({ type: 'SET_RAGAZZI', payload: res.data });
    });
  }, [dispatch, state.ragazzi.length]);

  // Reload entries whenever the visible month changes.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      if (isMockMode) {
        setEntries(getMockWashingMachineEntries(month.year, month.month));
        setLoading(false);
        return;
      }
      const res = await apiGet<WashingMachineEntry[]>(
        `/api/washing-machine?year=${month.year}&month=${month.month}`,
      );
      if (cancelled) return;
      if (res.error) {
        setError(res.error);
        setEntries([]);
      } else {
        setEntries(res.data ?? []);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [month.year, month.month]);

  const checkedIndex = useMemo(() => indexEntries(entries), [entries]);

  const toggle = async (ragazzoId: string, day: number, type: WashingMachineEntryType) => {
    const date = dateString(month.year, month.month, day);
    const key = `${ragazzoId}|${date}|${type}`;
    const currentlyChecked = checkedIndex.has(key);
    const previous = entries;
    const tmpId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Optimistic update
    if (currentlyChecked) {
      setEntries((prev) =>
        prev.filter((e) => !(e.ragazzoId === ragazzoId && e.date === date && e.entryType === type)),
      );
    } else {
      setEntries((prev) => [...prev, { id: tmpId, ragazzoId, date, entryType: type }]);
    }

    if (isMockMode) {
      if (currentlyChecked) removeMockWashingMachineEntry(ragazzoId, date, type);
      else addMockWashingMachineEntry(ragazzoId, date, type);
      return;
    }

    const res = currentlyChecked
      ? await apiDelete(`/api/washing-machine?ragazzoId=${ragazzoId}&date=${date}&entryType=${type}`)
      : await apiPost<WashingMachineEntry>('/api/washing-machine', { ragazzoId, date, entryType: type });

    if (res.error) {
      setEntries(previous);
      setError(res.error);
      return;
    }

    // Swap the optimistic row for the server's canonical one on insert.
    if (!currentlyChecked && res.data) {
      const inserted = res.data;
      setEntries((prev) => prev.map((e) => (e.id === tmpId ? inserted : e)));
    }
  };

  const days = useMemo(
    () => Array.from({ length: month.daysInMonth }, (_, i) => i + 1),
    [month.daysInMonth],
  );

  const ragazzi = state.ragazzi;
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === month.year && today.getMonth() + 1 === month.month;

  return (
    <div className="animate-fade-in pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-800">
          {t('washing_machine_title', lang)}{' '}
          <span className="text-[17px] text-violet-800">({month.label})</span>
        </h1>
        <div className='flex items-center gap-3'>
          <Button
              className='bg-indigo-600 hover:bg-indigo-800 text-white'
              onClick={async () => {
                await apiDownloadFile(
                  `/api/export-pdf/washing-machine-pdf?year=${month.year}&month=${month.month}&monthLabel=${encodeURIComponent(month.label)}`,
                  `lavatrice-${month.year}-${String(month.month).padStart(2, '0')}.pdf`,
                );
              }}
            >
              {t('wa_download_pdf', lang)} ({month.label})
            </Button>
          <NotificationBell />
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => setMonthOffset((o) => o - 1)}>
          ← {t('washing_machine_prev_month', lang)}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setMonthOffset(0)}>
          {t('washing_machine_current_month', lang)}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setMonthOffset((o) => o + 1)}>
          {t('washing_machine_next_month', lang)} →
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-stone-800/40 py-12">{t('common_loading', lang)}</div>
      ) : ragazzi.length === 0 ? (
        <div className="text-center text-stone-800/40 py-12">{t('washing_machine_empty_ragazzi', lang)}</div>
      ) : (
        <div className="glass-card overflow-auto p-2">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-white/80 backdrop-blur z-10">
              <tr>
                <th rowSpan={2} className="w-8 sticky left-0 bg-stone-300/70 backdrop-blur z-20 px-1 py-2 text-left text-stone-800 font-semibold border-b border-r border-stone-300 align-bottom">
                  {t('washing_machine_day_header', lang)}
                </th>
                {ragazzi.map((r) => (
                  <th
                    key={r.id}
                    colSpan={2}
                    className="px-3 py-2 text-center text-stone-800 font-semibold border-b border-l border-stone-300 whitespace-nowrap bg-stone-200/70"
                  >
                    {r.firstName} {r.lastName}
                  </th>
                ))}
              </tr>
              <tr>
                {ragazzi.map((r) => (
                  <Fragment key={r.id}>
                    <th className="w-10 px-2 py-1 text-center text-xs font-medium text-stone-700 border-b border-l border-stone-200 bg-white/40">
                      {t('washing_machine_col_v', lang)}
                    </th>
                    <th className="w-10 px-2 py-1 text-center text-xs font-medium text-stone-700 border-b border-l border-stone-300 bg-stone-200/50">
                      {t('washing_machine_col_la', lang)}
                    </th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => {
                const isToday = isCurrentMonth && day === today.getDate();
                return (
                  <tr key={day} className={isToday ? 'bg-amber-50' : day % 2 === 0 ? 'bg-white/30' : ''}>
                    <td className={`w-8 sticky left-0 z-10 px-1 py-1.5 font-medium text-stone-700 border-b border-r border-stone-300/80 ${isToday ? 'bg-amber-100' : day % 2 === 0 ? 'bg-stone-200/70' : 'bg-stone-200/50'}`}>
                      {day}
                    </td>
                    {ragazzi.map((r) => {
                      const date = dateString(month.year, month.month, day);
                      const vChecked = checkedIndex.has(`${r.id}|${date}|V`);
                      const laChecked = checkedIndex.has(`${r.id}|${date}|LA`);
                      return (
                        <Fragment key={r.id}>
                          <td className="w-10 text-center border-b border-l border-stone-200/60 p-0 bg-white/20">
                            <Cell checked={vChecked} onClick={() => void toggle(r.id, day, 'V')} />
                          </td>
                          <td className="w-10 text-center border-b border-l border-stone-300/60 p-0 bg-stone-200/30">
                            <Cell checked={laChecked} onClick={() => void toggle(r.id, day, 'LA')} />
                          </td>
                        </Fragment>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Cell({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={`w-10 h-9 inline-flex items-center justify-center transition-colors ${
        checked
          ? 'text-indigo-700 font-bold text-lg hover:bg-indigo-100'
          : 'text-stone-300 hover:bg-indigo-50 hover:text-indigo-400'
      }`}
    >
      {checked ? '✕' : ''}
    </button>
  );
}
