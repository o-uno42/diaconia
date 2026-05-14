import { useCallback } from 'react';
import { useAppContext } from '../store/AppContext';
import { supabase, isMockMode } from '../lib/supabase';
import { apiPost } from '../lib/api';
import type { UserProfile } from '@shared/types';

// Mock users for offline demo
const MOCK_USERS: Record<string, UserProfile> = {
  'admin@demo.it': { id: 'mock-admin-id', role: 'admin', email: 'admin@demo.it', textScalePercent: 100 },
  'mario@demo.it': { id: 'mock-mario-uid', role: 'ragazzo', email: 'mario@demo.it', ragazzoId: 'mock-mario-id', textScalePercent: 100 },
  'giulia@demo.it': { id: 'mock-giulia-uid', role: 'ragazzo', email: 'giulia@demo.it', ragazzoId: 'mock-giulia-id', textScalePercent: 100 },
  'ahmed@demo.it': { id: 'mock-ahmed-uid', role: 'ragazzo', email: 'ahmed@demo.it', ragazzoId: 'mock-ahmed-id', textScalePercent: 100 },
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

      // 1. Sign in via Supabase client → stores session / JWT locally
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        dispatch({ type: 'SET_ERROR', payload: { key: 'auth', value: signInError.message } });
        dispatch({ type: 'SET_LOADING', payload: { key: 'auth', value: false } });
        return false;
      }

      // 2. Fetch full profile from backend (JWT sent automatically via apiPost → getToken)
      const res = await apiPost<{ user: UserProfile }>('/api/auth/login');
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

  const register = useCallback(async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: 'admin' | 'ragazzo' = 'admin',
  ): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'auth', value: true } });
    dispatch({ type: 'SET_ERROR', payload: { key: 'auth', value: null } });

    try {
      const res = await apiPost<{ message: string }>('/api/auth/register', {
        email,
        password,
        firstName,
        lastName,
        role,
      });

      if (res.error || !res.data) {
        const msg = res.error ?? 'Registration failed';
        dispatch({ type: 'SET_ERROR', payload: { key: 'auth', value: msg } });
        dispatch({ type: 'SET_LOADING', payload: { key: 'auth', value: false } });
        return { success: false, error: msg };
      }

      // Account created — user must confirm email before logging in
      dispatch({ type: 'SET_LOADING', payload: { key: 'auth', value: false } });
      return { success: true };
    } catch {
      dispatch({ type: 'SET_ERROR', payload: { key: 'auth', value: 'Registration failed' } });
      dispatch({ type: 'SET_LOADING', payload: { key: 'auth', value: false } });
      return { success: false, error: 'Registration failed' };
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
    register,
    logout,
    isAdmin: state.currentUser?.role === 'admin',
    isRagazzo: state.currentUser?.role === 'ragazzo',
  };
}
