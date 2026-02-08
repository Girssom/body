import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { authRequired } from '../middleware/auth.js';
import { getDb } from '../db/index.js';
import { createNativeOrder, verifyNotifySignature } from '../services/wechat.js';
import { config } from '../config.js';

const router = Router();
const PRO_AMOUNT_CENTS = 6800; // ¥68

router.post('/create-order', authRequired, async (req: Request, res: Response) => {
  const user = (req as Request & { user: { id: string } }).user;
  if (!config.wechat.appId || !config.wechat.mchId || !config.wechat.apiKeyV3) {
    res.status(503).json({ error: 'WeChat Pay not configured' });
    return;
  }
  const orderId = `FIT${Date.now()}${randomUUID().slice(0, 8)}`;
  const database = getDb();
  database
    .prepare('INSERT INTO orders (id, user_id, amount, status) VALUES (?, ?, ?, ?)')
    .run(orderId, user.id, PRO_AMOUNT_CENTS, 'pending');

  try {
    const { code_url } = await createNativeOrder(
      orderId,
      PRO_AMOUNT_CENTS,
      'Fitness Pro 年度会员',
    );
    res.json({ orderId, code_url, amount: PRO_AMOUNT_CENTS / 100 });
  } catch (e) {
    res.status(502).json({ error: 'Failed to create WeChat order', detail: String(e) });
  }
});

router.post('/notify', (req: Request, res: Response) => {
  const timestamp = req.headers['wechatpay-timestamp'] as string;
  const nonce = req.headers['wechatpay-nonce'] as string;
  const signature = req.headers['wechatpay-signature'] as string;
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  const body = rawBody ? rawBody.toString('utf-8') : JSON.stringify(req.body);

  if (!timestamp || !nonce || !signature) {
    res.status(400).send('<xml><return_code>FAIL</return_code></xml>');
    return;
  }
  if (!verifyNotifySignature(timestamp, nonce, body, signature)) {
    res.status(401).send('<xml><return_code>FAIL</return_code></xml>');
    return;
  }

  let event: { event_type?: string; resource?: { out_trade_no?: string } };
  try {
    event = typeof body === 'string' ? JSON.parse(body) : body;
  } catch {
    res.status(400).send('<xml><return_code>FAIL</return_code></xml>');
    return;
  }
  if (event.event_type !== 'TRANSACTION.SUCCESS' || !event.resource?.out_trade_no) {
    res.status(200).send('<xml><return_code>SUCCESS</return_code></xml>');
    return;
  }

  const outTradeNo = event.resource.out_trade_no;
  const database = getDb();
  const order = database.prepare('SELECT id, user_id, status FROM orders WHERE id = ?').get(outTradeNo) as { id: string; user_id: string; status: string } | undefined;
  if (order && order.status === 'pending') {
    database.prepare('UPDATE orders SET status = ? WHERE id = ?').run('paid', order.id);
    database.prepare('UPDATE users SET plan = ? WHERE id = ?').run('pro', order.user_id);
  }
  res.status(200).send('<xml><return_code>SUCCESS</return_code></xml>');
});

export default router;
