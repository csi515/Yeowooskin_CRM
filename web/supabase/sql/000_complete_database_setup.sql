-- =====================================================
-- SUPABASE 데이터베이스 완전 재구축 SQL
-- 무한 재귀 RLS 정책 수정 버전
-- =====================================================
-- 
-- 경고: 이 스크립트는 기존 데이터를 모두 삭제합니다!
-- 
-- 사용 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 이 파일 내용 전체를 복사
-- 3. "New query" 클릭 후 붙여넣기
-- 4. "Run" 클릭
-- =====================================================

-- 1. 기존 테이블 삭제 (순서 중요 - 외래 키 제약 때문)
DROP TABLE IF EXISTS public.voucher_uses CASCADE;
DROP TABLE IF EXISTS public.vouchers CASCADE;
DROP TABLE IF EXISTS public.customer_product_ledger CASCADE;
DROP TABLE IF EXISTS public.customer_products CASCADE;
DROP TABLE IF EXISTS public.points_ledger CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.staff CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. 필요한 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 사용자 테이블 (Users)
-- =====================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  birthdate DATE,
  role TEXT NOT NULL DEFAULT 'pending',
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 정보만 조회 가능
CREATE POLICY "users_select_own" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- 신규 사용자 자동 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, birthdate)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'name'), NULL),
    COALESCE((NEW.raw_user_meta_data->>'phone'), NULL),
    NULLIF((NEW.raw_user_meta_data->>'birthdate'), '')::DATE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 사용자 정보 동기화 트리거
CREATE OR REPLACE FUNCTION public.handle_user_updated()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    name = COALESCE(NEW.raw_user_meta_data->>'name', name),
    phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone),
    birthdate = NULLIF(NEW.raw_user_meta_data->>'birthdate','')::DATE
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_updated();

-- =====================================================
-- 고객 테이블 (Customers)
-- =====================================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  features TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_owner ON public.customers(owner_id);
CREATE INDEX idx_customers_name ON public.customers(name);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_all" ON public.customers
FOR ALL USING (owner_id = auth.uid());

-- =====================================================
-- 상품 테이블 (Products)
-- =====================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_owner ON public.products(owner_id);
CREATE INDEX idx_products_active ON public.products(active);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_all" ON public.products
FOR ALL USING (owner_id = auth.uid());

-- =====================================================
-- 직원 테이블 (Staff)
-- =====================================================
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  phone TEXT,
  email TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_owner ON public.staff(owner_id);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_all" ON public.staff
FOR ALL USING (owner_id = auth.uid());

-- =====================================================
-- 예약 테이블 (Appointments)
-- =====================================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_owner ON public.appointments(owner_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_customer ON public.appointments(customer_id);
CREATE INDEX idx_appointments_staff ON public.appointments(staff_id);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_all" ON public.appointments
FOR ALL USING (owner_id = auth.uid());

-- =====================================================
-- 거래 테이블 (Transactions)
-- =====================================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  transaction_date DATE NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_owner ON public.transactions(owner_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_customer ON public.transactions(customer_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_all" ON public.transactions
FOR ALL USING (owner_id = auth.uid());

-- =====================================================
-- 지출 테이블 (Expenses)
-- =====================================================
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  category TEXT,
  expense_date DATE NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_owner ON public.expenses(owner_id);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_all" ON public.expenses
FOR ALL USING (owner_id = auth.uid());

-- =====================================================
-- 설정 테이블 (Settings)
-- =====================================================
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settings_owner ON public.settings(owner_id);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_all" ON public.settings
FOR ALL USING (owner_id = auth.uid());

-- =====================================================
-- 포인트 원장 테이블 (Points Ledger)
-- =====================================================
CREATE TABLE public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_points_ledger_owner ON public.points_ledger(owner_id);
CREATE INDEX idx_points_ledger_customer ON public.points_ledger(customer_id);
CREATE INDEX idx_points_ledger_created ON public.points_ledger(created_at DESC);

ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "points_ledger_select" ON public.points_ledger
FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "points_ledger_insert" ON public.points_ledger
FOR INSERT WITH CHECK (owner_id = auth.uid());

-- =====================================================
-- 고객 상품 테이블 (Customer Products)
-- =====================================================
CREATE TABLE public.customer_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

CREATE INDEX idx_customer_products_owner ON public.customer_products(owner_id);
CREATE INDEX idx_customer_products_customer ON public.customer_products(customer_id);
CREATE INDEX idx_customer_products_product ON public.customer_products(product_id);

ALTER TABLE public.customer_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_products_all" ON public.customer_products
FOR ALL USING (owner_id = auth.uid());

-- =====================================================
-- 고객 상품 원장 테이블 (Customer Product Ledger)
-- =====================================================
CREATE TABLE public.customer_product_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_product_ledger_owner ON public.customer_product_ledger(owner_id);
CREATE INDEX idx_customer_product_ledger_customer ON public.customer_product_ledger(customer_id);
CREATE INDEX idx_customer_product_ledger_product ON public.customer_product_ledger(product_id);

ALTER TABLE public.customer_product_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_product_ledger_select" ON public.customer_product_ledger
FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "customer_product_ledger_insert" ON public.customer_product_ledger
FOR INSERT WITH CHECK (owner_id = auth.uid());

-- =====================================================
-- 바우처 테이블 (Vouchers)
-- =====================================================
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  remaining_amount NUMERIC(10,2) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vouchers_owner ON public.vouchers(owner_id);
CREATE INDEX idx_vouchers_customer ON public.vouchers(customer_id);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vouchers_all" ON public.vouchers
FOR ALL USING (owner_id = auth.uid());

-- =====================================================
-- 바우처 사용 내역 테이블 (Voucher Uses)
-- =====================================================
CREATE TABLE public.voucher_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX idx_voucher_uses_owner ON public.voucher_uses(owner_id);
CREATE INDEX idx_voucher_uses_voucher ON public.voucher_uses(voucher_id);

ALTER TABLE public.voucher_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voucher_uses_all" ON public.voucher_uses
FOR ALL USING (owner_id = auth.uid());

-- =====================================================
-- updated_at 자동 업데이트 함수 및 트리거
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_products_updated_at
  BEFORE UPDATE ON public.customer_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vouchers_updated_at
  BEFORE UPDATE ON public.vouchers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 완료!
-- =====================================================
-- 
-- 데이터베이스 재구축이 완료되었습니다.
-- 
-- 주요 변경사항:
-- 1. 모든 RLS 정책이 단순화됨 (owner_id = auth.uid())
-- 2. users 테이블은 auth.uid() = id 직접 사용
-- 3. 무한 재귀 방지 - 테이블이 자기 자신을 조회하지 않음
-- 4. 모든 테이블에 적절한 인덱스 생성
-- 5. Foreign Key 제약 조건 추가
-- 
-- =====================================================
