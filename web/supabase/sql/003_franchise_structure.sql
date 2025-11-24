-- 프랜차이즈 구조 마이그레이션
-- HQ - Owner - Staff 계층 구조 지원

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

-- profiles 테이블 (사용자 프로필, 기존 users 테이블 대체)
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
  approved_by uuid references auth.users(id),
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

-- 기존 테이블에 branch_id 컬럼 추가
alter table public.customers add column if not exists branch_id uuid references public.branches(id) on delete cascade;
alter table public.products add column if not exists branch_id uuid references public.branches(id) on delete cascade;
alter table public.staff add column if not exists branch_id uuid references public.branches(id) on delete cascade;
alter table public.appointments add column if not exists branch_id uuid references public.branches(id) on delete cascade;
alter table public.transactions add column if not exists branch_id uuid references public.branches(id) on delete cascade;
alter table public.expenses add column if not exists branch_id uuid references public.branches(id) on delete cascade;

-- 인덱스 생성
create index if not exists idx_customers_branch_id on public.customers(branch_id);
create index if not exists idx_products_branch_id on public.products(branch_id);
create index if not exists idx_staff_branch_id on public.staff(branch_id);
create index if not exists idx_appointments_branch_id on public.appointments(branch_id);
create index if not exists idx_transactions_branch_id on public.transactions(branch_id);
create index if not exists idx_expenses_branch_id on public.expenses(branch_id);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_branch_id on public.profiles(branch_id);
create index if not exists idx_invitations_branch_id on public.invitations(branch_id);
create index if not exists idx_invitations_invite_code on public.invitations(invite_code);

-- RLS 활성화
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.staff enable row level security;
alter table public.appointments enable row level security;
alter table public.transactions enable row level security;
alter table public.expenses enable row level security;

-- profiles RLS 정책
-- HQ: 모든 프로필 열람/수정 가능
create policy "hq_profiles_all" on public.profiles
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

-- Owner: 자신의 지점 프로필만 열람/수정 가능
create policy "owner_profiles_branch" on public.profiles
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = profiles.branch_id
    )
  );

-- Staff: 자신의 프로필만 열람/수정 가능
create policy "staff_profiles_own" on public.profiles
  for all using (auth.uid() = id);

-- 본인 프로필은 항상 열람 가능
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- branches RLS 정책
-- HQ: 모든 지점 열람/수정 가능
create policy "hq_branches_all" on public.branches
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

-- Owner: 자신의 지점만 열람/수정 가능
create policy "owner_branches_own" on public.branches
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = branches.id
    )
  );

-- invitations RLS 정책
-- HQ: 모든 초대 열람/수정 가능
create policy "hq_invitations_all" on public.invitations
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

-- Owner: 자신의 지점 초대만 열람/수정 가능
create policy "owner_invitations_branch" on public.invitations
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = invitations.branch_id
    )
  );

-- customers RLS 정책
-- HQ: 모든 고객 데이터 열람/수정 가능
create policy "hq_customers_all" on public.customers
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

-- Owner: 자신의 지점 고객만 열람/수정 가능
create policy "owner_customers_branch" on public.customers
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = customers.branch_id
    )
  );

-- Staff: 자신의 지점 고객만 열람/수정 가능
create policy "staff_customers_branch" on public.customers
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'STAFF' and p.branch_id = customers.branch_id
    )
  );

-- products RLS 정책
-- HQ: 모든 상품 데이터 열람/수정 가능
create policy "hq_products_all" on public.products
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

-- Owner: 자신의 지점 상품만 열람/수정 가능
create policy "owner_products_branch" on public.products
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = products.branch_id
    )
  );

-- Staff: 자신의 지점 상품만 열람/수정 가능
create policy "staff_products_branch" on public.products
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'STAFF' and p.branch_id = products.branch_id
    )
  );

-- staff RLS 정책
-- HQ: 모든 직원 데이터 열람/수정 가능
create policy "hq_staff_all" on public.staff
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

-- Owner: 자신의 지점 직원만 열람/수정 가능
create policy "owner_staff_branch" on public.staff
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = staff.branch_id
    )
  );

-- appointments RLS 정책
-- HQ: 모든 예약 데이터 열람/수정 가능
create policy "hq_appointments_all" on public.appointments
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

-- Owner: 자신의 지점 예약만 열람/수정 가능
create policy "owner_appointments_branch" on public.appointments
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = appointments.branch_id
    )
  );

-- Staff: 자신의 지점 예약만 열람/수정 가능
create policy "staff_appointments_branch" on public.appointments
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'STAFF' and p.branch_id = appointments.branch_id
    )
  );

-- transactions RLS 정책
-- HQ: 모든 거래 데이터 열람/수정 가능
create policy "hq_transactions_all" on public.transactions
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

-- Owner: 자신의 지점 거래만 열람/수정 가능
create policy "owner_transactions_branch" on public.transactions
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = transactions.branch_id
    )
  );

-- expenses RLS 정책
-- HQ: 모든 지출 데이터 열람/수정 가능
create policy "hq_expenses_all" on public.expenses
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

-- Owner: 자신의 지점 지출만 열람/수정 가능
create policy "owner_expenses_branch" on public.expenses
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = expenses.branch_id
    )
  );

-- 신규 사용자 프로필 자동 생성 트리거 (profiles 테이블로 변경)
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

-- 기존 트리거 재설정
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, raw_user_meta_data on auth.users
  for each row execute procedure public.handle_user_updated();

-- branches updated_at 자동 업데이트 트리거
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_branches_updated_at
  before update on public.branches
  for each row execute procedure public.handle_updated_at();

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- 기존 users 테이블 데이터 마이그레이션 (필요시)
-- insert into public.profiles (id, email, name, phone, role, approved)
-- select id, email, name, phone, 'OWNER', approved from public.users
-- on conflict (id) do nothing;

-- drop table if exists public.users; -- 마이그레이션 완료 후 제거
