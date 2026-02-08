import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { authRequired } from '../middleware/auth.js';
import { getDb } from '../db/index.js';
import { buildYearlyRecap } from '../services/recap.js';
import { generateReportPdf } from '../services/pdf.js';
import { getReportKey, uploadReportBuffer, getPresignedUrl } from '../services/tos.js';

const router = Router();

router.post('/generate', authRequired, async (req: Request, res: Response) => {
  const user = (req as Request & { user: { id: string; plan: string } }).user;
  if (user.plan !== 'pro') {
    res.status(403).json({ error: 'Pro subscription required' });
    return;
  }
  const { year } = req.body as { year?: number };
  const y = year ?? new Date().getFullYear();

  const database = getDb();
  const rows = database
    .prepare('SELECT id, data FROM workouts WHERE user_id = ?')
    .all(user.id) as { id: string; data: string }[];
  const logs = rows.map((r) => ({ ...JSON.parse(r.data), id: r.id }));

  const recap = buildYearlyRecap(logs, y);
  if (recap.totalWorkouts === 0) {
    res.status(400).json({ error: 'No workout data for this year' });
    return;
  }

  const reportId = randomUUID();
  const tosKey = getReportKey(user.id, y);

  try {
    const pdfBuffer = await generateReportPdf(recap);
    await uploadReportBuffer(tosKey, pdfBuffer);
  } catch (e) {
    console.error('PDF/TOS error:', e);
    res.status(500).json({ error: 'Report generation failed' });
    return;
  }

  let fileUrl: string | null = null;
  try {
    fileUrl = await getPresignedUrl(tosKey, 86400 * 7); // 7 days
  } catch {
    // optional
  }

  database
    .prepare('INSERT INTO reports (id, user_id, year, tos_key, file_url) VALUES (?, ?, ?, ?, ?)')
    .run(reportId, user.id, y, tosKey, fileUrl);

  res.status(201).json({
    id: reportId,
    year: y,
    downloadUrl: fileUrl,
  });
});

router.get('/list', authRequired, (req: Request, res: Response) => {
  const user = (req as Request & { user: { id: string } }).user;
  const database = getDb();
  const rows = database
    .prepare('SELECT id, year, file_url, created_at FROM reports WHERE user_id = ? ORDER BY created_at DESC')
    .all(user.id) as { id: string; year: number; file_url: string | null; created_at: string }[];
  res.json({
    reports: rows.map((r) => ({
      id: r.id,
      year: r.year,
      downloadUrl: r.file_url,
      createdAt: r.created_at,
    })),
  });
});

router.get('/url/:id', authRequired, async (req: Request, res: Response) => {
  const user = (req as Request & { user: { id: string } }).user;
  const { id } = req.params;
  const database = getDb();
  const row = database
    .prepare('SELECT id, tos_key FROM reports WHERE id = ? AND user_id = ?')
    .get(id, user.id) as { id: string; tos_key: string } | undefined;
  if (!row) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }
  try {
    const url = await getPresignedUrl(row.tos_key, 3600);
    res.json({ url });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get download link' });
  }
});

router.get('/download/:id', authRequired, async (req: Request, res: Response) => {
  const user = (req as Request & { user: { id: string } }).user;
  const { id } = req.params;
  const database = getDb();
  const row = database
    .prepare('SELECT id, tos_key FROM reports WHERE id = ? AND user_id = ?')
    .get(id, user.id) as { id: string; tos_key: string } | undefined;
  if (!row) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }
  try {
    const url = await getPresignedUrl(row.tos_key, 3600);
    res.redirect(302, url);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get download link' });
  }
});

export default router;
