import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { apiGet } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import { MOCK_RAGAZZI } from '../../lib/mockData';
import { t } from '../../i18n/translations';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import homeImg from '../../assets/home.png';
import NotificationBell from '../layout/NotificationBell';
import { DEFAULT_ADMIN_SETTINGS, type Ragazzo } from '@shared/types';
import { formatWeekRange } from '@/hooks/useTasks';
import { useTaskTemplates } from '@/hooks/useTaskTemplates';

export default function AdminDashboard() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const lang = state.language;
  const { templates, fetchTemplates, createTemplate } = useTaskTemplates();
  const settings = state.currentUser?.adminSettings ?? DEFAULT_ADMIN_SETTINGS;
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPoints, setNewPoints] = useState('1');

  const handleCreateTemplate = async () => {
    if (!newName.trim()) return;
    await createTemplate(newName.trim(), parseFloat(newPoints));
    setNewName('');
    setNewPoints('1');
    setShowAddTemplate(false);
  };

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

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

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
        <Card>
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
                  {settings.useMonthlyReports && (
                    <Button
                      size="sm"
                      className="animate-pulse-cta hover:animate-none shrink-0"
                      onClick={() => navigate(`/admin/ragazzi/${r.id}/report`)}
                    >
                      {t('report_open', lang)}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <div className='dashed-divider'/>
      {/* ─── SECTION: Settimanale + Compiti generali ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly stats — narrower column */}
        <section className="lg:col-span-1">
          <h2 className="text-2xl font-bold text-stone-800 mb-4">{t('dash_section_weekly', lang)} <span className="text-sm text-[17px] text-violet-800">({formatWeekRange(state.weekOffset, lang)})</span></h2>
          <div className="flex flex-col gap-4">
            {weeklyStats.map((stat, i) => (
              <div
                key={i}
                className={`glass-card px-4 py-5 bg-gradient-to-br ${stat.color} border border-stone-500 animate-slide-up flex items-center justify-between gap-4`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <p className="text-sm text-stone-800">{stat.label}</p>
                <p className="text-2xl font-bold text-stone-800">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Compiti generali — wider column */}
        <section className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-stone-800 mb-4">{t('dash_general_tasks', lang)}</h2>
          <Card>
            <div className="max-h-[160px] overflow-y-auto pr-1 scrollbar-thin space-y-2">
              {templates.length === 0 ? (
                <p className="text-sm text-stone-800/40 text-center py-4">{t('task_templates_empty', lang)}</p>
              ) : (
                templates.map((tpl) => (
                  <div key={tpl.id} className="flex items-center gap-3 p-3 rounded-xl border border-stone-400">
                    <Badge color="amber">{tpl.points}</Badge>
                    <p className="text-sm font-medium text-stone-800 flex-1">{tpl.name}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-center mt-4">
              <Button size="sm" onClick={() => setShowAddTemplate(true)} className="!bg-stone-300 hover:!bg-amber-200 !text-amber-800">
                + {t('task_template_add', lang)}
              </Button>
            </div>
          </Card>
        </section>
      </div>

      {/* Add general task modal */}
      <Modal
        isOpen={showAddTemplate}
        onClose={() => { setShowAddTemplate(false); setNewName(''); setNewPoints('1'); }}
        title={t('task_template_add', lang)}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex gap-3 items-end items-center">
            <div className="flex-1">
              <label className="block text-sm text-stone-800 mb-1">{t('task_name', lang)}</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTemplate();
                  if (e.key === 'Escape') { setShowAddTemplate(false); setNewName(''); setNewPoints('1'); }
                }}
                autoFocus
                className="input-field"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm text-stone-800 mb-1">{t('task_points', lang)}</label>
              <select value={newPoints} onChange={(e) => setNewPoints(e.target.value)} className="input-field">
                <option value="0.5">0.5</option>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setShowAddTemplate(false); setNewName(''); setNewPoints('1'); }}>
              {t('common_cancel', lang)}
            </Button>
            <Button size="sm" onClick={handleCreateTemplate}>
              {t('common_save', lang)}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
