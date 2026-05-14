# Diaconia — Case Management Platform

> Piattaforma di gestione per comunità educative. Due ruoli: **Admin** e **Ragazzo**.

![Stack](https://img.shields.io/badge/React-TypeScript-blue) ![Stack](https://img.shields.io/badge/Express-Node.js-green) ![Stack](https://img.shields.io/badge/Supabase-Postgres-purple)

---

## 🔐 Credenziali Demo

| Ruolo   | Email             | Password   |
|---------|-------------------|------------|
| Admin   | admin@demo.it     | demo1234   |
| Mario   | mario@demo.it     | demo1234   |
| Giulia  | giulia@demo.it    | demo1234   |
| Ahmed   | ahmed@demo.it     | demo1234   |

---

## 🚀 Quick Start

### Prerequisiti
- Node.js >= 18
- Un progetto [Supabase](https://supabase.com) (o usare la **modalità demo** senza backend)

### 1. Installa le dipendenze
```bash
npm install
```

### 2. Configura Supabase (opzionale — la modalità demo funziona senza)

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Vai su **SQL Editor** ed esegui le migrations in ordine: `supabase/migrations/001_initial.sql`, poi `002`, `003`, `004`
   (la `004` crea automaticamente il bucket Storage privato `ragazzo_photos`)
3. Copia le chiavi nelle variabili d'ambiente:

```bash
# backend/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001

# frontend/.env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

### 3. Seed del database (richiede Supabase configurato)
```bash
npm run seed
```

### 4. Avvia in sviluppo
```bash
# Frontend + Backend insieme
npm run dev

# Oppure separatamente:
npm run dev:frontend   # → http://localhost:5173
npm run dev:backend    # → http://localhost:3001
```

### 5. Modalità Demo (senza Supabase)

Se le variabili `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` sono vuote, l'app parte in **modalità demo** con dati mock integrati. Basta avviare il frontend:

```bash
npm run dev:frontend
```

---

## 📁 Struttura

```
├── packages/shared/types/   # Interfacce TypeScript condivise
├── frontend/                # React + Vite + Tailwind
├── backend/                 # Express + TypeScript
├── supabase/migrations/     # Schema SQL + RLS
└── README.md
```

## ✨ Funzionalità

### P0 — Core (completato)
- ✅ Autenticazione email/password via Supabase
- ✅ Profili ragazzi CRUD (admin) + vista propria (ragazzo)
- ✅ Calendario compiti (griglia admin + vista giornaliera ragazzo)
- ✅ Punti settimanali (calcolati on-the-fly + grafico Recharts)
- ✅ Report con evidenziazione parole chiave
- ✅ Upload foto (array semplice, signed URLs)

### P1 — Nice to have (completato)
- ✅ Calendario impegni settimanali
- ✅ Notifiche in-app (polling 30s)
- ✅ i18n (it/en/fr/ar con supporto RTL)

### P2 — Bonus
- ✅ Voice input per report (Web Speech API)
- ✅ Modalità demo offline (dati mock integrati)

## 🎨 Design

- **Tema Admin:** Slate + Indigo con glassmorphism
- **Tema Ragazzo:** Emerald + Sky, mobile-first
- **Animazioni:** fade-in, slide-up, scale-in, hover lift
- **Font:** Inter (Google Fonts)
- **Responsive:** Desktop sidebar + mobile bottom nav

## 🔧 Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 3, Vite, Recharts, React Router
- **Backend:** Express, TypeScript, Multer, Supabase JS
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Monorepo:** npm workspaces
