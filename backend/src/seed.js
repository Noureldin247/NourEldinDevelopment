// سكربت يُشغَّل مرة واحدة لإنشاء أول حسابين (إدارة وموارد بشرية) بباسورد مشفر
// One-time script to create the first admin & HR accounts with hashed passwords.
// Run with: npm run seed   (after filling SEED_* values in backend/.env)

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

async function upsertUser(fullName, email, password, role) {
  if (!email || !password) {
    console.log(`تخطي ${role} — لم يتم تحديد بريد إلكتروني أو كلمة مرور في .env`);
    return;
  }

  if (password.length < 8) {
    throw new Error(`كلمة مرور ${role} قصيرة جدًا — يجب ألا تقل عن 8 أحرف.`);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           updated_at = now()`,
    [fullName, email.toLowerCase().trim(), passwordHash, role]
  );

  console.log(`✅ تم إنشاء/تحديث حساب ${role}: ${email}`);
}

async function run() {
  await upsertUser('مدير النظام', process.env.SEED_ADMIN_EMAIL, process.env.SEED_ADMIN_PASSWORD, 'admin');
  await upsertUser('مسؤول الموارد البشرية', process.env.SEED_HR_EMAIL, process.env.SEED_HR_PASSWORD, 'hr');
  await pool.end();
}

run().catch((error) => {
  console.error('❌ فشلت عملية إنشاء الحسابات:', error.message);
  process.exit(1);
});
