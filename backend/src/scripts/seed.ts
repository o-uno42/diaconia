import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) { console.error('Missing env vars'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } });

function getWeekId(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  const year = d.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

async function seed() {
  console.log('🌱 Seeding Diaconia database...');

  // 1. Admin user
  const { data: adminAuth } = await supabase.auth.admin.createUser({
    email: 'admin@demo.it', password: 'demo1234', email_confirm: true,
  });
  if (!adminAuth?.user) { console.error('Failed to create admin'); return; }
  await supabase.from('profiles').insert({ id: adminAuth.user.id, role: 'admin' });
  const adminId = adminAuth.user.id;
  console.log('✅ Admin created');

  // Backfill rows inserted by migrations (weekly_activities catalog, etc.) that
  // were created before any admin existed — assign them to the demo admin so
  // owner_admin_id is no longer null.
  await supabase.from('weekly_activities').update({ owner_admin_id: adminId }).is('owner_admin_id', null);
  await supabase.from('task_templates').update({ owner_admin_id: adminId }).is('owner_admin_id', null);
  await supabase.from('email_templates').update({ owner_admin_id: adminId }).is('owner_admin_id', null);

  // 2. Ragazzi
  const ragazziData = [
    { email: 'mario@demo.it', firstName: 'Mario', lastName: 'Rossi', birthDate: '2005-03-15', phone: '+39 333 1234567', taxCode: 'RSSMRA05C15H501Z', language: 'it', keywords: ['Autonomia', 'Puntualità'] },
    { email: 'giulia@demo.it', firstName: 'Giulia', lastName: 'Bianchi', birthDate: '2006-07-22', phone: '+39 333 7654321', taxCode: 'BNCGLI06L62H501A', language: 'it', keywords: ['Ansia', 'Creatività'] },
    { email: 'ahmed@demo.it', firstName: 'Ahmed', lastName: 'Hassan', birthDate: '2004-11-08', phone: '+39 333 9876543', taxCode: 'HSSMHD04S08H501B', language: 'ar', keywords: ['Pazienza', 'Integrazione'] },
  ];

  const ragazzoIds: string[] = [];
  const ragazzoUserIds: string[] = [];

  for (const r of ragazziData) {
    const { data: authData } = await supabase.auth.admin.createUser({
      email: r.email, password: 'demo1234', email_confirm: true,
    });
    if (!authData?.user) { console.error(`Failed to create ${r.email}`); continue; }

    const { data: ragazzo } = await supabase.from('ragazzi').insert({
      user_id: authData.user.id, owner_admin_id: adminId,
      first_name: r.firstName, last_name: r.lastName,
      birth_date: r.birthDate, phone: r.phone, email: r.email, tax_code: r.taxCode,
      language: r.language, keywords: r.keywords,
    }).select().single();

    if (ragazzo) {
      ragazzoIds.push(ragazzo.id as string);
      ragazzoUserIds.push(authData.user.id);
      await supabase.from('profiles').insert({ id: authData.user.id, role: 'ragazzo', ragazzo_id: ragazzo.id });
    }
    console.log(`✅ ${r.firstName} ${r.lastName} created`);
  }

  // 3. Tasks for current week + past weeks
  const currentWeekId = getWeekId(0);
  const currentWeekTasks = [
    { name: 'Pulizia cucina', points: 1, assigned_to: ragazzoIds[0] },
    { name: 'Lavanderia', points: 0.5, assigned_to: ragazzoIds[1] },
    { name: 'Spesa settimanale', points: 2, assigned_to: null },
    { name: 'Giardinaggio', points: 1, assigned_to: null },
    { name: 'Riordino sala comune', points: 0.5, assigned_to: null },
  ];

  for (const t of currentWeekTasks) {
    await supabase.from('tasks').insert({
      week_id: currentWeekId, owner_admin_id: adminId,
      name: t.name, points: t.points, assigned_to: t.assigned_to,
    });
  }
  console.log('✅ Current week tasks created');

  // 4. Past weeks tasks + completions (6 weeks)
  const pastTaskNames = ['Pulizia bagno', 'Cucina pranzo', 'Lavare piatti', 'Riordinare camera', 'Aspirapolvere'];
  for (let w = -6; w < 0; w++) {
    const weekId = getWeekId(w);
    for (const taskName of pastTaskNames) {
      const points = [0.5, 1, 2][Math.floor(Math.random() * 3)] ?? 1;
      const assignedIdx = Math.floor(Math.random() * 3);

      const { data: task } = await supabase.from('tasks').insert({
        week_id: weekId, owner_admin_id: adminId,
        name: taskName, points, assigned_to: ragazzoIds[assignedIdx],
      }).select().single();

      if (task) {
        // Random completions for each ragazzo
        const numCompletions = Math.floor(Math.random() * 4) + 1;
        for (let d = 0; d < numCompletions; d++) {
          const ragIdx = Math.floor(Math.random() * 3);
          await supabase.from('task_completions').insert({
            task_id: task.id, ragazzo_id: ragazzoIds[ragIdx], day: d, marked_by_admin: Math.random() > 0.5,
          });
        }
      }
    }
  }
  console.log('✅ 6 weeks of historical data created');

  // Complete some current week tasks
  const { data: cwTasks } = await supabase.from('tasks').select('id').eq('week_id', currentWeekId).limit(2);
  for (const t of cwTasks ?? []) {
    await supabase.from('task_completions').insert({
      task_id: t.id, ragazzo_id: ragazzoIds[0], day: 0, marked_by_admin: true,
    });
  }

  // 5. Report entries
  const marioReports = [
    { date: '2025-05-10', daily_area: 'Mario ha dimostrato grande Autonomia nella gestione dei compiti.', health: 'Buone condizioni generali.', family_area: 'Contatto telefonico positivo con la famiglia.', social_relational: 'Puntualità migliorata nelle attività di gruppo.', psycho_affective: 'Stato emotivo stabile.', cognitive_area: '', individual_session: 'Lavorato su obiettivi di Autonomia personale.' },
    { date: '2025-05-08', daily_area: 'Giornata produttiva. Buona Puntualità.', health: 'Leggero raffreddore.', family_area: 'Nessun contatto.', social_relational: 'Interazione positiva con i pari.', psycho_affective: 'Motivato.', cognitive_area: '', individual_session: 'Focus sulla Puntualità negli impegni.' },
    { date: '2025-05-05', daily_area: 'Impegno nell\'Autonomia quotidiana.', health: 'Ok.', family_area: 'Visita della madre.', social_relational: 'Partecipazione attiva.', psycho_affective: 'Sereno.', cognitive_area: '', individual_session: 'Progresso sull\'Autonomia.' },
  ];

  for (const r of marioReports) {
    await supabase.from('report_entries').insert({ ragazzo_id: ragazzoIds[0], ...r });
  }

  const giuliaReports = [
    { date: '2025-05-09', daily_area: 'Giulia ha mostrato Creatività nel laboratorio artistico.', health: 'Episodio di Ansia gestito con tecniche di respirazione.', family_area: 'Videochiamata con il padre.', social_relational: 'Buona Creatività nei progetti di gruppo.', psycho_affective: 'Ansia sotto controllo.', cognitive_area: '', individual_session: 'Lavoro sulla gestione dell\'Ansia.' },
    { date: '2025-05-07', daily_area: 'Partecipazione alla Creatività musicale.', health: 'Ok.', family_area: 'Lettera alla sorella.', social_relational: 'Collaborativa.', psycho_affective: 'Leggera Ansia pre-attività.', cognitive_area: '', individual_session: 'Creatività come strumento terapeutico.' },
  ];

  for (const r of giuliaReports) {
    await supabase.from('report_entries').insert({ ragazzo_id: ragazzoIds[1], ...r });
  }
  console.log('✅ Report entries created');

  // 6. Commitments
  for (let i = 0; i < 3; i++) {
    const commitments = [
      { day: 0, text: 'Corso di italiano' },
      { day: 2, text: 'Colloquio con assistente sociale' },
      { day: 4, text: 'Laboratorio artigianale' },
    ];
    for (const c of commitments) {
      await supabase.from('commitments').insert({
        ragazzo_id: ragazzoIds[i], week_id: currentWeekId, day: c.day, text: c.text,
      });
    }
  }
  console.log('✅ Commitments created');

  // 7. Email templates
  const templates = [
    { label: 'Convocazione riunione', subject: 'Convocazione riunione per {ragazzoName}', body: 'Gentile {destinatario},\n\nSi comunica che è stata fissata una riunione per discutere il percorso di {ragazzoName} in data {data}.\n\nCordiali saluti,\n{operatore}' },
    { label: 'Report settimanale', subject: 'Report settimanale — {ragazzoName}', body: 'Gentile {destinatario},\n\nIn allegato il report settimanale relativo a {ragazzoName} per la settimana {settimana}.\n\nPunti ottenuti: {punti}\n\nCordiali saluti,\n{operatore}' },
    { label: 'Comunicazione famiglia', subject: 'Aggiornamento su {ragazzoName}', body: 'Gentile {familiare},\n\nDesideriamo aggiornarvi sul percorso di {ragazzoName}.\n\n{aggiornamento}\n\nRimaniamo a disposizione per qualsiasi chiarimento.\n\nCordiali saluti,\n{operatore}' },
  ];
  for (const t of templates) {
    await supabase.from('email_templates').insert(t);
  }
  console.log('✅ Email templates created');

  // 8. Sample notifications
  await supabase.from('notifications').insert([
    { user_id: adminAuth.user.id, message: 'Mario Rossi ha completato "Pulizia cucina"', read: false },
    { user_id: adminAuth.user.id, message: 'Giulia Bianchi ha prenotato "Lavanderia"', read: false },
    { user_id: adminAuth.user.id, message: 'Nuova settimana iniziata — 3 task non assegnati', read: true },
  ]);
  console.log('✅ Notifications created');

  console.log('\n🎉 Seed complete! Demo credentials:');
  console.log('  Admin:   admin@demo.it / demo1234');
  console.log('  Mario:   mario@demo.it / demo1234');
  console.log('  Giulia:  giulia@demo.it / demo1234');
  console.log('  Ahmed:   ahmed@demo.it / demo1234');
}

seed().catch(console.error);
