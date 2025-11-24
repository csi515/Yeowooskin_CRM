-- ============================================
-- 완전한 데이터베이스 스키마 마이그레이션
-- 현재 시스템에 맞게 통합된 모든 테이블 및 설정
-- ============================================

-- 확장 기능 활성화
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. 프랜차이즈 구조 (HQ - Owner - Staff)
-- ============================================

-- branches 테이블 (지점 정보)
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  address text,
  phone text,
  owner_id uuid references auth.users(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- profiles 테이블 (사용자 프로필, users 테이블 대체)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  phone text,
  role text not null check (role in ('HQ', 'OWNER', 'STAFF')),
  branch_id uuid references public.branches(id) on delete cascade,
  invite_code text,
  invite_expires_at timestamptz,
  approved boolean not null default false,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- invitations 테이블 (직원 초대 시스템)
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('OWNER', 'STAFF')),
  branch_id uuid references public.branches(id) on delete cascade,
  invite_code text unique not null,
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================
-- 2. 기본 비즈니스 테이블 (이미 존재한다고 가정하지만 컬럼 추가)
-- ============================================

-- customers 테이블에 branch_id 및 건강 정보 컬럼 추가
alter table public.customers add column if not exists branch_id uuid references public.branches(id) on delete cascade;
alter table public.customers add column if not exists health_allergies text;
alter table public.customers add column if not exists health_medications text;
alter table public.customers add column if not exists health_skin_conditions text;
alter table public.customers add column if not exists health_pregnant boolean default false;
alter table public.customers add column if not exists health_breastfeeding boolean default false;
alter table public.customers add column if not exists health_notes text;
alter table public.customers add column if not exists skin_type text;
alter table public.customers add column if not exists skin_concerns text[];
alter table public.customers add column if not exists birthdate date;
alter table public.customers add column if not exists last_visit_date timestamptz;
alter table public.customers add column if not exists recommended_visit_interval_days integer;

-- products 테이블에 branch_id 추가
alter table public.products add column if not exists branch_id uuid references public.branches(id) on delete cascade;

-- staff 테이블에 branch_id 추가
alter table public.staff add column if not exists branch_id uuid references public.branches(id) on delete cascade;

-- appointments 테이블에 branch_id 및 room_id 추가
alter table public.appointments add column if not exists branch_id uuid references public.branches(id) on delete cascade;
alter table public.appointments add column if not exists room_id uuid references public.treatment_rooms(id) on delete set null;

-- transactions 테이블에 branch_id 추가
alter table public.transactions add column if not exists branch_id uuid references public.branches(id) on delete cascade;

-- expenses 테이블에 branch_id 추가
alter table public.expenses add column if not exists branch_id uuid references public.branches(id) on delete cascade;

-- ============================================
-- 3. 포인트 및 상품 보유 관리
-- ============================================

-- points_ledger 테이블 (포인트 변동 이력)
create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  delta integer not null,
  reason text,
  created_at timestamptz not null default now()
);

-- customer_products 테이블 (고객 보유 상품)
create table if not exists public.customer_products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  quantity integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- customer_product_ledger 테이블 (고객 상품 변동 이력)
create table if not exists public.customer_product_ledger (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  customer_product_id uuid not null references public.customer_products(id) on delete cascade,
  delta integer not null,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================
-- 4. 시술 관리
-- ============================================

-- treatment_rooms 테이블 (시술실)
create table if not exists public.treatment_rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  name text not null,
  code text,
  description text,
  capacity integer default 1,
  active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(branch_id, code)
);

-- treatment_records 테이블 (시술 기록)
create table if not exists public.treatment_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  staff_id uuid references public.staff(id) on delete set null,
  treatment_name text not null,
  treatment_content text,
  skin_condition_before text,
  skin_condition_after text,
  notes text,
  before_images text[],
  after_images text[],
  treatment_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- treatment_programs 테이블 (시술 프로그램)
