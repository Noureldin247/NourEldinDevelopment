-- 002_consignments.sql
-- جدول الرسائل (التوزين والصباغة) — بطاقة واحدة لكل طلب: وزن قبل الصباغة،
-- مكونات الصباغة المستخدمة، ثم وزن بعد الصباغة.
-- Consignments (weighing & dyeing tickets) — one card per order: pre-dye weight,
-- dye chemicals used, then post-dye weight.

CREATE TABLE IF NOT EXISTS consignments (
    id                      SERIAL PRIMARY KEY,
    customer_name           VARCHAR(150) NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'RECEIVED'
                                CHECK (status IN ('RECEIVED', 'IN_PRODUCTION', 'READY_FOR_DELIVERY')),
    pre_dye_weight_kg       NUMERIC(10,2) NOT NULL,
    pre_dye_length_m        NUMERIC(10,2) NOT NULL,
    post_dye_weight_kg      NUMERIC(10,2),
    post_dye_length_m       NUMERIC(10,2),
    created_by              INTEGER REFERENCES users(id),
    received_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    production_started_at   TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consignments_status ON consignments(status);

-- قائمة مكونات الصباغة المستخدمة في كل رسالة (اسم المادة + الكمية)
-- Dye chemicals used per consignment (chemical name + quantity).
CREATE TABLE IF NOT EXISTS consignment_dye_chemicals (
    id              SERIAL PRIMARY KEY,
    consignment_id  INTEGER NOT NULL REFERENCES consignments(id) ON DELETE CASCADE,
    chemical_name   VARCHAR(150) NOT NULL,
    quantity        NUMERIC(10,2) NOT NULL,
    unit            VARCHAR(20) NOT NULL DEFAULT 'kg',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dye_chemicals_consignment ON consignment_dye_chemicals(consignment_id);
