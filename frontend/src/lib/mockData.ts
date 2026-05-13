import type { Ragazzo, Task, Notification, ReportEntry, WeeklyPoints, Commitment, EmailTemplate } from '@shared/types';

// ─── Mock Ragazzi ───────────────────────────────────────────────────
export const MOCK_RAGAZZI: Ragazzo[] = [
  {
    id: 'mock-mario-id', userId: 'mock-mario-uid',
    firstName: 'Mario', lastName: 'Rossi', birthDate: '2005-03-15',
    phone: '+39 333 1234567', email: 'mario@demo.it', taxCode: 'RSSMRA05C15H501Z',
    language: 'it', keywords: ['Autonomia', 'Puntualità'], photos: [],
    pointsHistory: genPoints('mock-mario-id'),
  },
  {
    id: 'mock-giulia-id', userId: 'mock-giulia-uid',
    firstName: 'Giulia', lastName: 'Bianchi', birthDate: '2006-07-22',
    phone: '+39 333 7654321', email: 'giulia@demo.it', taxCode: 'BNCGLI06L62H501A',
    language: 'it', keywords: ['Ansia', 'Creatività'], photos: [],
    pointsHistory: genPoints('mock-giulia-id'),
  },
  {
    id: 'mock-ahmed-id', userId: 'mock-ahmed-uid',
    firstName: 'Ahmed', lastName: 'Hassan', birthDate: '2004-11-08',
    phone: '+39 333 9876543', email: 'ahmed@demo.it', taxCode: 'HSSMHD04S08H501B',
    language: 'ar', keywords: ['Pazienza', 'Integrazione'], photos: [],
    pointsHistory: genPoints('mock-ahmed-id'),
  },
];

function genPoints(_id: string): WeeklyPoints[] {
  const pts: WeeklyPoints[] = [];
  for (let i = -6; i <= 0; i++) {
    const d = new Date(); d.setDate(d.getDate() + i * 7);
    const year = d.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
    const week = Math.ceil((days + jan1.getDay() + 1) / 7);
    const weekId = `${year}-W${String(week).padStart(2, '0')}`;
    pts.push({ weekId, weekLabel: `Sett. ${week}`, points: Math.floor(Math.random() * 8) + 2 });
  }
  return pts;
}

// ─── Mock Tasks ─────────────────────────────────────────────────────
export function getMockTasks(weekId: string): Task[] {
  return [
    { id: 'task-1', weekId, name: 'Pulizia cucina', points: 1, assignedTo: 'mock-mario-id', completions: [
      { id: 'tc-1', taskId: 'task-1', ragazzoId: 'mock-mario-id', day: 0, completedAt: new Date().toISOString(), markedByAdmin: true },
    ]},
    { id: 'task-2', weekId, name: 'Lavanderia', points: 0.5, assignedTo: 'mock-giulia-id', completions: [
      { id: 'tc-2', taskId: 'task-2', ragazzoId: 'mock-giulia-id', day: 1, completedAt: new Date().toISOString(), markedByAdmin: false },
    ]},
    { id: 'task-3', weekId, name: 'Spesa settimanale', points: 2, completions: [] },
    { id: 'task-4', weekId, name: 'Giardinaggio', points: 1, completions: [] },
    { id: 'task-5', weekId, name: 'Riordino sala comune', points: 0.5, completions: [] },
  ];
}

