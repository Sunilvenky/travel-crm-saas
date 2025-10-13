import { Request, Response, NextFunction } from 'express';

export default function rbac(requiredRoles: string[]){
  return function(req: Request & { user?: any }, res: Response, next: NextFunction){
    const user = req.user as any;
    if(!user) return res.status(401).json({ error: 'unauthenticated' });
    if(requiredRoles.includes(user.role)) return next();
    return res.status(403).json({ error: 'forbidden' });
  }
}
