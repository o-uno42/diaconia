import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { UserProfile, Ragazzo, Task, Notification, Language, AdminSettings } from '@shared/types';

// ─── State ──────────────────────────────────────────────────────────
interface AppState {
  currentUser: UserProfile | null;
  language: Language;
  textScalePercent: number;
  highContrast: boolean;
  ragazzi: Ragazzo[];
  tasks: Task[];
  notifications: Notification[];
  weekOffset: number;
  loading: { auth: boolean; ragazzi: boolean; tasks: boolean; notifications: boolean };
  error: { auth: string | null; ragazzi: string | null; tasks: string | null };
}

const initialState: AppState = {
  currentUser: null,
  language: 'it',
  textScalePercent: 100,
  highContrast: false,
  ragazzi: [],
  tasks: [],
  notifications: [],
  weekOffset: 0,
  loading: { auth: false, ragazzi: false, tasks: false, notifications: false },
  error: { auth: null, ragazzi: null, tasks: null },
};

// ─── Actions ────────────────────────────────────────────────────────
type AppAction =
  | { type: 'SET_USER'; payload: UserProfile | null }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_TEXT_SCALE_PERCENT'; payload: number }
  | { type: 'SET_HIGH_CONTRAST'; payload: boolean }
  | { type: 'SET_ADMIN_SETTINGS'; payload: AdminSettings }
  | { type: 'SET_RAGAZZI'; payload: Ragazzo[] }
  | { type: 'UPDATE_RAGAZZO'; payload: Ragazzo }
  | { type: 'ADD_RAGAZZO'; payload: Ragazzo }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'REMOVE_TASK'; payload: string }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'MARK_NOTIFICATIONS_READ' }
  | { type: 'SET_WEEK_OFFSET'; payload: number }
  | { type: 'SET_LOADING'; payload: { key: keyof AppState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: { key: keyof AppState['error']; value: string | null } };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        currentUser: action.payload,
        textScalePercent:
          action.payload?.role === 'ragazzo'
            ? (action.payload.textScalePercent ?? 100)
            : 100,
        highContrast: action.payload?.highContrast ?? false,
      };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_TEXT_SCALE_PERCENT':
      return {
        ...state,
        textScalePercent: action.payload,
        currentUser: state.currentUser
          ? { ...state.currentUser, textScalePercent: action.payload }
          : state.currentUser,
      };
    case 'SET_HIGH_CONTRAST':
      return {
        ...state,
        highContrast: action.payload,
        currentUser: state.currentUser
          ? { ...state.currentUser, highContrast: action.payload }
          : state.currentUser,
      };
    case 'SET_ADMIN_SETTINGS':
      return {
        ...state,
        currentUser: state.currentUser
          ? { ...state.currentUser, adminSettings: action.payload }
          : state.currentUser,
      };
    case 'SET_RAGAZZI':
      return { ...state, ragazzi: action.payload };
    case 'UPDATE_RAGAZZO':
      return { ...state, ragazzi: state.ragazzi.map((r) => (r.id === action.payload.id ? action.payload : r)) };
    case 'ADD_RAGAZZO':
      return { ...state, ragazzi: [...state.ragazzi, action.payload] };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)) };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'REMOVE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload) };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'MARK_NOTIFICATIONS_READ':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    case 'SET_WEEK_OFFSET':
      return { ...state, weekOffset: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.payload.key]: action.payload.value } };
    case 'SET_ERROR':
      return { ...state, error: { ...state.error, [action.payload.key]: action.payload.value } };
    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

export type { AppState, AppAction };
