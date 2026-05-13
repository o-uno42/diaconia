import { useState, useEffect } from 'react';
import { useAppContext } from '../../store/AppContext';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import { getMockCommitments } from '../../lib/mockData';
import { getWeekId } from '../../hooks/useTasks';
import { t, getDayLabels } from '../../i18n/translations';
import type { Commitment } from '@shared/types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import NotificationBell from '../layout/NotificationBell';

export default function CommitmentsCalendarPage() {
  const { state } = useAppContext();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [weekOffset, setOffset] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newDay, setNewDay] = useState(0);
  const [newRagazzoId, setNewRagazzoId] = useState('');
  const [newText, setNewText] = useState('');
  const lang = state.language;
  const weekId = getWeekId(weekOffset);
  const days = getDayLabels(lang);

  useEffect(() => {
    if (isMockMode) { setCommitments(getMockCommitments(weekId)); return; }
    apiGet<Commitment[]>(`/api/commitments?weekId=${weekId}`).then((res) => {
      if (res.data) setCommitments(res.data);
    });
  }, [weekId]);

  const handleCreate = async () => {
    if (!newText.trim() || !newRagazzoId) return;
    if (isMockMode) {
      setCommitments([...commitments, { id: `mock-${Date.now()}`, ragazzoId: newRagazzoId, weekId, day: newDay, text: newText }]);
    } else {
      const res = await apiPost<Commitment>('/api/commitments', { ragazzoId: newRagazzoId, weekId, day: newDay, text: newText });
      if (res.data) setCommitments([...commitments, res.data]);
    }
    setShowCreate(false); setNewText('');
  };

  const handleDelete = async (id: string) => {
    if (!isMockMode) await apiDelete(`/api/commitments/${id}`);
    setCommitments(commitments.filter((c) => c.id !== id));
  };

  const getRagazzoName = (id: string) => {
    const r = state.ragazzi.find((r) => r.id === id);
    return r ? `${r.firstName} ${r.lastName.charAt(0)}.` : '—';
  };

  const ragazzoColors = ['from-accent-600/30 to-accent-400/10', 'from-emerald-600/30 to-emerald-400/10', 'from-sky-600/30 to-sky-400/10'];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t('commit_title', lang)}</h1>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => setShowCreate(true)}>{t('commit_add', lang)}</Button>
          <NotificationBell />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => setOffset(weekOffset - 1)}>←</Button>
        <span className="text-white/50 text-sm">{weekId}</span>
        <Button variant="ghost" size="sm" onClick={() => setOffset(weekOffset + 1)}>→</Button>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-white/10">
              {days.map((d, i) => (
                <th key={i} className="px-3 py-3 text-sm font-semibold text-white/60 text-center">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {days.map((_, dayIdx) => {
                const dayCommits = commitments.filter((c) => c.day === dayIdx);
                return (
                  <td key={dayIdx} className="px-2 py-3 align-top border-r border-white/5 last:border-r-0 min-w-[120px]">
                    <div className="space-y-2">
                      {dayCommits.map((c, ci) => (
                        <div key={c.id} className={`p-2 rounded-lg bg-gradient-to-br ${ragazzoColors[ci % 3]} border border-white/5 group`}>
                          <p className="text-xs font-medium text-white">{c.text}</p>
                          <p className="text-[10px] text-white/40 mt-1">{getRagazzoName(c.ragazzoId)}</p>
                          <button onClick={() => handleDelete(c.id)} className="text-red-400/0 group-hover:text-red-400/60 text-[10px] transition-colors">✕</button>
                        </div>
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={t('commit_add', lang)} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">{t('task_assign', lang)}</label>
            <select value={newRagazzoId} onChange={(e) => setNewRagazzoId(e.target.value)} className="input-field">
              <option value="">—</option>
              {state.ragazzi.map((r) => <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Giorno</label>
            <select value={newDay} onChange={(e) => setNewDay(parseInt(e.target.value))} className="input-field">
              {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">{t('commit_text', lang)}</label>
            <input value={newText} onChange={(e) => setNewText(e.target.value)} className="input-field" />
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
