import { useEffect, useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { apiGet } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import { MOCK_WEEKLY_ACTIVITIES, getMockWeeklyActivityEntries } from '../../lib/mockData';
import { getWeekId, formatWeekRange } from '../../hooks/useTasks';
import { t, getFullDayLabels } from '../../i18n/translations';
import type { WeeklyActivity, WeeklyActivityEntry } from '@shared/types';
import Button from '../ui/Button';
import Card from '../ui/Card';

const ROME_TZ = 'Europe/Rome';

function getRomeTodayDayIdx(): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ROME_TZ, weekday: 'short',
  }).formatToParts(new Date());
  const wd = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const map: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return map[wd] ?? 0;
}

export default function RagazzoWeeklyActivitiesView() {
  const { state } = useAppContext();
  const lang = state.language;
  const [weekOffset, setWeekOffset] = useState(0);
  const weekId = getWeekId(weekOffset);
  const dayLabels = getFullDayLabels(lang);
  const todayIdx = weekOffset === 0 ? getRomeTodayDayIdx() : -1;

  const [activities, setActivities] = useState<WeeklyActivity[]>([]);
  const [entries, setEntries] = useState<WeeklyActivityEntry[]>([]);

  useEffect(() => {
    if (isMockMode) {
      setActivities(MOCK_WEEKLY_ACTIVITIES);
      return;
    }
    apiGet<WeeklyActivity[]>('/api/weekly-activities').then((res) => {
      if (res.data) setActivities(res.data);
    });
  }, []);

  useEffect(() => {
    if (isMockMode) {
      setEntries(getMockWeeklyActivityEntries(weekId));
      return;
    }
    apiGet<WeeklyActivityEntry[]>(`/api/weekly-activities/entries/list?weekId=${weekId}`).then((res) => {
      if (res.data) setEntries(res.data);
    });
  }, [weekId]);

  const activityName = (id: string) => activities.find((a) => a.id === id)?.name ?? '';

  // Sort: by day, then by activity creation order (matches admin table row order)
  const activityOrder = new Map(activities.map((a, i) => [a.id, i]));
  const sorted = entries
    .filter((e) => e.text.trim().length > 0)
    .sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return (activityOrder.get(a.activityId) ?? 0) - (activityOrder.get(b.activityId) ?? 0);
    });

  // Split into sections based on relation to today (only meaningful for current week)
  let todayEntries: typeof sorted = [];
  let upcomingEntries: typeof sorted = [];
  let pastEntries: typeof sorted = [];

  if (weekOffset === 0) {
    todayEntries = sorted.filter((e) => e.day === todayIdx);
    upcomingEntries = sorted.filter((e) => e.day > todayIdx);
    pastEntries = sorted.filter((e) => e.day < todayIdx);
  } else if (weekOffset > 0) {
    upcomingEntries = sorted;
  } else {
    pastEntries = sorted;
  }

  const totalVisible = sorted.length;

  const renderCard = (e: (typeof sorted)[0], style: 'today' | 'upcoming' | 'past') => {
    const styles = {
      today:    { bg: 'bg-amber-50',  border: 'border-amber-400',  label: 'text-amber-800',  body: 'text-stone-800' },
      upcoming: { bg: 'bg-indigo-50', border: 'border-indigo-300', label: 'text-indigo-800', body: 'text-stone-800' },
      past:     { bg: 'bg-white',     border: 'border-stone-200',  label: 'text-stone-500',  body: 'text-stone-600' },
    }[style];
    return (
      <Card key={e.id} className={`${styles.bg} ${styles.border}`}>
        <p className={`text-sm font-semibold ${styles.label}`}>
          {dayLabels[e.day]} — {activityName(e.activityId)}
        </p>
        <p className={`text-base mt-1 whitespace-pre-wrap break-words ${styles.body}`}>{e.text}</p>
      </Card>
    );
  };

  return (
    <div className="animate-fade-in pb-24">
      <h1 className="text-2xl font-bold text-stone-800 mb-2">{t('weekly_activities', lang)}</h1>
      <p className="text-stone-800/50 text-sm mb-6">{formatWeekRange(weekOffset, lang)}</p>

      <div className="flex items-center gap-2 mb-6 justify-center">
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(weekOffset - 1)}>
          <span className="text-2xl">←</span>
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>
          {formatWeekRange(weekOffset, lang)}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(weekOffset + 1)}>
          <span className="text-2xl">→</span>
        </Button>
      </div>

      {totalVisible === 0 ? (
        <p className="text-stone-800/40 text-sm text-center mt-8">{t('wa_ragazzo_empty', lang)}</p>
      ) : (
        <div className="space-y-6">
          {todayEntries.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-2">
                Attività di oggi
              </h2>
              <div className="space-y-3">
                {todayEntries.map((e) => renderCard(e, 'today'))}
              </div>
            </section>
          )}

          {upcomingEntries.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-indigo-700 uppercase tracking-wide mb-2">
                Attività in arrivo
              </h2>
              <div className="space-y-3">
                {upcomingEntries.map((e) => renderCard(e, 'upcoming'))}
              </div>
            </section>
          )}

          {pastEntries.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wide mb-2">
                Attività trascorse
              </h2>
              <div className="space-y-3">
                {pastEntries.map((e) => renderCard(e, 'past'))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
