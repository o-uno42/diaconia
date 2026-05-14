import type { Language } from '@shared/types';

type TranslationKeys = {
  // Brand
  brand_subtitle: string; brand_tagline: string;
  // Roles
  role_admin: string; role_ragazzo: string;
  // Nav
  nav_dashboard: string; nav_ragazzi: string; nav_tasks: string; nav_commitments: string;
  nav_weekly_activities: string; nav_stats: string;
  nav_profile: string; nav_home: string; nav_logout: string; nav_notifications: string;
  // Stats
  stats_title: string;
  stats_legend: string;
  stats_never_done: string;
  stats_prev_month: string;
  stats_next_month: string;
  stats_current_month: string;
  // Auth
  auth_login: string; auth_email: string; auth_password: string; auth_login_btn: string;
  auth_logging_in: string; auth_error: string;
  auth_demo_credentials: string; auth_demo_password_hint: string;
  auth_register: string; auth_register_btn: string; auth_registering: string;
  auth_first_name: string; auth_last_name: string;
  auth_password_confirm: string; auth_passwords_mismatch: string;
  auth_no_account: string; auth_already_account: string;
  // Dashboard
  dash_title: string; dash_active_ragazzi: string; dash_weekly_tasks: string;
  dash_completions: string; dash_pending: string;
  dash_welcome: string; dash_quick_actions: string;
  dash_section_ragazzi: string; dash_section_weekly: string; dash_general_tasks: string;
  report_open: string;
  // Ragazzi
  rag_title: string; rag_add: string; rag_first_name: string; rag_last_name: string;
  rag_birth_date: string; rag_phone: string; rag_email: string; rag_tax_code: string;
  rag_language: string; rag_keywords: string; rag_save: string; rag_cancel: string;
  rag_edit: string; rag_delete: string; rag_view: string;
  // Tasks
  task_title: string; task_add: string; task_name: string; task_points: string;
  task_assign: string; task_unassigned: string; task_complete: string; task_book: string;
  task_completed: string; task_week: string; task_prev_week: string; task_next_week: string;
  task_today: string; task_my_tasks: string; task_none_assigned: string;
  task_available: string; task_none_available: string;
  task_manage: string; task_manage_title: string; task_empty: string; task_confirm_delete: string;
  // Task templates
  task_templates_title: string; task_template_drop_here: string;
  task_template_drop_hint: string; task_templates_empty: string;
  task_template_add: string; task_template_confirm_delete: string;
  task_template_already_in_week: string;
  // Task completion confirmation
  task_completion_confirm_title: string; task_completion_confirm_yes: string;
  task_completion_confirm_no: string; task_completion_pending_tooltip: string;
  // Days
  day_mon: string; day_tue: string; day_wed: string; day_thu: string;
  day_fri: string; day_sat: string; day_sun: string;
  // Report
  report_title: string; report_of: string; report_add: string; report_date: string;
  report_daily_area: string; report_health: string; report_family_area: string;
  report_social_relational: string; report_psycho_affective: string;
  report_cognitive_area: string;
  report_individual_session: string; report_save: string; report_voice: string;
  report_edit: string;
  report_empty: string; report_download: string;
  // Photos
  photo_title: string; photo_upload: string; photo_delete: string; photo_confirm_delete: string;
  photo_preview: string; photo_confirm_delete_title: string; photo_demo_warning: string;
  // Points
  points_title: string; points_weekly: string; chart_points: string;
  points_card_pre: string; points_card_post: string;
  top_task_title: string; top_task_count_pre: string; top_task_count_post: string;
  // Commitments
  commit_title: string; commit_add: string; commit_text: string; commit_day: string; commit_edit: string;
  // Washing machine
  nav_washing_machine: string;
  washing_machine_title: string;
  washing_machine_col_v: string;
  washing_machine_col_la: string;
  washing_machine_empty_ragazzi: string;
  washing_machine_prev_month: string;
  washing_machine_next_month: string;
  washing_machine_current_month: string;
  washing_machine_day_header: string;
  // Weekly activities
  weekly_activities: string;
  wa_manage: string; wa_manage_title: string; wa_add: string; wa_name: string;
  wa_empty: string; wa_confirm_delete: string; wa_download_pdf: string;
  // Notifications
  notif_title: string; notif_mark_all: string; notif_empty: string;
  // Profile
  profile_personal_info: string; profile_settings: string;
  // Admin profile
  nav_admin_profile: string;
  admin_profile_title: string;
  admin_profile_features_heading: string;
  admin_profile_ragazzi_heading: string;
  admin_profile_feature_weekly_tasks: string;
  admin_profile_feature_weekly_commitments: string;
  admin_profile_feature_weekly_activities: string;
  admin_profile_feature_monthly_task_stats: string;
  admin_profile_feature_washing_machine: string;
  admin_profile_feature_monthly_reports: string;
  admin_profile_ragazzi_see_task_scores: string;
  admin_profile_ragazzi_see_weekly_activities: string;
  admin_profile_save_error: string;
  // Accessibility
  settings_text_size: string; settings_text_size_normal: string; settings_text_size_large: string;
  settings_visual_accessibility: string;
  // Keywords
  keywords_empty: string; keywords_new_placeholder: string;
  // Ragazzo Home
  ragazzo_home_title: string; ragazzo_greeting: string; ragazzo_welcome: string; ragazzo_your_role: string;
  // Demo
  demo_mode_banner: string;
  // Common
  common_loading: string; common_error: string; common_save: string; common_cancel: string;
  common_confirm: string; common_close: string; common_search: string; common_no_data: string;
  // Email
  email_precompiled_button: string;
  email_warning_title: string;
  email_warning_heading: string;
  email_warning_body: string;
  email_warning_windows: string;
  email_warning_macos: string;
  email_warning_alt: string;
  email_copy: string;
  email_copy_done: string;
  email_open_gmail: string;
};

