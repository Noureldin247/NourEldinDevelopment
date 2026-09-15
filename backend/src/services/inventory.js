// خدمة مشتركة للمخزون — تستخدمها routes/inventory.js عشان التوريد،
// وroutes/weighing.js عشان خصم الاستهلاك التلقائي عند اكتمال الرسالة.
// Shared inventory service — used by routes/inventory.js for restocking,
// and routes/weighing.js for automatic consumption deduction on consignment completion.
//
// المطابقة بقت بالـ id مباشرة (fabric_item_id / chemical_item_id) مش بمطابقة الاسم كنص —
// أدق (مفيش مشاكل أخطاء إملائية) وأبسط دلوقتي إن القماش والمواد الكيميائية بقى ليهم رقم تعريف من كتالوج المخزون.
// Matching is now by id directly (fabric_item_id / chemical_item_id), not string name matching —
// more precise (no typo mismatches) and simpler now that fabric/chemicals have real catalog ids.

// requirements: [{ inventoryItemId, quantity }]
export async function getInventoryShortages(client, requirements) {
  const shortages = [];

  for (const requirement of requirements) {
    const { rows } = await client.query('SELECT name, unit, quantity_on_hand FROM inventory_items WHERE id = $1', [
      requirement.inventoryItemId,
    ]);

    const item = rows[0];
    const available = item ? Number(item.quantity_on_hand) : 0;

    if (available < requirement.quantity) {
      shortages.push({
        inventoryItemId: requirement.inventoryItemId,
        name: item?.name ?? '—',
        unit: item?.unit ?? '',
        available,
        required: requirement.quantity,
      });
    }
  }

  return shortages;
}

// لازم تتنادى بعد ما getInventoryShortages ترجع مصفوفة فاضية بس — العناصر مضمون وجودها وكفايتها هنا
// Must only be called after getInventoryShortages() returned an empty array — items are guaranteed to exist and be sufficient here.
export async function deductInventory(client, requirements, { consignmentId, userId }) {
  for (const requirement of requirements) {
    await client.query(
      `UPDATE inventory_items SET quantity_on_hand = quantity_on_hand - $2, updated_at = now() WHERE id = $1`,
      [requirement.inventoryItemId, requirement.quantity]
    );

    await client.query(
      `INSERT INTO inventory_transactions (inventory_item_id, change_type, quantity, consignment_id, created_by)
       VALUES ($1, 'CONSUMPTION', $2, $3, $4)`,
      [requirement.inventoryItemId, -requirement.quantity, consignmentId, userId]
    );
  }
}

export async function restockInventory(client, itemId, { quantity, note, userId }) {
  await client.query(
    'UPDATE inventory_items SET quantity_on_hand = quantity_on_hand + $2, updated_at = now() WHERE id = $1',
    [itemId, quantity]
  );

  await client.query(
    `INSERT INTO inventory_transactions (inventory_item_id, change_type, quantity, note, created_by)
     VALUES ($1, 'RESTOCK', $2, $3, $4)`,
    [itemId, quantity, note ?? null, userId]
  );
}
