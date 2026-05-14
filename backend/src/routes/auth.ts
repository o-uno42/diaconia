import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/auth/login — JWT must be in Authorization: Bearer header.
// Frontend signs in via Supabase client (gets JWT), then calls this to get
// the full profile. No credentials accepted in the body.
router.post('/login', authMiddleware, (req: Request, res: Response): void => {
  res.json({ data: { user: req.user } });
});

// POST /api/auth/register — creates a new admin or ragazzo account.
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password, firstName, lastName, role } = req.body as {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };

  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({ error: 'email, password, firstName and lastName are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const userRole = role === 'ragazzo' ? 'ragazzo' : 'admin';

  try {
    // Use anon-key client so Supabase sends the OTP confirmation email
    const anonClient = createClient(
      process.env['SUPABASE_URL']!,
      process.env['SUPABASE_ANON_KEY']!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    });

    if (signUpError || !signUpData.user) {
      res.status(400).json({ error: signUpError?.message ?? 'Registration failed' });
      return;
    }

    const userId = signUpData.user.id;

    // For ragazzi: create the ragazzi record first, then link it in the profile
    let ragazzoId: string | null = null;
    if (userRole === 'ragazzo') {
      const { data: ragazzo, error: ragazzoError } = await supabase
        .from('ragazzi')
        .insert({
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
          language: 'it',
          keywords: [],
        })
        .select('id')
        .single();

      if (ragazzoError || !ragazzo) {
        await supabase.auth.admin.deleteUser(userId);
        res.status(500).json({ error: 'Failed to create ragazzo record' });
        return;
      }

      ragazzoId = ragazzo.id as string;
    }

    // Create profile row (user cannot log in until email is confirmed)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: userId, role: userRole, ragazzo_id: ragazzoId });

    if (profileError) {
      // Roll back: delete ragazzo record if created, then auth user
      if (ragazzoId) await supabase.from('ragazzi').delete().eq('id', ragazzoId);
      await supabase.auth.admin.deleteUser(userId);
      res.status(500).json({ error: 'Failed to create user profile' });
      return;
    }

    res.status(201).json({ data: { message: 'Check your email for the confirmation OTP.' } });
  } catch {
    res.status(500).json({ error: 'Registration failed' });
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
