import { Router } from 'express';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();
const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantDomain: z.string().optional()
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(data.password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    // Create access token
    const accessToken = jwt.sign({ userId: user.id, tenantId: user.tenant_id, role: user.role }, process.env.JWT_SECRET || 'change-me', { expiresIn: '15m' });

    // Create refresh token
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || 'refresh-secret', { expiresIn: '7d' });

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        user_id: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set refresh token in secure HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ accessToken });
  } catch (err) {
    logger.error('Login error', { error: err });
    res.status(400).json({ error: 'Bad request', details: err instanceof Error ? err.message : err });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

  try {
    const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret');
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

    if (!stored || stored.revoked) {
      // Revoke all tokens for user on reuse detection
      await prisma.refreshToken.updateMany({ where: { user_id: decoded.userId, revoked: false }, data: { revoked: true } });
      logger.warn('Refresh token reuse detected', { userId: decoded.userId });
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Rotate refresh token
    const newRefreshToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_REFRESH_SECRET || 'refresh-secret', { expiresIn: '7d' });
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { token: newRefreshToken, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const accessToken = jwt.sign({ userId: user.id, tenantId: user.tenant_id, role: user.role }, process.env.JWT_SECRET || 'change-me', { expiresIn: '15m' });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (err) {
    logger.error('Refresh error', { error: err });
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    await prisma.refreshToken.updateMany({ where: { token: refreshToken }, data: { revoked: true } });
  }
  res.clearCookie('refreshToken');
  res.json({ ok: true });
});

// Impersonation with audit log
router.post('/impersonate', async (req, res) => {
  // Assume auth middleware sets req.user
  const { userId } = req.body;
  const admin = (req as any).user;
  if (!admin || admin.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser || targetUser.tenant_id !== admin.tenant_id) return res.status(404).json({ error: 'User not found' });

  const impersonationToken = jwt.sign({ userId: targetUser.id, tenantId: targetUser.tenant_id, role: targetUser.role, impersonator: admin.id }, process.env.JWT_SECRET || 'change-me', { expiresIn: '1h' });

  logger.info('Impersonation initiated', { adminId: admin.id, targetUserId: targetUser.id });
  res.json({ accessToken: impersonationToken });
});

export default router;
