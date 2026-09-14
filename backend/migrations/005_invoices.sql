-- 005_invoices.sql
-- الفواتير — فاتورة واحدة ممكن تجمع أكتر من رسالة (شحنة) لنفس العميل،
-- وكل بند في الفاتورة (مادة صباغة أو خدمة الصباغة نفسها) يتسعّر لوحده لأن الأسعار بتختلف من مرة للتانية.
-- Invoices — one invoice can bundle several consignments for the same customer,
-- and each line (a dye chemical or the dyeing service itself) is priced individually since prices vary each time.

CREATE TABLE IF NOT EXISTS invoices (
    id            SERIAL PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ISSUED', 'PAID')),
    due_date      DATE,
    issued_at     TIMESTAMPTZ,
    paid_at       TIMESTAMPTZ,
    created_by    INTEGER REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_name);

-- يربط الفاتورة بكل الرسائل المضمّنة فيها — رسالة واحدة متتفوترش مرتين
-- Links an invoice to every consignment it bundles — a consignment can't be invoiced twice.
CREATE TABLE IF NOT EXISTS invoice_consignments (
    id             SERIAL PRIMARY KEY,
    invoice_id     INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    consignment_id INTEGER NOT NULL REFERENCES consignments(id),
    UNIQUE (consignment_id)
);

-- بنود الفاتورة — سطر لكل مادة صباغة + سطر لخدمة الصباغة نفسها (بالوزن الفعلي بعد الصباغة)
-- Invoice line items — one line per dye chemical, plus one for the dyeing service itself (by actual post-dye weight).
CREATE TABLE IF NOT EXISTS invoice_lines (
    id             SERIAL PRIMARY KEY,
    invoice_id     INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    consignment_id INTEGER REFERENCES consignments(id),
    line_type      VARCHAR(20) NOT NULL CHECK (line_type IN ('CHEMICAL', 'FABRIC')),
    description    VARCHAR(200) NOT NULL,
    quantity       NUMERIC(10,2) NOT NULL,
    unit           VARCHAR(20) NOT NULL DEFAULT '',
    unit_price     NUMERIC(10,2),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines(invoice_id);
