import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { apiGet, apiPost, apiPatch, apiDelete, apiDownloadFile } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import { MOCK_REPORTS, MOCK_RAGAZZI } from '../../lib/mockData';
import { t, type TranslationKeys } from '../../i18n/translations';
import type { Language, ReportEntry, ReportSections } from '@shared/types';
import { useSpeech } from '../../hooks/useSpeech';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Highlight from '../ui/Highlight';

type SectionDef = { key: keyof ReportSections; labelKey: keyof TranslationKeys; titleColor: string };

// Returns the [start, end) instants of the month at `offset` (0 = current month)
// plus a localized "Maggio 2026"-style label.
function getMonthRange(offset: number, lang: Language) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  const raw = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(start);
  const label = raw.charAt(0).toUpperCase() + raw.slice(1);
  return { start, end, label };
}

// Left grid (3x2): 6 thematic areas
const LEFT_SECTION_KEYS: SectionDef[] = [
  { key: 'dailyArea', labelKey: 'report_daily_area', titleColor: 'text-indigo-700' },
  { key: 'health', labelKey: 'report_health', titleColor: 'text-emerald-700' },
  { key: 'familyArea', labelKey: 'report_family_area', titleColor: 'text-rose-700' },
  { key: 'socialRelational', labelKey: 'report_social_relational', titleColor: 'text-sky-700' },
  { key: 'psychoAffective', labelKey: 'report_psycho_affective', titleColor: 'text-violet-700' },
  { key: 'cognitiveArea', labelKey: 'report_cognitive_area', titleColor: 'text-teal-700' },
];

// Right column (narrower): single area shown full-height beside the grid
const RIGHT_SECTION_KEYS: SectionDef[] = [
  { key: 'individualSession', labelKey: 'report_individual_session', titleColor: 'text-amber-700' },
];

const SECTION_KEYS: SectionDef[] = [...LEFT_SECTION_KEYS, ...RIGHT_SECTION_KEYS];

