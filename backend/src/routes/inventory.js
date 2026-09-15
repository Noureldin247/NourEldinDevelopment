import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { restockInventory } from '../services/inventory.js';

const router = Router();

const guard = [requireAuth, requireRole('admin', 'hr')];

const ITEM_TYPES = ['FABRIC', 'CHEMICAL'];

const INVENTORY_SELECT = `
  SELECT id,
         CASE WHEN item_type = 'FABRIC' THEN 'FAB-' ELSE 'CHM-' END || lpad(id::text, 6, '0') AS "code",
         item_type AS "itemType", name, unit, quantity_on_hand AS "quantityOnHand",
         reorder_threshold AS "reorderThreshold", created_at AS "createdAt"
  FROM inventory_items
`;

function isNonNegativeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

router.get('/inventory-items', ...guard, async (req, res) => {
  const { lowStock, itemType } = req.query;
  const conditions = [];
  const params = [];

  if (lowStock === 'true') {
    conditions.push('quantity_on_hand <= reorder_threshold');
  }

  if (ITEM_TYPES.includes(itemType)) {
    params.push(itemType);
    conditions.push(`item_type = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(`${INVENTORY_SELECT} ${where} ORDER BY item_type ASC, name ASC`, params);
    return res.json({ data: rows });
  } catch (error) {
    console.error('List inventory items error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.post('/inventory-items', ...guard, async (req, res) => {
  const { itemType, name, unit, quantityOnHand, reorderThreshold } = req.body ?? {};

  if (
    !ITEM_TYPES.includes(itemType) ||
    !name ||
    !isNonNegativeNumber(quantityOnHand) ||
    !isNonNegativeNumber(reorderThreshold)
  ) {
    return res.status(400).json({ message: 'نوع الصنف والاسم والكمية وحد الطلب مطلوبة وبقيم صحيحة.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO inventory_items (item_type, name, unit, quantity_on_hand, reorder_threshold)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [itemType, name.trim(), unit?.trim() || 'kg', quantityOnHand, reorderThreshold]
    );

    const { rows: created } = await pool.query(`${INVENTORY_SELECT} WHERE id = $1`, [rows[0].id]);
    return res.status(201).json({ message: 'تم إضافة الصنف بنجاح.', data: created[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'يوجد صنف بنفس الاسم والنوع بالفعل.' });
    }

    console.error('Create inventory item error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.patch('/inventory-items/:id', ...guard, async (req, res) => {
  const { name, unit, reorderThreshold } = req.body ?? {};

  if (!name || !unit || !isNonNegativeNumber(reorderThreshold)) {
    return res.status(400).json({ message: 'الاسم والوحدة وحد الطلب مطلوبة وبقيم صحيحة.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE inventory_items SET name = $2, unit = $3, reorder_threshold = $4, updated_at = now()
       WHERE id = $1 RETURNING id`,
      [req.params.id, name.trim(), unit.trim(), reorderThreshold]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'الصنف غير موجود.' });
    }

    const { rows: updated } = await pool.query(`${INVENTORY_SELECT} WHERE id = $1`, [req.params.id]);
    return res.json({ message: 'تم تحديث الصنف بنجاح.', data: updated[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'يوجد صنف بنفس الاسم والنوع بالفعل.' });
    }

    console.error('Update inventory item error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

router.post('/inventory-items/:id/restock', ...guard, async (req, res) => {
  const { quantity, note } = req.body ?? {};

  if (!isPositiveNumber(quantity)) {
    return res.status(400).json({ message: 'الكمية يجب أن تكون رقمًا موجبًا.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: existing } = await client.query('SELECT id FROM inventory_items WHERE id = $1', [req.params.id]);

    if (!existing[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'الصنف غير موجود.' });
    }

    await restockInventory(client, req.params.id, { quantity, note, userId: req.user.sub });

    await client.query('COMMIT');

    const { rows: updated } = await pool.query(`${INVENTORY_SELECT} WHERE id = $1`, [req.params.id]);
    return res.json({ message: 'تم تسجيل التوريد بنجاح.', data: updated[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Restock inventory item error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  } finally {
    client.release();
  }
});

router.get('/inventory-items/:id/transactions', ...guard, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, change_type AS "changeType", quantity, consignment_id AS "consignmentId",
              note, created_at AS "createdAt"
       FROM inventory_transactions WHERE inventory_item_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );

    return res.json({ data: rows });
  } catch (error) {
    console.error('List inventory transactions error:', error);
    return res.status(500).json({ message: 'حدث خطأ في الخادم، برجاء المحاولة لاحقًا.' });
  }
});

export default router;
