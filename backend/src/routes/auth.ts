import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    // Use an isolated client for sign-in so the shared service-role client
    // doesn't get its session overwritten with this user's JWT — otherwise
    // subsequent storage/db calls would run as the user (RLS) instead of as
    // service_role (bypasses RLS).
    const authClient = createClient(
      process.env['SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data, error } = await authClient.auth.signInWithPassword({
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
      .select('role, ragazzo_id, text_scale_percent, high_contrast')
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
          textScalePercent: profile.text_scale_percent ?? 100,
          highContrast: profile.high_contrast ?? false,
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

// PATCH /api/auth/me/preferences
// Accepts partial updates. textScalePercent is ragazzo-only; highContrast
// is available to all roles. Either field may be omitted.
router.patch('/me/preferences', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const body = req.body as { textScalePercent?: number | string; highContrast?: boolean };
  const updates: Record<string, unknown> = {};

  if (body.textScalePercent !== undefined) {
    if (req.user.role !== 'ragazzo') {
      res.status(403).json({ error: 'textScalePercent is only available for ragazzo role' });
      return;
    }
    const value = Number(body.textScalePercent);
    const allowed = new Set([100, 102, 105, 110, 115, 120, 125]);
    if (!Number.isInteger(value) || !allowed.has(value)) {
      res.status(400).json({ error: 'Invalid textScalePercent value' });
      return;
    }
    updates['text_scale_percent'] = value;
  }

  if (body.highContrast !== undefined) {
    if (typeof body.highContrast !== 'boolean') {
      res.status(400).json({ error: 'Invalid highContrast value' });
      return;
    }
    updates['high_contrast'] = body.highContrast;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select('text_scale_percent, high_contrast')
      .single();

    if (error || !data) {
      res.status(500).json({ error: error?.message ?? 'Failed to update preferences' });
      return;
    }

    res.json({
      data: {
        textScalePercent: data.text_scale_percent ?? 100,
        highContrast: data.high_contrast ?? false,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to update preferences' });
  }
});

export default router;
