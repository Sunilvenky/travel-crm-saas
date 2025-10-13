import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

router.use(authMiddleware);

const customerSchema = z.object({
  lead_id: z.string(),
  customer_type: z.string(),
  loyalty_level: z.string(),
});

// GET /api/customers
router.get('/', async (req: any, res) => {
  const customers = await prisma.customer.findMany({
    where: { tenant_id: req.user.tenant_id },
  });
  res.json({ customers });
});

// POST /api/customers
router.post('/', async (req: any, res) => {
  const data = customerSchema.parse(req.body);
  const customer = await prisma.customer.create({
    data: {
      ...data,
      tenant_id: req.user.tenant_id,
    },
  });
  res.json({ customer });
});

// GET /api/customers/:id
router.get('/:id', async (req: any, res) => {
  const customer = await prisma.customer.findFirst({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
  });
  if (!customer) return res.status(404).json({ error: 'Not found' });
  res.json({ customer });
});

// PUT /api/customers/:id
router.put('/:id', async (req: any, res) => {
  const data = customerSchema.partial().parse(req.body);
  const customer = await prisma.customer.updateMany({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
    data,
  });
  if (customer.count === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// DELETE /api/customers/:id
router.delete('/:id', async (req: any, res) => {
  const customer = await prisma.customer.deleteMany({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
  });
  if (customer.count === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;