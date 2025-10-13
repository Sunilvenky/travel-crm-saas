import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import rbac from '../middleware/rbac';
import authMiddlewareFactory from '../middleware/auth';

export default function(prisma: PrismaClient){
  const router = Router();
  const auth = authMiddlewareFactory(prisma as any);

  // list users for the tenant - ADMIN or SUPERADMIN
  router.get('/users', auth, rbac(['ADMIN','SUPERADMIN']), async (req: any, res: any) => {
    const users = await prisma.user.findMany({ where: { tenant_id: req.user.tenant_id }, select: { id: true, email: true, first_name: true, last_name: true, role: true, is_active: true } });
    res.json({ users });
  });

  // impersonate: admin requests a short-lived token for a user
  router.post('/impersonate', auth, rbac(['ADMIN','SUPERADMIN']), async (req: any, res: any) => {
    const { user_id } = req.body as { user_id?: string };
    if(!user_id) return res.status(400).json({ error: 'missing_user_id' });
    const target = await prisma.user.findUnique({ where: { id: user_id } });
    if(!target || target.tenant_id !== req.user.tenant_id) return res.status(404).json({ error: 'not_found' });

    // create short-lived access token with impersonation flag
    const jwt = require('jsonwebtoken');
    const payload = { sub: target.id, role: target.role, tenant_id: target.tenant_id, impersonator: req.user.id };
    const access = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '5m' });
    res.json({ access });
  });

  return router;
}
