import type { Language } from '@shared/types';

type TranslationKeys = {
  // Nav
  nav_dashboard: string; nav_ragazzi: string; nav_tasks: string; nav_commitments: string;
  nav_profile: string; nav_home: string; nav_logout: string; nav_notifications: string;
  // Auth
  auth_login: string; auth_email: string; auth_password: string; auth_login_btn: string;
  auth_logging_in: string; auth_error: string;
  // Dashboard
  dash_title: string; dash_active_ragazzi: string; dash_weekly_tasks: string;
  dash_completions: string; dash_pending: string;
  // Ragazzi
  rag_title: string; rag_add: string; rag_first_name: string; rag_last_name: string;
  rag_birth_date: string; rag_phone: string; rag_email: string; rag_tax_code: string;
  rag_language: string; rag_keywords: string; rag_save: string; rag_cancel: string;
  rag_edit: string; rag_delete: string; rag_view: string;
  // Tasks
  task_title: string; task_add: string; task_name: string; task_points: string;
  task_assign: string; task_unassigned: string; task_complete: string; task_book: string;
  task_completed: string; task_week: string; task_prev_week: string; task_next_week: string;
  // Days
  day_mon: string; day_tue: string; day_wed: string; day_thu: string;
  day_fri: string; day_sat: string; day_sun: string;
  // Report
  report_title: string; report_add: string; report_date: string;
  report_daily_area: string; report_health: string; report_family_area: string;
  report_social_relational: string; report_psycho_affective: string;
  report_individual_session: string; report_save: string; report_voice: string;
  // Photos
  photo_title: string; photo_upload: string; photo_delete: string; photo_confirm_delete: string;
  // Points
  points_title: string; points_weekly: string;
  // Commitments
  commit_title: string; commit_add: string; commit_text: string;
  // Notifications
  notif_title: string; notif_mark_all: string; notif_empty: string;
  // Common
  common_loading: string; common_error: string; common_save: string; common_cancel: string;
  common_confirm: string; common_close: string; common_search: string; common_no_data: string;
};

