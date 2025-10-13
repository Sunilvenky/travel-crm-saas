import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { reqStore } from '../context/requestContext';

export default function(prisma: PrismaClient){
  return async function authMiddleware(req: Request & { user?: any, tenant?: any }, res: Response, next: NextFunction){
    const auth = req.headers.authorization;
    if(!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing_token' });
    const token = auth.slice(7);
    try{
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
      if(!user) return res.status(401).json({ error: 'invalid_token' });
      if(!user.is_active) return res.status(403).json({ error: 'user_disabled' });
      // tenant mismatch
      if(req.tenant && user.tenant_id !== req.tenant.id) return res.status(403).json({ error: 'tenant_mismatch' });
  req.user = user;
      // populate AsyncLocalStorage context for Prisma middleware
      try{
        const store = reqStore.getStore();
        if(store){ store.tenantId = user.tenant_id; store.userId = user.id; }
      }catch(e){}
      next();
    }catch(e){
      return res.status(401).json({ error: 'invalid_token' });
    }
  }
}
