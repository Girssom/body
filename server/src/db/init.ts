import { getDb } from './index.js';

getDb();
console.log('Database initialized at', process.env.DATABASE_PATH || './data/fitness.db');
