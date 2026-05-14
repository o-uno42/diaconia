import { useEffect, useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import { MOCK_WEEKLY_ACTIVITIES, getMockWeeklyActivityEntries } from '../../lib/mockData';
import { getWeekId, formatWeekRange } from '../../hooks/useTasks';
import { t, getDayLabels } from '../../i18n/translations';
import type { WeeklyActivity, WeeklyActivityEntry } from '@shared/types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import DownloadPDFFAB from '../ui/DownloadPDFFAB';
import NotificationBell from '../layout/NotificationBell';

export default function WeeklyActivitiesPage() {
  const { state } = useAppContext();
  const lang = state.language;
  const isAdmin = state.currentUser?.role === 'admin';
  const [weekOffset, setWeekOffset] = useState(0);
  const weekId = getWeekId(weekOffset);
  const days = getDayLabels(lang);
  const todayJs = weekOffset === 0 ? new Date().getDay() : -1;

  const [activities, setActivities] = useState<WeeklyActivity[]>([]);
  const [entries, setEntries] = useState<WeeklyActivityEntry[]>([]);
  const [editingCell, setEditingCell] = useState<{ activityId: string; day: number } | null>(null);
  const [editingText, setEditingText] = useState('');

  const [showManage, setShowManage] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingText, setRenamingText] = useState('');

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

  // ─── Cell inline edit ─────────────────────────────────────────────
  const startInlineEdit = (activityId: string, day: number) => {
    if (!isAdmin) return;
    const existing = entries.find((e) => e.activityId === activityId && e.day === day);
    setEditingCell({ activityId, day });
    setEditingText(existing?.text ?? '');
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;
    const trimmed = editingText.trim();
    const existing = entries.find((e) => e.activityId === editingCell.activityId && e.day === editingCell.day);

    if (!trimmed) {
      if (existing) {
        if (!isMockMode) await apiDelete(`/api/weekly-activities/entries/${existing.id}`);
        setEntries(entries.filter((e) => e.id !== existing.id));
      }
      setEditingCell(null);
      setEditingText('');
      return;
    }

    if (existing) {
      if (isMockMode) {
        setEntries(entries.map((e) => (e.id === existing.id ? { ...e, text: trimmed } : e)));
      } else {
        const res = await apiPatch<WeeklyActivityEntry>(`/api/weekly-activities/entries/${existing.id}`, { text: trimmed });
        if (res.data) setEntries(entries.map((e) => (e.id === existing.id ? res.data! : e)));
      }
    } else if (isMockMode) {
      setEntries([
        ...entries,
        { id: `mock-${Date.now()}`, activityId: editingCell.activityId, weekId, day: editingCell.day, text: trimmed },
      ]);
    } else {
      const res = await apiPost<WeeklyActivityEntry>('/api/weekly-activities/entries', {
        activityId: editingCell.activityId, weekId, day: editingCell.day, text: trimmed,
      });
      if (res.data) setEntries([...entries, res.data]);
    }

    setEditingCell(null);
    setEditingText('');
  };

  // ─── Catalog management ───────────────────────────────────────────
  const handleAddActivity = async () => {
    const name = newActivityName.trim();
    if (!name) return;
    if (isMockMode) {
      setActivities([...activities, { id: `mock-${Date.now()}`, name, createdAt: new Date().toISOString() }]);
    } else {
      const res = await apiPost<WeeklyActivity>('/api/weekly-activities', { name });
      if (res.data) setActivities([...activities, res.data]);
    }
    setNewActivityName('');
    setShowAddForm(false);
  };

  const handleRenameActivity = async (id: string) => {
    const name = renamingText.trim();
    if (!name) { setRenamingId(null); return; }
    if (isMockMode) {
      setActivities(activities.map((a) => (a.id === id ? { ...a, name } : a)));
    } else {
      const res = await apiPatch<WeeklyActivity>(`/api/weekly-activities/${id}`, { name });
      if (res.data) setActivities(activities.map((a) => (a.id === id ? res.data! : a)));
    }
    setRenamingId(null);
    setRenamingText('');
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm(t('wa_confirm_delete', lang))) return;
    if (!isMockMode) await apiDelete(`/api/weekly-activities/${id}`);
    setActivities(activities.filter((a) => a.id !== id));
    setEntries(entries.filter((e) => e.activityId !== id));
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-800">
          {t('weekly_activities', lang)} <span className="text-sm text-[17px] text-violet-800">({formatWeekRange(weekOffset, lang)})</span>
        </h1>
        <div className="flex items-center gap-3">
          {isAdmin && <Button size="sm" onClick={() => setShowManage(true)}>{t('wa_manage', lang)}</Button>}
          <NotificationBell />
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(weekOffset - 1)}>
          ← {t('task_prev_week', lang)}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>{t('task_today', lang)}</Button>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(weekOffset + 1)}>
          {t('task_next_week', lang)} →
        </Button>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full min-w-[900px] table-fixed border-collapse">
          <colgroup>
            <col className="w-48" />
            {days.map((_, i) => (
              <col key={i} style={{ width: `${100 / days.length}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-stone-300/60 border-b border-stone-400/40">
              <th className="text-left px-4 py-3 text-sm font-bold text-stone-900 border-r border-stone-400/50">&nbsp;</th>
              {days.map((d, i) => {
                const isToday = todayJs === (i + 1) % 7;
                return (
                  <th
                    key={i}
                    className={`text-center px-2 py-3 text-sm font-bold border-l border-stone-400/40 ${isToday ? 'bg-amber-400/50 text-stone-900' : i % 2 === 0 ? 'bg-stone-200/20 text-stone-900' : 'bg-stone-100/10 text-stone-900'}`}
                  >
                    {d}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr><td colSpan={days.length + 1} className="text-center py-8 text-stone-800/30">{t('wa_empty', lang)}</td></tr>
            ) : (
              activities.map((a) => (
                <tr key={a.id} className="border-b border-stone-300/40 hover:bg-white/20 transition-colors">
                  <td className="px-4 py-3 bg-stone-200/50 border-r border-stone-300/50">
                    <p className="text-sm font-semibold text-stone-900 break-words">{a.name}</p>
                  </td>
                  {days.map((_, dayIdx) => {
                    const entry = entries.find((e) => e.activityId === a.id && e.day === dayIdx);
                    const hasContent = !!entry;
                    const isEditing = editingCell?.activityId === a.id && editingCell.day === dayIdx;
                    const isTodayCell = todayJs === (dayIdx + 1) % 7;
                    const bgClass = isTodayCell && hasContent
                      ? 'bg-amber-400/50'
                      : isTodayCell
                      ? 'bg-amber-400/20'
                      : hasContent
                      ? 'bg-indigo-300/30'
                      : dayIdx % 2 === 0
                      ? 'bg-stone-100/10'
                      : 'bg-white/5';
                    return (
                      <td
                        key={dayIdx}
                        className={`px-2 py-2 align-top border-l border-stone-300/40 ${isAdmin ? 'cursor-text' : ''} ${bgClass}`}
                        onClick={() => startInlineEdit(a.id, dayIdx)}
                      >
                        {isEditing ? (
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={saveInlineEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveInlineEdit(); }
                              if (e.key === 'Escape') { setEditingCell(null); setEditingText(''); }
                            }}
                            className="w-full text-xs text-stone-800 bg-white/60 rounded p-1 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            rows={2}
                            autoFocus
                          />
                        ) : (
                          <p className="text-xs font-medium text-stone-800 break-words whitespace-normal min-h-[1.5rem]">
                            {entry?.text ?? ''}
                          </p>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manage activities modal */}
      <Modal isOpen={showManage} onClose={() => { setShowManage(false); setRenamingId(null); }} title={t('wa_manage_title', lang)} size="md">
        <div className="space-y-4">
          <div className="space-y-3">
            {!showAddForm && (
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-full animate-pulse-cta animate-pulse-soft hover:animate-none"
              >
                {t('wa_add', lang)} +
              </Button>
            )}
            {showAddForm && (
              <div className="space-y-3 animate-fade-in">
                <div>
                  <label className="block text-sm text-stone-800 mb-1">{t('wa_name', lang)}</label>
                  <input
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddActivity();
                      if (e.key === 'Escape') { setShowAddForm(false); setNewActivityName(''); }
                    }}
                    autoFocus
                    className="input-field"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setNewActivityName(''); }}>
                    {t('common_cancel', lang)}
                  </Button>
                  <Button size="sm" onClick={handleAddActivity}>
                    {t('common_save', lang)}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {activities.map((a) => (
              <li key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/20 border border-white/10">
                {renamingId === a.id ? (
                  <>
                    <input
                      value={renamingText}
                      onChange={(e) => setRenamingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameActivity(a.id);
                        if (e.key === 'Escape') { setRenamingId(null); setRenamingText(''); }
                      }}
                      autoFocus
                      className="input-field flex-1"
                    />
                    <Button size="sm" onClick={() => handleRenameActivity(a.id)}>{t('common_save', lang)}</Button>
                    <Button variant="ghost" size="sm" onClick={() => { setRenamingId(null); setRenamingText(''); }}>{t('common_cancel', lang)}</Button>
                  </>
                ) : (
                  <>
                    <p className="flex-1 text-sm text-stone-800 break-words">{a.name}</p>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => { setRenamingId(a.id); setRenamingText(a.name); }}
                    >
                      {t('rag_edit', lang)}
                    </Button>
                    <button
                      onClick={() => handleDeleteActivity(a.id)}
                      aria-label={t('rag_delete', lang)}
                      className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center justify-center shadow-sm active:scale-95 transition-all shrink-0"
                    >
                      ✕
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => { setShowManage(false); setRenamingId(null); }}>{t('common_close', lang)}</Button>
          </div>
        </div>
      </Modal>

      <DownloadPDFFAB weekOffset={weekOffset} lang={lang} />
    </div>
  );
}
