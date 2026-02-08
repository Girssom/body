import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const path = config.databasePath;
    const dir = dirname(path);
    try {
      mkdirSync(dir, { recursive: true });
    } catch {
      // ignore
    }
    db = new Database(path);
    db.pragma('journal_mode = WAL');
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    db.exec(schema);
  }
  return db;
}

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  plan: 'free' | 'pro';
  created_at: string;
};

export type OrderRow = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  wechat_order_id: string | null;
  created_at: string;
};

export type WorkoutRow = {
  id: string;
  user_id: string;
  data: string;
  created_at: string;
};

export type ReportRow = {
  id: string;
  user_id: string;
  year: number;
  tos_key: string;
  file_url: string | null;
  created_at: string;
};
