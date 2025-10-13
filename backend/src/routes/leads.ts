import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

// Apply auth to all routes
router.use(authMiddleware);

const leadSchema = z.object({
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  source: z.string(),
  destination: z.string(),
  budget: z.number().optional(),
  adults: z.number().optional(),
});

// GET /api/leads - List leads for tenant
router.get('/', async (req: any, res) => {
  const leads = await prisma.lead.findMany({
    where: { tenant_id: req.user.tenant_id },
  });
  res.json({ leads });
});

// POST /api/leads - Create lead
router.post('/', async (req: any, res) => {
  const data = leadSchema.parse(req.body);
  const lead = await prisma.lead.create({
    data: {
      ...data,
      tenant_id: req.user.tenant_id,
    },
  });
  res.json({ lead });
});

// GET /api/leads/:id - Get lead
router.get('/:id', async (req: any, res) => {
  const lead = await prisma.lead.findFirst({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
  });
  if (!lead) return res.status(404).json({ error: 'Not found' });
  res.json({ lead });
});

// PUT /api/leads/:id - Update lead
router.put('/:id', async (req: any, res) => {
  const data = leadSchema.partial().parse(req.body);
  const lead = await prisma.lead.updateMany({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
    data,
  });
  if (lead.count === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// DELETE /api/leads/:id - Delete lead
router.delete('/:id', async (req: any, res) => {
  const lead = await prisma.lead.deleteMany({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
  });
  if (lead.count === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;