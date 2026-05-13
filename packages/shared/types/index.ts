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
}

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
  'individualSession',
];

export const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'] as const;
