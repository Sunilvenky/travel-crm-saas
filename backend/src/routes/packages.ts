import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

router.use(authMiddleware);

const packageSchema = z.object({
  name: z.string(),
  description: z.string(),
  base_price: z.number(),
  duration: z.number(),
  destination: z.string(),
});

// GET /api/packages
router.get('/', async (req: any, res) => {
  const packages = await prisma.travelPackage.findMany({
    where: { tenant_id: req.user.tenant_id },
  });
  res.json({ packages });
});

// POST /api/packages
router.post('/', async (req: any, res) => {
  const data = packageSchema.parse(req.body);
  const pkg = await prisma.travelPackage.create({
    data: {
      ...data,
      tenant_id: req.user.tenant_id,
    },
  });
  res.json({ package: pkg });
});

// GET /api/packages/:id
router.get('/:id', async (req: any, res) => {
  const pkg = await prisma.travelPackage.findFirst({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
  });
  if (!pkg) return res.status(404).json({ error: 'Not found' });
  res.json({ package: pkg });
});

// PUT /api/packages/:id
router.put('/:id', async (req: any, res) => {
  const data = packageSchema.partial().parse(req.body);
  const pkg = await prisma.travelPackage.updateMany({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
    data,
  });
  if (pkg.count === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// DELETE /api/packages/:id
router.delete('/:id', async (req: any, res) => {
  const pkg = await prisma.travelPackage.deleteMany({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
  });
  if (pkg.count === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;