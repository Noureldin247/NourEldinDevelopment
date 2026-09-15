-- 008_customers_and_catalog_links.sql
-- عملاء بأرقام تعريف فريدة، وربط القماش والمواد الكيميائية بكارت المخزون (بدل النص الحر)
-- عشان نقدر نتتبع طلبات كل عميل ونعرف نوعية القماش/الكيماويات اللي بيطلبها عادةً.
-- Customers with unique IDs, and linking fabric/chemical to the inventory catalog
-- (instead of free text) so we can track each customer's orders and their usual fabric/chemicals.

CREATE TABLE IF NOT EXISTS customers (
    id          SERIAL PRIMARY KEY,
    full_name   VARCHAR(150) NOT NULL,
    phone       VARCHAR(30),
    email       VARCHAR(150),
    address     TEXT,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_full_name ON customers(full_name);

ALTER TABLE consignments ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id);
ALTER TABLE consignments ADD COLUMN IF NOT EXISTS fabric_item_id INTEGER REFERENCES inventory_items(id);
ALTER TABLE consignment_dye_chemicals ADD COLUMN IF NOT EXISTS chemical_item_id INTEGER REFERENCES inventory_items(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id);

-- ====== Backfill: عملاء من الأسماء الموجودة فعليًا في الرسائل ======
-- ====== Backfill: customers from names already used in consignments ======
INSERT INTO customers (full_name)
SELECT DISTINCT customer_name FROM consignments
WHERE customer_name IS NOT NULL AND customer_name != ''
  AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.full_name = consignments.customer_name);

UPDATE consignments SET customer_id = c.id
FROM customers c
WHERE c.full_name = consignments.customer_name AND consignments.customer_id IS NULL;

UPDATE invoices SET customer_id = c.id
FROM customers c
WHERE c.full_name = invoices.customer_name AND invoices.customer_id IS NULL;

-- ====== Backfill: أصناف القماش من الأسماء الموجودة في الرسائل ======
-- ====== Backfill: fabric items from names already used in consignments ======
INSERT INTO inventory_items (item_type, name, unit, quantity_on_hand, reorder_threshold)
SELECT 'FABRIC', name, 'kg', 0, 0 FROM (
  SELECT DISTINCT fabric_name AS name
  FROM consignments
  WHERE fabric_name IS NOT NULL AND fabric_name != ''
) distinct_fabrics
WHERE NOT EXISTS (
  SELECT 1 FROM inventory_items i WHERE i.item_type = 'FABRIC' AND i.name = distinct_fabrics.name
);

UPDATE consignments SET fabric_item_id = i.id
FROM inventory_items i
WHERE i.item_type = 'FABRIC' AND i.name = consignments.fabric_name AND consignments.fabric_item_id IS NULL;

-- ====== Backfill: المواد الكيميائية من الأسماء الموجودة في بنود الرسائل ======
-- ====== Backfill: chemical items from names already used in consignment lines ======
INSERT INTO inventory_items (item_type, name, unit, quantity_on_hand, reorder_threshold)
SELECT 'CHEMICAL', name, unit, 0, 0 FROM (
  SELECT DISTINCT ON (chemical_name) chemical_name AS name, unit
  FROM consignment_dye_chemicals
  WHERE chemical_name IS NOT NULL AND chemical_name != ''
  ORDER BY chemical_name, created_at ASC
) distinct_chemicals
WHERE NOT EXISTS (
  SELECT 1 FROM inventory_items i WHERE i.item_type = 'CHEMICAL' AND i.name = distinct_chemicals.name
);

UPDATE consignment_dye_chemicals SET chemical_item_id = i.id
FROM inventory_items i
WHERE i.item_type = 'CHEMICAL' AND i.name = consignment_dye_chemicals.chemical_name
  AND consignment_dye_chemicals.chemical_item_id IS NULL;
