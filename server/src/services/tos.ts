import { TosClient } from '@volcengine/tos-sdk';
import { config } from '../config.js';

let client: TosClient | null = null;

function getClient(): TosClient {
  if (!client) {
    if (!config.tos.accessKeyId || !config.tos.bucket) {
      throw new Error('TOS not configured');
    }
    client = new TosClient({
      accessKeyId: config.tos.accessKeyId,
      accessKeySecret: config.tos.accessKeySecret,
      region: config.tos.region,
      endpoint: config.tos.endpoint || undefined,
    });
  }
  return client;
}

export function getReportKey(userId: string, year: number): string {
  return `fitness-reports/${userId}/${year}/fitness_report_${year}.pdf`;
}

export async function uploadReportBuffer(key: string, buffer: Buffer): Promise<void> {
  const c = getClient();
  await c.putObject({
    bucket: config.tos.bucket,
    key,
    body: buffer,
    contentType: 'application/pdf',
  });
}

export async function getPresignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const c = getClient();
  const url = await c.getPreSignedUrl({
    bucket: config.tos.bucket,
    key,
    expiresIn: expiresInSeconds,
  });
  return url;
}
