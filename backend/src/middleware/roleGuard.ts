import { Request, Response, NextFunction } from 'express';

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

export function requireAdminOrOwn(req: Request, res: Response, next: NextFunction): void {
  if (req.user.role === 'admin') {
    next();
    return;
  }

  const ragazzoId = req.params['id'];
  if (req.user.ragazzoId === ragazzoId) {
    next();
    return;
  }

  res.status(403).json({ error: 'Forbidden — not authorized for this resource' });
}
