import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.js';
import weighingRoutes from './src/routes/weighing.js';
import reportsRoutes from './src/routes/reports.js';
import adminRoutes from './src/routes/admin.js';
import invoicesRoutes from './src/routes/invoices.js';
import hrRoutes from './src/routes/hr.js';
import inventoryRoutes from './src/routes/inventory.js';
import customersRoutes from './src/routes/customers.js';
import { requireAuth, requireRole } from './src/middleware/auth.js';
import { connectDatabase } from './src/db.js';

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
app.use('/api', weighingRoutes);
app.use('/api', reportsRoutes);
app.use('/api', adminRoutes);
app.use('/api', invoicesRoutes);
app.use('/api', hrRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', customersRoutes);

// Pings محمية للتأكد إن التحقق من الدور شغال فعليًا من طرف لطرف.
// الـ routes الحقيقية (الإرساليات، التوزين، الفواتير...) هتتضاف في الخطوات الجاية.
app.get('/api/admin/ping', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ message: `مرحبًا بك ${req.user.name} في لوحة الإدارة.` });
});

app.get('/api/hr/ping', requireAuth, requireRole('hr'), (req, res) => {
  res.json({ message: `مرحبًا بك ${req.user.name} في لوحة الموارد البشرية.` });
});

async function startServer() {
  try {
    await connectDatabase();

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
  } catch (error) {
    console.error('Unable to start the backend server:', error.message);
    process.exit(1);
  }
}

startServer();
