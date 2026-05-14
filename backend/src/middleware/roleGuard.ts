import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden — admin access required' });
    return;
  }
  next();
}

export function requireRagazzo(req: Request, res: Response, next: NextFunction): void {
  if (req.user.role !== 'ragazzo') {
    res.status(403).json({ error: 'Forbidden — ragazzo access required' });
    return;
  }
  next();
}

// Allow access if the caller is either:
//   (a) an admin who owns the target ragazzo (req.params.id), or
//   (b) the ragazzo themselves.
// Returns 404 instead of 403 on cross-tenant attempts so we don't leak the
// existence of other admins' ragazzi.
export async function requireAdminOrOwn(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ragazzoId = req.params['id'];
  if (!ragazzoId) {
    res.status(400).json({ error: 'Missing ragazzo id' });
    return;
  }

  if (req.user.role === 'ragazzo') {
    if (req.user.ragazzoId === ragazzoId) { next(); return; }
    res.status(403).json({ error: 'Forbidden — not authorized for this resource' });
    return;
  }

  if (req.user.role === 'admin') {
    const { data } = await supabase
      .from('ragazzi')
      .select('owner_admin_id')
      .eq('id', ragazzoId)
      .single();
    if (data && data.owner_admin_id === req.user.id) { next(); return; }
    res.status(404).json({ error: 'Ragazzo not found' });
    return;
  }

  res.status(403).json({ error: 'Forbidden — not authorized for this resource' });
}

// Admin-only AND must own the target ragazzo (req.params.id). 404s on
// cross-tenant attempts to avoid leaking the existence of other admins' ragazzi.
export async function requireAdminOwnsRagazzo(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden — admin access required' });
    return;
  }
  const ragazzoId = req.params['id'];
  if (!ragazzoId) {
    res.status(400).json({ error: 'Missing ragazzo id' });
    return;
  }
  const { data } = await supabase
    .from('ragazzi')
    .select('owner_admin_id')
    .eq('id', ragazzoId)
    .single();
  if (!data || data.owner_admin_id !== req.user.id) {
    res.status(404).json({ error: 'Ragazzo not found' });
    return;
  }
  next();
}
