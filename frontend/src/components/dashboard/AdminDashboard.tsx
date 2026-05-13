import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { apiGet } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import { MOCK_RAGAZZI } from '../../lib/mockData';
import { t } from '../../i18n/translations';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
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

  const stats = [
    { label: t('dash_active_ragazzi', lang), value: state.ragazzi.length, icon: '👥', color: 'from-accent-600 to-accent-400' },
    { label: t('dash_weekly_tasks', lang), value: state.tasks.length, icon: '📋', color: 'from-emerald-600 to-emerald-400' },
    { label: t('dash_completions', lang), value: totalCompletions, icon: '✅', color: 'from-sky-600 to-sky-400' },
    { label: t('dash_pending', lang), value: pendingTasks, icon: '⏳', color: 'from-amber-600 to-amber-400' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('dash_title', lang)}</h1>
          <p className="text-white/50 mt-1">Benvenuto nella piattaforma Diaconia</p>
        </div>
        <NotificationBell />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-5 hover:bg-white/10 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50">{stat.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ragazzi Quick List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card header={<h2 className="text-lg font-semibold text-white">{t('nav_ragazzi', lang)}</h2>}>
          <div className="space-y-3">
            {state.ragazzi.map((r, i) => (
              <div
                key={r.id}
                onClick={() => navigate(`/admin/ragazzi/${r.id}`)}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-10 h-10 rounded-full gradient-success flex items-center justify-center text-white font-bold text-sm">
                  {r.firstName.charAt(0)}{r.lastName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{r.firstName} {r.lastName}</p>
                  <p className="text-xs text-white/40">{r.email}</p>
                </div>
                <div className="flex gap-1">
                  {r.keywords.map((kw) => (
                    <Badge key={kw} color="indigo">{kw}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card header={<h2 className="text-lg font-semibold text-white">Azioni rapide</h2>}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t('rag_add', lang), icon: '➕', to: '/admin/ragazzi' },
              { label: t('task_add', lang), icon: '📝', to: '/admin/tasks' },
              { label: t('report_title', lang), icon: '📊', to: '/admin/ragazzi' },
              { label: t('nav_commitments', lang), icon: '📅', to: '/admin/commitments' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.to)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all"
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-xs font-medium text-white/70">{action.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
