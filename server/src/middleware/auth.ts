import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { getDb } from '../db/index.js';
import type { UserRow } from '../db/index.js';

export type JwtPayload = { userId: string; email: string };

export function authRequired(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', code: 'NO_TOKEN' });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    const database = getDb();
    const user = database.prepare('SELECT id, email, plan FROM users WHERE id = ?').get(decoded.userId) as UserRow | undefined;
    if (!user) {
      res.status(401).json({ error: 'User not found', code: 'USER_GONE' });
      return;
    }
    (req as Request & { user: UserRow }).user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
  }
}