// Italian is the source of truth — must be complete.
// Other languages are Partial; missing keys fall back to Italian via t().
type TranslationsMap =
  { it: TranslationKeys }
  & { [K in Exclude<Language, 'it'>]: Partial<TranslationKeys> };

const translations: TranslationsMap = {
  it: {
    brand_subtitle: 'Gestire la quotidianità', brand_tagline: 'Vivere la quotidianità, insieme',
    role_admin: 'Admin', role_ragazzo: 'Ragazzo',
    nav_dashboard: 'Panoramica', nav_ragazzi: 'Ragazzi', nav_tasks: 'Compiti', nav_commitments: 'Impegni',
    nav_weekly_activities: 'Attività settimanali', nav_stats: 'Statistiche',
    stats_title: 'Statistiche mensili compiti',
    stats_legend: 'Legenda compiti',
    stats_never_done: 'Compiti mai svolti',
    stats_prev_month: 'Precedente',
    stats_next_month: 'Successivo',
    stats_current_month: 'Questo mese',
    nav_profile: 'Profilo', nav_home: 'Home', nav_logout: 'Esci', nav_notifications: 'Notifiche',
    auth_login: 'Accedi a Diaconia', auth_email: 'Email', auth_password: 'Password',
    auth_login_btn: 'Accedi', auth_logging_in: 'Accesso in corso...', auth_error: 'Credenziali non valide',
    auth_demo_credentials: 'Credenziali demo', auth_demo_password_hint: 'Password: demo1234',
    auth_register: 'Crea account', auth_register_btn: 'Crea account', auth_registering: 'Registrazione in corso...',
    auth_first_name: 'Nome', auth_last_name: 'Cognome',
    auth_password_confirm: 'Conferma password', auth_passwords_mismatch: 'Le password non coincidono',
    auth_no_account: 'Non hai un account? Registrati', auth_already_account: 'Hai già un account? Accedi',
    dash_title: 'Panoramica', dash_active_ragazzi: 'Ragazzi registrati in piattaforma', dash_weekly_tasks: 'Compiti di questa settimana',
    dash_completions: 'Compiti completati questa settimana', dash_pending: 'Compiti non ancora svolti',
    dash_welcome: 'Benvenuto nella piattaforma Diaconia', dash_quick_actions: 'Azioni rapide',
    dash_section_ragazzi: 'Ragazzi', dash_section_weekly: 'Settimanale', dash_general_tasks: 'Compiti generali',
    report_open: 'Apri report',
    rag_title: 'Ragazzi', rag_add: 'Aggiungi ragazzo', rag_first_name: 'Nome', rag_last_name: 'Cognome',
    rag_birth_date: 'Data di nascita', rag_phone: 'Telefono', rag_email: 'Email', rag_tax_code: 'Codice fiscale',
    rag_language: 'Lingua', rag_keywords: 'Parole chiave', rag_save: 'Salva', rag_cancel: 'Annulla',
    rag_edit: 'Modifica', rag_delete: 'Elimina', rag_view: 'Visualizza',
    task_title: 'Compiti settimanali', task_add: 'Aggiungi compito', task_name: 'Nome compito',
    task_points: 'Punti', task_assign: 'Assegna a', task_unassigned: 'Non assegnato',
    task_complete: 'Fatto', task_book: 'Faccio io!', task_completed: 'Finito!',
    task_week: 'Settimana', task_prev_week: 'Precedente', task_next_week: 'Successiva',
    task_today: 'Questa settimana', task_my_tasks: 'I miei compiti', task_none_assigned: 'Nessun compito assegnato',
    task_available: 'Compiti disponibili', task_none_available: 'Nessun compito disponibile',
    task_manage: 'Modifica compiti', task_manage_title: 'Compiti settimana',
    task_empty: 'Nessun compito. Aggiungine uno per iniziare.',
    task_confirm_delete: 'Eliminare questo compito? Tutti i completamenti collegati verranno rimossi.',
    task_templates_title: 'Compiti generali',
    task_template_drop_here: 'Trascina qui un nuovo compito',
    task_template_drop_hint: 'Rilascia per aggiungerlo alla settimana',
    task_templates_empty: 'Nessun compito generale. Aggiungine uno per iniziare.',
    task_template_add: 'Aggiungi compito generale',
    task_template_confirm_delete: 'Eliminare questo compito generale? Le istanze già aggiunte alle settimane non verranno toccate.',
    task_template_already_in_week: 'Già nella settimana',
    task_completion_confirm_title: 'Il ragazzo ha svolto l\'attività?',
    task_completion_confirm_yes: 'Sì, confermo',
    task_completion_confirm_no: 'No',
    task_completion_pending_tooltip: 'In attesa di conferma — clicca per rivedere',
    day_mon: 'Lun', day_tue: 'Mar', day_wed: 'Mer', day_thu: 'Gio',
    day_fri: 'Ven', day_sat: 'Sab', day_sun: 'Dom',
    report_title: 'Report', report_of: 'di', report_add: 'Nuovo report', report_date: 'Data',
    report_daily_area: 'Area quotidiana', report_health: 'Salute', report_family_area: 'Area familiare',
    report_social_relational: 'Socio-relazionale', report_psycho_affective: 'Psico-affettivo',
    report_cognitive_area: 'Area cognitiva',
    report_individual_session: 'Colloquio individuale', report_save: 'Salva report', report_voice: 'Dettatura vocale',
    report_edit: 'Modifica report',
    report_empty: 'Report vuoto', report_download: 'Scarica il report',
    photo_title: 'Documenti', photo_upload: 'Carica un documento', photo_delete: 'Elimina',
    photo_confirm_delete: 'Sei sicuro di voler eliminare questo file?',
    photo_preview: 'Anteprima', photo_confirm_delete_title: 'Conferma eliminazione',
    photo_demo_warning: 'Demo mode — le foto non vengono salvate',
    points_title: 'Punti', points_weekly: 'Punti settimanali', chart_points: 'Punti',
    points_card_pre: 'Hai accumulato', points_card_post: 'punti. Grande!',
    top_task_title: 'Compito preferito:', top_task_count_pre: 'Svolto', top_task_count_post: 'volte',
    commit_title: 'Impegni settimanali', commit_add: 'Aggiungi impegno', commit_text: 'Testo impegno', commit_day: 'Giorno', commit_edit: 'Modifica impegno',
    nav_washing_machine: 'Lavatrice',
    washing_machine_title: 'Gestione lavatrice',
    washing_machine_col_v: 'V',
    washing_machine_col_la: 'L e A',
    washing_machine_empty_ragazzi: 'Nessun ragazzo. Aggiungine uno per iniziare a usare il calendario lavatrice.',
    washing_machine_prev_month: 'Precedente',
    washing_machine_next_month: 'Successivo',
    washing_machine_current_month: 'Questo mese',
    washing_machine_day_header: 'Giorno',
    weekly_activities: 'Attività settimanali',
    wa_manage: 'Modifica fasce attività', wa_manage_title: 'Fasce attività',
    wa_add: 'Aggiungi fascia', wa_name: 'Nome fascia',
    wa_empty: 'Nessuna fascia. Aggiungine una per iniziare.',
    wa_confirm_delete: 'Eliminare questa fascia? Tutte le voci collegate verranno rimosse.',
    wa_download_pdf: 'Scarica PDF',
    notif_title: 'Notifiche', notif_mark_all: 'Segna tutto come letto', notif_empty: 'Nessuna notifica',
    profile_personal_info: 'Informazioni personali', profile_settings: 'Impostazioni',
    nav_admin_profile: 'Profilo',
    admin_profile_title: 'Profilo admin',
    admin_profile_features_heading: 'Funzionalità abilitate',
    admin_profile_ragazzi_heading: 'Impostazioni per i ragazzi',
    admin_profile_feature_weekly_tasks: 'Utilizzo calendario "Compiti settimanali"',
    admin_profile_feature_weekly_commitments: 'Utilizzo calendario "Impegni settimanali"',
    admin_profile_feature_weekly_activities: 'Utilizzo calendario "Attività settimanali"',
    admin_profile_feature_monthly_task_stats: 'Utilizzo "Statistiche mensili compiti"',
    admin_profile_feature_washing_machine: 'Utilizzo "Gestione lavatrice"',
    admin_profile_feature_monthly_reports: 'Utilizzo "Report mensili"',
    admin_profile_ragazzi_see_task_scores: 'I ragazzi possono vedere i punteggi dei compiti',
    admin_profile_ragazzi_see_weekly_activities: 'I ragazzi possono vedere il calendario "Attività settimanali"',
    admin_profile_save_error: 'Impossibile aggiornare le impostazioni',
    settings_text_size: 'Dimensione testo', settings_text_size_normal: 'Normale', settings_text_size_large: 'Grande',
    settings_visual_accessibility: 'Accessibilità visiva',
    keywords_empty: 'Nessuna parola chiave', keywords_new_placeholder: 'Nuova parola chiave...',
    ragazzo_home_title: 'Rieccoti a casa!',
    ragazzo_greeting: 'Ciao!', ragazzo_welcome: 'Benvenuto nella tua area personale',
    ragazzo_your_role: 'Il tuo ruolo',
    demo_mode_banner: 'Modalità demo — nessun backend collegato',
    common_loading: 'Caricamento...', common_error: 'Si è verificato un errore', common_save: 'Salva',
    common_cancel: 'Annulla', common_confirm: 'Conferma', common_close: 'Chiudi',
    common_search: 'Cerca...', common_no_data: 'Nessun dato disponibile',
    email_precompiled_button: "Invia un'email precompilata",
    email_warning_title: 'Avvertenza',
    email_warning_heading: 'Se non si è aperto il tuo client email…',
    email_warning_body: 'Il tuo dispositivo non ha un\'app email predefinita configurata per gestire i link "mailto:". Devi sceglierne una dalle impostazioni del sistema:',
    email_warning_windows: 'Windows: Impostazioni → App → App predefinite → cerca "mailto" o l\'app email (Outlook, Posta, Thunderbird) e assegnala.',
    email_warning_macos: 'macOS: apri l\'app Mail → Mail → Impostazioni → Generali → "App email predefinita".',
    email_warning_alt: 'In alternativa puoi aprire direttamente Gmail con il pulsante qui sotto, o copiare il testo precompilato e incollarlo nel client che preferisci.',
    email_copy: 'Copia testo email',
    email_copy_done: 'Copiato!',
    email_open_gmail: 'Apri in Gmail',
  },
  en: {
    nav_dashboard: 'Dashboard', nav_ragazzi: 'Residents', nav_tasks: 'Tasks', nav_commitments: 'Commitments',
    nav_profile: 'Profile', nav_home: 'Home', nav_logout: 'Logout', nav_notifications: 'Notifications',
    auth_login: 'Sign in to Diaconia', auth_email: 'Email', auth_password: 'Password',
    auth_login_btn: 'Sign in', auth_logging_in: 'Signing in...', auth_error: 'Invalid credentials',
    auth_register: 'Create account', auth_register_btn: 'Create account', auth_registering: 'Creating account...',
    auth_first_name: 'First name', auth_last_name: 'Last name',
    auth_password_confirm: 'Confirm password', auth_passwords_mismatch: 'Passwords do not match',
    auth_no_account: "Don't have an account? Sign up", auth_already_account: 'Already have an account? Sign in',
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
    report_title: 'Report', report_add: 'New report', report_date: 'Date', report_download: 'Download report',
    report_daily_area: 'Daily area', report_health: 'Health', report_family_area: 'Family area',
    report_social_relational: 'Social-relational', report_psycho_affective: 'Psycho-affective',
    report_individual_session: 'Individual session', report_save: 'Save report', report_voice: 'Voice input',
    photo_title: 'Photos & Documents', photo_upload: 'Upload file', photo_delete: 'Delete',
    photo_confirm_delete: 'Are you sure you want to delete this file?',
    points_title: 'Points', points_weekly: 'Weekly points', chart_points: 'Points',
    commit_title: 'Weekly Commitments', commit_add: 'Add commitment', commit_text: 'Commitment text',
    notif_title: 'Notifications', notif_mark_all: 'Mark all as read', notif_empty: 'No notifications',
    ragazzo_home_title: 'Welcome home',
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
    report_title: 'Rapport', report_add: 'Nouveau rapport', report_date: 'Date', report_download: 'Télécharger le rapport',
    report_daily_area: 'Zone quotidienne', report_health: 'Santé', report_family_area: 'Zone familiale',
    report_social_relational: 'Socio-relationnel', report_psycho_affective: 'Psycho-affectif',
    report_individual_session: 'Session individuelle', report_save: 'Enregistrer rapport', report_voice: 'Dictée vocale',
    photo_title: 'Photos et documents', photo_upload: 'Télécharger', photo_delete: 'Supprimer',
    photo_confirm_delete: 'Êtes-vous sûr de vouloir supprimer ce fichier?',
    points_title: 'Points', points_weekly: 'Points hebdomadaires', chart_points: 'Points',
    commit_title: 'Engagements hebdomadaires', commit_add: 'Ajouter engagement', commit_text: 'Texte',
    notif_title: 'Notifications', notif_mark_all: 'Tout marquer comme lu', notif_empty: 'Aucune notification',
    ragazzo_home_title: 'Bon retour a la maison!',
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
    report_title: 'التقرير', report_add: 'تقرير جديد', report_date: 'التاريخ', report_download: 'تحميل التقرير',
    report_daily_area: 'المجال اليومي', report_health: 'الصحة', report_family_area: 'المجال العائلي',
    report_social_relational: 'الاجتماعي', report_psycho_affective: 'النفسي-العاطفي',
    report_individual_session: 'الجلسة الفردية', report_save: 'حفظ التقرير', report_voice: 'إدخال صوتي',
    photo_title: 'الصور والمستندات', photo_upload: 'رفع ملف', photo_delete: 'حذف',
    photo_confirm_delete: 'هل أنت متأكد من حذف هذا الملف؟',
    points_title: 'النقاط', points_weekly: 'النقاط الأسبوعية', chart_points: 'النقاط',
    commit_title: 'الالتزامات الأسبوعية', commit_add: 'إضافة التزام', commit_text: 'نص الالتزام',
    notif_title: 'الإشعارات', notif_mark_all: 'تحديد الكل كمقروء', notif_empty: 'لا توجد إشعارات',
    ragazzo_home_title: 'مرحبا بعودتك إلى المنزل!',
    common_loading: 'جاري التحميل...', common_error: 'حدث خطأ', common_save: 'حفظ',
    common_cancel: 'إلغاء', common_confirm: 'تأكيد', common_close: 'إغلاق',
    common_search: 'بحث...', common_no_data: 'لا توجد بيانات',
  },
};

export function t(key: keyof TranslationKeys, lang: Language = 'it'): string {
  return translations[lang]?.[key] ?? translations['it'][key] ?? key;
}

export function getDayLabels(lang: Language): string[] {
  const keys: (keyof TranslationKeys)[] = ['day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat', 'day_sun'];
  return keys.map((k) => t(k, lang));
}

export type { TranslationKeys };
export default translations;
