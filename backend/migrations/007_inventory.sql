-- 007_inventory.sql
-- المخزون — كمية القماش والمواد الكيميائية المتاحة، عشان نعرف إمتى نطلب توريد جديد.
-- Inventory — available fabric and chemical quantities, so we know when to order more.

CREATE TABLE IF NOT EXISTS inventory_items (
    id                 SERIAL PRIMARY KEY,
    item_type          VARCHAR(20) NOT NULL CHECK (item_type IN ('FABRIC', 'CHEMICAL')),
    name               VARCHAR(150) NOT NULL,
    unit               VARCHAR(20) NOT NULL DEFAULT 'kg',
    quantity_on_hand   NUMERIC(10,2) NOT NULL DEFAULT 0,
    reorder_threshold  NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (item_type, name)
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_type ON inventory_items(item_type);

-- سجل كل حركة مخزون — إضافة (توريد جديد) أو خصم (استهلاك تلقائي من رسالة توزين)
-- Ledger of every stock movement — addition (new stock received) or deduction (auto-consumed by a consignment).
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id                 SERIAL PRIMARY KEY,
    inventory_item_id  INTEGER NOT NULL REFERENCES inventory_items(id),
    change_type        VARCHAR(20) NOT NULL CHECK (change_type IN ('RESTOCK', 'CONSUMPTION', 'ADJUSTMENT')),
    quantity           NUMERIC(10,2) NOT NULL,
    consignment_id     INTEGER REFERENCES consignments(id),
    note               TEXT,
    created_by         INTEGER REFERENCES users(id),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(inventory_item_id);
