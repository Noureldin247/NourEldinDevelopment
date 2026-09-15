import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getInventoryShortages, deductInventory } from '../services/inventory.js';

const router = Router();

// نطاق الحماية محدد بمسار /consignments فقط — لو مطبقة على كل المسارات
// كانت هتمنع أي راوتر تاني بيتحمّل بعد ده في server.js من إنه يوصله الطلب أصلاً
// Scoped to the /consignments path only — an unscoped router.use() here would stop
// requests meant for routers mounted after this one in server.js from ever reaching them.
router.use('/consignments', requireAuth, requireRole('admin', 'hr'));

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

const CONSIGNMENT_SELECT = `
  SELECT
    id,
    'CN-' || lpad(id::text, 6, '0') AS "consignmentNo",
    customer_id AS "customerId",
    customer_name AS "customerName",
    fabric_item_id AS "fabricItemId",
    fabric_name AS "fabricName",
    status,
    pre_dye_weight_kg AS "preDyeWeightKg",
    pre_dye_length_m AS "preDyeLengthM",
    post_dye_weight_kg AS "postDyeWeightKg",
    post_dye_length_m AS "postDyeLengthM",
    received_at AS "receivedAt",
    production_started_at AS "productionStartedAt",
    completed_at AS "completedAt",
    EXTRACT(DAY FROM now() - received_at)::int AS "daysOverdue"
  FROM consignments
`;

async function getConsignmentOr404(id, res) {
  const { rows } = await pool.query('SELECT id, status FROM consignments WHERE id = $1', [id]);
  if (!rows[0]) {
    res.status(404).json({ message: 'الرسالة غير موجودة.' });
    return null;
  }
  return rows[0];
}