// ─── Mock Reports ───────────────────────────────────────────────────
export const MOCK_REPORTS: Record<string, ReportEntry[]> = {
  'mock-mario-id': [
    { id: 'r1', ragazzoId: 'mock-mario-id', date: '2025-05-10', sections: {
      dailyArea: 'Mario ha dimostrato grande Autonomia nella gestione dei compiti quotidiani. Ha completato tutte le attività assegnate.',
      health: 'Buone condizioni generali. Nessun problema segnalato.',
      familyArea: 'Contatto telefonico positivo con la famiglia. La madre ha confermato il progresso.',
      socialRelational: 'Puntualità migliorata nelle attività di gruppo. Buona interazione con i compagni.',
      psychoAffective: 'Stato emotivo stabile. Mostra crescente sicurezza.',
      individualSession: 'Lavorato su obiettivi di Autonomia personale. Progressi evidenti.',
    }, createdAt: '2025-05-10T10:00:00Z', updatedAt: '2025-05-10T10:00:00Z' },
    { id: 'r2', ragazzoId: 'mock-mario-id', date: '2025-05-08', sections: {
      dailyArea: 'Giornata produttiva. Buona Puntualità negli impegni mattutini.',
      health: 'Leggero raffreddore, ma non ha impedito le attività.',
      familyArea: 'Nessun contatto con la famiglia oggi.',
      socialRelational: 'Interazione positiva con i pari durante il pranzo.',
      psychoAffective: 'Motivato e partecipativo.',
      individualSession: 'Focus sulla Puntualità negli impegni settimanali.',
    }, createdAt: '2025-05-08T10:00:00Z', updatedAt: '2025-05-08T10:00:00Z' },
  ],
  'mock-giulia-id': [
    { id: 'r3', ragazzoId: 'mock-giulia-id', date: '2025-05-09', sections: {
      dailyArea: 'Giulia ha mostrato Creatività nel laboratorio artistico. Ottimo lavoro sul progetto.',
      health: 'Episodio di Ansia gestito con tecniche di respirazione apprese.',
      familyArea: 'Videochiamata con il padre. Momento sereno.',
      socialRelational: 'Buona Creatività nei progetti di gruppo. Ha guidato il team.',
      psychoAffective: 'Ansia sotto controllo grazie alle strategie acquisite.',
      individualSession: 'Lavoro sulla gestione dell\'Ansia. La Creatività come strumento terapeutico.',
    }, createdAt: '2025-05-09T10:00:00Z', updatedAt: '2025-05-09T10:00:00Z' },
  ],
};

// ─── Mock Notifications ─────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', userId: 'mock-admin-id', message: 'Mario Rossi ha completato "Pulizia cucina"', read: false, createdAt: new Date().toISOString() },
  { id: 'n2', userId: 'mock-admin-id', message: 'Giulia Bianchi ha prenotato "Lavanderia"', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'n3', userId: 'mock-admin-id', message: 'Nuova settimana — 3 task non assegnati', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
];

// ─── Mock Commitments ───────────────────────────────────────────────
export function getMockCommitments(weekId: string): Commitment[] {
  return [
    { id: 'c1', ragazzoId: 'mock-mario-id', weekId, day: 0, text: 'Corso di italiano' },
    { id: 'c2', ragazzoId: 'mock-mario-id', weekId, day: 2, text: 'Colloquio assistente sociale' },
    { id: 'c3', ragazzoId: 'mock-giulia-id', weekId, day: 1, text: 'Laboratorio artistico' },
    { id: 'c4', ragazzoId: 'mock-giulia-id', weekId, day: 4, text: 'Laboratorio artigianale' },
    { id: 'c5', ragazzoId: 'mock-ahmed-id', weekId, day: 0, text: 'Corso di italiano' },
    { id: 'c6', ragazzoId: 'mock-ahmed-id', weekId, day: 3, text: 'Mediazione culturale' },
  ];
}

// ─── Mock Email Templates ───────────────────────────────────────────
export const MOCK_EMAIL_TEMPLATES: EmailTemplate[] = [
  { id: 'et1', label: 'Convocazione riunione', subject: 'Convocazione riunione per {ragazzoName}', body: 'Gentile {destinatario},\n\nSi comunica che è stata fissata una riunione per discutere il percorso di {ragazzoName} in data {data}.\n\nCordiali saluti,\n{operatore}' },
  { id: 'et2', label: 'Report settimanale', subject: 'Report settimanale — {ragazzoName}', body: 'Gentile {destinatario},\n\nIn allegato il report settimanale relativo a {ragazzoName} per la settimana {settimana}.\n\nPunti ottenuti: {punti}\n\nCordiali saluti,\n{operatore}' },
  { id: 'et3', label: 'Comunicazione famiglia', subject: 'Aggiornamento su {ragazzoName}', body: 'Gentile {familiare},\n\nDesideriamo aggiornarvi sul percorso di {ragazzoName}.\n\n{aggiornamento}\n\nRimaniamo a disposizione.\n\nCordiali saluti,\n{operatore}' },
];
