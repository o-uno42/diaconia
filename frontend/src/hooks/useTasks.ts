import { useCallback } from 'react';
import { useAppContext } from '../store/AppContext';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { isMockMode } from '../lib/supabase';
import type { Task } from '@shared/types';
import { getMockTasks } from '../lib/mockData';

export function getWeekId(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  const year = d.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function formatWeekRange(offset: number, lang = 'it'): string {
  const now = new Date();
  // move to a date within the requested week
  const target = new Date(now);
  target.setDate(now.getDate() + offset * 7);

  // calculate monday of that week (Monday as first day)
  const monday = new Date(target);
  const diffToMonday = (target.getDay() + 6) % 7; // 0 for Monday
  monday.setDate(target.getDate() - diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const dayFormatter = new Intl.DateTimeFormat(lang, { day: 'numeric' });
  const monthFormatter = new Intl.DateTimeFormat(lang, { month: 'short' });

  const startDay = dayFormatter.format(monday);
  const endDay = dayFormatter.format(sunday);
  let startMonth = monthFormatter.format(monday);
  let endMonth = monthFormatter.format(sunday);

  // Normalize month capitalization and remove trailing dots (some locales use 'gen.' )
  const normalize = (s: string) => s.replace('.', '').replace(/(^|\s)\S/g, (t) => t.toUpperCase());
  startMonth = normalize(startMonth);
  endMonth = normalize(endMonth);

  if (startMonth === endMonth) return `${startDay}-${endDay} ${startMonth}`;
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
}

export function useTasks() {
  const { state, dispatch } = useAppContext();

  const fetchTasks = useCallback(async (weekOffset?: number) => {
    const offset = weekOffset ?? state.weekOffset;
    const weekId = getWeekId(offset);
    dispatch({ type: 'SET_LOADING', payload: { key: 'tasks', value: true } });

    if (isMockMode) {
      dispatch({ type: 'SET_TASKS', payload: getMockTasks(weekId) });
      dispatch({ type: 'SET_LOADING', payload: { key: 'tasks', value: false } });
      return;
    }

    const res = await apiGet<Task[]>(`/api/tasks?weekId=${weekId}`);
    if (res.data) dispatch({ type: 'SET_TASKS', payload: res.data });
    dispatch({ type: 'SET_LOADING', payload: { key: 'tasks', value: false } });
  }, [state.weekOffset, dispatch]);

  const createTask = useCallback(async (name: string, points: number, assignedTo?: string) => {
    const weekId = getWeekId(state.weekOffset);
    const res = await apiPost<Task>('/api/tasks', { weekId, name, points, assignedTo });
    if (res.data) dispatch({ type: 'ADD_TASK', payload: res.data });
    return res;
  }, [state.weekOffset, dispatch]);

  const completeTask = useCallback(async (taskId: string, ragazzoId: string, day: number) => {
    const res = await apiPost<Task>(`/api/tasks/${taskId}/complete`, { ragazzoId, day });
    if (!res.error) await fetchTasks();
    return res;
  }, [fetchTasks]);

  const confirmCompletion = useCallback(async (completionId: string) => {
    const res = await apiPatch(`/api/tasks/completions/${completionId}/confirm`);
    if (!res.error) await fetchTasks();
    return res;
  }, [fetchTasks]);

  const deleteCompletion = useCallback(async (completionId: string) => {
    const res = await apiDelete(`/api/tasks/completions/${completionId}`);
    if (!res.error) await fetchTasks();
    return res;
  }, [fetchTasks]);

  const bookTask = useCallback(async (taskId: string) => {
    const res = await apiPost<Task>(`/api/tasks/${taskId}/book`);
    if (res.data) dispatch({ type: 'UPDATE_TASK', payload: res.data });
    return res;
  }, [dispatch]);

  const updateTask = useCallback(async (taskId: string, patch: { name?: string; points?: number }) => {
    const res = await apiPatch<Task>(`/api/tasks/${taskId}`, patch);
    if (res.data) dispatch({ type: 'UPDATE_TASK', payload: res.data });
    return res;
  }, [dispatch]);

  const deleteTask = useCallback(async (taskId: string) => {
    const res = await apiDelete(`/api/tasks/${taskId}`);
    if (!res.error) dispatch({ type: 'REMOVE_TASK', payload: taskId });
    return res;
  }, [dispatch]);

  const setWeekOffset = useCallback((offset: number) => {
    dispatch({ type: 'SET_WEEK_OFFSET', payload: offset });
  }, [dispatch]);

  return {
    tasks: state.tasks,
    loading: state.loading.tasks,
    weekOffset: state.weekOffset,
    currentWeekId: getWeekId(state.weekOffset),
    fetchTasks,
    createTask,
    updateTask,
    completeTask,
    confirmCompletion,
    deleteCompletion,
    bookTask,
    deleteTask,
    setWeekOffset,
  };
}