const EMPTY_SECTIONS: ReportSections = {
  dailyArea: '', health: '', familyArea: '', socialRelational: '', psychoAffective: '',
  cognitiveArea: '', individualSession: '',
};

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useAppContext();
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [editMode, setEditMode] = useState(false);
  // Per-area add flow: which area is being added to (null = closed)
  const [addArea, setAddArea] = useState<keyof ReportSections | null>(null);
  const [addDate, setAddDate] = useState(new Date().toISOString().slice(0, 10));
  const [addText, setAddText] = useState('');
  const [monthOffset, setMonthOffset] = useState(0);
  const lang = state.language;
  const monthRange = useMemo(() => getMonthRange(monthOffset, lang), [monthOffset, lang]);
  const { isListening, isTranscribing, isSupported, startListening, stopListening } = useSpeech(lang);

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening((text) => {
        setAddText((prev) => (prev ? prev + ' ' + text : text));
      });
    }
  }, [isListening, startListening, stopListening]);

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

  // When the user picks a date in the add-to-area modal, prefill the textarea
  // with whatever text already exists for that (date, area), so adding to a
  // pre-existing daily entry doesn't accidentally wipe it.
  useEffect(() => {
    if (!addArea) return;
    const existing = entries.find((e) => e.date === addDate);
    setAddText(existing?.sections[addArea] ?? '');
  }, [addArea, addDate, entries]);

  const openAddArea = (area: keyof ReportSections) => {
    setAddDate(new Date().toISOString().slice(0, 10));
    setAddText('');
    setEditMode(false);
    setAddArea(area);
  };

  const openEditArea = (area: keyof ReportSections, entry: ReportEntry) => {
    setAddDate(entry.date);
    setEditMode(true);
    setAddArea(area);
    // useEffect will fill addText from entry.sections[area]
  };

  const handleSaveAddArea = async () => {
    if (!id || !addArea || !addText.trim()) return;
    const existing = entries.find((e) => e.date === addDate);

    if (existing) {
      // Patch the existing entry for that date, merging the new area text
      const mergedSections: ReportSections = { ...existing.sections, [addArea]: addText };
      if (!isMockMode) {
        await apiPatch(`/api/ragazzi/${id}/report/${existing.id}`, { sections: mergedSections });
      }
      setEntries(entries.map((e) => (e.id === existing.id ? { ...e, sections: mergedSections } : e)));
    } else {
      // Create a new entry for that date with only the chosen area filled
      const sections: ReportSections = { ...EMPTY_SECTIONS, [addArea]: addText };
      if (isMockMode) {
        const newEntry: ReportEntry = {
          id: `mock-${Date.now()}`, ragazzoId: id, date: addDate,
          sections, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        setEntries([newEntry, ...entries]);
      } else {
        const res = await apiPost<ReportEntry>(`/api/ragazzi/${id}/report`, { date: addDate, sections });
        if (res.data) setEntries([res.data, ...entries]);
      }
    }
    closeAddModal();
  };

  const closeAddModal = () => {
    stopListening();
    setAddArea(null);
    setEditMode(false);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!id) return;
    if (!isMockMode) await apiDelete(`/api/ragazzi/${id}/report/${entryId}`);
    setEntries(entries.filter((e) => e.id !== entryId));
  };

  const currentAreaLabel = addArea
    ? t(SECTION_KEYS.find((s) => s.key === addArea)!.labelKey, lang)
    : '';

  const renderAreaCard = ({ key, labelKey, titleColor }: SectionDef, heightClass: string) => {
    const { start, end } = monthRange;
    const startMs = start.getTime();
    const endMs = end.getTime();
    const areaEntries = entries
      .filter((e) => {
        if (!e.sections[key]?.trim()) return false;
        const ts = new Date(e.date).getTime();
        return ts >= startMs && ts < endMs;
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div key={key} className={`glass-card flex flex-col overflow-hidden ${heightClass}`}>
        {/* Header — area title + add button */}
        <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <h2 className={`text-sm font-semibold uppercase tracking-wider ${titleColor}`}>
            {t(labelKey, lang)}
          </h2>
          <button
            type="button"
            onClick={() => openAddArea(key)}
            aria-label={`${t('report_add', lang)} — ${t(labelKey, lang)}`}
            className="animate-pulse-cta w-9 h-9 rounded-full bg-indigo-600 text-white text-xl font-bold flex items-center justify-center shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
          >
            +
          </button>
        </div>

        {/* Scrollable list of dated entries for this area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
          {areaEntries.length === 0 ? (
            <p className="text-sm text-stone-800/40 text-center pt-4">{t('report_empty', lang)}</p>
          ) : (
            <div className="space-y-3">
              {areaEntries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => openEditArea(key, entry)}
                  className="cursor-pointer rounded-lg p-2 -mx-2 hover:bg-white/40 transition-colors"
                >
                  <div className="text-xs font-semibold text-stone-800/60 mb-1">
                    {new Date(entry.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <Highlight
                    text={entry.sections[key]}
                    keywords={keywords}
                    className="text-sm text-stone-800/90 leading-relaxed"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-stone-800">
          {t('report_title', lang)} {t('report_of', lang)} {ragazzo?.firstName} {ragazzo?.lastName}{' '}
          <span className="text-[17px] text-violet-800">({monthRange.label})</span>
        </h1>
        <Button
          className='bg-indigo-600 hover:bg-indigo-800 text-white'
          onClick={async () => {
            const { start } = monthRange;
            const year = start.getFullYear();
            const month = start.getMonth() + 1;
            const name = ragazzo ? `${ragazzo.firstName}-${ragazzo.lastName}` : id ?? 'report';
            await apiDownloadFile(
              `/api/ragazzi/${id}/report/export/docx?year=${year}&month=${month}`,
              `report-${name}-${monthRange.label}.docx`,
            );
          }}
        >
          {t('report_download', lang)} ({monthRange.label})
        </Button>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-3 mb-4 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => setMonthOffset(monthOffset - 1)}>
          ← {t('stats_prev_month', lang)}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setMonthOffset(0)}>
          {t('stats_current_month', lang)}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setMonthOffset(monthOffset + 1)}>
          {t('stats_next_month', lang)} →
        </Button>
      </div>

      {/* Layout: 3x2 grid on the left for the 6 thematic areas, then a
          narrower right column with the "Colloquio individuale" card spanning
          the full height (so it visually matches two stacked left cards). */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4">
        <div className="lg:flex-[3] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 gap-4 min-h-0">
          {LEFT_SECTION_KEYS.map((section) => renderAreaCard(section, 'h-[380px] lg:h-full min-h-0'))}
        </div>
        <div className="lg:flex-1 flex flex-col min-h-0">
          {RIGHT_SECTION_KEYS.map((section) => renderAreaCard(section, 'h-[380px] lg:h-full min-h-0'))}
        </div>
      </div>

      {/* Add-to-area Modal — scoped to a single thematic area */}
      <Modal
        isOpen={!!addArea}
        onClose={closeAddModal}
        title={editMode ? t('report_edit', lang) : `${t('report_add', lang)} — ${currentAreaLabel}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-stone-800/60 mb-1">{t('report_date', lang)}</label>
            <input
              type="date"
              value={addDate}
              onChange={(e) => setAddDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-stone-800/60 mb-1">{currentAreaLabel}</label>
            <textarea
              value={addText}
              onChange={(e) => setAddText(e.target.value)}
              className="input-field min-h-[140px] resize-y"
              rows={5}
              autoFocus
            />
          </div>

          {isSupported && (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleMicToggle}
                disabled={isTranscribing}
                aria-label={isListening ? 'Ferma registrazione' : 'Microfono'}
                className={`w-16 h-16 rounded-full text-white flex items-center justify-center shadow-md active:scale-95 transition-all ${isTranscribing
                  ? 'bg-amber-500 cursor-wait'
                  : isListening
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-violet-600 hover:bg-violet-700'
                  }`}
              >
                {isTranscribing ? (
                  /* Spinner icon */
                  <svg className="w-7 h-7 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : isListening ? (
                  /* Stop icon */
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" aria-hidden="true">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  /* Mic icon */
                  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" aria-hidden="true">
                    <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="2" />
                    <path d="M6 11a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M9 21h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </button>
              {isListening && (
                <span className="text-xs text-red-500 font-medium animate-pulse">
                  Registrazione in corso…
                </span>
              )}
              {isTranscribing && (
                <span className="text-xs text-amber-600 font-medium">
                  Trascrizione in corso…
                </span>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={closeAddModal}>{t('common_cancel', lang)}</Button>
            <Button onClick={handleSaveAddArea} disabled={isListening || isTranscribing}>{t('common_save', lang)}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit modal replaced: clicking a dated entry now opens the add modal
          in editMode (same UI + mic), so no separate edit modal needed. */}
    </div>
  );
}
