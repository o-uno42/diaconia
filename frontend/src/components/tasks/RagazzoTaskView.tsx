import { useEffect } from 'react';
import { useAppContext } from '../../store/AppContext';
import { useTasks } from '../../hooks/useTasks';
import { t } from '../../i18n/translations';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

export default function RagazzoTaskView() {
  const { state } = useAppContext();
  const { tasks, fetchTasks, completeTask, bookTask, weekOffset, setWeekOffset } = useTasks();
  const lang = state.language;
  const ragazzoId = state.currentUser?.ragazzoId;

  useEffect(() => { fetchTasks(); }, [weekOffset, fetchTasks]);

  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1; // Mon=0 ... Sun=6
  const dayNames = [t('day_mon', lang), t('day_tue', lang), t('day_wed', lang), t('day_thu', lang), t('day_fri', lang), t('day_sat', lang), t('day_sun', lang)];

  const myTasks = tasks.filter((t) => t.assignedTo === ragazzoId);
  const availableTasks = tasks.filter((t) => !t.assignedTo);

  return (
    <div className="animate-fade-in pb-24">
      <h1 className="text-2xl font-bold text-white mb-2">{t('task_title', lang)}</h1>
      <p className="text-white/50 text-sm mb-6">{dayNames[todayIdx]} — {new Date().toLocaleDateString('it-IT')}</p>

      {/* Week nav */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(weekOffset - 1)}>←</Button>
        <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>{t('task_week', lang)}</Button>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(weekOffset + 1)}>→</Button>
      </div>

      {/* My Tasks */}
      <h2 className="text-lg font-semibold text-white mb-3">I miei compiti</h2>
      {myTasks.length === 0 ? (
        <p className="text-white/30 text-sm mb-6">Nessun compito assegnato</p>
      ) : (
        <div className="space-y-3 mb-6">
          {myTasks.map((task) => {
            const completed = task.completions.some((c) => c.ragazzoId === ragazzoId && c.day === todayIdx);
            return (
              <Card key={task.id} className={completed ? 'border-emerald-500/30' : ''}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{task.name}</p>
                    <Badge color={task.points >= 2 ? 'emerald' : 'indigo'} className="mt-1">{task.points} {t('task_points', lang)}</Badge>
                  </div>
                  {completed ? (
                    <Badge color="emerald">✓ {t('task_completed', lang)}</Badge>
                  ) : (
                    <Button size="sm" onClick={() => ragazzoId && completeTask(task.id, ragazzoId, todayIdx)}>
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
      <h2 className="text-lg font-semibold text-white mb-3">Compiti disponibili</h2>
      {availableTasks.length === 0 ? (
        <p className="text-white/30 text-sm">Nessun compito disponibile</p>
      ) : (
        <div className="space-y-3">
          {availableTasks.map((task) => (
            <Card key={task.id} hover onClick={() => bookTask(task.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{task.name}</p>
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
