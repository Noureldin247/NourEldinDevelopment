import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL is not set. Set it in backend/.env before starting the server.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (error) => {
  console.error('Unexpected database error:', error);
  process.exit(1);
});

export async function connectDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }

  try {
    const client = await pool.connect();
    client.release();
    console.log('✅ Database connection established');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error.message);
    throw error;
  }
}
