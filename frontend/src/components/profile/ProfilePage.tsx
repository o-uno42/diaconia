import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { apiGet, apiPatch } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import { MOCK_RAGAZZI, MOCK_EMAIL_TEMPLATES } from '../../lib/mockData';
import { t } from '../../i18n/translations';
import type { Ragazzo, Language } from '@shared/types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import PointsChart from './PointsChart';
import PhotosSection from './PhotosSection';
import KeywordsSection from './KeywordsSection';
import NotificationBell from '../layout/NotificationBell';
import SendIcon from '../icons/SendIcon';
import Modal from '../ui/Modal';

const TEXT_SCALE_OPTIONS = [100, 102, 105, 110, 115, 120, 125] as const;

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [ragazzo, setRagazzo] = useState<Ragazzo | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Ragazzo>>({});
  const [personalOpen, setPersonalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const isAdmin = state.currentUser?.role === 'admin';
  const lang = state.language;

  // For ragazzo viewing their own profile
  const ragazzoId = id ?? state.currentUser?.ragazzoId;

  useEffect(() => {
    const load = async () => {
      if (!ragazzoId) return;
      if (isMockMode) {
        const mock = MOCK_RAGAZZI.find((r) => r.id === ragazzoId);
        if (mock) { setRagazzo(mock); setFormData(mock); }
        return;
      }
      const res = await apiGet<Ragazzo>(`/api/ragazzi/${ragazzoId}`);
      if (res.data) { setRagazzo(res.data); setFormData(res.data); }
    };
    load();
  }, [ragazzoId]);

  const handleSave = async () => {
    if (!ragazzoId || !formData) return;
    if (!isMockMode) {
      const res = await apiPatch<Ragazzo>(`/api/ragazzi/${ragazzoId}`, formData);
      if (res.data) { setRagazzo(res.data); dispatch({ type: 'UPDATE_RAGAZZO', payload: res.data }); }
    } else {
      setRagazzo({ ...ragazzo!, ...formData } as Ragazzo);
    }
    setEditing(false);
  };

  const handleLanguageChange = async (nextLanguage: Language) => {
    const currentLanguage = (formData.language ?? ragazzo?.language ?? 'it') as Language;

    // Admin keeps the existing edit/save flow.
    if (isAdmin) {
      setFormData({ ...formData, language: nextLanguage });
      return;
    }

    // Ragazzo can update language directly and persist immediately.
    setFormData({ ...formData, language: nextLanguage });
    dispatch({ type: 'SET_LANGUAGE', payload: nextLanguage });
    document.documentElement.dir = nextLanguage === 'ar' ? 'rtl' : 'ltr';

    if (!ragazzoId) return;

    if (isMockMode) {
      setRagazzo((prev) => (prev ? { ...prev, language: nextLanguage } : prev));
      return;
    }

    const res = await apiPatch<Ragazzo>(`/api/ragazzi/${ragazzoId}`, { language: nextLanguage });
    if (res.data) {
      setRagazzo(res.data);
      setFormData(res.data);
      dispatch({ type: 'UPDATE_RAGAZZO', payload: res.data });
      return;
    }

    // Rollback if persistence fails.
    setFormData({ ...formData, language: currentLanguage });
    dispatch({ type: 'SET_LANGUAGE', payload: currentLanguage });
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
  };

  const handleTextScaleChange = async (value: number) => {
    if (state.currentUser?.role !== 'ragazzo') return;

    dispatch({ type: 'SET_TEXT_SCALE_PERCENT', payload: value });

    if (isMockMode) return;

    const res = await apiPatch<{ textScalePercent: number }>('/api/auth/me/preferences', {
      textScalePercent: value,
    });

    if (res.data?.textScalePercent) {
      dispatch({ type: 'SET_TEXT_SCALE_PERCENT', payload: res.data.textScalePercent });
      return;
    }

    if (res.error) {
      // Keep the app usable even if preference save fails.
      dispatch({ type: 'SET_TEXT_SCALE_PERCENT', payload: state.currentUser.textScalePercent ?? 100 });
    }
  };

  const handleHighContrastToggle = async (next: boolean) => {
    const previous = state.highContrast;
    dispatch({ type: 'SET_HIGH_CONTRAST', payload: next });

    if (isMockMode) return;

    const res = await apiPatch<{ highContrast: boolean }>('/api/auth/me/preferences', {
      highContrast: next,
    });

    if (res.error) {
      // Rollback if persistence fails.
      dispatch({ type: 'SET_HIGH_CONTRAST', payload: previous });
    }
  };

  const fillTemplate = (str: string) => {
    if (!ragazzo) return str;
    return str
      .replace(/\{ragazzoName\}/g, `${ragazzo.firstName} ${ragazzo.lastName}`)
      .replace(/\{operatore\}/g, state.currentUser?.firstName || 'Op.')
      .replace(/\{destinatario\}/g, 'Destinatario')
      .replace(/\{data\}/g, new Date().toLocaleDateString('it-IT'))
      .replace(/\{settimana\}/g, 'questa settimana')
      .replace(/\{punti\}/g, (ragazzo.pointsHistory?.reduce((sum, w) => sum + w.points, 0) || 0).toString())
      .replace(/\{familiare\}/g, 'Famiglia')
      .replace(/\{aggiornamento\}/g, '...');
  };

  function handleEmailTemplateSelect(template: typeof MOCK_EMAIL_TEMPLATES[0]) {
    const subject = encodeURIComponent(fillTemplate(template.subject));
    const body = encodeURIComponent(fillTemplate(template.body));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setEmailModalOpen(false);
  }

  if (!ragazzo) return <div className="flex items-center justify-center h-64 text-stone-800/50">{t('common_loading', lang)}</div>;

  const totalPoints = ragazzo.pointsHistory.reduce((sum, w) => sum + w.points, 0);

  return (
    <div className="animate-fade-in pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-800">{ragazzo.firstName} {ragazzo.lastName}</h1>
        <div className="flex items-center gap-3">
          {isAdmin && !editing && <Button variant="secondary" onClick={() => setEditing(true)}>{t('rag_edit', lang)}</Button>}
          {editing && (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>{t('rag_cancel', lang)}</Button>
              <Button onClick={handleSave}>{t('rag_save', lang)}</Button>
            </>
          )}
          <NotificationBell />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Celebration — total accumulated points */}
        {totalPoints > 0 && (
          <Card className="lg:col-span-3 bg-emerald-300 border-2 border-emerald-500 animate-scale-in">
            <div className="flex items-center justify-center gap-6 py-4">
              <span className="text-7xl text-yellow-200 drop-shadow-md leading-none">★</span>
              <div className="text-center">
                <p className="text-stone-700 text-lg">{t('points_card_pre', lang)}</p>
                <p className="text-6xl font-bold text-emerald-700 my-1 leading-tight">{totalPoints}</p>
                <p className="text-stone-700 text-lg">{t('points_card_post', lang)}</p>
              </div>
              <span className="text-7xl text-yellow-200 drop-shadow-md leading-none">★</span>
            </div>
          </Card>
        )}

        {/* Top task — most-executed task */}
        {ragazzo.topTask && (
          <Card className="lg:col-span-3 bg-amber-100 border-2 border-amber-500 animate-scale-in">
            <div className="flex items-center justify-center gap-4 py-2">
              <span className="text-2xl drop-shadow-md leading-none">🏆</span>
              <div className="text-center space-y-1.5">
                <p className="text-stone-700 text-[12px] tracking-wide font-medium">{t('top_task_title', lang)}</p>
                <p className="text-base font-bold text-amber-700 uppercase leading-tight">{ragazzo.topTask.name}</p>
                <p className="text-stone-700 text-xs">
                  {t('top_task_count_pre', lang)} <span className="font-bold">{ragazzo.topTask.count}</span> {t('top_task_count_post', lang)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Personal Info — collapsible (closed by default) */}
        <div className="glass-card overflow-hidden lg:col-span-2 transition-all duration-300">
          <button
            type="button"
            onClick={() => setPersonalOpen((o) => !o)}
            aria-expanded={personalOpen}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors text-left"
          >
            <h2 className="text-lg font-semibold text-stone-800">{t('profile_personal_info', lang)}</h2>
            <svg
              className={`w-8 h-8 text-stone-800 transition-transform duration-300 ${personalOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              personalOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <div className="px-6 pb-6">
                <div className="dashed-divider" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {([
                    { key: 'firstName', label: t('rag_first_name', lang), adminOnly: true },
                    { key: 'lastName', label: t('rag_last_name', lang), adminOnly: true },
                    { key: 'birthDate', label: t('rag_birth_date', lang), adminOnly: true, type: 'date' },
                    { key: 'phone', label: t('rag_phone', lang), adminOnly: false },
                    { key: 'email', label: t('rag_email', lang), adminOnly: true },
                    { key: 'taxCode', label: t('rag_tax_code', lang), adminOnly: true },
                  ] as const).map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-stone-800/50 mb-1">{field.label}</label>
                      {editing && (isAdmin || !field.adminOnly) ? (
                        <input
                          type={('type' in field && field.type) || 'text'}
                          value={String(formData[field.key] ?? '')}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          className="input-field"
                        />
                      ) : (
                        <p className="text-stone-800 py-2">{String(ragazzo[field.key] || '—')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings — language + text size (collapsible, closed by default) */}
        <div className="glass-card overflow-hidden transition-all duration-300">
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            aria-expanded={settingsOpen}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors text-left"
          >
            <h2 className="text-lg font-semibold text-stone-800">{t('profile_settings', lang)}</h2>
            <svg
              className={`w-8 h-8 text-stone-800 transition-transform duration-300 ${settingsOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              settingsOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <div className="px-6 pb-6">
                <div className="dashed-divider" />
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-800/50 mb-1">{t('rag_language', lang)}</label>
                    {editing || !isAdmin ? (
                      <select
                        value={formData.language ?? ragazzo.language}
                        onChange={(e) => void handleLanguageChange(e.target.value as Language)}
                        className="input-field"
                      >
                        <option value="it">Italiano</option>
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                        <option value="ar">العربية</option>
                      </select>
                    ) : (
                      <p className="text-stone-800 py-2">{{ it: 'Italiano', en: 'English', fr: 'Français', ar: 'العربية' }[ragazzo.language]}</p>
                    )}
                  </div>

                  {state.currentUser?.role === 'ragazzo' && (
                    <div>
                      <label className="block text-sm font-medium text-stone-800/50 mb-1">{t('settings_text_size', lang)}</label>
                      <select
                        value={state.textScalePercent}
                        onChange={(e) => void handleTextScaleChange(Number(e.target.value))}
                        className="input-field"
                      >
                        {TEXT_SCALE_OPTIONS.map((percent) => (
                          <option key={percent} value={percent}>{percent}%</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* High-contrast / visual accessibility toggle — available to all roles */}
                  <label className="flex items-center justify-between gap-3 cursor-pointer py-1">
                    <span className="text-sm font-medium text-stone-800">{t('settings_visual_accessibility', lang)}</span>
                    <span className="relative inline-block w-11 h-6">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={state.highContrast}
                        onChange={(e) => void handleHighContrastToggle(e.target.checked)}
                      />
                      <span className="block w-11 h-6 rounded-full bg-stone-300 peer-checked:bg-indigo-600 transition-colors" />
                      <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Keywords */}
        <Card header={<h2 className="text-lg font-semibold text-stone-800">{t('rag_keywords', lang)}</h2>}>
          <div className='dashed-divider'/>
          <KeywordsSection
            keywords={ragazzo.keywords}
            editable={editing && isAdmin}
            onChange={(kw) => setFormData({ ...formData, keywords: kw })}
          />
        </Card>

        {/* Points Chart */}
        <Card header={<h2 className="text-lg font-semibold text-stone-800">{t('points_weekly', lang)}</h2>} className="lg:col-span-2">
          <div className='dashed-divider'/>
          <PointsChart pointsHistory={ragazzo.pointsHistory} />
        </Card>

        {/* Email button */}
        <div className="flex justify-center items-center lg:col-span-3">
          <button
            type="button"
            // className="animate-pulse-cta hover:animate-none"
            className="animate-pulse-soft hover:animate-none px-6 py-3 rounded-xl font-semibold text-sky-800 bg-sky-200 border border-sky-500 shadow-sm hover:bg-sky-200 transition flex items-center gap-2"
            onClick={() => setEmailModalOpen(true)}
          >
            {t('email_precompiled_button', lang)}
            <SendIcon className="w-12 h-12 text-sky-800 ml-1" />
          </button>
        </div>
        <Modal isOpen={emailModalOpen} onClose={() => setEmailModalOpen(false)} title={t('email_precompiled_button', lang)} size="sm">
          <div className="space-y-3">
            {MOCK_EMAIL_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                className="w-full text-left px-4 py-3 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 transition font-medium text-sky-800"
                onClick={() => handleEmailTemplateSelect(tpl)}
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </Modal>

        {/* Photos */}
        <Card header={<h2 className="text-lg font-semibold text-stone-800">{t('photo_title', lang)}</h2>} className="lg:col-span-3">
          <PhotosSection ragazzoId={ragazzo.id} photos={ragazzo.photos} isAdmin={isAdmin} />
        </Card>
      </div>

      {/* FAB — admin-only: jump to ragazzo's report */}
      {isAdmin && id && (
        <button
          type="button"
          onClick={() => navigate(`/admin/ragazzi/${id}/report`)}
          aria-label={t('report_open', lang)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-6 py-3.5 rounded-full bg-indigo-600 text-white font-bold shadow-[0_10px_25px_rgba(79,70,229,0.4)] animate-pulse-cta hover:animate-none hover:bg-indigo-700 active:scale-95 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t('report_open', lang)}
        </button>
      )}
    </div>
  );
}
