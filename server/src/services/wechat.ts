import crypto from 'crypto';
import https from 'https';
import { config } from '../config.js';

const WECHAT_NATIVE_URL = 'https://api.mch.weixin.qq.com/v3/pay/transactions/native';

function getNonceStr(): string {
  return crypto.randomBytes(16).toString('hex');
}

function sign(method: string, url: string, timestamp: string, nonce: string, body: string): string {
  const message = `${method}\n${url}\n${timestamp}\n${nonce}\n${body}\n`;
  const signature = crypto.createHmac('sha256', config.wechat.apiKeyV3).update(message).digest('base64');
  return signature;
}

export function createNativeOrder(orderId: string, amountCents: number, description: string): Promise<{ code_url: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(WECHAT_NATIVE_URL);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = getNonceStr();
    const body = JSON.stringify({
      appid: config.wechat.appId,
      mchid: config.wechat.mchId,
      description,
      out_trade_no: orderId,
      notify_url: config.wechat.notifyUrl,
      amount: { total: amountCents, currency: 'CNY' },
    });
    const pathWithQuery = url.pathname + url.search;
    const signature = sign('POST', pathWithQuery, timestamp, nonce, body);
    const authHeader = `WECHATPAY2-SHA256-RSA2048 mchid="${config.wechat.mchId}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}"`;

    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode !== 200 && res.statusCode !== 201) {
            reject(new Error(`WeChat API ${res.statusCode}: ${data}`));
            return;
          }
          try {
            const json = JSON.parse(data);
            if (json.code_url) resolve({ code_url: json.code_url });
            else reject(new Error('No code_url in response: ' + data));
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export function verifyNotifySignature(
  timestamp: string,
  nonce: string,
  body: string,
  signature: string,
): boolean {
  const message = `${timestamp}\n${nonce}\n${body}\n`;
  const expected = crypto.createHmac('sha256', config.wechat.apiKeyV3).update(message).digest('base64');
  return signature === expected;
}
