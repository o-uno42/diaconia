import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { apiGet, apiPatch } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import { MOCK_RAGAZZI } from '../../lib/mockData';
import { t } from '../../i18n/translations';
import type { Ragazzo, Language } from '@shared/types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import PointsChart from './PointsChart';
import PhotosSection from './PhotosSection';
import KeywordsSection from './KeywordsSection';
import NotificationBell from '../layout/NotificationBell';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useAppContext();
  const [ragazzo, setRagazzo] = useState<Ragazzo | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Ragazzo>>({});
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

  if (!ragazzo) return <div className="flex items-center justify-center h-64 text-white/50">{t('common_loading', lang)}</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{ragazzo.firstName} {ragazzo.lastName}</h1>
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
        {/* Personal Info */}
        <Card header={<h2 className="text-lg font-semibold text-white">Informazioni personali</h2>} className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              { key: 'firstName', label: t('rag_first_name', lang), adminOnly: true },
              { key: 'lastName', label: t('rag_last_name', lang), adminOnly: true },
              { key: 'birthDate', label: t('rag_birth_date', lang), adminOnly: true, type: 'date' },
              { key: 'phone', label: t('rag_phone', lang), adminOnly: false },
              { key: 'email', label: t('rag_email', lang), adminOnly: true },
              { key: 'taxCode', label: t('rag_tax_code', lang), adminOnly: true },
            ] as const).map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-white/50 mb-1">{field.label}</label>
                {editing && (isAdmin || !field.adminOnly) ? (
                  <input
                    type={('type' in field && field.type) || 'text'}
                    value={String(formData[field.key] ?? '')}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="input-field"
                  />
                ) : (
                  <p className="text-white py-2">{String(ragazzo[field.key] || '—')}</p>
                )}
              </div>
            ))}

            {/* Language selector */}
            <div>
              <label className="block text-sm font-medium text-white/50 mb-1">{t('rag_language', lang)}</label>
              {editing ? (
                <select
                  value={formData.language ?? ragazzo.language}
                  onChange={(e) => {
                    setFormData({ ...formData, language: e.target.value as Language });
                    dispatch({ type: 'SET_LANGUAGE', payload: e.target.value as Language });
                    if (e.target.value === 'ar') document.documentElement.dir = 'rtl';
                    else document.documentElement.dir = 'ltr';
                  }}
                  className="input-field"
                >
                  <option value="it">Italiano</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                </select>
              ) : (
                <p className="text-white py-2">{{ it: 'Italiano', en: 'English', fr: 'Français', ar: 'العربية' }[ragazzo.language]}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Keywords */}
        <Card header={<h2 className="text-lg font-semibold text-white">{t('rag_keywords', lang)}</h2>}>
          <KeywordsSection
            keywords={ragazzo.keywords}
            editable={editing && isAdmin}
            onChange={(kw) => setFormData({ ...formData, keywords: kw })}
          />
        </Card>

        {/* Points Chart */}
        <Card header={<h2 className="text-lg font-semibold text-white">{t('points_weekly', lang)}</h2>} className="lg:col-span-2">
          <PointsChart pointsHistory={ragazzo.pointsHistory} />
        </Card>

        {/* Photos */}
        <Card header={<h2 className="text-lg font-semibold text-white">{t('photo_title', lang)}</h2>} className="lg:col-span-3">
          <PhotosSection ragazzoId={ragazzo.id} photos={ragazzo.photos} isAdmin={isAdmin} />
        </Card>
      </div>
    </div>
  );
}
