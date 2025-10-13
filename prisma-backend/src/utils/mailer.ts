import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const devOut = path.join(process.cwd(), 'tmp', 'emails');
if (!fs.existsSync(devOut)) fs.mkdirSync(devOut, { recursive: true });

export async function sendEmail(opts: { to: string; subject: string; text?: string; html?: string }) {
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_URL) {
    const transporter = nodemailer.createTransport(process.env.SMTP_URL);
    return transporter.sendMail({ from: process.env.SMTP_FROM || 'no-reply@example.com', to: opts.to, subject: opts.subject, text: opts.text, html: opts.html });
  }
  // dev: write email to disk and console
  const filename = path.join(devOut, `${Date.now()}-${opts.to.replace(/[^a-z0-9]/gi, '_')}.json`);
  const payload = { to: opts.to, subject: opts.subject, text: opts.text, html: opts.html, ts: new Date().toISOString() };
  await fs.promises.writeFile(filename, JSON.stringify(payload, null, 2));
  console.log('Dev email written to', filename);
  return payload;
}
