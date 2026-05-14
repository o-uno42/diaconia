import { useEffect } from 'react';
import { useAppContext } from '../../store/AppContext';
import { useTasks } from '../../hooks/useTasks';
import { t } from '../../i18n/translations';
import { celebrate } from '../../lib/celebrate';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

const ROME_TZ = 'Europe/Rome';

function getRomeTodayUtcDate(): Date {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ROME_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);

  return new Date(Date.UTC(year, month - 1, day));
}

export default function RagazzoTaskView() {
  const { state } = useAppContext();
  const { tasks, fetchTasks, completeTask, bookTask, weekOffset, setWeekOffset } = useTasks();
  const lang = state.language;
  const ragazzoId = state.currentUser?.ragazzoId;

  useEffect(() => { fetchTasks(); }, [weekOffset, fetchTasks]);

  const romeTodayUtc = getRomeTodayUtcDate();
  const today = romeTodayUtc.getUTCDay();
  const todayIdx = today === 0 ? 6 : today - 1; // Mon=0 ... Sun=6
  const dayNames = [t('day_mon', lang), t('day_tue', lang), t('day_wed', lang), t('day_thu', lang), t('day_fri', lang), t('day_sat', lang), t('day_sun', lang)];

  const mondayOffset = today === 0 ? -6 : 1 - today;
  const weekStart = new Date(romeTodayUtc);
  weekStart.setUTCDate(romeTodayUtc.getUTCDate() + mondayOffset + weekOffset * 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  const weekRangeLabel = `${new Intl.DateTimeFormat('it-IT', { timeZone: ROME_TZ, day: '2-digit', month: 'short' }).format(weekStart)} - ${new Intl.DateTimeFormat('it-IT', { timeZone: ROME_TZ, day: '2-digit', month: 'short' }).format(weekEnd)}`;

  const todayLabel = new Intl.DateTimeFormat('it-IT', {
    timeZone: ROME_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(romeTodayUtc);

  const myTasks = tasks.filter((t) => t.assignedTo === ragazzoId);
  const availableTasks = tasks.filter((t) => !t.assignedTo);

  return (
    <div className="animate-fade-in pb-24">
      <h1 className="text-2xl font-bold text-stone-800 mb-2">{t('task_title', lang)}</h1>
      <p className="text-stone-800/50 text-sm mb-6">{dayNames[todayIdx]} — {todayLabel}</p>

      {/* Week nav */}
      <div className="flex items-center gap-2 mb-6 justify-center">
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(weekOffset - 1)}>
          <span className="text-2xl">←</span>
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>{weekRangeLabel}</Button>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(weekOffset + 1)}>
          <span className="text-2xl">→</span>
        </Button>
      </div>

      {/* My Tasks */}
      <h2 className="text-lg font-semibold text-stone-800 mb-3">{t('task_my_tasks', lang)}</h2>
      {myTasks.length === 0 ? (
        <p className="text-stone-800/30 text-sm mb-6">{t('task_none_assigned', lang)}</p>
      ) : (
        <div className="space-y-3 mb-6">
          {myTasks.map((task) => {
            const completed = task.completions.some((c) => c.ragazzoId === ragazzoId && c.day === todayIdx);
            // Card color: verde se completato, lilla se prenotato ma non completato
            const cardBg = completed
              ? 'bg-emerald-100'
              : 'bg-violet-100';
            const cardBorder = completed
              ? 'border-emerald-500'
              : 'border-violet-400';
            const badgeColor = completed
              ? 'emerald'
              : 'violet';
            return (
              <Card key={task.id} className={`${cardBg} ${cardBorder}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-stone-800">{task.name}</p>
                    <Badge color={badgeColor} className="mt-1">+{task.points} {t('task_points', lang)}</Badge>
                  </div>
                  {completed ? (
                    <Badge color="emerald" className="flex flex-col items-center">
                      <span className="block text-5xl text-yellow-200 mb-1">★</span>
                      {/* {t('task_completed', lang)} */}
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      className="animate-pulse-cta hover:animate-none"
                      onClick={(e) => {
                        if (!ragazzoId) return;
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        celebrate({
                          x: (rect.left + rect.width / 2) / window.innerWidth,
                          y: (rect.top + rect.height / 2) / window.innerHeight,
                        });
                        completeTask(task.id, ragazzoId, todayIdx);
                      }}
                    >
                      {t('task_complete', lang)}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Available to book */}
      <h2 className="text-lg font-semibold text-stone-800 mb-3">{t('task_available', lang)}</h2>
      {availableTasks.length === 0 ? (
        <p className="text-stone-800/30 text-sm">{t('task_none_available', lang)}</p>
      ) : (
        <div className="space-y-3">
          {availableTasks.map((task) => (
            <Card key={task.id} hover className="bg-stone-100" onClick={() => bookTask(task.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-800">{task.name}</p>
                  <Badge color="sky" className="mt-1">{task.points} {t('task_points', lang)}</Badge>
                </div>
                <Button variant="secondary" size="sm">{t('task_book', lang)}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
