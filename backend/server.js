import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.js';
import { requireAuth, requireRole } from './src/middleware/auth.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET غير موجود في ملف .env — لن يعمل الخادم بدونه.');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running' });
});

app.use('/api', authRoutes);

// Pings محمية للتأكد إن التحقق من الدور شغال فعليًا من طرف لطرف.
// الـ routes الحقيقية (الإرساليات، التوزين، الفواتير...) هتتضاف في الخطوات الجاية.
app.get('/api/admin/ping', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ message: `مرحبًا بك ${req.user.name} في لوحة الإدارة.` });
});

app.get('/api/hr/ping', requireAuth, requireRole('hr'), (req, res) => {
  res.json({ message: `مرحبًا بك ${req.user.name} في لوحة الموارد البشرية.` });
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the other backend process or set a different PORT value.`);
    process.exit(1);
  }

  throw error;
});
