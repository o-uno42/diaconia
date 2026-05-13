import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    // Use a fresh client with anon key behavior through service role
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({ error: error.message });
      return;
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, ragazzo_id')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      res.status(500).json({ error: 'User profile not found' });
      return;
    }

    res.json({
      data: {
        session: data.session,
        user: {
          id: data.user.id,
          role: profile.role,
          email: data.user.email,
          ragazzoId: profile.ragazzo_id,
        },
      },
    });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (_req: Request, res: Response): Promise<void> => {
  res.json({ data: { message: 'Logged out successfully' } });
});

export default router;
