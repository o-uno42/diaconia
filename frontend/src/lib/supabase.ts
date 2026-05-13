import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Guard: if no Supabase config, we'll use mock mode
export const isMockMode = !supabaseUrl || !supabaseAnonKey;

export const supabase = isMockMode
  ? (null as unknown as ReturnType<typeof createClient>)
  : createClient(supabaseUrl, supabaseAnonKey);
