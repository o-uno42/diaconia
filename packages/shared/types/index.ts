// ─── Enums & Aliases ───────────────────────────────────────────────

export type Role = 'admin' | 'ragazzo';
export type Language = 'it' | 'en' | 'fr' | 'ar';
export type PointValue = 0.5 | 1 | 2;

// ─── Auth / User ───────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  role: Role;
  email: string;
  ragazzoId?: string;
  textScalePercent?: number;
  highContrast?: boolean;
  firstName?: string;
  adminSettings?: AdminSettings;
}

// Admin-controlled feature flags. All default to true; the admin can
// disable individual capabilities for themselves or for their ragazzi.
// Frontend wiring is not applied yet — these only persist the choices.
export interface AdminSettings {
  // Admin-side features (affect what the admin sees)
  useWeeklyTasksCalendar: boolean;
  useWeeklyCommitmentsCalendar: boolean;
  useWeeklyActivitiesCalendar: boolean;
  useMonthlyTaskStats: boolean;
  useWashingMachine: boolean;
  useMonthlyReports: boolean;
  // Ragazzi-side features (set by the admin, affect their ragazzi)
  ragazziCanSeeTaskScores: boolean;
  ragazziCanSeeWeeklyActivities: boolean;
}

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  useWeeklyTasksCalendar: true,
  useWeeklyCommitmentsCalendar: true,
  useWeeklyActivitiesCalendar: true,
  useMonthlyTaskStats: true,
  useWashingMachine: true,
  useMonthlyReports: true,
  ragazziCanSeeTaskScores: true,
  ragazziCanSeeWeeklyActivities: true,
};

// ─── Ragazzo ───────────────────────────────────────────────────────

export interface Ragazzo {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  email: string;
  taxCode: string;
  language: Language;
  keywords: string[];
  photos: RagazzoPhoto[];
  pointsHistory: WeeklyPoints[];
  topTask?: TopTask | null;
}

export interface TopTask {
  name: string;
  count: number;
}

export interface RagazzoPhoto {
  id: string;
  ragazzoId: string;
  fileName: string;
  storagePath: string;
  publicUrl?: string;
  mimeType: string;
  uploadedAt: string;
}

export interface WeeklyPoints {
  weekId: string;
  weekLabel: string;
  points: number;
}

// ─── Tasks ─────────────────────────────────────────────────────────

export interface Task {
  id: string;
  weekId: string;
  name: string;
  points: PointValue;
  assignedTo?: string;
  completions: TaskCompletion[];
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  ragazzoId: string;
  day: number; // 0 = Monday … 6 = Sunday
  completedAt: string;
  markedByAdmin: boolean;
  adminConfirmed: boolean;
}

export interface TaskTemplate {
  id: string;
  name: string;
  points: PointValue;
  createdAt: string;
}

// ─── Reports ───────────────────────────────────────────────────────

export interface ReportEntry {
  id: string;
  ragazzoId: string;
  date: string; // YYYY-MM-DD
  sections: ReportSections;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSections {
  dailyArea: string;
  health: string;
  familyArea: string;
  socialRelational: string;
  psychoAffective: string;
  cognitiveArea: string;
  individualSession: string;
}

// ─── Commitments ───────────────────────────────────────────────────

export interface Commitment {
  id: string;
  ragazzoId: string;
  weekId: string;
  day: number;
  text: string;
}

// ─── Weekly Activities ─────────────────────────────────────────────

export interface WeeklyActivity {
  id: string;
  name: string;
  createdAt: string;
}

export interface WeeklyActivityEntry {
  id: string;
  activityId: string;
  weekId: string;
  day: number;
  text: string;
}

// ─── Washing machine ───────────────────────────────────────────────

// 'V' and 'LA' are the two independent toggles each ragazzo has per day.
// Their semantics live in the UI labels; the backend just stores X marks.
export type WashingMachineEntryType = 'V' | 'LA';

export interface WashingMachineEntry {
  id: string;
  ragazzoId: string;
  date: string; // YYYY-MM-DD
  entryType: WashingMachineEntryType;
}

// ─── Notifications ─────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ─── Email Templates ───────────────────────────────────────────────

export interface EmailTemplate {
  id: string;
  label: string;
  subject: string;
  body: string; // {variableName} placeholders
}

// ─── API ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────

export const REPORT_SECTION_KEYS: (keyof ReportSections)[] = [
  'dailyArea',
  'health',
  'familyArea',
  'socialRelational',
  'psychoAffective',
  'cognitiveArea',
  'individualSession',
];

export const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'] as const;
