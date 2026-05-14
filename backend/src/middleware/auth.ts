import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../../../packages/shared/types';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user: UserProfile;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Fetch profile for role info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, ragazzo_id, text_scale_percent, high_contrast')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      res.status(401).json({ error: 'User profile not found' });
      return;
    }

    req.user = {
      id: user.id,
      role: profile.role as UserProfile['role'],
      email: user.email ?? '',
      ragazzoId: profile.ragazzo_id ?? undefined,
      textScalePercent: profile.text_scale_percent ?? 100,
      highContrast: profile.high_contrast ?? false,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Authentication failed' });
  }
}
