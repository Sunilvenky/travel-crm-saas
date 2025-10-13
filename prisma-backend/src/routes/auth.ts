import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const bcrypt = require('bcrypt');
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { sendEmail } from '../utils/mailer';
import rateLimit from 'express-rate-limit';

const router = Router();

export default function(prisma: PrismaClient){
  const loginLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
  const resetLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });
  router.post('/login', async (req, res) => {
    // rate limit middleware applied inline
    await new Promise<void>((resolve) => loginLimiter(req as any, res as any, () => resolve()));
    const schema = z.object({ email: z.string().email(), password: z.string() });
    const parsed = schema.safeParse(req.body);
    if(!parsed.success) return res.status(400).json({ error: 'invalid_payload' });

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
  if(!user) return res.status(401).json({ error: 'invalid_credentials' });

    // account lockout check
    if(user.locked_until && new Date(user.locked_until) > new Date()){
      return res.status(403).json({ error: 'account_locked' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if(!match){
      const failed = await prisma.user.update({ where: { id: user.id }, data: { failed_logins: { increment: 1 } }, select: { failed_logins: true } });
      // lockout after 5 failed attempts for 15 minutes
      if(failed.failed_logins >= 5){
        await prisma.user.update({ where: { id: user.id }, data: { locked_until: new Date(Date.now() + 15 * 60 * 1000) } });
      }
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    // success: reset failed count
    await prisma.user.update({ where: { id: user.id }, data: { failed_logins: 0, last_login: new Date(), locked_until: null } });

    const payload = { sub: user.id, role: user.role, tenant_id: user.tenant_id };
    const access = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '15m' });
    const refreshToken = jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET || 'dev_refresh', { expiresIn: '7d' });

    // persist refresh token
    await prisma.refreshToken.create({ data: { user_id: user.id, token: refreshToken, expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000) } });

    res.json({ access, refresh: refreshToken });
  });

  router.post('/refresh', async (req, res) => {
    const schema = z.object({ refresh: z.string() });
    const parsed = schema.safeParse(req.body);
    if(!parsed.success) return res.status(400).json({ error: 'invalid_payload' });
    try{
      const decoded: any = jwt.verify(parsed.data.refresh, process.env.JWT_REFRESH_SECRET || 'dev_refresh');
      const stored = await prisma.refreshToken.findUnique({ where: { token: parsed.data.refresh } });
      // reuse detection: token signature valid but not found or already revoked
      if(!stored){
        // possible reuse: revoke all tokens for this user and alert
        await prisma.refreshToken.updateMany({ where: { user_id: decoded.sub, revoked: false }, data: { revoked: true } });
        console.warn('Possible refresh token reuse detected for user', decoded.sub);
        return res.status(401).json({ error: 'invalid_refresh' });
      }
      if(stored.revoked || stored.expires_at < new Date()) return res.status(401).json({ error: 'invalid_refresh' });
      const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
      if(!user) return res.status(401).json({ error: 'invalid_refresh' });

      // rotate refresh token
      const newRefresh = jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET || 'dev_refresh', { expiresIn: '7d' });
      await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true, replaced_by: newRefresh } });
      await prisma.refreshToken.create({ data: { user_id: user.id, token: newRefresh, expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000) } });

      const payload = { sub: user.id, role: user.role, tenant_id: user.tenant_id };
      const access = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '15m' });
      res.json({ access, refresh: newRefresh });
    }catch(e){
      return res.status(401).json({ error: 'invalid_refresh' });
    }
  });

  router.post('/logout', async (req, res) => {
    const schema = z.object({ refresh: z.string().optional() });
    const parsed = schema.safeParse(req.body);
    if(!parsed.success) return res.status(400).json({ error: 'invalid_payload' });
    if(parsed.data.refresh){
      await prisma.refreshToken.updateMany({ where: { token: parsed.data.refresh }, data: { revoked: true } });
    }
    return res.json({ ok: true });
  });

  router.post('/register', async (req, res) => {
    const schema = z.object({ email: z.string().email(), password: z.string().min(8), first_name: z.string().optional(), last_name: z.string().optional(), tenant_domain: z.string().optional() });
    const parsed = schema.safeParse(req.body);
    if(!parsed.success) return res.status(400).json({ error: 'invalid_payload' });
    const { email, password, first_name, last_name, tenant_domain } = parsed.data;

    // password complexity check (example)
    if(!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return res.status(400).json({ error: 'weak_password' });

    let tenantId = undefined as any;
    if(tenant_domain){
      const tenant = await prisma.tenant.findUnique({ where: { domain: tenant_domain } });
      if(!tenant) return res.status(400).json({ error: 'invalid_tenant' });
      tenantId = tenant.id;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password_hash: hashed, first_name, last_name, tenant_id: tenantId } });
    res.json({ id: user.id, email: user.email });
  });

  router.post('/request-reset', async (req, res) => {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse(req.body);
    if(!parsed.success) return res.status(400).json({ error: 'invalid_payload' });
    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if(!user) return res.json({ ok: true }); // do not reveal

  // create a reset token persisted in DB (simple implementation)
  const token = jwt.sign({ sub: user.id }, process.env.JWT_RESET_SECRET || 'dev_reset', { expiresIn: '1h' });
  await prisma.passwordReset.create({ data: { user_id: user.id, token, expires_at: new Date(Date.now() + 3600 * 1000) } });

  // send email in production; in dev we still write to disk via mailer util
  const resetUrl = `${process.env.FRONTEND_ORIGIN || 'http://localhost:3000'}/reset?token=${token}`;
  await sendEmail({ to: user.email, subject: 'Password reset', text: `Reset your password: ${resetUrl}` });

  // Do not reveal presence; return ok
  res.json({ ok: true });
  });

  router.post('/reset', async (req, res) => {
    const schema = z.object({ token: z.string(), new_password: z.string().min(8) });
    const parsed = schema.safeParse(req.body);
    if(!parsed.success) return res.status(400).json({ error: 'invalid_payload' });
    try{
      const decoded: any = jwt.verify(parsed.data.token, process.env.JWT_RESET_SECRET || 'dev_reset');
      const pr = await prisma.passwordReset.findUnique({ where: { token: parsed.data.token } });
      if(!pr || pr.expires_at < new Date()) return res.status(400).json({ error: 'invalid_token' });
      const hashed = await bcrypt.hash(parsed.data.new_password, 10);
      await prisma.user.update({ where: { id: decoded.sub }, data: { password_hash: hashed } });
  await prisma.passwordReset.delete({ where: { id: pr.id } });
  // Revoke all refresh tokens for the user to force re-login
  await prisma.refreshToken.updateMany({ where: { user_id: decoded.sub, revoked: false }, data: { revoked: true } });
      res.json({ ok: true });
    }catch(e){
      return res.status(400).json({ error: 'invalid_token' });
    }
  });

  return router;
}