create table if not exists public.treatment_programs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  program_name text not null,
  total_sessions integer not null default 1,
  completed_sessions integer not null default 0,
  product_id uuid references public.products(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- treatment_program_sessions 테이블 (프로그램 세션 기록)
create table if not exists public.treatment_program_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.treatment_programs(id) on delete cascade,
  treatment_record_id uuid references public.treatment_records(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  session_number integer not null,
  session_date timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================
-- 5. HQ 관리자 기능
-- ============================================

-- approval_history 테이블 (승인 히스토리)
-- 코드에서 auth.users를 참조하므로 일치시킴
create table if not exists public.approval_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approved_by uuid references auth.users(id) on delete set null,
  approved boolean not null,
  reason text,
  created_at timestamptz not null default now()
);

-- api_keys 테이블 (API 키 관리)
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_hash text unique not null,
  created_by uuid references auth.users(id) on delete set null,
  permissions jsonb default '[]'::jsonb,
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- notification_settings 테이블 (알림 설정)
-- 코드에서 user_id를 사용하므로 auth.users 참조
create table if not exists public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  notification_type text not null,
  enabled boolean not null default true,
  channel text not null default 'email',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, notification_type)
);

-- notifications 테이블 (알림 이력)
-- 코드에서 user_id를 사용하므로 auth.users 참조
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  read_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- permissions 테이블 (세분화된 권한 관리)
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('HQ', 'OWNER', 'STAFF')),
  resource text not null,
  action text not null,
  created_at timestamptz not null default now(),
  unique (role, resource, action)
);

