-- 003_simplify_roles.sql
-- تبسيط الأدوار: الإدارة (admin) والموارد البشرية (hr) فقط — الموارد البشرية
-- تتولى الآن أيضًا مهام المشغّل (التوزين والصباغة والشحنات) والمحاسب (الحسابات).
-- Simplify roles to just admin and hr — HR now also covers what operator and
-- accountant used to handle (weighing/dyeing, shipments, and accounting).

UPDATE users SET role = 'hr' WHERE role IN ('operator', 'accountant');

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'hr'));
