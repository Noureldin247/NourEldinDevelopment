import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const guard = [requireAuth, requireRole('admin', 'hr')];

const CUSTOMER_SELECT = `
  SELECT id, 'CUST-' || lpad(id::text, 6, '0') AS "customerCode",
         full_name AS "fullName", phone, email, address, notes, created_at AS "createdAt"
  FROM customers
`;

router.get('/customers', ...guard, async (req, res) => {
  const { search } = req.query;
  const where = search ? 'WHERE full_name ILIKE $1' : '';
  const params = search ? [`%${search}%`] : [];

  try {
    const { rows } = await pool.query(`${CUSTOMER_SELECT} ${where} ORDER BY full_name ASC`, params);
    return res.json({ data: rows });
  } catch (error) {
    console.error('List customers error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.post('/customers', ...guard, async (req, res) => {
  const { fullName, phone, email, address, notes } = req.body ?? {};

  if (!fullName) {
    return res.status(400).json({ message: 'اسم العميل مطلوب.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO customers (full_name, phone, email, address, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [fullName.trim(), phone?.trim() || null, email?.trim() || null, address?.trim() || null, notes?.trim() || null]
    );

    const { rows: created } = await pool.query(`${CUSTOMER_SELECT} WHERE id = $1`, [rows[0].id]);
    return res.status(201).json({ message: 'تم إضافة العميل بنجاح.', data: created[0] });
  } catch (error) {
    console.error('Create customer error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.patch('/customers/:id', ...guard, async (req, res) => {
  const { fullName, phone, email, address, notes } = req.body ?? {};

  if (!fullName) {
    return res.status(400).json({ message: 'اسم العميل مطلوب.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE customers SET full_name = $2, phone = $3, email = $4, address = $5, notes = $6, updated_at = now()
       WHERE id = $1 RETURNING id`,
      [req.params.id, fullName.trim(), phone?.trim() || null, email?.trim() || null, address?.trim() || null, notes?.trim() || null]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'العميل غير موجود.' });
    }

    const { rows: updated } = await pool.query(`${CUSTOMER_SELECT} WHERE id = $1`, [req.params.id]);
    return res.json({ message: 'تم تحديث بيانات العميل بنجاح.', data: updated[0] });
  } catch (error) {
    console.error('Update customer error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.get('/customers/:id', ...guard, async (req, res) => {
  try {
    const { rows } = await pool.query(`${CUSTOMER_SELECT} WHERE id = $1`, [req.params.id]);
    const customer = rows[0];

    if (!customer) {
      return res.status(404).json({ message: 'العميل غير موجود.' });
    }

    const { rows: orders } = await pool.query(
      `SELECT id, 'CN-' || lpad(id::text, 6, '0') AS "consignmentNo", fabric_name AS "fabricName",
              status, pre_dye_weight_kg AS "preDyeWeightKg", received_at AS "receivedAt"
       FROM consignments WHERE customer_id = $1 ORDER BY received_at DESC`,
      [req.params.id]
    );

    const { rows: fabricUsage } = await pool.query(
      `SELECT fabric_name AS "fabricName", count(*)::int AS "orderCount"
       FROM consignments
       WHERE customer_id = $1 AND fabric_name IS NOT NULL AND fabric_name != ''
       GROUP BY fabric_name ORDER BY "orderCount" DESC`,
      [req.params.id]
    );

    const { rows: chemicalUsage } = await pool.query(
      `SELECT cdc.chemical_name AS "chemicalName", count(*)::int AS "usageCount"
       FROM consignment_dye_chemicals cdc
       JOIN consignments c ON c.id = cdc.consignment_id
       WHERE c.customer_id = $1
       GROUP BY cdc.chemical_name ORDER BY "usageCount" DESC`,
      [req.params.id]
    );

    return res.json({ data: { ...customer, orders, fabricUsage, chemicalUsage } });
  } catch (error) {
    console.error('Get customer error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

export default router;
