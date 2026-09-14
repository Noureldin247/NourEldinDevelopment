import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// كل route هنا بياخد requireAuth/requireRole بشكل صريح، مش عن طريق router.use()
// لأن الملف ده بيخدم أكتر من مسار (employees/attendance/leave-requests/payslips) —
// استخدام router.use() هنا ممكن يمنع بالغلط مسارات تانية زي ما حصل قبل كده مع ملفات تانية.
// Every route here applies requireAuth/requireRole explicitly rather than via router.use(),
// since this file serves multiple resource prefixes — a blanket router.use() previously
// caused a real bug where one router's gate silently blocked unrelated routes.
const guard = [requireAuth, requireRole('admin', 'hr')];

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

const EMPLOYEE_SELECT = `
  SELECT id, full_name AS "fullName", position, department, phone,
         hire_date AS "hireDate", monthly_salary AS "monthlySalary", is_active AS "isActive"
  FROM employees
`;

router.get('/employees', ...guard, async (req, res) => {
  const { active } = req.query;
  const conditions = [];

  if (active === 'true') conditions.push('is_active = true');
  if (active === 'false') conditions.push('is_active = false');

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(`${EMPLOYEE_SELECT} ${where} ORDER BY full_name ASC`);
    return res.json({ data: rows });
  } catch (error) {
    console.error('List employees error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.post('/employees', ...guard, async (req, res) => {
  const { fullName, position, department, phone, hireDate, monthlySalary } = req.body ?? {};

  if (!fullName || !position || !hireDate || !isPositiveNumber(monthlySalary)) {
    return res.status(400).json({ message: 'الاسم والوظيفة وتاريخ التعيين والراتب مطلوبة وبقيم صحيحة.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO employees (full_name, position, department, phone, hire_date, monthly_salary)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [fullName.trim(), position.trim(), department?.trim() || null, phone?.trim() || null, hireDate, monthlySalary]
    );

    const { rows: created } = await pool.query(`${EMPLOYEE_SELECT} WHERE id = $1`, [rows[0].id]);
    return res.status(201).json({ message: 'تم إضافة الموظف بنجاح.', data: created[0] });
  } catch (error) {
    console.error('Create employee error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.patch('/employees/:id', ...guard, async (req, res) => {
  const { fullName, position, department, phone, hireDate, monthlySalary } = req.body ?? {};

  if (!fullName || !position || !hireDate || !isPositiveNumber(monthlySalary)) {
    return res.status(400).json({ message: 'الاسم والوظيفة وتاريخ التعيين والراتب مطلوبة وبقيم صحيحة.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE employees SET full_name = $2, position = $3, department = $4, phone = $5,
              hire_date = $6, monthly_salary = $7, updated_at = now()
       WHERE id = $1 RETURNING id`,
      [req.params.id, fullName.trim(), position.trim(), department?.trim() || null, phone?.trim() || null, hireDate, monthlySalary]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'الموظف غير موجود.' });
    }

    const { rows: updated } = await pool.query(`${EMPLOYEE_SELECT} WHERE id = $1`, [req.params.id]);
    return res.json({ message: 'تم تحديث بيانات الموظف بنجاح.', data: updated[0] });
  } catch (error) {
    console.error('Update employee error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.patch('/employees/:id/status', ...guard, async (req, res) => {
  const { isActive } = req.body ?? {};

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'قيمة الحالة غير صحيحة.' });
  }

  try {
    const { rows } = await pool.query(
      'UPDATE employees SET is_active = $2, updated_at = now() WHERE id = $1 RETURNING id',
      [req.params.id, isActive]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'الموظف غير موجود.' });
    }

    const { rows: updated } = await pool.query(`${EMPLOYEE_SELECT} WHERE id = $1`, [req.params.id]);
    return res.json({ message: 'تم تحديث حالة الموظف بنجاح.', data: updated[0] });
  } catch (error) {
    console.error('Set employee status error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.get('/attendance', ...guard, async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: 'التاريخ مطلوب.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT e.id AS "employeeId", e.full_name AS "fullName", e.position, a.status
       FROM employees e
       LEFT JOIN attendance_records a ON a.employee_id = e.id AND a.date = $1
       WHERE e.is_active = true
       ORDER BY e.full_name ASC`,
      [date]
    );

    return res.json({ data: rows });
  } catch (error) {
    console.error('Get attendance error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.put('/attendance', ...guard, async (req, res) => {
  const { employeeId, date, status } = req.body ?? {};

  if (!employeeId || !date || !['PRESENT', 'ABSENT', 'LATE'].includes(status)) {
    return res.status(400).json({ message: 'بيانات الحضور غير مكتملة.' });
  }

  try {
    await pool.query(
      `INSERT INTO attendance_records (employee_id, date, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (employee_id, date) DO UPDATE SET status = EXCLUDED.status`,
      [employeeId, date, status]
    );

    return res.json({ message: 'تم تسجيل الحضور بنجاح.' });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.get('/leave-requests', ...guard, async (req, res) => {
  const { status, employeeId } = req.query;
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`l.status = $${params.length}`);
  }

  if (employeeId) {
    params.push(employeeId);
    conditions.push(`l.employee_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(
      `SELECT l.id, l.employee_id AS "employeeId", e.full_name AS "employeeName",
              l.leave_type AS "leaveType", l.start_date AS "startDate", l.end_date AS "endDate",
              l.reason, l.status, l.reviewed_at AS "reviewedAt"
       FROM leave_requests l
       JOIN employees e ON e.id = l.employee_id
       ${where}
       ORDER BY l.created_at DESC`,
      params
    );

    return res.json({ data: rows });
  } catch (error) {
    console.error('List leave requests error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.post('/leave-requests', ...guard, async (req, res) => {
  const { employeeId, leaveType, startDate, endDate, reason } = req.body ?? {};

  if (!employeeId || !['VACATION', 'SICK', 'OTHER'].includes(leaveType) || !startDate || !endDate) {
    return res.status(400).json({ message: 'بيانات الطلب غير مكتملة.' });
  }

  if (new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({ message: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [employeeId, leaveType, startDate, endDate, reason?.trim() || null]
    );

    return res.status(201).json({ message: 'تم تسجيل طلب الإجازة بنجاح.', data: { id: rows[0].id } });
  } catch (error) {
    console.error('Create leave request error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.patch('/leave-requests/:id/review', ...guard, async (req, res) => {
  const { status } = req.body ?? {};

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'قيمة الحالة غير صحيحة.' });
  }

  try {
    const { rows: existing } = await pool.query('SELECT status FROM leave_requests WHERE id = $1', [req.params.id]);

    if (!existing[0]) {
      return res.status(404).json({ message: 'الطلب غير موجود.' });
    }

    if (existing[0].status !== 'PENDING') {
      return res.status(400).json({ message: 'تمت مراجعة هذا الطلب بالفعل.' });
    }

    await pool.query(
      `UPDATE leave_requests SET status = $2, reviewed_by = $3, reviewed_at = now() WHERE id = $1`,
      [req.params.id, status, req.user.sub]
    );

    return res.json({ message: 'تم تحديث حالة الطلب بنجاح.' });
  } catch (error) {
    console.error('Review leave request error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.get('/payslips', ...guard, async (req, res) => {
  const { employeeId, month } = req.query;
  const conditions = [];
  const params = [];

  if (employeeId) {
    params.push(employeeId);
    conditions.push(`p.employee_id = $${params.length}`);
  }

  if (month) {
    params.push(month);
    conditions.push(`p.month = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.employee_id AS "employeeId", e.full_name AS "employeeName", p.month,
              p.base_salary AS "baseSalary", p.absent_days AS "absentDays",
              p.deduction, p.net_pay AS "netPay", p.generated_at AS "generatedAt"
       FROM payslips p
       JOIN employees e ON e.id = p.employee_id
       ${where}
       ORDER BY p.month DESC`,
      params
    );

    return res.json({ data: rows });
  } catch (error) {
    console.error('List payslips error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.post('/payslips/generate', ...guard, async (req, res) => {
  const { employeeId, month } = req.body ?? {};

  if (!employeeId || !month) {
    return res.status(400).json({ message: 'الموظف والشهر مطلوبان.' });
  }

  try {
    const { rows: employeeRows } = await pool.query('SELECT monthly_salary FROM employees WHERE id = $1', [employeeId]);

    if (!employeeRows[0]) {
      return res.status(404).json({ message: 'الموظف غير موجود.' });
    }

    const monthlySalary = Number(employeeRows[0].monthly_salary);

    const { rows: absentRows } = await pool.query(
      `SELECT count(*)::int AS count
       FROM attendance_records a
       WHERE a.employee_id = $1
         AND a.date >= $2::date AND a.date < ($2::date + interval '1 month')
         AND a.status = 'ABSENT'
         AND NOT EXISTS (
           SELECT 1 FROM leave_requests l
           WHERE l.employee_id = $1 AND l.status = 'APPROVED'
             AND a.date BETWEEN l.start_date AND l.end_date
         )`,
      [employeeId, month]
    );

    const absentDays = absentRows[0].count;
    const dailyRate = monthlySalary / 30;
    const deduction = Math.round(dailyRate * absentDays * 100) / 100;
    const netPay = Math.round((monthlySalary - deduction) * 100) / 100;

    const { rows } = await pool.query(
      `INSERT INTO payslips (employee_id, month, base_salary, absent_days, deduction, net_pay)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (employee_id, month) DO UPDATE SET
         base_salary = EXCLUDED.base_salary, absent_days = EXCLUDED.absent_days,
         deduction = EXCLUDED.deduction, net_pay = EXCLUDED.net_pay, generated_at = now()
       RETURNING id`,
      [employeeId, month, monthlySalary, absentDays, deduction, netPay]
    );

    const { rows: created } = await pool.query(
      `SELECT p.id, p.employee_id AS "employeeId", e.full_name AS "employeeName", p.month,
              p.base_salary AS "baseSalary", p.absent_days AS "absentDays",
              p.deduction, p.net_pay AS "netPay", p.generated_at AS "generatedAt"
       FROM payslips p JOIN employees e ON e.id = p.employee_id WHERE p.id = $1`,
      [rows[0].id]
    );

    return res.status(201).json({ message: 'تم إصدار فيش الراتب بنجاح.', data: created[0] });
  } catch (error) {
    console.error('Generate payslip error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

export default router;
