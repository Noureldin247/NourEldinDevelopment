-- 004_add_fabric_name.sql
-- إضافة اسم/نوع القماش إلى بطاقة التوزين والصباغة (كان مكتوبًا على الورقة يدويًا)
-- Add the fabric name/type to the weighing & dyeing ticket (previously only handwritten on paper).

ALTER TABLE consignments ADD COLUMN IF NOT EXISTS fabric_name VARCHAR(150) NOT NULL DEFAULT '';