const translations: Record<Language, TranslationKeys> = {
  it: {
    nav_dashboard: 'Dashboard', nav_ragazzi: 'Ragazzi', nav_tasks: 'Compiti', nav_commitments: 'Impegni',
    nav_profile: 'Profilo', nav_home: 'Home', nav_logout: 'Esci', nav_notifications: 'Notifiche',
    auth_login: 'Accedi a Diaconia', auth_email: 'Email', auth_password: 'Password',
    auth_login_btn: 'Accedi', auth_logging_in: 'Accesso in corso...', auth_error: 'Credenziali non valide',
    dash_title: 'Dashboard', dash_active_ragazzi: 'Ragazzi attivi', dash_weekly_tasks: 'Compiti settimanali',
    dash_completions: 'Completamenti', dash_pending: 'In attesa',
    rag_title: 'Ragazzi', rag_add: 'Aggiungi ragazzo', rag_first_name: 'Nome', rag_last_name: 'Cognome',
    rag_birth_date: 'Data di nascita', rag_phone: 'Telefono', rag_email: 'Email', rag_tax_code: 'Codice fiscale',
    rag_language: 'Lingua', rag_keywords: 'Parole chiave', rag_save: 'Salva', rag_cancel: 'Annulla',
    rag_edit: 'Modifica', rag_delete: 'Elimina', rag_view: 'Visualizza',
    task_title: 'Calendario compiti', task_add: 'Aggiungi compito', task_name: 'Nome compito',
    task_points: 'Punti', task_assign: 'Assegna a', task_unassigned: 'Non assegnato',
    task_complete: 'Completa', task_book: 'Prenota', task_completed: 'Completato',
    task_week: 'Settimana', task_prev_week: 'Settimana precedente', task_next_week: 'Settimana successiva',
    day_mon: 'Lun', day_tue: 'Mar', day_wed: 'Mer', day_thu: 'Gio',
    day_fri: 'Ven', day_sat: 'Sab', day_sun: 'Dom',
    report_title: 'Report', report_add: 'Nuovo report', report_date: 'Data',
    report_daily_area: 'Area quotidiana', report_health: 'Salute', report_family_area: 'Area familiare',
    report_social_relational: 'Socio-relazionale', report_psycho_affective: 'Psico-affettivo',
    report_individual_session: 'Sessione individuale', report_save: 'Salva report', report_voice: 'Dettatura vocale',
    photo_title: 'Foto e documenti', photo_upload: 'Carica file', photo_delete: 'Elimina',
    photo_confirm_delete: 'Sei sicuro di voler eliminare questo file?',
    points_title: 'Punti', points_weekly: 'Punti settimanali',
    commit_title: 'Impegni settimanali', commit_add: 'Aggiungi impegno', commit_text: 'Testo impegno',
    notif_title: 'Notifiche', notif_mark_all: 'Segna tutto come letto', notif_empty: 'Nessuna notifica',
    common_loading: 'Caricamento...', common_error: 'Si è verificato un errore', common_save: 'Salva',
    common_cancel: 'Annulla', common_confirm: 'Conferma', common_close: 'Chiudi',
    common_search: 'Cerca...', common_no_data: 'Nessun dato disponibile',
  },
  en: {
    nav_dashboard: 'Dashboard', nav_ragazzi: 'Residents', nav_tasks: 'Tasks', nav_commitments: 'Commitments',
    nav_profile: 'Profile', nav_home: 'Home', nav_logout: 'Logout', nav_notifications: 'Notifications',
    auth_login: 'Sign in to Diaconia', auth_email: 'Email', auth_password: 'Password',
    auth_login_btn: 'Sign in', auth_logging_in: 'Signing in...', auth_error: 'Invalid credentials',
    dash_title: 'Dashboard', dash_active_ragazzi: 'Active residents', dash_weekly_tasks: 'Weekly tasks',
    dash_completions: 'Completions', dash_pending: 'Pending',
    rag_title: 'Residents', rag_add: 'Add resident', rag_first_name: 'First name', rag_last_name: 'Last name',
    rag_birth_date: 'Birth date', rag_phone: 'Phone', rag_email: 'Email', rag_tax_code: 'Tax code',
    rag_language: 'Language', rag_keywords: 'Keywords', rag_save: 'Save', rag_cancel: 'Cancel',
    rag_edit: 'Edit', rag_delete: 'Delete', rag_view: 'View',
    task_title: 'Task Calendar', task_add: 'Add task', task_name: 'Task name',
    task_points: 'Points', task_assign: 'Assign to', task_unassigned: 'Unassigned',
    task_complete: 'Complete', task_book: 'Book', task_completed: 'Completed',
    task_week: 'Week', task_prev_week: 'Previous week', task_next_week: 'Next week',
    day_mon: 'Mon', day_tue: 'Tue', day_wed: 'Wed', day_thu: 'Thu',
    day_fri: 'Fri', day_sat: 'Sat', day_sun: 'Sun',
    report_title: 'Report', report_add: 'New report', report_date: 'Date',
    report_daily_area: 'Daily area', report_health: 'Health', report_family_area: 'Family area',
    report_social_relational: 'Social-relational', report_psycho_affective: 'Psycho-affective',
    report_individual_session: 'Individual session', report_save: 'Save report', report_voice: 'Voice input',
    photo_title: 'Photos & Documents', photo_upload: 'Upload file', photo_delete: 'Delete',
    photo_confirm_delete: 'Are you sure you want to delete this file?',
    points_title: 'Points', points_weekly: 'Weekly points',
    commit_title: 'Weekly Commitments', commit_add: 'Add commitment', commit_text: 'Commitment text',
    notif_title: 'Notifications', notif_mark_all: 'Mark all as read', notif_empty: 'No notifications',
    common_loading: 'Loading...', common_error: 'An error occurred', common_save: 'Save',
    common_cancel: 'Cancel', common_confirm: 'Confirm', common_close: 'Close',
    common_search: 'Search...', common_no_data: 'No data available',
  },
  fr: {
    nav_dashboard: 'Tableau de bord', nav_ragazzi: 'Résidents', nav_tasks: 'Tâches', nav_commitments: 'Engagements',
    nav_profile: 'Profil', nav_home: 'Accueil', nav_logout: 'Déconnexion', nav_notifications: 'Notifications',
    auth_login: 'Connexion à Diaconia', auth_email: 'E-mail', auth_password: 'Mot de passe',
    auth_login_btn: 'Se connecter', auth_logging_in: 'Connexion...', auth_error: 'Identifiants invalides',
    dash_title: 'Tableau de bord', dash_active_ragazzi: 'Résidents actifs', dash_weekly_tasks: 'Tâches hebdo',
    dash_completions: 'Complétions', dash_pending: 'En attente',
    rag_title: 'Résidents', rag_add: 'Ajouter résident', rag_first_name: 'Prénom', rag_last_name: 'Nom',
    rag_birth_date: 'Date de naissance', rag_phone: 'Téléphone', rag_email: 'E-mail', rag_tax_code: 'Code fiscal',
    rag_language: 'Langue', rag_keywords: 'Mots-clés', rag_save: 'Enregistrer', rag_cancel: 'Annuler',
    rag_edit: 'Modifier', rag_delete: 'Supprimer', rag_view: 'Voir',
    task_title: 'Calendrier des tâches', task_add: 'Ajouter tâche', task_name: 'Nom de tâche',
    task_points: 'Points', task_assign: 'Assigner à', task_unassigned: 'Non assigné',
    task_complete: 'Compléter', task_book: 'Réserver', task_completed: 'Complété',
    task_week: 'Semaine', task_prev_week: 'Semaine précédente', task_next_week: 'Semaine suivante',
    day_mon: 'Lun', day_tue: 'Mar', day_wed: 'Mer', day_thu: 'Jeu',
    day_fri: 'Ven', day_sat: 'Sam', day_sun: 'Dim',
    report_title: 'Rapport', report_add: 'Nouveau rapport', report_date: 'Date',
    report_daily_area: 'Zone quotidienne', report_health: 'Santé', report_family_area: 'Zone familiale',
    report_social_relational: 'Socio-relationnel', report_psycho_affective: 'Psycho-affectif',
    report_individual_session: 'Session individuelle', report_save: 'Enregistrer rapport', report_voice: 'Dictée vocale',
    photo_title: 'Photos et documents', photo_upload: 'Télécharger', photo_delete: 'Supprimer',
    photo_confirm_delete: 'Êtes-vous sûr de vouloir supprimer ce fichier?',
    points_title: 'Points', points_weekly: 'Points hebdomadaires',
    commit_title: 'Engagements hebdomadaires', commit_add: 'Ajouter engagement', commit_text: 'Texte',
    notif_title: 'Notifications', notif_mark_all: 'Tout marquer comme lu', notif_empty: 'Aucune notification',
    common_loading: 'Chargement...', common_error: 'Une erreur est survenue', common_save: 'Enregistrer',
    common_cancel: 'Annuler', common_confirm: 'Confirmer', common_close: 'Fermer',
    common_search: 'Rechercher...', common_no_data: 'Aucune donnée disponible',
  },
  ar: {
    nav_dashboard: 'لوحة التحكم', nav_ragazzi: 'المقيمون', nav_tasks: 'المهام', nav_commitments: 'الالتزامات',
    nav_profile: 'الملف الشخصي', nav_home: 'الرئيسية', nav_logout: 'تسجيل الخروج', nav_notifications: 'الإشعارات',
    auth_login: 'تسجيل الدخول إلى Diaconia', auth_email: 'البريد الإلكتروني', auth_password: 'كلمة المرور',
    auth_login_btn: 'دخول', auth_logging_in: 'جاري الدخول...', auth_error: 'بيانات غير صحيحة',
    dash_title: 'لوحة التحكم', dash_active_ragazzi: 'المقيمون النشطون', dash_weekly_tasks: 'المهام الأسبوعية',
    dash_completions: 'المكتملة', dash_pending: 'قيد الانتظار',
    rag_title: 'المقيمون', rag_add: 'إضافة مقيم', rag_first_name: 'الاسم', rag_last_name: 'اللقب',
    rag_birth_date: 'تاريخ الميلاد', rag_phone: 'الهاتف', rag_email: 'البريد', rag_tax_code: 'الرقم الضريبي',
    rag_language: 'اللغة', rag_keywords: 'الكلمات المفتاحية', rag_save: 'حفظ', rag_cancel: 'إلغاء',
    rag_edit: 'تعديل', rag_delete: 'حذف', rag_view: 'عرض',
    task_title: 'تقويم المهام', task_add: 'إضافة مهمة', task_name: 'اسم المهمة',
    task_points: 'النقاط', task_assign: 'تعيين إلى', task_unassigned: 'غير معين',
    task_complete: 'إكمال', task_book: 'حجز', task_completed: 'مكتمل',
    task_week: 'الأسبوع', task_prev_week: 'الأسبوع السابق', task_next_week: 'الأسبوع التالي',
    day_mon: 'اثن', day_tue: 'ثلا', day_wed: 'أرب', day_thu: 'خمي',
    day_fri: 'جمع', day_sat: 'سبت', day_sun: 'أحد',
    report_title: 'التقرير', report_add: 'تقرير جديد', report_date: 'التاريخ',
    report_daily_area: 'المجال اليومي', report_health: 'الصحة', report_family_area: 'المجال العائلي',
    report_social_relational: 'الاجتماعي', report_psycho_affective: 'النفسي-العاطفي',
    report_individual_session: 'الجلسة الفردية', report_save: 'حفظ التقرير', report_voice: 'إدخال صوتي',
    photo_title: 'الصور والمستندات', photo_upload: 'رفع ملف', photo_delete: 'حذف',
    photo_confirm_delete: 'هل أنت متأكد من حذف هذا الملف؟',
    points_title: 'النقاط', points_weekly: 'النقاط الأسبوعية',
    commit_title: 'الالتزامات الأسبوعية', commit_add: 'إضافة التزام', commit_text: 'نص الالتزام',
    notif_title: 'الإشعارات', notif_mark_all: 'تحديد الكل كمقروء', notif_empty: 'لا توجد إشعارات',
    common_loading: 'جاري التحميل...', common_error: 'حدث خطأ', common_save: 'حفظ',
    common_cancel: 'إلغاء', common_confirm: 'تأكيد', common_close: 'إغلاق',
    common_search: 'بحث...', common_no_data: 'لا توجد بيانات',
  },
};

export function t(key: keyof TranslationKeys, lang: Language = 'it'): string {
  return translations[lang][key] ?? translations['it'][key] ?? key;
}

export function getDayLabels(lang: Language): string[] {
  const keys: (keyof TranslationKeys)[] = ['day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat', 'day_sun'];
  return keys.map((k) => t(k, lang));
}

export type { TranslationKeys };
export default translations;