router.get('/consignments', async (req, res) => {
  const { status } = req.query;

  try {
    const { rows } = status
      ? await pool.query(`${CONSIGNMENT_SELECT} WHERE status = $1 ORDER BY received_at DESC`, [status])
      : await pool.query(`${CONSIGNMENT_SELECT} ORDER BY received_at DESC`);

    return res.json({ data: rows });
  } catch (error) {
    console.error('List consignments error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.post('/consignments', async (req, res) => {
  const { customerId, fabricItemId, preDyeWeightKg, preDyeLengthM } = req.body ?? {};

  if (!customerId || !fabricItemId || !isPositiveNumber(preDyeWeightKg) || !isPositiveNumber(preDyeLengthM)) {
    return res.status(400).json({ message: 'العميل ونوع القماش والوزن والطول قبل الصباغة مطلوبة وبقيم صحيحة.' });
  }

  try {
    const { rows: customerRows } = await pool.query('SELECT full_name FROM customers WHERE id = $1', [customerId]);
    if (!customerRows[0]) {
      return res.status(404).json({ message: 'العميل غير موجود.' });
    }

    const { rows: fabricRows } = await pool.query(
      "SELECT name FROM inventory_items WHERE id = $1 AND item_type = 'FABRIC'",
      [fabricItemId]
    );
    if (!fabricRows[0]) {
      return res.status(404).json({ message: 'نوع القماش غير موجود في المخزون.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO consignments (customer_id, customer_name, fabric_item_id, fabric_name, pre_dye_weight_kg, pre_dye_length_m, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [customerId, customerRows[0].full_name, fabricItemId, fabricRows[0].name, preDyeWeightKg, preDyeLengthM, req.user.sub]
    );

    const { rows: created } = await pool.query(`${CONSIGNMENT_SELECT} WHERE id = $1`, [rows[0].id]);

    return res.status(201).json({ message: 'تم إنشاء الرسالة بنجاح.', data: created[0] });
  } catch (error) {
    console.error('Create consignment error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.get('/consignments/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`${CONSIGNMENT_SELECT} WHERE id = $1`, [req.params.id]);
    const consignment = rows[0];

    if (!consignment) {
      return res.status(404).json({ message: 'الرسالة غير موجودة.' });
    }

    const { rows: chemicals } = await pool.query(
      `SELECT id, chemical_item_id AS "chemicalItemId", chemical_name AS "chemicalName",
              quantity, unit, created_at AS "createdAt"
       FROM consignment_dye_chemicals WHERE consignment_id = $1 ORDER BY created_at ASC`,
      [req.params.id]
    );

    return res.json({ data: { ...consignment, chemicals } });
  } catch (error) {
    console.error('Get consignment error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.post('/consignments/:id/chemicals', async (req, res) => {
  const { chemicalItemId, quantity } = req.body ?? {};

  if (!chemicalItemId || !isPositiveNumber(quantity)) {
    return res.status(400).json({ message: 'المادة الكيميائية والكمية مطلوبان وبقيمة صحيحة.' });
  }

  try {
    const consignment = await getConsignmentOr404(req.params.id, res);
    if (!consignment) return;

    if (consignment.status === 'READY_FOR_DELIVERY') {
      return res.status(400).json({ message: 'لا يمكن إضافة مكونات لرسالة تم الانتهاء منها.' });
    }

    const { rows: chemicalRows } = await pool.query(
      "SELECT name, unit FROM inventory_items WHERE id = $1 AND item_type = 'CHEMICAL'",
      [chemicalItemId]
    );
    if (!chemicalRows[0]) {
      return res.status(404).json({ message: 'المادة الكيميائية غير موجودة في المخزون.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO consignment_dye_chemicals (consignment_id, chemical_item_id, chemical_name, quantity, unit)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, chemical_item_id AS "chemicalItemId", chemical_name AS "chemicalName",
                 quantity, unit, created_at AS "createdAt"`,
      [req.params.id, chemicalItemId, chemicalRows[0].name, quantity, chemicalRows[0].unit]
    );

    return res.status(201).json({ message: 'تمت إضافة المادة بنجاح.', data: rows[0] });
  } catch (error) {
    console.error('Add dye chemical error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.delete('/consignments/:id/chemicals/:chemicalId', async (req, res) => {
  try {
    const consignment = await getConsignmentOr404(req.params.id, res);
    if (!consignment) return;

    if (consignment.status === 'READY_FOR_DELIVERY') {
      return res.status(400).json({ message: 'لا يمكن تعديل رسالة تم الانتهاء منها.' });
    }

    await pool.query('DELETE FROM consignment_dye_chemicals WHERE id = $1 AND consignment_id = $2', [
      req.params.chemicalId,
      req.params.id,
    ]);

    return res.json({ message: 'تم حذف المادة بنجاح.' });
  } catch (error) {
    console.error('Remove dye chemical error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.patch('/consignments/:id/start-production', async (req, res) => {
  try {
    const consignment = await getConsignmentOr404(req.params.id, res);
    if (!consignment) return;

    if (consignment.status !== 'RECEIVED') {
      return res.status(400).json({ message: 'لا يمكن بدء الإنتاج إلا لرسالة في حالة "مستلمة".' });
    }

    const { rows: chemicalCount } = await pool.query(
      'SELECT count(*)::int AS count FROM consignment_dye_chemicals WHERE consignment_id = $1',
      [req.params.id]
    );

    if (chemicalCount[0].count === 0) {
      return res.status(400).json({ message: 'أضف مكونات الصباغة أولاً قبل بدء الإنتاج.' });
    }

    const { rows } = await pool.query(
      `UPDATE consignments SET status = 'IN_PRODUCTION', production_started_at = now(), updated_at = now()
       WHERE id = $1 RETURNING id`,
      [req.params.id]
    );

    const { rows: updated } = await pool.query(`${CONSIGNMENT_SELECT} WHERE id = $1`, [rows[0].id]);

    return res.json({ message: 'تم بدء الإنتاج بنجاح.', data: updated[0] });
  } catch (error) {
    console.error('Start production error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.patch('/consignments/:id/complete', async (req, res) => {
  const { postDyeWeightKg, postDyeLengthM } = req.body ?? {};

  if (!isPositiveNumber(postDyeWeightKg) || !isPositiveNumber(postDyeLengthM)) {
    return res.status(400).json({ message: 'الوزن والطول بعد الصباغة مطلوبان وبقيمة صحيحة.' });
  }

  try {
    const { rows: consignmentRows } = await pool.query(
      'SELECT id, status, fabric_item_id, pre_dye_weight_kg FROM consignments WHERE id = $1',
      [req.params.id]
    );
    const consignment = consignmentRows[0];

    if (!consignment) {
      return res.status(404).json({ message: 'الرسالة غير موجودة.' });
    }

    if (consignment.status !== 'IN_PRODUCTION') {
      return res.status(400).json({ message: 'لا يمكن إنهاء الرسالة إلا وهي في حالة "قيد التصنيع".' });
    }

    const { rows: chemicals } = await pool.query(
      'SELECT chemical_item_id, quantity FROM consignment_dye_chemicals WHERE consignment_id = $1',
      [req.params.id]
    );

    // لازم يكون فيه مخزون كافٍ من القماش وكل مادة صباغة قبل ما نسمح بإنهاء الرسالة —
    // ده بيخصم المخزون تلقائيًا فمينفعش نخصم حاجة مش موجودة أصلاً
    // Fabric and every dye chemical must have enough recorded stock before completion is allowed —
    // this automatically deducts inventory, so it can't deduct stock that isn't actually there.
    const requirements = [
      { inventoryItemId: consignment.fabric_item_id, quantity: Number(consignment.pre_dye_weight_kg) },
      ...chemicals.map((chemical) => ({
        inventoryItemId: chemical.chemical_item_id,
        quantity: Number(chemical.quantity),
      })),
    ];

    const shortages = await getInventoryShortages(pool, requirements);

    if (shortages.length > 0) {
      const details = shortages
        .map((shortage) => `${shortage.name} (متاح: ${shortage.available} ${shortage.unit}، مطلوب: ${shortage.required} ${shortage.unit})`)
        .join('، ');
      return res.status(400).json({ message: `لا يوجد مخزون كافٍ لإنهاء الرسالة: ${details}` });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE consignments
         SET status = 'READY_FOR_DELIVERY', post_dye_weight_kg = $2, post_dye_length_m = $3,
             completed_at = now(), updated_at = now()
         WHERE id = $1`,
        [req.params.id, postDyeWeightKg, postDyeLengthM]
      );

      await deductInventory(client, requirements, { consignmentId: req.params.id, userId: req.user.sub });

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const { rows: updated } = await pool.query(`${CONSIGNMENT_SELECT} WHERE id = $1`, [req.params.id]);

    return res.json({ message: 'الرسالة جاهزة للتسليم الآن.', data: updated[0] });
  } catch (error) {
    console.error('Complete consignment error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

export default router;
