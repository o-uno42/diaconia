import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import type { UserProfile, AdminSettings } from '../../../packages/shared/types';
import { DEFAULT_ADMIN_SETTINGS } from '../../../packages/shared/types';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user: UserProfile;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Fetch profile for role info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, ragazzo_id, text_scale_percent, high_contrast, use_weekly_tasks_calendar, use_weekly_commitments_calendar, use_weekly_activities_calendar, use_monthly_task_stats, use_washing_machine, use_monthly_reports, ragazzi_can_see_task_scores, ragazzi_can_see_weekly_activities, ragazzi_can_see_keywords')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      res.status(401).json({ error: 'User profile not found' });
      return;
    }

    const row = profile as Record<string, unknown>;
    const role = row['role'] as UserProfile['role'];
    const ragazzoId = (row['ragazzo_id'] as string | null) ?? undefined;

    const buildAdminSettings = (r: Record<string, unknown>): AdminSettings => ({
      useWeeklyTasksCalendar: (r['use_weekly_tasks_calendar'] as boolean | null) ?? DEFAULT_ADMIN_SETTINGS.useWeeklyTasksCalendar,
      useWeeklyCommitmentsCalendar: (r['use_weekly_commitments_calendar'] as boolean | null) ?? DEFAULT_ADMIN_SETTINGS.useWeeklyCommitmentsCalendar,
      useWeeklyActivitiesCalendar: (r['use_weekly_activities_calendar'] as boolean | null) ?? DEFAULT_ADMIN_SETTINGS.useWeeklyActivitiesCalendar,
      useMonthlyTaskStats: (r['use_monthly_task_stats'] as boolean | null) ?? DEFAULT_ADMIN_SETTINGS.useMonthlyTaskStats,
      useWashingMachine: (r['use_washing_machine'] as boolean | null) ?? DEFAULT_ADMIN_SETTINGS.useWashingMachine,
      useMonthlyReports: (r['use_monthly_reports'] as boolean | null) ?? DEFAULT_ADMIN_SETTINGS.useMonthlyReports,
      ragazziCanSeeTaskScores: (r['ragazzi_can_see_task_scores'] as boolean | null) ?? DEFAULT_ADMIN_SETTINGS.ragazziCanSeeTaskScores,
      ragazziCanSeeWeeklyActivities: (r['ragazzi_can_see_weekly_activities'] as boolean | null) ?? DEFAULT_ADMIN_SETTINGS.ragazziCanSeeWeeklyActivities,
      ragazziCanSeeKeywords: (r['ragazzi_can_see_keywords'] as boolean | null) ?? DEFAULT_ADMIN_SETTINGS.ragazziCanSeeKeywords,
    });

    let adminSettings: AdminSettings | undefined;
    if (role === 'admin') {
      adminSettings = buildAdminSettings(row);
    } else if (role === 'ragazzo' && ragazzoId) {
      // Inherit the owning admin's settings so the ragazzo UI can gate
      // features the admin disabled.
      const { data: ownerRow } = await supabase
        .from('ragazzi')
        .select('owner_admin_id')
        .eq('id', ragazzoId)
        .single();
      const ownerAdminId = (ownerRow?.owner_admin_id as string | undefined) ?? undefined;
      if (ownerAdminId) {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('use_weekly_tasks_calendar, use_weekly_commitments_calendar, use_weekly_activities_calendar, use_monthly_task_stats, use_washing_machine, use_monthly_reports, ragazzi_can_see_task_scores, ragazzi_can_see_weekly_activities, ragazzi_can_see_keywords')
          .eq('id', ownerAdminId)
          .single();
        if (adminProfile) {
          adminSettings = buildAdminSettings(adminProfile as Record<string, unknown>);
        }
      }
    }

    req.user = {
      id: user.id,
      role,
      email: user.email ?? '',
      ragazzoId,
      textScalePercent: (row['text_scale_percent'] as number | null) ?? 100,
      highContrast: (row['high_contrast'] as boolean | null) ?? false,
      adminSettings,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Authentication failed' });
  }
}
