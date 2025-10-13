import { Request, Response, NextFunction } from 'express';

export type Role = 'ADMIN' | 'MANAGER' | 'AGENT' | 'VIEWER';

export function requireRole(allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Assume req.user is populated by auth middleware
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowed.includes(user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
