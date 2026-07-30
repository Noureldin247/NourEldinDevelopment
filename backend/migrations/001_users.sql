-- 001_users.sql
-- جدول المستخدمين — يحل محل بيانات الدخول الثابتة القديمة في server.js
-- Real user accounts, replacing the old hardcoded admin/hr object.

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,   -- bcrypt hash, لا يُخزَّن أي باسورد كنص صريح أبدًا
    role            VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'hr', 'operator', 'accountant')),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