-- system_settings 테이블 (전역 시스템 설정)
create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  description text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- backup_history 테이블 (데이터 백업 이력)
create table if not exists public.backup_history (
  id uuid primary key default gen_random_uuid(),
  backup_type text not null,
  file_path text,
  file_size bigint,
  status text not null default 'pending',
  created_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

-- ============================================
-- 6. 인덱스 생성
-- ============================================

-- branches 인덱스
create index if not exists idx_branches_code on public.branches(code);
create index if not exists idx_branches_owner_id on public.branches(owner_id);

-- profiles 인덱스
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_branch_id on public.profiles(branch_id);
create index if not exists idx_profiles_approved on public.profiles(approved);

-- invitations 인덱스
create index if not exists idx_invitations_branch_id on public.invitations(branch_id);
create index if not exists idx_invitations_invite_code on public.invitations(invite_code);
create index if not exists idx_invitations_email on public.invitations(email);

-- customers 인덱스
create index if not exists idx_customers_branch_id on public.customers(branch_id);
create index if not exists idx_customers_owner_id on public.customers(owner_id);

-- products 인덱스
create index if not exists idx_products_branch_id on public.products(branch_id);

-- staff 인덱스
create index if not exists idx_staff_branch_id on public.staff(branch_id);

-- appointments 인덱스
create index if not exists idx_appointments_branch_id on public.appointments(branch_id);
create index if not exists idx_appointments_customer_id on public.appointments(customer_id);
create index if not exists idx_appointments_date_status on public.appointments(appointment_date desc, status);
create index if not exists idx_appointments_room_id on public.appointments(room_id);

-- transactions 인덱스
create index if not exists idx_transactions_branch_id on public.transactions(branch_id);
create index if not exists idx_transactions_customer_id on public.transactions(customer_id);
create index if not exists idx_transactions_date on public.transactions(transaction_date desc);

-- expenses 인덱스
create index if not exists idx_expenses_branch_id on public.expenses(branch_id);

-- points_ledger 인덱스
create index if not exists idx_points_ledger_owner on public.points_ledger(owner_id);
create index if not exists idx_points_ledger_customer on public.points_ledger(customer_id);
create index if not exists idx_points_ledger_created on public.points_ledger(created_at desc);
create index if not exists idx_points_ledger_customer_created on public.points_ledger(customer_id, created_at desc);

-- customer_products 인덱스
create index if not exists idx_customer_products_customer on public.customer_products(customer_id, created_at desc);
create index if not exists idx_customer_products_branch on public.customer_products(branch_id) where branch_id is not null;
create index if not exists idx_customer_products_product on public.customer_products(product_id);

-- customer_product_ledger 인덱스
create index if not exists idx_customer_product_ledger_customer_product on public.customer_product_ledger(customer_product_id, created_at desc);
create index if not exists idx_customer_product_ledger_created on public.customer_product_ledger(created_at desc);
create index if not exists idx_customer_product_ledger_created_by on public.customer_product_ledger(created_by) where created_by is not null;

-- treatment_rooms 인덱스
create index if not exists idx_treatment_rooms_branch on public.treatment_rooms(branch_id);

-- treatment_records 인덱스
create index if not exists idx_treatment_records_customer on public.treatment_records(customer_id);
create index if not exists idx_treatment_records_branch on public.treatment_records(branch_id);
create index if not exists idx_treatment_records_date on public.treatment_records(treatment_date desc);
create index if not exists idx_treatment_records_customer_date on public.treatment_records(customer_id, treatment_date desc);
create index if not exists idx_treatment_records_branch_date on public.treatment_records(branch_id, treatment_date desc) where branch_id is not null;

-- treatment_programs 인덱스
create index if not exists idx_treatment_programs_customer on public.treatment_programs(customer_id);
create index if not exists idx_treatment_programs_branch on public.treatment_programs(branch_id);

-- treatment_program_sessions 인덱스
create index if not exists idx_treatment_program_sessions_program on public.treatment_program_sessions(program_id);
create index if not exists idx_treatment_program_sessions_program_date on public.treatment_program_sessions(program_id, session_date desc);

-- approval_history 인덱스
create index if not exists idx_approval_history_user_id on public.approval_history(user_id);
create index if not exists idx_approval_history_created_at on public.approval_history(created_at desc);
create index if not exists idx_approval_history_approved_by on public.approval_history(approved_by) where approved_by is not null;
create index if not exists idx_approval_history_user_created on public.approval_history(user_id, created_at desc);

-- api_keys 인덱스
create index if not exists idx_api_keys_created_by on public.api_keys(created_by);
create index if not exists idx_api_keys_is_active on public.api_keys(is_active);

-- notifications 인덱스
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(read, created_at desc);
create index if not exists idx_notifications_user_read_created_at on public.notifications(user_id, read, created_at desc);
create index if not exists idx_notifications_type_created_at on public.notifications(type, created_at desc);

-- permissions 인덱스
create index if not exists idx_permissions_role on public.permissions(role);

-- system_settings 인덱스
create index if not exists idx_system_settings_key on public.system_settings(key);

-- backup_history 인덱스
create index if not exists idx_backup_history_status on public.backup_history(status, created_at desc);
create index if not exists idx_backup_history_created_at on public.backup_history(created_at desc);

-- ============================================
-- 7. RLS (Row Level Security) 활성화
-- ============================================

alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.staff enable row level security;
alter table public.appointments enable row level security;
alter table public.transactions enable row level security;
alter table public.expenses enable row level security;
alter table public.points_ledger enable row level security;
alter table public.customer_products enable row level security;
alter table public.customer_product_ledger enable row level security;
alter table public.treatment_rooms enable row level security;
alter table public.treatment_records enable row level security;
alter table public.treatment_programs enable row level security;
alter table public.treatment_program_sessions enable row level security;
alter table public.approval_history enable row level security;
alter table public.api_keys enable row level security;
alter table public.notification_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.permissions enable row level security;
alter table public.system_settings enable row level security;
alter table public.backup_history enable row level security;

-- ============================================
-- 8. RLS 정책 생성
-- ============================================

-- profiles RLS 정책
drop policy if exists "hq_profiles_all" on public.profiles;
create policy "hq_profiles_all" on public.profiles
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

drop policy if exists "owner_profiles_branch" on public.profiles;
create policy "owner_profiles_branch" on public.profiles
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = profiles.branch_id
    )
  );

drop policy if exists "staff_profiles_own" on public.profiles;
create policy "staff_profiles_own" on public.profiles
  for all using (auth.uid() = id);

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- branches RLS 정책
drop policy if exists "hq_branches_all" on public.branches;
create policy "hq_branches_all" on public.branches
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

drop policy if exists "owner_branches_own" on public.branches;
create policy "owner_branches_own" on public.branches
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = branches.id
    )
  );

-- invitations RLS 정책
drop policy if exists "hq_invitations_all" on public.invitations;
create policy "hq_invitations_all" on public.invitations
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

