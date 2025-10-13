import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import tenantMiddleware from './middleware/tenant';
import rbac from './middleware/rbac';
import { reqStore } from './context/requestContext';
import { attachTenantMiddleware } from './prisma/middleware';
import authMiddlewareFactory from './middleware/auth';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// attach prisma middleware for tenant filtering
attachTenantMiddleware(prisma as any);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// create a small wrapper to populate AsyncLocalStorage per-request
app.use((req, res, next) => {
	reqStore.run({ tenantId: undefined, userId: undefined }, () => next());
});

app.use(tenantMiddleware(prisma));

// auth routes (public)
app.use('/auth', authRoutes(prisma));
app.use('/admin', adminRoutes(prisma));

// protected routes would use authMiddlewareFactory(prisma)
const authMiddleware = authMiddlewareFactory(prisma as any);
app.get('/protected', authMiddleware, (req: any, res: any) => {
	res.json({ ok: true, user: { id: req.user.id, email: req.user.email, role: req.user.role } });
});

app.get('/health', (req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Prisma backend listening on ${port}`));

process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(); });
