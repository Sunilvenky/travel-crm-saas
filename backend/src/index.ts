import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth';
import leadsRouter from './routes/leads';
import customersRouter from './routes/customers';
import dealsRouter from './routes/deals';
import packagesRouter from './routes/packages';
import bookingsRouter from './routes/bookings';
import logger from './utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, { ip: req.ip, userAgent: req.get('User-Agent') });
  next();
});

// Routes
app.get('/', (req, res) => res.json({ ok: true, service: 'travel-crm-backend' }));
app.use('/api/auth', authRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/packages', packagesRouter);
app.use('/api/bookings', bookingsRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
  console.log(`Server running on port ${port}`);
});