drop policy if exists "owner_invitations_branch" on public.invitations;
create policy "owner_invitations_branch" on public.invitations
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = invitations.branch_id
    )
  );

-- customers RLS 정책
drop policy if exists "hq_customers_all" on public.customers;
create policy "hq_customers_all" on public.customers
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

drop policy if exists "owner_customers_branch" on public.customers;
create policy "owner_customers_branch" on public.customers
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = customers.branch_id
    )
  );

drop policy if exists "staff_customers_branch" on public.customers;
create policy "staff_customers_branch" on public.customers
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'STAFF' and p.branch_id = customers.branch_id
    )
  );

-- products RLS 정책
drop policy if exists "hq_products_all" on public.products;
create policy "hq_products_all" on public.products
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

drop policy if exists "owner_products_branch" on public.products;
create policy "owner_products_branch" on public.products
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = products.branch_id
    )
  );

drop policy if exists "staff_products_branch" on public.products;
create policy "staff_products_branch" on public.products
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'STAFF' and p.branch_id = products.branch_id
    )
  );

-- staff RLS 정책
drop policy if exists "hq_staff_all" on public.staff;
create policy "hq_staff_all" on public.staff
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

drop policy if exists "owner_staff_branch" on public.staff;
create policy "owner_staff_branch" on public.staff
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = staff.branch_id
    )
  );

-- appointments RLS 정책
drop policy if exists "hq_appointments_all" on public.appointments;
create policy "hq_appointments_all" on public.appointments
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

drop policy if exists "owner_appointments_branch" on public.appointments;
create policy "owner_appointments_branch" on public.appointments
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = appointments.branch_id
    )
  );

drop policy if exists "staff_appointments_branch" on public.appointments;
create policy "staff_appointments_branch" on public.appointments
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'STAFF' and p.branch_id = appointments.branch_id
    )
  );

-- transactions RLS 정책
drop policy if exists "hq_transactions_all" on public.transactions;
create policy "hq_transactions_all" on public.transactions
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

drop policy if exists "owner_transactions_branch" on public.transactions;
create policy "owner_transactions_branch" on public.transactions
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = transactions.branch_id
    )
  );

-- expenses RLS 정책
drop policy if exists "hq_expenses_all" on public.expenses;
create policy "hq_expenses_all" on public.expenses
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

drop policy if exists "owner_expenses_branch" on public.expenses;
create policy "owner_expenses_branch" on public.expenses
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = expenses.branch_id
    )
  );

-- points_ledger RLS 정책
drop policy if exists "points_ledger_select_policy" on public.points_ledger;
create policy "points_ledger_select_policy" on public.points_ledger
  for select using (owner_id = auth.uid());

drop policy if exists "points_ledger_insert_policy" on public.points_ledger;
create policy "points_ledger_insert_policy" on public.points_ledger
  for insert with check (owner_id = auth.uid());

-- customer_products RLS 정책
drop policy if exists "hq_customer_products_all" on public.customer_products;
create policy "hq_customer_products_all" on public.customer_products
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

drop policy if exists "owner_customer_products_branch" on public.customer_products;
create policy "owner_customer_products_branch" on public.customer_products
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = customer_products.branch_id
    )
  );

drop policy if exists "staff_customer_products_branch" on public.customer_products;
create policy "staff_customer_products_branch" on public.customer_products
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'STAFF' and p.branch_id = customer_products.branch_id
    )
  );

-- customer_product_ledger RLS 정책
drop policy if exists "hq_customer_product_ledger_all" on public.customer_product_ledger;
create policy "hq_customer_product_ledger_all" on public.customer_product_ledger
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

drop policy if exists "owner_customer_product_ledger_branch" on public.customer_product_ledger;
create policy "owner_customer_product_ledger_branch" on public.customer_product_ledger
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = (
        select branch_id from public.customer_products where id = customer_product_ledger.customer_product_id
      )
    )
  );

-- treatment_rooms RLS 정책
drop policy if exists "hq_treatment_rooms_all" on public.treatment_rooms;
create policy "hq_treatment_rooms_all" on public.treatment_rooms
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

