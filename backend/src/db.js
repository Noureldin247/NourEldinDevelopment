import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL is not set. Copy backend/.env.example to backend/.env and fill it in.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (error) => {
  console.error('Unexpected database error:', error);
  process.exit(1);
});
