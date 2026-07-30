# نظام وينيتكس للنسيج والملابس — Winitex Factory System

نظام داخلي لمصنع وينيتكس يغطي عمليات التوزين والصباغة، بالإضافة إلى قسم الموارد البشرية.

## التشغيل المحلي (Local setup)

### 1. قاعدة البيانات
```bash
createdb winitex
cp backend/.env.example backend/.env
# افتح backend/.env واملأ DATABASE_URL و JWT_SECRET والقيم المؤقتة SEED_*
```

### 2. الباك اند (Backend)
```bash
cd backend
npm install
npm run migrate   # ينشئ الجداول
npm run seed       # ينشئ أول حساب إدارة وحساب موارد بشرية (يقرأ من .env)
npm run dev
```

### 3. الفرونت اند (Frontend)
```bash
cd frontend
npm install
npm run dev
```

## ملاحظات أمان مهمة

- **لا يوجد أي بيانات دخول ثابتة في الكود.** كل الحسابات مخزنة في جدول `users` بكلمة مرور مشفرة (bcrypt).
- ملف `.env` غير مرفوع على GitHub (موجود في `.gitignore`) — لازم كل شخص يعمله بنفسه محليًا من `.env.example`.
- بعد تشغيل `npm run seed` أول مرة، غيّر قيم `SEED_ADMIN_PASSWORD` و `SEED_HR_PASSWORD` في `.env` أو احذفهم، عشان محدش يقدر يشغل السكربت تاني بنفس الباسورد.
