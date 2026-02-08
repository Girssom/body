import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import workoutsRoutes from './routes/workouts.js';
import payRoutes from './routes/pay.js';
import reportRoutes from './routes/report.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));

app.use((req, res, next) => {
  if (req.originalUrl === '/api/pay/notify' && req.method === 'POST') {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      (req as express.Request & { rawBody: Buffer }).rawBody = Buffer.concat(chunks);
      next();
    });
    return;
  }
  next();
});
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutsRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/pay', payRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
