import { useState, useEffect } from 'react';
import { useAppContext } from '../../store/AppContext';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import { getMockCommitments } from '../../lib/mockData';
import { getWeekId, formatWeekRange } from '../../hooks/useTasks';
import { apiDownloadFile } from '../../lib/api';
import { t, getDayLabels } from '../../i18n/translations';
import type { Commitment } from '@shared/types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import DownloadPDFFAB from '../ui/DownloadPDFFAB';
import NotificationBell from '../layout/NotificationBell';

export default function CommitmentsCalendarPage() {
  const { state } = useAppContext();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [weekOffset, setOffset] = useState(0);
  const [editingCell, setEditingCell] = useState<{ ragazzoId: string; day: number } | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newDay, setNewDay] = useState(0);
  const [newRagazzoId, setNewRagazzoId] = useState('');
  const [newText, setNewText] = useState('');
  const lang = state.language;
  const weekId = getWeekId(weekOffset);
  const days = getDayLabels(lang);
  const todayJs = weekOffset === 0 ? new Date().getDay() : -1;

  useEffect(() => {
    if (isMockMode) { setCommitments(getMockCommitments(weekId)); return; }
    apiGet<Commitment[]>(`/api/commitments?weekId=${weekId}`).then((res) => {
      if (res.data) setCommitments(res.data);
    });
  }, [weekId]);

  const handleDownloadPdf = async () => {
    const weekLabel = formatWeekRange(weekOffset, lang);
    await apiDownloadFile(
      `/api/export/commitments-pdf?weekId=${encodeURIComponent(weekId)}&weekLabel=${encodeURIComponent(weekLabel)}`,
      `commitments-${weekId}.pdf`,
    );
  };

  const handleCreate = async () => {
    if (!newText.trim() || !newRagazzoId) return;
    const existing = commitments.find((c) => c.ragazzoId === newRagazzoId && c.day === newDay);
    if (existing) {
      if (isMockMode) {
        setCommitments(commitments.map((c) => (c.id === existing.id ? { ...c, text: newText.trim() } : c)));
      } else {
        const res = await apiPatch<Commitment>(`/api/commitments/${existing.id}`, { text: newText.trim() });
        if (res.data) setCommitments(commitments.map((c) => (c.id === existing.id ? res.data! : c)));
      }
    } else {
      if (isMockMode) {
        setCommitments([...commitments, { id: `mock-${Date.now()}`, ragazzoId: newRagazzoId, weekId, day: newDay, text: newText }]);
      } else {
        const res = await apiPost<Commitment>('/api/commitments', { ragazzoId: newRagazzoId, weekId, day: newDay, text: newText });
        if (res.data) setCommitments([...commitments, res.data]);
      }
    }
    setShowCreate(false); setNewText('');
  };

  const handleDelete = async (id: string) => {
    if (!isMockMode) await apiDelete(`/api/commitments/${id}`);
    setCommitments(commitments.filter((c) => c.id !== id));
  };

  const startInlineEdit = (ragazzoId: string, day: number) => {
    const existing = commitments.find((c) => c.ragazzoId === ragazzoId && c.day === day);
    setEditingCell({ ragazzoId, day });
    setEditingText(existing?.text ?? '');
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;
    const trimmed = editingText.trim();
    const existing = commitments.find((c) => c.ragazzoId === editingCell.ragazzoId && c.day === editingCell.day);

    if (!trimmed) {
      if (existing) await handleDelete(existing.id);
      setEditingCell(null);
      setEditingText('');
      return;
    }

    if (existing) {
      if (isMockMode) {
        setCommitments(commitments.map((c) => (c.id === existing.id ? { ...c, text: trimmed } : c)));
      } else {
        const res = await apiPatch<Commitment>(`/api/commitments/${existing.id}`, { text: trimmed });
        if (res.data) {
          setCommitments(commitments.map((c) => (c.id === existing.id ? res.data! : c)));
        }
      }
    } else if (isMockMode) {
      setCommitments([
        ...commitments,
        {
          id: `mock-${Date.now()}`,
          ragazzoId: editingCell.ragazzoId,
          weekId,
          day: editingCell.day,
          text: trimmed,
        },
      ]);
    } else {
      const res = await apiPost<Commitment>('/api/commitments', {
        ragazzoId: editingCell.ragazzoId,
        weekId,
        day: editingCell.day,
        text: trimmed,
      });
      if (res.data) setCommitments([...commitments, res.data]);
    }

    setEditingCell(null);
    setEditingText('');
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-800">{t('commit_title', lang)} <span className="text-sm text-[17px] text-violet-800">({formatWeekRange(weekOffset, lang)})</span></h1>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => setShowCreate(true)}>{t('commit_add', lang)}</Button>
          <NotificationBell />
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => setOffset(weekOffset - 1)}>
          ← {t('task_prev_week', lang)}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setOffset(0)}>{t('task_today', lang)}</Button>
        <Button variant="ghost" size="sm" onClick={() => setOffset(weekOffset + 1)}>
          {t('task_next_week', lang)} →
        </Button>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full min-w-[900px] table-fixed border-collapse">
          <colgroup>
            <col className="w-44" />
            {days.map((_, i) => (
              <col key={i} style={{ width: `${100 / days.length}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-stone-300/60 border-b border-stone-400/40">
              <th className="text-left px-4 py-3 text-sm font-bold text-stone-900 border-r border-stone-400/50">{t('rag_first_name', lang)}</th>
              {days.map((d, i) => {
                const isToday = todayJs === (i + 1) % 7;
                return (
                  <th
                    key={i}
                    className={`text-center px-2 py-3 text-sm font-bold border-l border-stone-400/40 ${isToday ? 'bg-amber-400/50 text-stone-900' : i % 2 === 0 ? 'bg-stone-200/20' : 'bg-stone-100/10'}`}
                  >
                    {d}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {state.ragazzi.length === 0 ? (
              <tr><td colSpan={days.length + 1} className="text-center py-8 text-stone-800/30">{t('common_no_data', lang)}</td></tr>
            ) : (
              state.ragazzi.map((r) => (
                <tr key={r.id} className="border-b border-stone-300/40 hover:bg-white/20 transition-colors">
                  <td className="px-4 py-3 bg-stone-200/50 border-r border-stone-300/50">
                    <p className="text-sm font-semibold text-stone-900 break-words">{r.firstName} {r.lastName}</p>
                  </td>
                  {days.map((_, dayIdx) => {
                    const cellCommits = commitments.filter((c) => c.ragazzoId === r.id && c.day === dayIdx);
                    const hasContent = cellCommits.length > 0;
                    const isEditing = editingCell?.ragazzoId === r.id && editingCell.day === dayIdx;
                    const isTodayCell = todayJs === (dayIdx + 1) % 7;
                    return (
                      <td
                        key={dayIdx}
                        className={`px-2 py-2 align-top border-l border-stone-300/40 cursor-text ${isTodayCell && hasContent ? 'bg-amber-400/50' : isTodayCell ? 'bg-amber-400/20' : hasContent ? 'bg-indigo-300/30' : dayIdx % 2 === 0 ? 'bg-stone-100/10' : 'bg-white/5'}`}
                        onClick={() => startInlineEdit(r.id, dayIdx)}
                      >
                        {isEditing ? (
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={saveInlineEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                void saveInlineEdit();
                              }
                              if (e.key === 'Escape') {
                                setEditingCell(null);
                                setEditingText('');
                              }
                            }}
                            autoFocus
                            className="w-full min-h-[70px] resize-none rounded-md border border-stone-400/50 bg-white/70 p-2 text-xs font-medium text-stone-900 outline-none focus:ring-2 focus:ring-accent-400/50"
                            placeholder={t('commit_text', lang)}
                          />
                        ) : (
                          <div className="space-y-1">
                            {cellCommits.map((c) => (
                              <div key={c.id} className="p-2 rounded-lg group flex items-start justify-between gap-1">
                                <p className="text-xs font-medium text-stone-800 break-words whitespace-normal min-w-0 flex-1">{c.text}</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleDelete(c.id);
                                  }}
                                  className="text-red-400/0 group-hover:text-red-400/60 text-[10px] transition-colors shrink-0"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
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

      <DownloadPDFFAB weekOffset={weekOffset} lang={lang} onClick={handleDownloadPdf} />

      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setNewText(''); }} title={commitments.find((c) => c.ragazzoId === newRagazzoId && c.day === newDay) ? t('commit_edit', lang) : t('commit_add', lang)} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-stone-800/60 mb-1">{t('task_assign', lang)}</label>
            <select value={newRagazzoId} onChange={(e) => {
              const id = e.target.value;
              setNewRagazzoId(id);
              const ex = commitments.find((c) => c.ragazzoId === id && c.day === newDay);
              setNewText(ex?.text ?? '');
            }} className="input-field">
              <option value="">—</option>
              {state.ragazzi.map((r) => <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-stone-800/60 mb-1">{t('commit_day', lang)}</label>
            <select value={newDay} onChange={(e) => {
              const d = parseInt(e.target.value);
              setNewDay(d);
              const ex = commitments.find((c) => c.ragazzoId === newRagazzoId && c.day === d);
              setNewText(ex?.text ?? '');
            }} className="input-field">
              {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-stone-800/60 mb-1">{t('commit_text', lang)}</label>
            <textarea value={newText} onChange={(e) => setNewText(e.target.value)} rows={3} className="input-field resize-none" />
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
