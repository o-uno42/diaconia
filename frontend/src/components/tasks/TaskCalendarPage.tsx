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

  const getRagazzoName = (id?: string) => {
    if (!id) return t('task_unassigned', lang);
    const r = state.ragazzi.find((r) => r.id === id);
    return r ? `${r.firstName} ${r.lastName.charAt(0)}.` : id;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('task_title', lang)}</h1>
          <p className="text-white/50 text-sm mt-1">{currentWeekId}</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && <Button onClick={() => setShowCreate(true)} size="sm">{t('task_add', lang)}</Button>}
          <NotificationBell />
        </div>
      </div>

      {/* Week selector */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(weekOffset - 1)}>
          ← {t('task_prev_week', lang)}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>Oggi</Button>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(weekOffset + 1)}>
          {t('task_next_week', lang)} →
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/40">{t('common_loading', lang)}</div>
      ) : (
        /* Admin grid */
        <div className="glass-card overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-sm font-semibold text-white/60 w-48">{t('task_name', lang)}</th>
                <th className="text-center px-2 py-3 text-sm font-semibold text-white/60 w-16">{t('task_points', lang)}</th>
                {days.map((d, i) => (
                  <th key={i} className={`text-center px-2 py-3 text-sm font-semibold ${new Date().getDay() === (i + 1) % 7 ? 'text-accent-400' : 'text-white/60'}`}>{d}</th>
                ))}
                {isAdmin && <th className="w-12" />}
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-white/30">{t('common_no_data', lang)}</td></tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{task.name}</p>
                      <p className="text-xs text-white/40">{getRagazzoName(task.assignedTo)}</p>
                    </td>
                    <td className="text-center">
                      <Badge color={task.points >= 2 ? 'emerald' : task.points >= 1 ? 'indigo' : 'gray'}>
                        {task.points}
                      </Badge>
                    </td>
                    {days.map((_, dayIdx) => {
                      const completion = task.completions.find((c) => c.day === dayIdx);
                      return (
                        <td key={dayIdx} className="text-center px-1">
                          {completion ? (
                            <span className="inline-flex w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 items-center justify-center text-xs" title={getRagazzoName(completion.ragazzoId)}>
                              ✓
                            </span>
                          ) : (
                            <span className="inline-flex w-7 h-7 rounded-lg bg-white/5 items-center justify-center text-white/10 text-xs">·</span>
                          )}
                        </td>
                      );
                    })}
                    {isAdmin && (
                      <td className="px-2">
                        <button onClick={() => deleteTask(task.id)} className="text-red-400/50 hover:text-red-400 text-xs transition-colors">✕</button>
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
            <label className="block text-sm text-white/60 mb-1">{t('task_name', lang)}</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input-field" autoFocus />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">{t('task_points', lang)}</label>
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
