import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Ephemeral in-memory HMAC signing secret fallback if ADMIN_SESSION_SECRET is unset
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.trim().length > 0
    ? process.env.ADMIN_SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

// Salted scrypt digest used when process.env.ADMIN_PASSWORD is not configured in preview
const FALLBACK_SALT = 'e06ebd00bfa691609cf0c75111ea45bc';
const FALLBACK_HASH =
  'aed16b04a4443e06d4849ac39117f694676bffc6fae0b004fc0598880665bb877c097dd1eb4802db193bf5b7e04e8ac5b36ea24cc0205a739e196738a8ded1fa';

// Simple in-memory rate limit per IP for login attempts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  if (loginAttempts.size > 1000) {
    for (const [key, value] of loginAttempts.entries()) {
      if (now > value.resetAt) loginAttempts.delete(key);
    }
  }
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 });
    return true;
  }
  if (record.count >= 12) {
    return false;
  }
  record.count += 1;
  return true;
}

function verifyAdminPassword(candidate: string): boolean {
  const configured = process.env.ADMIN_PASSWORD?.trim();
  if (configured && configured.length > 0) {
    const a = crypto.createHash('sha256').update(candidate).digest();
    const b = crypto.createHash('sha256').update(configured).digest();
    return crypto.timingSafeEqual(a, b);
  }

  const derived = crypto.scryptSync(candidate, FALLBACK_SALT, 64);
  const expected = Buffer.from(FALLBACK_HASH, 'hex');
  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}

function createSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', exp: Date.now() + 24 * 60 * 60 * 1000 })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySessionToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return parsed.role === 'admin' && typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '64kb' }));

  app.post('/api/admin/login', (req: Request, res: Response) => {
    const clientIp = req.ip || 'unknown';
    if (!checkRateLimit(clientIp)) {
      res.status(429).json({ ok: false, error: 'Слишком много попыток. Попробуйте позже.' });
      return;
    }

    const body = req.body as { password?: unknown };
    if (typeof body?.password !== 'string' || body.password.length === 0 || body.password.length > 128) {
      res.status(400).json({ ok: false, error: 'Введите пароль' });
      return;
    }

    if (!verifyAdminPassword(body.password)) {
      res.status(401).json({ ok: false, error: 'Неверный пароль' });
      return;
    }

    const token = createSessionToken();
    res.json({ ok: true, token });
  });

  app.get('/api/admin/session', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : '';
    if (!token || !verifySessionToken(token)) {
      res.status(401).json({ valid: false });
      return;
    }
    res.json({ valid: true });
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Not Found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Viki pets server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
