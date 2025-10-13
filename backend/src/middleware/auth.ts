import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Unauthorized' });
  const token = header.replace('Bearer ', '');
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'change-me');
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.tenant_id !== decoded.tenantId) return res.status(401).json({ error: 'Invalid token' });
    (req as any).user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
