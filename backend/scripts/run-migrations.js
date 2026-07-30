// يشغّل ملفات migrations بالترتيب، ويتذكر اللي اتنفذ قبل كده عشان ميكررش
// Applies migration .sql files in order, tracking which ones already ran.
// Usage: npm run migrate

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pool } from '../src/db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', 'migrations');

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    VARCHAR(255) PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function getAppliedMigrations() {
  const { rows } = await pool.query('SELECT filename FROM schema_migrations');
  return new Set(rows.map((row) => row.filename));
}

async function run() {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`⏭️  تخطي (منفذ من قبل): ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`▶️  تنفيذ: ${file}`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`✅ تم: ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ فشل تنفيذ ${file}:`, error.message);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  await pool.end();
  console.log('🎉 كل الـ migrations شغالة وحديثة.');
}

run();
