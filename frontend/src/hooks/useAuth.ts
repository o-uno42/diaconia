import { useCallback } from 'react';
import { useAppContext } from '../store/AppContext';
import { supabase, isMockMode } from '../lib/supabase';
import { apiPost } from '../lib/api';
import type { UserProfile } from '@shared/types';

// Mock users for offline demo
const MOCK_USERS: Record<string, UserProfile> = {
  'admin@demo.it': { id: 'mock-admin-id', role: 'admin', email: 'admin@demo.it' },
  'mario@demo.it': { id: 'mock-mario-uid', role: 'ragazzo', email: 'mario@demo.it', ragazzoId: 'mock-mario-id' },
  'giulia@demo.it': { id: 'mock-giulia-uid', role: 'ragazzo', email: 'giulia@demo.it', ragazzoId: 'mock-giulia-id' },
  'ahmed@demo.it': { id: 'mock-ahmed-uid', role: 'ragazzo', email: 'ahmed@demo.it', ragazzoId: 'mock-ahmed-id' },
};

export function useAuth() {
  const { state, dispatch } = useAppContext();

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'auth', value: true } });
    dispatch({ type: 'SET_ERROR', payload: { key: 'auth', value: null } });

    try {
      if (isMockMode) {
        const mockUser = MOCK_USERS[email];
        if (mockUser && password === 'demo1234') {
          dispatch({ type: 'SET_USER', payload: mockUser });
          dispatch({ type: 'SET_LOADING', payload: { key: 'auth', value: false } });
          return true;
        }
        dispatch({ type: 'SET_ERROR', payload: { key: 'auth', value: 'Invalid credentials' } });
        dispatch({ type: 'SET_LOADING', payload: { key: 'auth', value: false } });
        return false;
      }

      // Real Supabase auth
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        dispatch({ type: 'SET_ERROR', payload: { key: 'auth', value: signInError.message } });
        dispatch({ type: 'SET_LOADING', payload: { key: 'auth', value: false } });
        return false;
      }

      const res = await apiPost<{ session: unknown; user: UserProfile }>('/api/auth/login', { email, password });
      if (res.error || !res.data) {
        dispatch({ type: 'SET_ERROR', payload: { key: 'auth', value: res.error ?? 'Login failed' } });
        dispatch({ type: 'SET_LOADING', payload: { key: 'auth', value: false } });
        return false;
      }

      dispatch({ type: 'SET_USER', payload: res.data.user });
      dispatch({ type: 'SET_LOADING', payload: { key: 'auth', value: false } });
      return true;
    } catch {
      dispatch({ type: 'SET_ERROR', payload: { key: 'auth', value: 'Login failed' } });
      dispatch({ type: 'SET_LOADING', payload: { key: 'auth', value: false } });
      return false;
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    if (!isMockMode) {
      await supabase.auth.signOut();
    }
    dispatch({ type: 'SET_USER', payload: null });
    dispatch({ type: 'SET_RAGAZZI', payload: [] });
    dispatch({ type: 'SET_TASKS', payload: [] });
    dispatch({ type: 'SET_NOTIFICATIONS', payload: [] });
  }, [dispatch]);

  return {
    user: state.currentUser,
    loading: state.loading.auth,
    error: state.error.auth,
    login,
    logout,
    isAdmin: state.currentUser?.role === 'admin',
    isRagazzo: state.currentUser?.role === 'ragazzo',
  };
}
