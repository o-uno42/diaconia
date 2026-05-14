import { useEffect, useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { useTasks, getWeekId } from '../../hooks/useTasks';
import { t, getDayLabels } from '../../i18n/translations';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import NotificationBell from '../layout/NotificationBell';

export default function TaskCalendarPage() {
  const { state } = useAppContext();
  const { tasks, loading, weekOffset, fetchTasks, createTask, deleteTask, setWeekOffset, currentWeekId } = useTasks();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPoints, setNewPoints] = useState('1');
  const lang = state.language;
  const isAdmin = state.currentUser?.role === 'admin';
  const days = getDayLabels(lang);

  useEffect(() => { fetchTasks(); }, [weekOffset, fetchTasks]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createTask(newName, parseFloat(newPoints));
    setNewName(''); setNewPoints('1'); setShowCreate(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">{t('task_title', lang)}</h1>
          {/* <p className="text-stone-800/50 text-sm mt-1">{currentWeekId}</p> */}
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && <Button onClick={() => setShowCreate(true)} size="sm">{t('task_add', lang)}</Button>}
          <NotificationBell />
        </div>
      </div>

      {/* Week selector */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(weekOffset - 1)}>
          ← {t('task_prev_week', lang)}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>{t('task_today', lang)}</Button>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(weekOffset + 1)}>
          {t('task_next_week', lang)} →
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-stone-800/40">{t('common_loading', lang)}</div>
      ) : (
        /* Admin grid */
        <div className="glass-card overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-stone-300/60 border-b border-stone-400/40">
                <th className="text-left px-4 py-3 text-sm font-bold text-stone-900 w-48">{t('task_name', lang)}</th>
                <th className="text-center px-2 py-3 text-sm font-bold text-stone-900 w-16">{t('task_points', lang)}</th>
                {days.map((d, i) => (
                  <th key={i} className={`text-center px-2 py-3 text-sm font-bold ${new Date().getDay() === (i + 1) % 7 ? 'text-indigo-700' : 'text-stone-900'}`}>{d}</th>
                ))}
                {isAdmin && <th className="w-12" />}
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-stone-800/30">{t('common_no_data', lang)}</td></tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="border-b border-stone-300/40 hover:bg-white/20 transition-colors">
                    <td className="px-4 py-3 bg-stone-200/50">
                      <p className="text-sm font-semibold text-stone-900">{task.name}</p>
                    </td>
                    <td className="text-center bg-stone-200/50">
                      <Badge color="amber">{task.points}</Badge>
                    </td>
                    {days.map((_, dayIdx) => {
                      const dayCompletions = task.completions.filter((c) => c.day === dayIdx);
                      return (
                        <td key={dayIdx} className="text-center px-1 py-1 align-middle">
                          {dayCompletions.length === 0 ? (
                            <span className="inline-flex w-7 h-7 rounded-lg bg-white/30 items-center justify-center text-stone-400 text-xs">·</span>
                          ) : (
                            <div className="flex flex-col items-center gap-0.5">
                              {dayCompletions.map((c) => {
                                const r = state.ragazzi.find((rg) => rg.id === c.ragazzoId);
                                return (
                                  <span
                                    key={c.id}
                                    className="text-[11px] font-medium text-emerald-900 bg-emerald-200/80 rounded px-1.5 py-0.5 leading-tight"
                                  >
                                    {r?.firstName ?? '?'}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    {isAdmin && (
                      <td className="px-2">
                        <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-800 text-xs transition-colors">✕</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={t('task_add', lang)} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-stone-800/60 mb-1">{t('task_name', lang)}</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input-field" autoFocus />
          </div>
          <div>
            <label className="block text-sm text-stone-800/60 mb-1">{t('task_points', lang)}</label>
            <select value={newPoints} onChange={(e) => setNewPoints(e.target.value)} className="input-field">
              <option value="0.5">0.5</option>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>{t('common_cancel', lang)}</Button>
            <Button onClick={handleCreate}>{t('common_save', lang)}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