drop policy if exists "owner_treatment_rooms_branch" on public.treatment_rooms;
create policy "owner_treatment_rooms_branch" on public.treatment_rooms
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = treatment_rooms.branch_id
    )
  );

drop policy if exists "staff_treatment_rooms_branch" on public.treatment_rooms;
create policy "staff_treatment_rooms_branch" on public.treatment_rooms
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'STAFF' and p.branch_id = treatment_rooms.branch_id
    )
  );

-- treatment_records RLS 정책
drop policy if exists "hq_treatment_records_all" on public.treatment_records;
create policy "hq_treatment_records_all" on public.treatment_records
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

drop policy if exists "owner_treatment_records_branch" on public.treatment_records;
create policy "owner_treatment_records_branch" on public.treatment_records
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = treatment_records.branch_id
    )
  );

drop policy if exists "staff_treatment_records_branch" on public.treatment_records;
create policy "staff_treatment_records_branch" on public.treatment_records
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'STAFF' and p.branch_id = treatment_records.branch_id
    )
  );

-- treatment_programs RLS 정책
drop policy if exists "hq_treatment_programs_all" on public.treatment_programs;
create policy "hq_treatment_programs_all" on public.treatment_programs
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

drop policy if exists "owner_treatment_programs_branch" on public.treatment_programs;
create policy "owner_treatment_programs_branch" on public.treatment_programs
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = treatment_programs.branch_id
    )
  );

drop policy if exists "staff_treatment_programs_branch" on public.treatment_programs;
create policy "staff_treatment_programs_branch" on public.treatment_programs
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'STAFF' and p.branch_id = treatment_programs.branch_id
    )
  );

-- treatment_program_sessions RLS 정책
drop policy if exists "hq_treatment_program_sessions_all" on public.treatment_program_sessions;
create policy "hq_treatment_program_sessions_all" on public.treatment_program_sessions
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

drop policy if exists "owner_treatment_program_sessions_branch" on public.treatment_program_sessions;
create policy "owner_treatment_program_sessions_branch" on public.treatment_program_sessions
  for all using (
    exists (
      select 1 from public.profiles p
      inner join public.treatment_programs tp on tp.id = treatment_program_sessions.program_id
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = tp.branch_id
    )
  );

drop policy if exists "staff_treatment_program_sessions_branch" on public.treatment_program_sessions;
create policy "staff_treatment_program_sessions_branch" on public.treatment_program_sessions
  for all using (
    exists (
      select 1 from public.profiles p
      inner join public.treatment_programs tp on tp.id = treatment_program_sessions.program_id
      where p.id = auth.uid() and p.role = 'STAFF' and p.branch_id = tp.branch_id
    )
  );

-- approval_history RLS 정책
drop policy if exists "HQ can view all approval history" on public.approval_history;
create policy "HQ can view all approval history" on public.approval_history
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'HQ'
    )
  );

-- api_keys RLS 정책
drop policy if exists "HQ can manage api keys" on public.api_keys;
create policy "HQ can manage api keys" on public.api_keys
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'HQ'
    )
  );

-- notification_settings RLS 정책
drop policy if exists "Users can manage own notification settings" on public.notification_settings;
create policy "Users can manage own notification settings" on public.notification_settings
  for all using (auth.uid() = user_id);

drop policy if exists "HQ can manage all notification settings" on public.notification_settings;
create policy "HQ can manage all notification settings" on public.notification_settings
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'HQ'
    )
  );

-- notifications RLS 정책
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

drop policy if exists "HQ can view all notifications" on public.notifications;
create policy "HQ can view all notifications" on public.notifications
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'HQ'
    )
  );

drop policy if exists "HQ can insert notifications" on public.notifications;
create policy "HQ can insert notifications" on public.notifications
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'HQ'
    )
  );

-- permissions RLS 정책
drop policy if exists "HQ can manage permissions" on public.permissions;
create policy "HQ can manage permissions" on public.permissions
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'HQ'
    )
  );

-- system_settings RLS 정책
drop policy if exists "HQ can manage system settings" on public.system_settings;
create policy "HQ can manage system settings" on public.system_settings
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'HQ'
    )
  );

