import type { ApiResponse } from '@shared/types';
import { supabase, isMockMode } from './supabase';

const envBaseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const BASE_URL = envBaseUrl || `${window.location.protocol}//${window.location.hostname}:3001`;

async function getToken(): Promise<string | null> {
  if (isMockMode) return 'mock-token';
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json() as ApiResponse<T>;
    if (!res.ok) return { error: json.error ?? `HTTP ${res.status}` };
    return json;
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  return request<T>('GET', path);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<T>('POST', path, body);
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<T>('PATCH', path, body);
}

export async function apiDelete(path: string): Promise<ApiResponse<void>> {
  return request<void>('DELETE', path);
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST', headers, body: formData,
    });
    const json = await res.json() as ApiResponse<T>;
    if (!res.ok) return { error: json.error ?? `HTTP ${res.status}` };
    return json;
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Network error' };
  }
}
