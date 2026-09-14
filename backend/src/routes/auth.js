import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// يمنع محاولات تخمين الباسورد المتكررة على نفس الـ IP
// Rate-limits login attempts to slow down brute-force guessing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 10,
  message: { message: 'محاولات دخول كثيرة جدًا، برجاء المحاولة لاحقًا بعد قليل.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// يحدد أي صفحة يتحول لها كل دور بعد الدخول
// Determines which dashboard each role lands on after logging in.
const roleRedirect = {
  admin: '/dashboard',
  hr: '/dashboard',
};

// هاش وهمي يُستخدم لما الإيميل مش موجود، عشان زمن الاستجابة يفضل ثابت
// ولا يكشف هل الإيميل مسجل في النظام ولا لأ (منع timing attacks)
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEeOWQXtQmzHRJEBhE6Ic.LzOqZQ1Uv7DUS';

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ message: 'البريد الإلكتروني وكلمة المرور مطلوبان.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = rows[0];

    const passwordMatches = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);

    if (!user || !user.is_active || !passwordMatches) {
      return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      message: 'تم تسجيل الدخول بنجاح.',
      token,
      role: user.role,
      fullName: user.full_name,
      redirectTo: roleRedirect[user.role] || '/',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

// يرجع بيانات المستخدم الحالي بناءً على التوكن — تستخدمه الواجهة الأمامية
// للتأكد إن الجلسة لسه صالحة عند تحميل الصفحة (مثلاً بعد إعادة التحميل)
router.get('/me', requireAuth, (req, res) => {
  res.json({ id: req.user.sub, role: req.user.role, fullName: req.user.name });
});

export default router;
