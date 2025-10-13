import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

router.use(authMiddleware);

const bookingSchema = z.object({
  customer_id: z.string(),
  package_id: z.string(),
  status: z.string(),
  total_amount: z.number(),
  travel_date: z.string(),
  pax_count: z.number(),
});

// GET /api/bookings
router.get('/', async (req: any, res) => {
  const bookings = await prisma.booking.findMany({
    where: { tenant_id: req.user.tenant_id },
    include: { customer: true, package: true },
  });
  res.json({ bookings });
});

// POST /api/bookings
router.post('/', async (req: any, res) => {
  const data = bookingSchema.parse(req.body);
  const booking = await prisma.booking.create({
    data: {
      ...data,
      tenant_id: req.user.tenant_id,
    },
  });
  res.json({ booking });
});

// GET /api/bookings/:id
router.get('/:id', async (req: any, res) => {
  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
    include: { customer: true, package: true },
  });
  if (!booking) return res.status(404).json({ error: 'Not found' });
  res.json({ booking });
});

// PUT /api/bookings/:id
router.put('/:id', async (req: any, res) => {
  const data = bookingSchema.partial().parse(req.body);
  const booking = await prisma.booking.updateMany({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
    data,
  });
  if (booking.count === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// DELETE /api/bookings/:id
router.delete('/:id', async (req: any, res) => {
  const booking = await prisma.booking.deleteMany({
    where: { id: req.params.id, tenant_id: req.user.tenant_id },
  });
  if (booking.count === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;