import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// نطاق الحماية محدد بمسار /invoices فقط — نفس السبب الموجود في admin.js و weighing.js
// Scoped to the /invoices path only — same reasoning as admin.js and weighing.js.
router.use('/invoices', requireAuth, requireRole('admin', 'hr'));

async function getInvoiceSummary(id) {
  const { rows } = await pool.query(
    `SELECT
       i.id,
       'INV-' || lpad(i.id::text, 6, '0') AS "invoiceNo",
       i.customer_id AS "customerId",
       i.customer_name AS "customerName",
       i.status,
       i.due_date AS "dueDate",
       i.issued_at AS "issuedAt",
       i.paid_at AS "paidAt",
       COALESCE(SUM(l.quantity * l.unit_price), 0) AS total
     FROM invoices i
     LEFT JOIN invoice_lines l ON l.invoice_id = i.id
     WHERE i.id = $1
     GROUP BY i.id`,
    [id]
  );
  return rows[0];
}

function isValidPrice(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

router.get('/invoices/available-consignments', async (req, res) => {
  const { customerName } = req.query;
  const conditions = [`c.status = 'READY_FOR_DELIVERY'`, `ic.id IS NULL`];
  const params = [];

  if (customerName) {
    params.push(customerName);
    conditions.push(`c.customer_name = $${params.length}`);
  }

  try {
    const { rows } = await pool.query(
      `SELECT
         c.id,
         'CN-' || lpad(c.id::text, 6, '0') AS "consignmentNo",
         c.customer_name AS "customerName",
         c.fabric_name AS "fabricName",
         c.post_dye_weight_kg AS "postDyeWeightKg",
         c.received_at AS "receivedAt"
       FROM consignments c
       LEFT JOIN invoice_consignments ic ON ic.consignment_id = c.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY c.received_at ASC`,
      params
    );

    return res.json({ data: rows });
  } catch (error) {
    console.error('Available consignments error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.get('/invoices', async (req, res) => {
  const { status, overdue } = req.query;
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`i.status = $${params.length}`);
  }

  if (overdue === 'true') {
    conditions.push(`i.status = 'ISSUED' AND i.due_date < CURRENT_DATE`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(
      `SELECT
         i.id,
         'INV-' || lpad(i.id::text, 6, '0') AS "invoiceNo",
         i.customer_name AS "customerName",
         i.status,
         i.due_date AS "dueDate",
         i.issued_at AS "issuedAt",
         i.paid_at AS "paidAt",
         COALESCE(SUM(l.quantity * l.unit_price), 0) AS total
       FROM invoices i
       LEFT JOIN invoice_lines l ON l.invoice_id = i.id
       ${where}
       GROUP BY i.id
       ORDER BY i.created_at DESC`,
      params
    );

    return res.json({ data: rows });
  } catch (error) {
    console.error('List invoices error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.post('/invoices', async (req, res) => {
  const { consignmentIds } = req.body ?? {};

  if (!Array.isArray(consignmentIds) || consignmentIds.length === 0) {
    return res.status(400).json({ message: 'يجب اختيار رسالة واحدة على الأقل.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: consignments } = await client.query(
      `SELECT id, customer_id, customer_name, fabric_name, post_dye_weight_kg, status
       FROM consignments WHERE id = ANY($1::int[])`,
      [consignmentIds]
    );

    if (consignments.length !== consignmentIds.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'إحدى الرسائل المختارة غير موجودة.' });
    }

    const notReady = consignments.find((c) => c.status !== 'READY_FOR_DELIVERY');
    if (notReady) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'لا يمكن فوترة رسالة لم تصل بعد لحالة "جاهزة للتسليم".' });
    }

    const distinctCustomers = new Set(consignments.map((c) => c.customer_id));
    if (distinctCustomers.size > 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'كل الرسائل المختارة يجب أن تكون لنفس العميل.' });
    }

    const { rows: alreadyInvoiced } = await client.query(
      `SELECT consignment_id FROM invoice_consignments WHERE consignment_id = ANY($1::int[])`,
      [consignmentIds]
    );

    if (alreadyInvoiced.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'إحدى الرسائل المختارة تمت فوترتها بالفعل.' });
    }

    const customerId = consignments[0].customer_id;
    const customerName = consignments[0].customer_name;

    const { rows: invoiceRows } = await client.query(
      'INSERT INTO invoices (customer_id, customer_name, created_by) VALUES ($1, $2, $3) RETURNING id',
      [customerId, customerName, req.user.sub]
    );
    const invoiceId = invoiceRows[0].id;

    for (const consignment of consignments) {
      await client.query('INSERT INTO invoice_consignments (invoice_id, consignment_id) VALUES ($1, $2)', [
        invoiceId,
        consignment.id,
      ]);

      const { rows: chemicals } = await client.query(
        'SELECT chemical_name, quantity, unit FROM consignment_dye_chemicals WHERE consignment_id = $1',
        [consignment.id]
      );

      for (const chemical of chemicals) {
        await client.query(
          `INSERT INTO invoice_lines (invoice_id, consignment_id, line_type, description, quantity, unit)
           VALUES ($1, $2, 'CHEMICAL', $3, $4, $5)`,
          [invoiceId, consignment.id, chemical.chemical_name, chemical.quantity, chemical.unit]
        );
      }

      await client.query(
        `INSERT INTO invoice_lines (invoice_id, consignment_id, line_type, description, quantity, unit)
         VALUES ($1, $2, 'FABRIC', $3, $4, 'kg')`,
        [invoiceId, consignment.id, consignment.fabric_name, consignment.post_dye_weight_kg]
      );
    }

    await client.query('COMMIT');

    const summary = await getInvoiceSummary(invoiceId);
    return res.status(201).json({ message: 'تم إنشاء الفاتورة بنجاح.', data: summary });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create invoice error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  } finally {
    client.release();
  }
});

