import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { apiGet } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import { MOCK_RAGAZZI } from '../../lib/mockData';
import { t } from '../../i18n/translations';
import Card from '../ui/Card';
import Button from '../ui/Button';
import homeImg from '../../assets/home.png';
import NotificationBell from '../layout/NotificationBell';
import type { Ragazzo } from '@shared/types';

export default function AdminDashboard() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const lang = state.language;

  useEffect(() => {
    const load = async () => {
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
  }, [dispatch]);

  const totalCompletions = state.tasks.reduce((sum, t) => sum + t.completions.length, 0);
  const pendingTasks = state.tasks.filter((t) => !t.assignedTo).length;

  const weeklyStats = [
    { label: t('dash_weekly_tasks', lang), value: state.tasks.length, color: 'from-emerald-100 to-emerald-200' },
    { label: t('dash_completions', lang), value: totalCompletions, color: 'from-sky-100 to-sky-200' },
    { label: t('dash_pending', lang), value: pendingTasks, color: 'from-amber-100 to-amber-200' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-stone-800">{t('dash_title', lang)}</h1>
        <NotificationBell />
      </div>

      {/* ─── SECTION: Ragazzi ───────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-stone-800 mb-4">{t('dash_section_ragazzi', lang)}</h2>

        {/* Stat — registered ragazzi */}
        <div className="relative mb-6">
          <div className="animate-slide-up max-w-lg" style={{ animationDelay: `0ms` }}>
            <div className="glass-card p-5 bg-gradient-to-br from-accent-100 to-accent-200 border border-stone-500 max-w-full">
              <div className="min-w-0">
                <p className="text-sm text-stone-800">{t('dash_active_ragazzi', lang)}:</p>
                <p className="text-3xl font-bold text-stone-800 mt-1 truncate">{state.ragazzi.length}</p>
              </div>
            </div>
          </div>

          {/* Image pinned to the right edge; kept outside the stat card with space-between effect */}
          <div className="absolute right-4 top-2/3 transform -translate-y-1/2 opacity-50">
            <img src={homeImg} alt="Home" className="w-[550px] h-auto object-contain flex-shrink-0" />
          </div>
        </div>

        {/* Ragazzi list — clean rows with "Apri report" CTA */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-800">{t('nav_ragazzi', lang)}</h3>
              {/* TODO: wire to actual "add ragazzo" flow; for now lands on list page */}
              <Button size="sm" variant="secondary" onClick={() => navigate('/admin/ragazzi')}>
                + {t('rag_add', lang)}
              </Button>
            </div>
          }
        >
          <div className="max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {state.ragazzi.map((r, i) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-stone-400 hover:bg-white/5 transition-all animate-slide-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div
                    onClick={() => navigate(`/admin/ragazzi/${r.id}`)}
                    className="w-10 h-10 flex items-center justify-center text-stone-800 font-bold text-2xl cursor-pointer shrink-0"
                  >
                    ★
                  </div>
                  <div
                    onClick={() => navigate(`/admin/ragazzi/${r.id}`)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <p className="font-medium text-stone-800 truncate">{r.firstName} {r.lastName}</p>
                  </div>
                  <Button
                    size="sm"
                    className="animate-pulse-cta hover:animate-none shrink-0"
                    onClick={() => navigate(`/admin/ragazzi/${r.id}/report`)}
                  >
                    {t('report_open', lang)}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

            <div className='dashed-divider'/>
      {/* ─── SECTION: Settimanale ───────────────────────────────────── */}
      <section>
        <h2 className="text-2xl font-bold text-stone-800 mb-4">{t('dash_section_weekly', lang)}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {weeklyStats.map((stat, i) => (
            <div
              key={i}
              className={`glass-card p-5 bg-gradient-to-br ${stat.color} border border-stone-500 animate-slide-up`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <p className="text-sm text-stone-800">{stat.label}:</p>
              <p className="text-3xl font-bold text-stone-800 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
