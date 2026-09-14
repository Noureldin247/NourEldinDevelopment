-- 006_hr.sql
-- الموارد البشرية: سجل الموظفين (منفصل تمامًا عن حسابات الدخول في users)،
-- الحضور اليومي، طلبات الإجازة، وفيش الراتب الشهري.
-- HR: employee directory (entirely separate from login accounts in users),
-- daily attendance, leave requests, and monthly payslips.

CREATE TABLE IF NOT EXISTS employees (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    position        VARCHAR(150) NOT NULL,
    department      VARCHAR(100),
    phone           VARCHAR(30),
    hire_date       DATE NOT NULL,
    monthly_salary  NUMERIC(10,2) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);

-- تسجيل الحضور اليومي — سجل واحد لكل موظف لكل يوم
-- Daily attendance — one record per employee per day.
CREATE TABLE IF NOT EXISTS attendance_records (
    id           SERIAL PRIMARY KEY,
    employee_id  INTEGER NOT NULL REFERENCES employees(id),
    date         DATE NOT NULL,
    status       VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (employee_id, date)
);

-- طلبات الإجازة — الموارد البشرية تسجّلها وتوافق/ترفض عليها
-- Leave requests — HR records and approves/rejects them.
CREATE TABLE IF NOT EXISTS leave_requests (
    id            SERIAL PRIMARY KEY,
    employee_id   INTEGER NOT NULL REFERENCES employees(id),
    leave_type    VARCHAR(20) NOT NULL CHECK (leave_type IN ('VACATION', 'SICK', 'OTHER')),
    start_date    DATE NOT NULL,
    end_date      DATE NOT NULL,
    reason        TEXT,
    status        VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by   INTEGER REFERENCES users(id),
    reviewed_at   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فيش راتب شهري — بيتحسب مرة واحدة وبيتسجل، مش بيتحسب كل مرة تفتحه
-- A monthly payslip — computed once and stored, not recalculated on every view.
CREATE TABLE IF NOT EXISTS payslips (
    id            SERIAL PRIMARY KEY,
    employee_id   INTEGER NOT NULL REFERENCES employees(id),
    month         DATE NOT NULL,
    base_salary   NUMERIC(10,2) NOT NULL,
    absent_days   INTEGER NOT NULL DEFAULT 0,
    deduction     NUMERIC(10,2) NOT NULL DEFAULT 0,
    net_pay       NUMERIC(10,2) NOT NULL,
    generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (employee_id, month)
);
