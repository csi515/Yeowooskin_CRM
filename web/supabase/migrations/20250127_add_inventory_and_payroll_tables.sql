-- 재고 트랜잭션 테이블
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'adjustment')),
  quantity INTEGER NOT NULL,
  before_count INTEGER,
  after_count INTEGER,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 재고 트랜잭션 인덱스
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_owner_id ON inventory_transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON inventory_transactions(created_at);

-- 재고 트랜잭션 RLS 정책
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own inventory transactions" ON inventory_transactions;
CREATE POLICY "Users can view their own inventory transactions"
  ON inventory_transactions FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert their own inventory transactions" ON inventory_transactions;
CREATE POLICY "Users can insert their own inventory transactions"
  ON inventory_transactions FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own inventory transactions" ON inventory_transactions;
CREATE POLICY "Users can update their own inventory transactions"
  ON inventory_transactions FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own inventory transactions" ON inventory_transactions;
CREATE POLICY "Users can delete their own inventory transactions"
  ON inventory_transactions FOR DELETE
  USING (auth.uid() = owner_id);

-- 재고 알림 테이블
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock')),
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 재고 알림 인덱스
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_owner_id ON inventory_alerts(owner_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_acknowledged ON inventory_alerts(acknowledged);

-- 재고 알림 RLS 정책
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own inventory alerts" ON inventory_alerts;
CREATE POLICY "Users can view their own inventory alerts"
  ON inventory_alerts FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert their own inventory alerts" ON inventory_alerts;
CREATE POLICY "Users can insert their own inventory alerts"
  ON inventory_alerts FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own inventory alerts" ON inventory_alerts;
CREATE POLICY "Users can update their own inventory alerts"
  ON inventory_alerts FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own inventory alerts" ON inventory_alerts;
CREATE POLICY "Users can delete their own inventory alerts"
  ON inventory_alerts FOR DELETE
  USING (auth.uid() = owner_id);

-- 급여 설정 테이블
CREATE TABLE IF NOT EXISTS payroll_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  base_salary INTEGER DEFAULT 0,
  hourly_rate INTEGER DEFAULT 0,
  national_pension_rate NUMERIC(5,2) DEFAULT 4.5,
  health_insurance_rate NUMERIC(5,2) DEFAULT 3.545,
  employment_insurance_rate NUMERIC(5,2) DEFAULT 0.9,
  income_tax_rate NUMERIC(5,2) DEFAULT 3.3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, staff_id)
);

-- 급여 설정 인덱스
CREATE INDEX IF NOT EXISTS idx_payroll_settings_owner_id ON payroll_settings(owner_id);
CREATE INDEX IF NOT EXISTS idx_payroll_settings_staff_id ON payroll_settings(staff_id);

-- 급여 설정 RLS 정책
ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payroll settings" ON payroll_settings;
CREATE POLICY "Users can view their own payroll settings"
  ON payroll_settings FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert their own payroll settings" ON payroll_settings;
CREATE POLICY "Users can insert their own payroll settings"
  ON payroll_settings FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own payroll settings" ON payroll_settings;
CREATE POLICY "Users can update their own payroll settings"
  ON payroll_settings FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own payroll settings" ON payroll_settings;
CREATE POLICY "Users can delete their own payroll settings"
  ON payroll_settings FOR DELETE
  USING (auth.uid() = owner_id);

-- 급여 기록 테이블
CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  base_salary INTEGER DEFAULT 0,
  overtime_pay INTEGER DEFAULT 0,
  incentive_pay INTEGER DEFAULT 0,
  total_gross INTEGER DEFAULT 0,
  national_pension INTEGER DEFAULT 0,
  health_insurance INTEGER DEFAULT 0,
  employment_insurance INTEGER DEFAULT 0,
  income_tax INTEGER DEFAULT 0,
  total_deductions INTEGER DEFAULT 0,
  net_salary INTEGER DEFAULT 0,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, staff_id, month)
);

-- 급여 기록 인덱스
CREATE INDEX IF NOT EXISTS idx_payroll_records_owner_id ON payroll_records(owner_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_staff_id ON payroll_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_month ON payroll_records(month);

-- 급여 기록 RLS 정책
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payroll records" ON payroll_records;
CREATE POLICY "Users can view their own payroll records"
  ON payroll_records FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert their own payroll records" ON payroll_records;
CREATE POLICY "Users can insert their own payroll records"
  ON payroll_records FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own payroll records" ON payroll_records;
CREATE POLICY "Users can update their own payroll records"
  ON payroll_records FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own payroll records" ON payroll_records;
CREATE POLICY "Users can delete their own payroll records"
  ON payroll_records FOR DELETE
  USING (auth.uid() = owner_id);

-- 업데이트 타임스탬프 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 급여 설정 업데이트 타임스탬프 트리거
DROP TRIGGER IF EXISTS update_payroll_settings_updated_at ON payroll_settings;
CREATE TRIGGER update_payroll_settings_updated_at
  BEFORE UPDATE ON payroll_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
