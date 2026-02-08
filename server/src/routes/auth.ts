import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { getDb } from '../db/index.js';
import { config } from '../config.js';
import { authRequired } from '../middleware/auth.js';
import type { JwtPayload } from '../middleware/auth.js';

const router = Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'Password is required' });
    return;
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (!emailRegex.test(trimmedEmail)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const database = getDb();
  const existing = database.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const id = randomUUID();
  database
    .prepare('INSERT INTO users (id, email, password_hash, plan) VALUES (?, ?, ?, ?)')
    .run(id, trimmedEmail, passwordHash, 'free');

  const token = jwt.sign(
    { userId: id, email: trimmedEmail } as JwtPayload,
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );

  res.status(201).json({
    token,
    user: { id, email: trimmedEmail, plan: 'free' },
  });
});

router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }
  const trimmedEmail = email.trim().toLowerCase();

  const database = getDb();
  const user = database
    .prepare('SELECT id, email, password_hash, plan FROM users WHERE email = ?')
    .get(trimmedEmail) as { id: string; email: string; password_hash: string; plan: string } | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email } as JwtPayload,
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, plan: user.plan },
  });
});

router.get('/me', authRequired, (req: Request, res: Response) => {
  const user = (req as Request & { user: { id: string; email: string; plan: string } }).user;
  res.json({ user: { id: user.id, email: user.email, plan: user.plan } });
});

export default router;
