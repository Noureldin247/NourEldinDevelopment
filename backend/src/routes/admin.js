import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// نطاق الحماية محدد بمسار /admin فقط — لو مطبقة على كل المسارات كانت هتمنع
// أي مستخدم غير admin من الوصول لأي راوتر تاني بيتحمّل بعد ده في server.js
// Scoped to the /admin path only — an unscoped router.use() here would block
// any non-admin user from ever reaching routers mounted after this one in server.js.
router.use('/admin', requireAuth, requireRole('admin'));

const VALID_ROLES = ['admin', 'hr'];

const USER_SELECT = `
  SELECT id, full_name AS "fullName", email, role, is_active AS "isActive", created_at AS "createdAt"
  FROM users
`;

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

router.get('/admin/users', async (req, res) => {
  try {
    const { rows } = await pool.query(`${USER_SELECT} ORDER BY created_at ASC`);
    return res.json({ data: rows });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.post('/admin/users', async (req, res) => {
  const { fullName, email, password, role } = req.body ?? {};

  if (!fullName || !email || !VALID_ROLES.includes(role) || !isValidPassword(password)) {
    return res.status(400).json({
      message: 'الاسم والبريد الإلكتروني والدور مطلوبة، وكلمة المرور يجب ألا تقل عن 8 أحرف.',
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [fullName.trim(), email.toLowerCase().trim(), passwordHash, role]
    );

    const { rows: created } = await pool.query(`${USER_SELECT} WHERE id = $1`, [rows[0].id]);

    return res.status(201).json({ message: 'تم إنشاء الحساب بنجاح.', data: created[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'البريد الإلكتروني مستخدم بالفعل.' });
    }

    console.error('Create user error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.patch('/admin/users/:id', async (req, res) => {
  const { fullName, email, role } = req.body ?? {};
  const targetId = Number(req.params.id);

  if (!fullName || !email || !VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: 'الاسم والبريد الإلكتروني والدور مطلوبة.' });
  }

  if (targetId === req.user.sub) {
    const { rows } = await pool.query('SELECT role FROM users WHERE id = $1', [targetId]);
    if (rows[0] && rows[0].role !== role) {
      return res.status(400).json({ message: 'لا يمكنك تغيير دور حسابك الخاص.' });
    }
  }

  try {
    const { rows } = await pool.query(
      `UPDATE users SET full_name = $2, email = $3, role = $4, updated_at = now()
       WHERE id = $1 RETURNING id`,
      [targetId, fullName.trim(), email.toLowerCase().trim(), role]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'المستخدم غير موجود.' });
    }

    const { rows: updated } = await pool.query(`${USER_SELECT} WHERE id = $1`, [targetId]);

    return res.json({ message: 'تم تحديث بيانات المستخدم بنجاح.', data: updated[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'البريد الإلكتروني مستخدم بالفعل.' });
    }

    console.error('Update user error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.patch('/admin/users/:id/password', async (req, res) => {
  const { password } = req.body ?? {};
  const targetId = Number(req.params.id);

  if (!isValidPassword(password)) {
    return res.status(400).json({ message: 'كلمة المرور يجب ألا تقل عن 8 أحرف.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1 RETURNING id',
      [targetId, passwordHash]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'المستخدم غير موجود.' });
    }

    return res.json({ message: 'تم تغيير كلمة المرور بنجاح.' });
  } catch (error) {
    console.error('Set password error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.patch('/admin/users/:id/status', async (req, res) => {
  const { isActive } = req.body ?? {};
  const targetId = Number(req.params.id);

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'قيمة الحالة غير صحيحة.' });
  }

  if (targetId === req.user.sub && !isActive) {
    return res.status(400).json({ message: 'لا يمكنك إلغاء تفعيل حسابك الخاص.' });
  }

  try {
    const { rows } = await pool.query(
      'UPDATE users SET is_active = $2, updated_at = now() WHERE id = $1 RETURNING id',
      [targetId, isActive]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'المستخدم غير موجود.' });
    }

    const { rows: updated } = await pool.query(`${USER_SELECT} WHERE id = $1`, [targetId]);

    return res.json({ message: 'تم تحديث حالة الحساب بنجاح.', data: updated[0] });
  } catch (error) {
    console.error('Set status error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

export default router;
