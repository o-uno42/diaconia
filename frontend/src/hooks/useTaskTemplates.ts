import { useCallback, useState } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import { isMockMode } from '../lib/supabase';
import { MOCK_TASK_TEMPLATES } from '../lib/mockData';
import type { TaskTemplate } from '@shared/types';

export function useTaskTemplates() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    if (isMockMode) {
      setTemplates(MOCK_TASK_TEMPLATES);
      setLoading(false);
      return;
    }
    const res = await apiGet<TaskTemplate[]>('/api/task-templates');
    if (res.data) setTemplates(res.data);
    setLoading(false);
  }, []);

  const createTemplate = useCallback(async (name: string, points: number) => {
    if (isMockMode) {
      const newTpl: TaskTemplate = {
        id: `tt-${Date.now()}`,
        name,
        points: points as TaskTemplate['points'],
        createdAt: new Date().toISOString(),
      };
      setTemplates((prev) => [...prev, newTpl]);
      return { data: newTpl };
    }
    const res = await apiPost<TaskTemplate>('/api/task-templates', { name, points });
    if (res.data) setTemplates((prev) => [...prev, res.data!]);
    return res;
  }, []);

  const updateTemplate = useCallback(async (id: string, patch: { name?: string; points?: number }) => {
    if (isMockMode) {
      setTemplates((prev) => prev.map((t) => t.id === id ? {
        ...t,
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.points !== undefined ? { points: patch.points as TaskTemplate['points'] } : {}),
      } : t));
      return { data: null };
    }
    const res = await apiPatch<TaskTemplate>(`/api/task-templates/${id}`, patch);
    if (res.data) setTemplates((prev) => prev.map((t) => t.id === id ? res.data! : t));
    return res;
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    if (isMockMode) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      return { data: null };
    }
    const res = await apiDelete(`/api/task-templates/${id}`);
    if (!res.error) setTemplates((prev) => prev.filter((t) => t.id !== id));
    return res;
  }, []);

  return { templates, loading, fetchTemplates, createTemplate, updateTemplate, deleteTemplate };
}
