import { randomUUID } from 'crypto';
import { Router, Request, Response } from 'express';
import { authRequired } from '../middleware/auth.js';
import { getDb } from '../db/index.js';

const router = Router();

router.get('/', authRequired, (req: Request, res: Response) => {
  const user = (req as Request & { user: { id: string } }).user;
  const database = getDb();
  const rows = database
    .prepare('SELECT id, data, created_at FROM workouts WHERE user_id = ? ORDER BY created_at DESC')
    .all(user.id) as { id: string; data: string; created_at: string }[];
  const logs = rows.map((r) => ({ ...JSON.parse(r.data), id: r.id }));
  res.json({ logs });
});

router.post('/', authRequired, (req: Request, res: Response) => {
  const user = (req as Request & { user: { id: string } }).user;
  const logs = req.body.logs as Array<{ id: string; date: string; exercise: string; sets?: number; reps?: number; weight?: number; distance?: number; duration?: number; note?: string }>;
  if (!Array.isArray(logs)) {
    res.status(400).json({ error: 'logs array required' });
    return;
  }
  const database = getDb();
  const insert = database.prepare(
    'INSERT OR REPLACE INTO workouts (id, user_id, data) VALUES (?, ?, ?)',
  );
  const run = database.transaction(() => {
    for (const log of logs) {
      const id = log.id || randomUUID();
      insert.run(id, user.id, JSON.stringify(log));
    }
  });
  run();
  res.json({ ok: true });
});

router.delete('/:id', authRequired, (req: Request, res: Response) => {
  const user = (req as Request & { user: { id: string } }).user;
  const { id } = req.params;
  const database = getDb();
  const result = database.prepare('DELETE FROM workouts WHERE id = ? AND user_id = ?').run(id, user.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ ok: true });
});

export default router;
