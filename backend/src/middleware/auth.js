import jwt from 'jsonwebtoken';

// يتحقق إن فيه توكن صالح مرفق بالطلب — يُستخدم قبل أي route محمي
// Verifies a valid JWT is attached to the request. Use before any protected route.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'يجب تسجيل الدخول للوصول لهذه الصفحة.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'جلسة الدخول غير صالحة أو منتهية، برجاء تسجيل الدخول مرة أخرى.' });
  }
}

// يتأكد إن دور المستخدم مسموح له بالوصول لهذا الـ route
// Confirms the authenticated user's role is allowed on this route.
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'لا تملك صلاحية الوصول لهذا القسم.' });
    }
    return next();
  };
}
