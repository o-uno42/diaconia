import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { apiPatch } from '../../lib/api';
import { isMockMode } from '../../lib/supabase';
import { t } from '../../i18n/translations';
import type { TranslationKeys } from '../../i18n/translations';
import type { AdminSettings } from '@shared/types';
import { DEFAULT_ADMIN_SETTINGS } from '@shared/types';
import Card from '../ui/Card';
import NotificationBell from '../layout/NotificationBell';

type AdminFeatureKey = keyof Pick<AdminSettings,
  | 'useWeeklyTasksCalendar'
  | 'useWeeklyCommitmentsCalendar'
  | 'useWeeklyActivitiesCalendar'
  | 'useMonthlyTaskStats'
  | 'useWashingMachine'
  | 'useMonthlyReports'
>;

type RagazziFeatureKey = keyof Pick<AdminSettings,
  | 'ragazziCanSeeTaskScores'
  | 'ragazziCanSeeWeeklyActivities'
  | 'ragazziCanSeeKeywords'
>;

const ADMIN_FEATURES: { key: AdminFeatureKey; labelKey: keyof TranslationKeys }[] = [
  { key: 'useWeeklyTasksCalendar', labelKey: 'admin_profile_feature_weekly_tasks' },
  { key: 'useWeeklyCommitmentsCalendar', labelKey: 'admin_profile_feature_weekly_commitments' },
  { key: 'useWeeklyActivitiesCalendar', labelKey: 'admin_profile_feature_weekly_activities' },
  { key: 'useMonthlyTaskStats', labelKey: 'admin_profile_feature_monthly_task_stats' },
  { key: 'useWashingMachine', labelKey: 'admin_profile_feature_washing_machine' },
  { key: 'useMonthlyReports', labelKey: 'admin_profile_feature_monthly_reports' },
];

const RAGAZZI_FEATURES: { key: RagazziFeatureKey; labelKey: keyof TranslationKeys }[] = [
  { key: 'ragazziCanSeeTaskScores', labelKey: 'admin_profile_ragazzi_see_task_scores' },
  { key: 'ragazziCanSeeWeeklyActivities', labelKey: 'admin_profile_ragazzi_see_weekly_activities' },
  { key: 'ragazziCanSeeKeywords', labelKey: 'admin_profile_ragazzi_see_keywords' },
];

export default function AdminProfilePage() {
  const { state, dispatch } = useAppContext();
  const lang = state.language;
  const settings = state.currentUser?.adminSettings ?? DEFAULT_ADMIN_SETTINGS;
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async (key: keyof AdminSettings, next: boolean) => {
    const previous = settings;
    const optimistic: AdminSettings = { ...settings, [key]: next };
    dispatch({ type: 'SET_ADMIN_SETTINGS', payload: optimistic });
    setError(null);

    if (isMockMode) return;

    const res = await apiPatch<{ adminSettings: AdminSettings }>(
      '/api/auth/me/admin-settings',
      { [key]: next },
    );

    if (res.error || !res.data) {
      dispatch({ type: 'SET_ADMIN_SETTINGS', payload: previous });
      setError(res.error ?? t('admin_profile_save_error', lang));
      return;
    }

    dispatch({ type: 'SET_ADMIN_SETTINGS', payload: res.data.adminSettings });
  };

  return (
    <div className="animate-fade-in pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-800">{t('admin_profile_title', lang)}</h1>
        <NotificationBell />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-sm animate-fade-in">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card header={<h2 className="text-lg font-semibold text-stone-800">{t('admin_profile_features_heading', lang)}</h2>}>
          <div className="dashed-divider" />
          <div className="space-y-1 mt-4">
            {ADMIN_FEATURES.map((f) => (
              <ToggleRow
                key={f.key}
                label={t(f.labelKey, lang)}
                checked={settings[f.key]}
                onChange={(next) => void handleToggle(f.key, next)}
              />
            ))}
          </div>
        </Card>

        <Card header={<h2 className="text-lg font-semibold text-stone-800">{t('admin_profile_ragazzi_heading', lang)}</h2>}>
          <div className="dashed-divider" />
          <div className="space-y-1 mt-4">
            {RAGAZZI_FEATURES.map((f) => (
              <ToggleRow
                key={f.key}
                label={t(f.labelKey, lang)}
                checked={settings[f.key]}
                onChange={(next) => void handleToggle(f.key, next)}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer py-2">
      <span className="text-sm font-medium text-stone-800">{label}</span>
      <span className="relative inline-block w-11 h-6 flex-shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="block w-11 h-6 rounded-full bg-stone-300 peer-checked:bg-indigo-600 transition-colors" />
        <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
