import { useEffect, useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { useTasks, formatWeekRange } from '../../hooks/useTasks';
import { useTaskTemplates } from '../../hooks/useTaskTemplates';
import { t, getDayLabels } from '../../i18n/translations';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import NotificationBell from '../layout/NotificationBell';
import Card from '../ui/Card';
import manageImg from '../../assets/manage.png';
import type { TaskCompletion } from '@shared/types';
import DownloadPDFFAB from '../ui/DownloadPDFFAB';

const DRAG_MIME = 'application/x-task-template';

export default function TaskCalendarPage() {
  const { state } = useAppContext();
  const { tasks, loading, weekOffset, fetchTasks, createTask, deleteTask, setWeekOffset, confirmCompletion, deleteCompletion } = useTasks();
  const { templates, fetchTemplates, createTemplate, updateTemplate, deleteTemplate } = useTaskTemplates();
  const [showManage, setShowManage] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPoints, setNewPoints] = useState('1');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingText, setRenamingText] = useState('');
  const [renamingPoints, setRenamingPoints] = useState('1');
  const [dropActive, setDropActive] = useState(false);
  const [confirmingCompletion, setConfirmingCompletion] = useState<TaskCompletion | null>(null);
  const lang = state.language;
  const isAdmin = state.currentUser?.role === 'admin';
  const days = getDayLabels(lang);
  const todayJs = weekOffset === 0 ? new Date().getDay() : -1;

  useEffect(() => { fetchTasks(); }, [weekOffset, fetchTasks]);
  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // Set of names already in this week — used to dim templates that can't be re-added
  const weekTaskNames = new Set(tasks.map((t) => t.name));

  const handleCreateTemplate = async () => {
    if (!newName.trim()) return;
    await createTemplate(newName.trim(), parseFloat(newPoints));
    setNewName('');
    setNewPoints('1');
    setShowAddForm(false);
  };

  const handleRenameTemplate = async (id: string) => {
    const name = renamingText.trim();
    const points = parseFloat(renamingPoints);
    if (!name) { setRenamingId(null); return; }
    await updateTemplate(id, { name, points });
    setRenamingId(null);
    setRenamingText('');
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm(t('task_template_confirm_delete', lang))) return;
    await deleteTemplate(id);
  };

  const handleDeleteWeekTask = async (taskId: string) => {
    if (!confirm(t('task_confirm_delete', lang))) return;
    await deleteTask(taskId);
  };

  const onTemplateDragStart = (e: React.DragEvent<HTMLDivElement>, templateId: string) => {
    e.dataTransfer.setData(DRAG_MIME, templateId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const onDropZoneDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isAdmin) return;
    if (e.dataTransfer.types.includes(DRAG_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      if (!dropActive) setDropActive(true);
    }
  };

  const onDropZoneDragLeave = () => setDropActive(false);

  const onDropZoneDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropActive(false);
    const templateId = e.dataTransfer.getData(DRAG_MIME);
    if (!templateId) return;
    const tpl = templates.find((x) => x.id === templateId);
    if (!tpl) return;
    if (weekTaskNames.has(tpl.name)) return;
    await createTask(tpl.name, tpl.points);
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">{t('task_title', lang)} <span className="text-sm text-[17px] text-violet-800">({formatWeekRange(weekOffset, lang)})</span></h1>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && <Button onClick={() => setShowManage(true)} size="sm">{t('task_manage', lang)}</Button>}
          <NotificationBell />
        </div>
      </div>

      {/* Week selector */}
      {/* <div className="flex items-center justify-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(weekOffset - 1)}>
          ← {t('task_prev_week', lang)}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>{t('task_today', lang)}</Button>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(weekOffset + 1)}>
          {t('task_next_week', lang)} →
        </Button>
      </div> */}

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-stone-800/40">{t('common_loading', lang)}</div>
      ) : (
        <>
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex flex-col min-h-0 gap-4">
            <div className="flex items-center justify-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setWeekOffset(weekOffset - 1)}>
                ← {t('task_prev_week', lang)}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>{t('task_today', lang)}</Button>
              <Button variant="ghost" size="sm" onClick={() => setWeekOffset(weekOffset + 1)}>
                {t('task_next_week', lang)} →
              </Button>
            </div>
            <div className="glass-card flex-1 min-h-0 overflow-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="bg-stone-300/60 border-b border-stone-400/40">
                    <th className="text-left px-4 py-3 text-sm font-bold text-stone-900 w-48 border-r border-stone-400/50">{t('task_name', lang)}</th>
                    <th className="text-center px-2 py-3 text-sm font-bold text-stone-900 w-16 border-r border-stone-400/50">{t('task_points', lang)}</th>
                    {days.map((d, i) => {
                      const isToday = todayJs === (i + 1) % 7;
                      return (
                        <th key={i} className={`text-center px-2 py-3 text-sm font-bold border-l border-stone-400/40 ${isToday ? 'bg-amber-400/50 text-stone-900' : 'text-stone-900'}`}>
                          {d}
                        </th>
                      );
                    })}
                    {isAdmin && <th className="w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr><td colSpan={days.length + 2 + (isAdmin ? 1 : 0)} className="text-center py-8 text-stone-800/30">{t('common_no_data', lang)}</td></tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task.id} className="border-b border-stone-300/40 hover:bg-white/20 transition-colors">
                        <td className="px-4 py-3 bg-stone-200/50 border-r border-stone-300/50">
                          <p className="text-sm font-semibold text-stone-900">{task.name}</p>
                        </td>
                        <td className="text-center bg-stone-200/50 border-r border-stone-300/50">
                          <Badge color="yellow">{task.points}</Badge>
                        </td>
                        {days.map((_, dayIdx) => {
                          const dayCompletions = task.completions.filter((c) => c.day === dayIdx);
                          const hasContent = dayCompletions.length > 0;
                          const isTodayCell = todayJs === (dayIdx + 1) % 7;
                          return (
                            <td key={dayIdx} className={`text-center px-1 py-1 align-middle border-l border-stone-300/40 ${isTodayCell && hasContent ? 'bg-amber-400/50' : isTodayCell ? 'bg-amber-400/20' : hasContent ? 'bg-emerald-100/30' : ''}`}>
                              {dayCompletions.length === 0 ? (
                                <span className="inline-flex w-7 h-7 rounded-lg items-center justify-center text-stone-400 text-xs"></span>
                              ) : (
                                <div className="flex flex-col items-center gap-0.5">
                                  {dayCompletions.map((c) => {
                                    const r = state.ragazzi.find((rg) => rg.id === c.ragazzoId);
                                    const confirmed = c.adminConfirmed;
                                    return (
                                      <span
                                        key={c.id}
                                        className={`inline-flex items-center gap-1 text-[11px] font-medium rounded px-1.5 py-0.5 leading-tight ${
                                          confirmed
                                            ? 'text-emerald-900 bg-emerald-200/80'
                                            : 'text-stone-700 bg-stone-300/70'
                                        }`}
                                      >
                                        {r?.firstName ?? '?'}
                                        {!confirmed && isAdmin && (
                                          <button
                                            type="button"
                                            onClick={() => setConfirmingCompletion(c)}
                                            aria-label={t('task_completion_pending_tooltip', lang)}
                                            title={t('task_completion_pending_tooltip', lang)}
                                            className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-white/70 hover:bg-white text-stone-700 hover:text-emerald-700 text-[10px] leading-none transition-colors"
                                          >
                                            ✓
                                          </button>
                                        )}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        {isAdmin && (
                          <td className="text-center px-1">
                            <button
                              onClick={() => handleDeleteWeekTask(task.id)}
                              aria-label={t('rag_delete', lang)}
                              className="w-6 h-6 rounded-full bg-red-400 hover:bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm active:scale-95 transition-all mx-auto"
                            >
                              ✕
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Drop zone — admin only */}
            {isAdmin && (
              <div
                onDragOver={onDropZoneDragOver}
                onDragLeave={onDropZoneDragLeave}
                onDrop={onDropZoneDrop}
                className={`rounded-xl border-2 border-dashed py-6 px-4 text-center transition-all ${
                  dropActive
                    ? 'border-violet-500 bg-violet-100/40 scale-[1.01]'
                    : 'border-stone-400/60 bg-white/10 hover:bg-white/20'
                }`}
              >
                <p className="text-sm font-semibold text-stone-700">{t('task_template_drop_here', lang)}</p>
                <p className="text-xs text-stone-600 mt-1">{t('task_template_drop_hint', lang)}</p>
              </div>
            )}
          </div>

          {/* Right-side Card: general task templates */}
          <div className="lg:col-span-1 min-h-0 flex flex-col gap-4">
            <Card className='!bg-amber-200/50 relative'>
              <p className="text-md font-semibold text-stone-600 uppercase tracking-wide mb-2">{t('task_templates_title', lang)}</p>
              <div className="max-h-[280px] overflow-y-auto space-y-1.5 pb-16">
                {templates.length === 0 ? (
                  <p className="text-sm text-stone-800/40 text-center py-4">{t('task_templates_empty', lang)}</p>
                ) : (
                  [...templates].sort((a, b) => {
                    const aUsed = weekTaskNames.has(a.name) ? 1 : 0;
                    const bUsed = weekTaskNames.has(b.name) ? 1 : 0;
                    return aUsed - bUsed;
                  }).map((tpl) => {
                    const alreadyInWeek = weekTaskNames.has(tpl.name);
                    const isDraggable = isAdmin && !alreadyInWeek;
                    return (
                      <div
                        key={tpl.id}
                        draggable={isDraggable}
                        onDragStart={isDraggable ? (e) => onTemplateDragStart(e, tpl.id) : undefined}
                        className={`flex items-center gap-2 p-2 rounded-lg border ${
                          alreadyInWeek
                            ? 'border-stone-300/30 bg-white/5 opacity-50'
                            : isDraggable
                              ? 'border-stone-300/50 bg-white/20 hover:bg-white/40 cursor-grab active:cursor-grabbing active:scale-[0.98]'
                              : 'border-stone-300/50 bg-white/10'
                        } transition-all`}
                        title={alreadyInWeek ? t('task_template_already_in_week', lang) : undefined}
                      >
                        <Badge color="yellow">{tpl.points}</Badge>
                        <p className="text-sm text-stone-800 flex-1 truncate">{tpl.name}</p>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[148px] bg-gradient-to-t from-white/90 from-20% to-transparent pointer-events-none" />
            </Card>
            <div className="flex-1 min-h-0 flex items-end justify-center overflow-visible">
            </div>
          </div>
        </div>
        </>
      )}

      <DownloadPDFFAB weekOffset={weekOffset} lang={lang} />

      {/* Decorative image — fixed so it's not clipped by layout overflow */}
      <img
        src={manageImg}
        alt=""
        className="fixed bottom-[-95px] right-[-130px] w-[680px] opacity-50 pointer-events-none z-0"
      />

      {/* Manage general tasks (templates) modal */}
      {/* Confirm-completion modal */}
      <Modal
        isOpen={confirmingCompletion !== null}
        onClose={() => setConfirmingCompletion(null)}
        title={t('task_completion_confirm_title', lang)}
        size="sm"
      >
        <div className="space-y-4">
          {confirmingCompletion && (
            <p className="text-sm text-stone-700">
              <strong>
                {state.ragazzi.find((r) => r.id === confirmingCompletion.ragazzoId)?.firstName ?? '?'}
              </strong>
              {' — '}
              {tasks.find((tk) => tk.id === confirmingCompletion.taskId)?.name ?? ''}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                if (!confirmingCompletion) return;
                await deleteCompletion(confirmingCompletion.id);
                setConfirmingCompletion(null);
              }}
            >
              {t('task_completion_confirm_no', lang)}
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                if (!confirmingCompletion) return;
                await confirmCompletion(confirmingCompletion.id);
                setConfirmingCompletion(null);
              }}
            >
              {t('task_completion_confirm_yes', lang)}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showManage} onClose={() => { setShowManage(false); setRenamingId(null); }} title={t('task_templates_title', lang)} size="md">
        <div className="space-y-4">
          {/* Add new template */}
          <div className="space-y-3">
            {!showAddForm && (
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-full animate-pulse-cta animate-pulse-soft hover:animate-none"
              >
                {t('task_template_add', lang)} +
              </Button>
            )}
            {showAddForm && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex gap-3 items-end items-center">
                  <div className="flex-1">
                    <label className="block text-sm text-stone-800 mb-1">{t('task_name', lang)}</label>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateTemplate();
                        if (e.key === 'Escape') { setShowAddForm(false); setNewName(''); setNewPoints('1'); }
                      }}
                      autoFocus
                      className="input-field"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-sm text-stone-800 mb-1">{t('task_points', lang)}</label>
                    <select value={newPoints} onChange={(e) => setNewPoints(e.target.value)} className="input-field">
                      <option value="0.5">0.5</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setNewName(''); setNewPoints('1'); }}>
                    {t('common_cancel', lang)}
                  </Button>
                  <Button size="sm" onClick={handleCreateTemplate}>
                    {t('common_save', lang)}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Templates list */}
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {templates.length === 0 ? (
              <li className="text-sm text-stone-800/40 text-center py-4">{t('task_templates_empty', lang)}</li>
            ) : (
              templates.map((tpl) => (
                <li key={tpl.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/20 border border-white/10">
                  {renamingId === tpl.id ? (
                    <>
                      <input
                        value={renamingText}
                        onChange={(e) => setRenamingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameTemplate(tpl.id);
                          if (e.key === 'Escape') { setRenamingId(null); setRenamingText(''); }
                        }}
                        autoFocus
                        className="input-field flex-1"
                      />
                      <select
                        value={renamingPoints}
                        onChange={(e) => setRenamingPoints(e.target.value)}
                        className="input-field w-20"
                      >
                        <option value="0.5">0.5</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </select>
                      <Button size="sm" onClick={() => handleRenameTemplate(tpl.id)}>{t('common_save', lang)}</Button>
                      <Button variant="ghost" size="sm" onClick={() => { setRenamingId(null); setRenamingText(''); }}>{t('common_cancel', lang)}</Button>
                    </>
                  ) : (
                    <>
                      <Badge color="yellow">{tpl.points}</Badge>
                      <p className="flex-1 text-sm text-stone-800 break-words">{tpl.name}</p>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setRenamingId(tpl.id);
                          setRenamingText(tpl.name);
                          setRenamingPoints(String(tpl.points));
                        }}
                      >
                        {t('rag_edit', lang)}
                      </Button>
                      <button
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        aria-label={t('rag_delete', lang)}
                        className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center justify-center shadow-sm active:scale-95 transition-all shrink-0"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </li>
              ))
            )}
          </ul>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => { setShowManage(false); setRenamingId(null); }}>{t('common_close', lang)}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
