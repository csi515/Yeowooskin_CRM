-- =====================================================
-- BeautyHub CRM Complete Database Schema
-- Consolidated from all migration files
-- =====================================================
-- 
-- This script creates the complete database structure
-- Run in Supabase SQL Editor
-- 
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- DROP EXISTING TABLES (순서 중요)
-- ============================================
DROP TABLE IF EXISTS public.inquiries CASCADE;
DROP TABLE IF EXISTS public.staff_attendance CASCADE;
DROP TABLE IF EXISTS public.customer_points_ledger CASCADE;
DROP TABLE IF EXISTS public.voucher_uses CASCADE;
DROP TABLE IF EXISTS public.vouchers CASCADE;
DROP TABLE IF EXISTS public.customer_product_ledger CASCADE;
DROP TABLE IF EXISTS public.customer_products CASCADE;
DROP TABLE IF EXISTS public.points_ledger CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.staff CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    birthdate DATE,
    branch_name TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE')),
    role TEXT NOT NULL DEFAULT 'pending' CHECK (role IN ('pending', 'user', 'admin', 'super_admin')),
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "admins_select_all" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Auto-create user record on signup
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

-- Sync user updates from auth.users
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

-- ============================================
-- 2. CUSTOMERS TABLE
-- ============================================
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    features TEXT,
    skin_type TEXT,
    allergy_info TEXT,
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_owner ON public.customers(owner_id);
CREATE INDEX idx_customers_name ON public.customers(name);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_all" ON public.customers
    FOR ALL USING (owner_id = auth.uid());

-- ============================================
-- 3. PRODUCTS TABLE
-- ============================================
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    stock_count INTEGER DEFAULT 0,
    safety_stock INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_owner ON public.products(owner_id);
CREATE INDEX idx_products_active ON public.products(active);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_all" ON public.products
    FOR ALL USING (owner_id = auth.uid());

-- ============================================
-- 4. STAFF TABLE
-- ============================================
CREATE TABLE public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    role TEXT,
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT,
    skills TEXT,
    incentive_rate NUMERIC(5, 2),
    profile_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_owner ON public.staff(owner_id);
CREATE INDEX idx_staff_active ON public.staff(active);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_all" ON public.staff
    FOR ALL USING (owner_id = auth.uid());

-- ============================================
-- 5. APPOINTMENTS TABLE
-- ============================================
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    appointment_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'scheduled',
    total_price NUMERIC(10, 2),
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

-- ============================================
-- 6. TRANSACTIONS TABLE
-- ============================================
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    type TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    category TEXT,
    payment_method TEXT,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_owner ON public.transactions(owner_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_customer ON public.transactions(customer_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_all" ON public.transactions
    FOR ALL USING (owner_id = auth.uid());

-- ============================================
-- 7. EXPENSES TABLE
-- ============================================
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    expense_date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_owner ON public.expenses(owner_id);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_all" ON public.expenses
    FOR ALL USING (owner_id = auth.uid());

-- ============================================
-- 8. SETTINGS TABLE
-- ============================================
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL UNIQUE,
    settings JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_settings_owner ON public.settings(owner_id);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_select_own" ON public.settings
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "settings_insert_own" ON public.settings
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "settings_update_own" ON public.settings
    FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "settings_delete_own" ON public.settings
    FOR DELETE USING (owner_id = auth.uid());

-- ============================================
-- 9. POINTS_LEDGER TABLE
-- ============================================
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

-- ============================================
-- 10. CUSTOMER_PRODUCTS TABLE
-- ============================================
CREATE TABLE public.customer_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
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

-- ============================================
-- 11. CUSTOMER_PRODUCT_LEDGER TABLE
-- ============================================
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

-- ============================================
-- 12. VOUCHERS TABLE
-- ============================================
CREATE TABLE public.vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    voucher_type TEXT NOT NULL,
    total_quantity INTEGER NOT NULL,
    remaining_quantity INTEGER NOT NULL,
    payment_amount NUMERIC(10, 2),
    notes TEXT,
    expiry_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vouchers_owner ON public.vouchers(owner_id);
CREATE INDEX idx_vouchers_customer ON public.vouchers(customer_id);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vouchers_all" ON public.vouchers
    FOR ALL USING (owner_id = auth.uid());

-- ============================================
-- 13. VOUCHER_USES TABLE
-- ============================================
CREATE TABLE public.voucher_uses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX idx_voucher_uses_owner ON public.voucher_uses(owner_id);
CREATE INDEX idx_voucher_uses_voucher ON public.voucher_uses(voucher_id);

ALTER TABLE public.voucher_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voucher_uses_all" ON public.voucher_uses
    FOR ALL USING (owner_id = auth.uid());

-- ============================================
-- 14. STAFF_ATTENDANCE TABLE
-- ============================================
CREATE TABLE public.staff_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('scheduled', 'actual')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT,
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attendance_owner ON public.staff_attendance(owner_id);
CREATE INDEX idx_attendance_staff ON public.staff_attendance(staff_id);
CREATE INDEX idx_attendance_start ON public.staff_attendance(start_time);

ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_attendance_all" ON public.staff_attendance
    FOR ALL USING (owner_id = auth.uid());

-- ============================================
-- 15. INQUIRIES TABLE (공개 문의)
-- ============================================
CREATE TABLE public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(name) <= 50),
    email TEXT NOT NULL CHECK (char_length(email) <= 100),
    phone TEXT CHECK (phone IS NULL OR char_length(phone) <= 20),
    subject TEXT NOT NULL CHECK (char_length(subject) <= 100),
    message TEXT NOT NULL CHECK (char_length(message) <= 2000),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inquiries_created_at ON public.inquiries(created_at DESC);
CREATE INDEX idx_inquiries_status ON public.inquiries(status);
CREATE INDEX idx_inquiries_email ON public.inquiries(email);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inquiries_insert_public" ON public.inquiries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "inquiries_select_admin" ON public.inquiries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "inquiries_update_admin" ON public.inquiries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "inquiries_delete_admin" ON public.inquiries
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- TRIGGERS: updated_at auto-update
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

CREATE TRIGGER update_staff_attendance_updated_at
    BEFORE UPDATE ON public.staff_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at
    BEFORE UPDATE ON public.inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 완료!
-- =====================================================
