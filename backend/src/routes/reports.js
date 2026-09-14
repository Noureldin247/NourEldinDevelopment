import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// عتبة اعتبار الرسالة "متأخرة" بالأيام — قيمة ثابتة داخلية، مش مدخلة من المستخدم
// Threshold (days) after which an open consignment counts as overdue — internal constant, not user input.
const OVERDUE_THRESHOLD_DAYS = 14;

router.get('/reports/custody-stock', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         COALESCE(SUM(pre_dye_weight_kg), 0) AS "totalKg",
         COALESCE(SUM(pre_dye_length_m), 0) AS "totalMetres"
       FROM consignments
       WHERE status != 'READY_FOR_DELIVERY'`
    );

    return res.json(rows[0]);
  } catch (error) {
    console.error('Custody stock report error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.get('/reports/open-consignments', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         id,
         'CN-' || lpad(id::text, 6, '0') AS "consignmentNo",
         customer_name AS "customerName",
         EXTRACT(DAY FROM now() - received_at)::int AS "daysOverdue"
       FROM consignments
       WHERE status != 'READY_FOR_DELIVERY'
         AND received_at < now() - interval '${OVERDUE_THRESHOLD_DAYS} days'
       ORDER BY received_at ASC`
    );

    return res.json({ data: rows });
  } catch (error) {
    console.error('Open consignments report error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.get('/reports/customer-custody-ranking', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         customer_name AS "customerName",
         SUM(pre_dye_weight_kg) AS "quantity"
       FROM consignments
       WHERE status != 'READY_FOR_DELIVERY'
       GROUP BY customer_name
       ORDER BY "quantity" DESC
       LIMIT 5`
    );

    return res.json({ data: rows });
  } catch (error) {
    console.error('Customer custody ranking report error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.get('/reports/monthly-revenue', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(l.quantity * l.unit_price), 0) AS total
       FROM invoices i
       JOIN invoice_lines l ON l.invoice_id = i.id
       WHERE i.status IN ('ISSUED', 'PAID')
         AND date_trunc('month', i.issued_at) = date_trunc('month', now())`
    );

    return res.json(rows[0]);
  } catch (error) {
    console.error('Monthly revenue report error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.get('/reports/customer-statement/:customerName', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(l.quantity * l.unit_price), 0) AS balance
       FROM invoices i
       JOIN invoice_lines l ON l.invoice_id = i.id
       WHERE i.status = 'ISSUED' AND i.customer_name = $1`,
      [req.params.customerName]
    );

    return res.json(rows[0]);
  } catch (error) {
    console.error('Customer statement report error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.get('/reports/unpriced-lines', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.id, l.description, l.line_type AS "lineType",
              'INV-' || lpad(i.id::text, 6, '0') AS "invoiceNo"
       FROM invoice_lines l
       JOIN invoices i ON i.id = l.invoice_id
       WHERE l.unit_price IS NULL AND i.status = 'DRAFT'
       ORDER BY l.created_at ASC`
    );

    return res.json({ data: rows });
  } catch (error) {
    console.error('Unpriced lines report error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.get('/reports/customer-names', requireAuth, async (req, res) => {
  const { search } = req.query;

  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT customer_name FROM consignments
       WHERE customer_name ILIKE $1
       ORDER BY customer_name ASC
       LIMIT 10`,
      [`%${search ?? ''}%`]
    );

    return res.json({ data: rows.map((row) => row.customer_name) });
  } catch (error) {
    console.error('Customer names report error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.get('/reports/low-stock', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, item_type AS "itemType", name, quantity_on_hand AS "quantityOnHand",
              unit, reorder_threshold AS "reorderThreshold"
       FROM inventory_items
       WHERE quantity_on_hand <= reorder_threshold
       ORDER BY (quantity_on_hand - reorder_threshold) ASC`
    );

    return res.json({ data: rows });
  } catch (error) {
    console.error('Low stock report error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

export default router;