-- backup_history RLS 정책
drop policy if exists "HQ can view backup history" on public.backup_history;
create policy "HQ can view backup history" on public.backup_history
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'HQ'
    )
  );

-- ============================================
-- 9. 트리거 함수 및 트리거
-- ============================================

-- updated_at 자동 업데이트 함수
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 신규 사용자 프로필 자동 생성 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, phone)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'name'), null),
    coalesce((new.raw_user_meta_data->>'phone'), null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- auth.users 업데이트 시 profiles 동기화 트리거
create or replace function public.handle_user_updated()
returns trigger as $$
begin
  update public.profiles
  set
    email = new.email,
    name = coalesce(new.raw_user_meta_data->>'name', name),
    phone = coalesce(new.raw_user_meta_data->>'phone', phone)
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

-- 트리거 생성
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, raw_user_meta_data on auth.users
  for each row execute procedure public.handle_user_updated();

-- updated_at 트리거
drop trigger if exists handle_branches_updated_at on public.branches;
create trigger handle_branches_updated_at
  before update on public.branches
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_customer_products_updated_at on public.customer_products;
create trigger handle_customer_products_updated_at
  before update on public.customer_products
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_treatment_records_updated_at on public.treatment_records;
create trigger handle_treatment_records_updated_at
  before update on public.treatment_records
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_treatment_programs_updated_at on public.treatment_programs;
create trigger handle_treatment_programs_updated_at
  before update on public.treatment_programs
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_treatment_rooms_updated_at on public.treatment_rooms;
create trigger handle_treatment_rooms_updated_at
  before update on public.treatment_rooms
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_api_keys_updated_at on public.api_keys;
create trigger handle_api_keys_updated_at
  before update on public.api_keys
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_notification_settings_updated_at on public.notification_settings;
create trigger handle_notification_settings_updated_at
  before update on public.notification_settings
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_permissions_updated_at on public.permissions;
create trigger handle_permissions_updated_at
  before update on public.permissions
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_system_settings_updated_at on public.system_settings;
create trigger handle_system_settings_updated_at
  before update on public.system_settings
  for each row execute procedure public.handle_updated_at();

-- ============================================
-- 10. 기본 데이터 삽입
-- ============================================

-- 기본 권한 데이터
insert into public.permissions (role, resource, action) values
  ('HQ', 'customers', 'read'),
  ('HQ', 'customers', 'write'),
  ('HQ', 'customers', 'delete'),
  ('HQ', 'customers', 'manage'),
  ('HQ', 'appointments', 'read'),
  ('HQ', 'appointments', 'write'),
  ('HQ', 'appointments', 'delete'),
  ('HQ', 'appointments', 'manage'),
  ('HQ', 'finance', 'read'),
  ('HQ', 'finance', 'write'),
  ('HQ', 'finance', 'delete'),
  ('HQ', 'finance', 'manage'),
  ('HQ', 'branches', 'read'),
  ('HQ', 'branches', 'write'),
  ('HQ', 'branches', 'delete'),
  ('HQ', 'branches', 'manage'),
  ('HQ', 'users', 'read'),
  ('HQ', 'users', 'write'),
  ('HQ', 'users', 'delete'),
  ('HQ', 'users', 'manage'),
  ('OWNER', 'customers', 'read'),
  ('OWNER', 'customers', 'write'),
  ('OWNER', 'appointments', 'read'),
  ('OWNER', 'appointments', 'write'),
  ('OWNER', 'finance', 'read'),
  ('OWNER', 'finance', 'write'),
  ('STAFF', 'customers', 'read'),
  ('STAFF', 'appointments', 'read'),
  ('STAFF', 'appointments', 'write')
on conflict (role, resource, action) do nothing;

-- 기본 시스템 설정
insert into public.system_settings (key, value) values
  ('maintenance_mode', '{"enabled": false}'::jsonb),
  ('backup_auto_enabled', '{"enabled": true, "interval_hours": 24}'::jsonb),
  ('email_notifications_enabled', '{"enabled": true}'::jsonb),
  ('approval_auto_enabled', '{"enabled": false}'::jsonb)
on conflict (key) do nothing;

-- ============================================
-- 마이그레이션 완료
-- ============================================

