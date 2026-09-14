// خدمة مشتركة للمخزون — تستخدمها routes/inventory.js عشان التوريد،
// وroutes/weighing.js عشان خصم الاستهلاك التلقائي عند اكتمال الرسالة.
// Shared inventory service — used by routes/inventory.js for restocking,
// and routes/weighing.js for automatic consumption deduction on consignment completion.

// requirements: [{ itemType, name, quantity }]
export async function getInventoryShortages(client, requirements) {
  const shortages = [];

  for (const requirement of requirements) {
    const { rows } = await client.query(
      'SELECT quantity_on_hand FROM inventory_items WHERE item_type = $1 AND name = $2',
      [requirement.itemType, requirement.name]
    );

    const available = rows[0] ? Number(rows[0].quantity_on_hand) : 0;

    if (available < requirement.quantity) {
      shortages.push({ itemType: requirement.itemType, name: requirement.name, available, required: requirement.quantity });
    }
  }

  return shortages;
}

// لازم تتنادى بعد ما getInventoryShortages ترجع مصفوفة فاضية بس — العناصر مضمون وجودها وكفايتها هنا
// Must only be called after getInventoryShortages() returned an empty array — items are guaranteed to exist and be sufficient here.
export async function deductInventory(client, requirements, { consignmentId, userId }) {
  for (const requirement of requirements) {
    const { rows } = await client.query(
      `UPDATE inventory_items SET quantity_on_hand = quantity_on_hand - $3, updated_at = now()
       WHERE item_type = $1 AND name = $2 RETURNING id`,
      [requirement.itemType, requirement.name, requirement.quantity]
    );

    await client.query(
      `INSERT INTO inventory_transactions (inventory_item_id, change_type, quantity, consignment_id, created_by)
       VALUES ($1, 'CONSUMPTION', $2, $3, $4)`,
      [rows[0].id, -requirement.quantity, consignmentId, userId]
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
