import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import { MOCK_REPORTS, MOCK_RAGAZZI } from '../../lib/mockData';
import { t, type TranslationKeys } from '../../i18n/translations';
import type { ReportEntry, ReportSections } from '@shared/types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Highlight from '../ui/Highlight';

const SECTION_KEYS: { key: keyof ReportSections; labelKey: keyof TranslationKeys }[] = [
  { key: 'dailyArea', labelKey: 'report_daily_area' },
  { key: 'health', labelKey: 'report_health' },
  { key: 'familyArea', labelKey: 'report_family_area' },
  { key: 'socialRelational', labelKey: 'report_social_relational' },
  { key: 'psychoAffective', labelKey: 'report_psycho_affective' },
  { key: 'individualSession', labelKey: 'report_individual_session' },
];

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useAppContext();
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [editEntry, setEditEntry] = useState<ReportEntry | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newSections, setNewSections] = useState<ReportSections>({
    dailyArea: '', health: '', familyArea: '', socialRelational: '', psychoAffective: '', individualSession: '',
  });
  const lang = state.language;

  const ragazzo = state.ragazzi.find((r) => r.id === id) ?? MOCK_RAGAZZI.find((r) => r.id === id);
  const keywords = ragazzo?.keywords ?? [];

  useEffect(() => {
    if (!id) return;
    if (isMockMode) {
      setEntries(MOCK_REPORTS[id] ?? []);
      return;
    }
    apiGet<ReportEntry[]>(`/api/ragazzi/${id}/report`).then((res) => {
      if (res.data) setEntries(res.data);
    });
  }, [id]);

  const handleCreate = async () => {
    if (!id) return;
    if (isMockMode) {
      const newEntry: ReportEntry = {
        id: `mock-${Date.now()}`, ragazzoId: id, date: newDate,
        sections: newSections, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      setEntries([newEntry, ...entries]);
    } else {
      const res = await apiPost<ReportEntry>(`/api/ragazzi/${id}/report`, { date: newDate, sections: newSections });
      if (res.data) setEntries([res.data, ...entries]);
    }
    setShowCreate(false);
    setNewSections({ dailyArea: '', health: '', familyArea: '', socialRelational: '', psychoAffective: '', individualSession: '' });
  };

  const handleUpdate = async () => {
    if (!editEntry || !id) return;
    if (!isMockMode) {
      await apiPatch(`/api/ragazzi/${id}/report/${editEntry.id}`, { sections: editEntry.sections });
    }
    setEntries(entries.map((e) => (e.id === editEntry.id ? editEntry : e)));
    setEditEntry(null);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!id) return;
    if (!isMockMode) await apiDelete(`/api/ragazzi/${id}/report/${entryId}`);
    setEntries(entries.filter((e) => e.id !== entryId));
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('report_title', lang)}</h1>
          {ragazzo && <p className="text-white/50 text-sm">{ragazzo.firstName} {ragazzo.lastName}</p>}
        </div>
        <Button onClick={() => setShowCreate(true)}>{t('report_add', lang)}</Button>
      </div>

      {/* Entries */}
      <div className="space-y-4">
        {entries.length === 0 && <p className="text-center text-white/30 py-8">{t('common_no_data', lang)}</p>}
        {entries.map((entry) => (
          <Card key={entry.id} header={
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">{new Date(entry.date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <div className="flex gap-2">
                <button onClick={() => setEditEntry(entry)} className="text-accent-400 hover:text-accent-300 text-sm">{t('rag_edit', lang)}</button>
                <button onClick={() => handleDeleteEntry(entry.id)} className="text-red-400 hover:text-red-300 text-sm">{t('rag_delete', lang)}</button>
              </div>
            </div>
          }>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SECTION_KEYS.map(({ key, labelKey }) => (
                <div key={key}>
                  <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">{t(labelKey, lang)}</h4>
                  <Highlight text={entry.sections[key]} keywords={keywords} className="text-sm text-white/80 leading-relaxed" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={t('report_add', lang)} size="xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">{t('report_date', lang)}</label>
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="input-field" />
          </div>
          {SECTION_KEYS.map(({ key, labelKey }) => (
            <div key={key}>
              <label className="block text-sm text-white/60 mb-1">{t(labelKey, lang)}</label>
              <textarea
                value={newSections[key]}
                onChange={(e) => setNewSections({ ...newSections, [key]: e.target.value })}
                className="input-field min-h-[80px] resize-y"
                rows={3}
              />
            </div>
          ))}
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>{t('common_cancel', lang)}</Button>
            <Button onClick={handleCreate}>{t('report_save', lang)}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editEntry} onClose={() => setEditEntry(null)} title={`${t('rag_edit', lang)} — ${editEntry?.date ?? ''}`} size="xl">
        {editEntry && (
          <div className="space-y-4">
            {SECTION_KEYS.map(({ key, labelKey }) => (
              <div key={key}>
                <label className="block text-sm text-white/60 mb-1">{t(labelKey, lang)}</label>
                <textarea
                  value={editEntry.sections[key]}
                  onChange={(e) => setEditEntry({ ...editEntry, sections: { ...editEntry.sections, [key]: e.target.value } })}
                  className="input-field min-h-[80px] resize-y"
                  rows={3}
                />
              </div>
            ))}
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setEditEntry(null)}>{t('common_cancel', lang)}</Button>
              <Button onClick={handleUpdate}>{t('report_save', lang)}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
