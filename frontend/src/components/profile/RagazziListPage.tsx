import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { apiGet } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import { MOCK_RAGAZZI } from '../../lib/mockData';
import { t } from '../../i18n/translations';
import type { Ragazzo } from '@shared/types';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import NotificationBell from '../layout/NotificationBell';

export default function RagazziListPage() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const lang = state.language;
  const [search, setSearch] = useState('');

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

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-800">{t('rag_title', lang)}</h1>
        <div className="flex items-center gap-3">
          <NotificationBell />
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common_search', lang)}
          className="input-field max-w-md"
        />
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
              <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center text-stone-800 font-bold flex-shrink-0">
                {r.firstName.charAt(0)}{r.lastName.charAt(0)}
              </div>
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
            <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
              <Button variant="ghost" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/admin/ragazzi/${r.id}`); }}>
                {t('nav_profile', lang)}
              </Button>
              <Button variant="ghost" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/admin/ragazzi/${r.id}/report`); }}>
                {t('report_title', lang)}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
