import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { apiGet, apiPost } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import { MOCK_RAGAZZI } from '../../lib/mockData';
import { t } from '../../i18n/translations';
import type { Ragazzo, Language } from '@shared/types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import NotificationBell from '../layout/NotificationBell';

const LANGUAGE_OPTIONS: Language[] = ['it', 'en', 'fr', 'ar'];

interface NewRagazzoForm {
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  email: string;
  taxCode: string;
  language: Language;
  keywords: string;
  password: string;
}

const emptyForm: NewRagazzoForm = {
  firstName: '',
  lastName: '',
  birthDate: '',
  phone: '',
  email: '',
  taxCode: '',
  language: 'it',
  keywords: '',
  password: '',
};

export default function RagazziListPage() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const lang = state.language;
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NewRagazzoForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (state.ragazzi.length > 0) return;
      dispatch({ type: 'SET_LOADING', payload: { key: 'ragazzi', value: true } });
      if (isMockMode) {
        dispatch({ type: 'SET_RAGAZZI', payload: MOCK_RAGAZZI });
      } else {
        const res = await apiGet<Ragazzo[]>('/api/ragazzi');
        if (res.data) dispatch({ type: 'SET_RAGAZZI', payload: res.data });
      }
      dispatch({ type: 'SET_LOADING', payload: { key: 'ragazzi', value: false } });
    };
    load();
  }, [dispatch, state.ragazzi.length]);

  const filtered = state.ragazzi.filter((r) =>
    `${r.firstName} ${r.lastName} ${r.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = () => {
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const updateField = <K extends keyof NewRagazzoForm>(key: K, value: NewRagazzoForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError(t('common_error', lang));
      return;
    }

    const keywords = form.keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    setSubmitting(true);

    if (isMockMode) {
      const mock: Ragazzo = {
        id: `mock-${Date.now()}`,
        userId: `mock-uid-${Date.now()}`,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        birthDate: form.birthDate,
        phone: form.phone.trim(),
        email: form.email.trim(),
        taxCode: form.taxCode.trim(),
        language: form.language,
        keywords,
        photos: [],
        pointsHistory: [],
      };
      dispatch({ type: 'ADD_RAGAZZO', payload: mock });
      setSubmitting(false);
      setModalOpen(false);
      return;
    }

    const res = await apiPost<Ragazzo>('/api/ragazzi', {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      birthDate: form.birthDate || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim(),
      taxCode: form.taxCode.trim() || undefined,
      language: form.language,
      keywords,
      password: form.password,
    });

    setSubmitting(false);

    if (res.error || !res.data) {
      setFormError(res.error ?? t('common_error', lang));
      return;
    }

    dispatch({ type: 'ADD_RAGAZZO', payload: res.data });
    setModalOpen(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-800">{t('rag_title', lang)}</h1>
        <div className="flex items-center gap-3">
          <NotificationBell />
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common_search', lang)}
          className="input-field flex-1"
        />
        <Button size="sm" className="animate-pulse-cta self-stretch" variant="secondary" onClick={openModal}>
          + {t('rag_add', lang)}
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r, i) => (
          <Card
            key={r.id}
            hover
            onClick={() => navigate(`/admin/ragazzi/${r.id}`)}
            className="animate-slide-up"
          >
            <div className="flex items-start gap-4">
              ★
              {/* <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center text-stone-800 font-bold flex-shrink-0">
                {r.firstName.charAt(0)}{r.lastName.charAt(0)}
              </div> */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-stone-800">{r.firstName} {r.lastName}</h3>
                <p className="text-sm text-stone-800/40 truncate">{r.email}</p>
                <p className="text-xs text-stone-800/30 mt-1">{r.phone}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {r.keywords.map((kw) => (
                    <Badge key={kw} color="amber">{kw}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/5">
              {/* <Button variant="ghost" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/admin/ragazzi/${r.id}`); }}>
                {t('nav_profile', lang)}
              </Button> */}
              <Button size="sm" className="w-auto" onClick={(e) => { e.stopPropagation(); navigate(`/admin/ragazzi/${r.id}/report`); }}>
                {t('report_open', lang)}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={t('rag_add', lang)} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm animate-fade-in">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-800/70 mb-1.5">
                {t('rag_first_name', lang)} *
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                className="input-field"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-800/70 mb-1.5">
                {t('rag_last_name', lang)} *
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-800/70 mb-1.5">
                {t('rag_email', lang)} *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-800/70 mb-1.5">
                {t('rag_phone', lang)}
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-800/70 mb-1.5">
                {t('rag_birth_date', lang)}
              </label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => updateField('birthDate', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-800/70 mb-1.5">
                {t('rag_tax_code', lang)}
              </label>
              <input
                type="text"
                value={form.taxCode}
                onChange={(e) => updateField('taxCode', e.target.value.toUpperCase())}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-800/70 mb-1.5">
                {t('rag_language', lang)}
              </label>
              <select
                value={form.language}
                onChange={(e) => updateField('language', e.target.value as Language)}
                className="input-field"
              >
                {LANGUAGE_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-800/70 mb-1.5">
                {t('auth_password', lang)} *
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                className="input-field"
                required
                minLength={6}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-800/70 mb-1.5">
              {t('rag_keywords', lang)}
            </label>
            <input
              type="text"
              value={form.keywords}
              onChange={(e) => updateField('keywords', e.target.value)}
              className="input-field"
              placeholder={t('keywords_new_placeholder', lang)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal} disabled={submitting}>
              {t('rag_cancel', lang)}
            </Button>
            <Button type="submit" loading={submitting}>
              {t('rag_save', lang)}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
