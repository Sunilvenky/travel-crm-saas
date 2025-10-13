import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

router.use(authMiddleware);

const dealSchema = z.object({
  customer_id: z.string(),
  title: z.string(),
  value: z.number(),
  stage: z.string(),
  expected_close_date: z.string().optional(),
});

// GET /api/deals
router.get('/', async (req: any, res) => {
  const deals = await prisma.deal.findMany({
    where: { tenant_id: req.user.tenant_id },
    include: { customer: true },
  });
  res.json({ deals });
});

// POST /api/deals
router.post('/', async (req: any, res) => {
  const data = dealSchema.parse(req.body);
  const deal = await prisma.deal.create({
    data: {
      ...data,
      tenant_id: req.user.tenant_id,
    },
  });
  res.json({ deal });
});

// GET /api/deals/:id
router.get('/:id', async (req: any, res) => {
  const deal = await prisma.deal.findFirst({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
    include: { customer: true },
  });
  if (!deal) return res.status(404).json({ error: 'Not found' });
  res.json({ deal });
});

// PUT /api/deals/:id
router.put('/:id', async (req: any, res) => {
  const data = dealSchema.partial().parse(req.body);
  const deal = await prisma.deal.updateMany({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
    data,
  });
  if (deal.count === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// DELETE /api/deals/:id
router.delete('/:id', async (req: any, res) => {
  const deal = await prisma.deal.deleteMany({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
  });
  if (deal.count === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;