router.get('/invoices/price-suggestion', async (req, res) => {
  const { lineType, description } = req.query;

  if (!lineType || !description) {
    return res.status(400).json({ message: 'نوع البند والوصف مطلوبان.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT unit_price AS "unitPrice" FROM invoice_lines
       WHERE line_type = $1 AND description = $2 AND unit_price IS NOT NULL
       ORDER BY created_at DESC LIMIT 1`,
      [lineType, description]
    );

    return res.json({ unitPrice: rows[0]?.unitPrice ?? null });
  } catch (error) {
    console.error('Price suggestion error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.get('/invoices/:id', async (req, res) => {
  try {
    const summary = await getInvoiceSummary(req.params.id);

    if (!summary) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة.' });
    }

    const { rows: lines } = await pool.query(
      `SELECT id, consignment_id AS "consignmentId", line_type AS "lineType", description,
              quantity, unit, unit_price AS "unitPrice"
       FROM invoice_lines WHERE invoice_id = $1 ORDER BY id ASC`,
      [req.params.id]
    );

    const { rows: consignments } = await pool.query(
      `SELECT c.id, 'CN-' || lpad(c.id::text, 6, '0') AS "consignmentNo"
       FROM consignments c
       JOIN invoice_consignments ic ON ic.consignment_id = c.id
       WHERE ic.invoice_id = $1`,
      [req.params.id]
    );

    return res.json({ data: { ...summary, lines, consignments } });
  } catch (error) {
    console.error('Get invoice error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.patch('/invoices/:id/lines/:lineId', async (req, res) => {
  const { unitPrice } = req.body ?? {};

  if (!isValidPrice(unitPrice)) {
    return res.status(400).json({ message: 'السعر يجب أن يكون رقمًا صحيحًا.' });
  }

  try {
    const { rows: invoiceRows } = await pool.query('SELECT status FROM invoices WHERE id = $1', [req.params.id]);

    if (!invoiceRows[0]) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة.' });
    }

    if (invoiceRows[0].status !== 'DRAFT') {
      return res.status(400).json({ message: 'لا يمكن تعديل أسعار فاتورة تم إصدارها.' });
    }

    const { rows } = await pool.query(
      'UPDATE invoice_lines SET unit_price = $3 WHERE id = $1 AND invoice_id = $2 RETURNING id',
      [req.params.lineId, req.params.id, unitPrice]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'البند غير موجود.' });
    }

    return res.json({ message: 'تم تحديث السعر.' });
  } catch (error) {
    console.error('Set line price error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.patch('/invoices/:id/issue', async (req, res) => {
  const { dueDate } = req.body ?? {};

  if (!dueDate) {
    return res.status(400).json({ message: 'تاريخ الاستحقاق مطلوب.' });
  }

  try {
    const { rows: invoiceRows } = await pool.query('SELECT status FROM invoices WHERE id = $1', [req.params.id]);

    if (!invoiceRows[0]) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة.' });
    }

    if (invoiceRows[0].status !== 'DRAFT') {
      return res.status(400).json({ message: 'الفاتورة تم إصدارها بالفعل.' });
    }

    const { rows: unpriced } = await pool.query(
      'SELECT count(*)::int AS count FROM invoice_lines WHERE invoice_id = $1 AND unit_price IS NULL',
      [req.params.id]
    );

    if (unpriced[0].count > 0) {
      return res.status(400).json({ message: 'يجب تسعير كل بنود الفاتورة قبل الإصدار.' });
    }

    await pool.query(
      `UPDATE invoices SET status = 'ISSUED', due_date = $2, issued_at = now(), updated_at = now() WHERE id = $1`,
      [req.params.id, dueDate]
    );

    const summary = await getInvoiceSummary(req.params.id);
    return res.json({ message: 'تم إصدار الفاتورة بنجاح.', data: summary });
  } catch (error) {
    console.error('Issue invoice error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.patch('/invoices/:id/mark-paid', async (req, res) => {
  try {
    const { rows: invoiceRows } = await pool.query('SELECT status FROM invoices WHERE id = $1', [req.params.id]);

    if (!invoiceRows[0]) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة.' });
    }

    if (invoiceRows[0].status !== 'ISSUED') {
      return res.status(400).json({ message: 'لا يمكن تحديد الفاتورة كمدفوعة إلا بعد إصدارها.' });
    }

    await pool.query(`UPDATE invoices SET status = 'PAID', paid_at = now(), updated_at = now() WHERE id = $1`, [
      req.params.id,
    ]);

    const summary = await getInvoiceSummary(req.params.id);
    return res.json({ message: 'تم تسجيل الفاتورة كمدفوعة.', data: summary });
  } catch (error) {
    console.error('Mark invoice paid error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

export default router;
