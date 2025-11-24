-- 피부관리샵 특화 기능 마이그레이션
-- 시술 기록, 건강 정보, 프로그램, 시술실 관리

-- 고객 건강 정보 (customers 테이블에 컬럼 추가)
alter table public.customers add column if not exists health_allergies text;
alter table public.customers add column if not exists health_medications text;
alter table public.customers add column if not exists health_skin_conditions text;
alter table public.customers add column if not exists health_pregnant boolean default false;
alter table public.customers add column if not exists health_breastfeeding boolean default false;
alter table public.customers add column if not exists health_notes text;
alter table public.customers add column if not exists skin_type text; -- 민감성, 건조, 지성, 복합성
alter table public.customers add column if not exists skin_concerns text[]; -- 여드름, 기미, 주름, 모공, 색소침착 등
alter table public.customers add column if not exists birthdate date;
alter table public.customers add column if not exists last_visit_date timestamptz;
alter table public.customers add column if not exists recommended_visit_interval_days integer; -- 권장 재방문 주기 (일)

-- 시술 기록 테이블
create table if not exists public.treatment_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  staff_id uuid references public.staff(id) on delete set null,
  treatment_name text not null,
  treatment_content text,
  skin_condition_before text, -- 시술 전 피부 상태
  skin_condition_after text, -- 시술 후 피부 상태
  notes text,
  before_images text[], -- 시술 전 사진 URL 배열
  after_images text[], -- 시술 후 사진 URL 배열
  treatment_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 시술 프로그램 테이블
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

-- 시술 프로그램 세션 기록
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

-- 시술실 테이블
create table if not exists public.treatment_rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  name text not null,
  code text,
  description text,
  capacity integer default 1, -- 동시 수용 인원
  active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(branch_id, code)
);

-- appointments 테이블에 room_id 추가
alter table public.appointments add column if not exists room_id uuid references public.treatment_rooms(id) on delete set null;

-- 인덱스 생성
create index if not exists idx_treatment_records_customer on public.treatment_records(customer_id);
create index if not exists idx_treatment_records_branch on public.treatment_records(branch_id);
create index if not exists idx_treatment_records_date on public.treatment_records(treatment_date desc);
create index if not exists idx_treatment_programs_customer on public.treatment_programs(customer_id);
create index if not exists idx_treatment_programs_branch on public.treatment_programs(branch_id);
create index if not exists idx_treatment_program_sessions_program on public.treatment_program_sessions(program_id);
create index if not exists idx_treatment_rooms_branch on public.treatment_rooms(branch_id);
create index if not exists idx_appointments_room on public.appointments(room_id);

-- RLS 활성화
alter table public.treatment_records enable row level security;
alter table public.treatment_programs enable row level security;
alter table public.treatment_program_sessions enable row level security;
alter table public.treatment_rooms enable row level security;

-- treatment_records RLS 정책
create policy "hq_treatment_records_all" on public.treatment_records
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

create policy "owner_treatment_records_branch" on public.treatment_records
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = treatment_records.branch_id
    )
  );

create policy "staff_treatment_records_branch" on public.treatment_records
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'STAFF' and p.branch_id = treatment_records.branch_id
    )
  );

-- treatment_programs RLS 정책
create policy "hq_treatment_programs_all" on public.treatment_programs
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

create policy "owner_treatment_programs_branch" on public.treatment_programs
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = treatment_programs.branch_id
    )
  );

create policy "staff_treatment_programs_branch" on public.treatment_programs
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'STAFF' and p.branch_id = treatment_programs.branch_id
    )
  );

-- treatment_program_sessions RLS 정책
create policy "hq_treatment_program_sessions_all" on public.treatment_program_sessions
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

create policy "owner_treatment_program_sessions_branch" on public.treatment_program_sessions
  for all using (
    exists (
      select 1 from public.profiles p
      inner join public.treatment_programs tp on tp.id = treatment_program_sessions.program_id
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = tp.branch_id
    )
  );

create policy "staff_treatment_program_sessions_branch" on public.treatment_program_sessions
  for all using (
    exists (
      select 1 from public.profiles p
      inner join public.treatment_programs tp on tp.id = treatment_program_sessions.program_id
      where p.id = auth.uid() and p.role = 'STAFF' and p.branch_id = tp.branch_id
    )
  );

-- treatment_rooms RLS 정책
create policy "hq_treatment_rooms_all" on public.treatment_rooms
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'HQ'
    )
  );

create policy "owner_treatment_rooms_branch" on public.treatment_rooms
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'OWNER' and p.branch_id = treatment_rooms.branch_id
    )
  );

create policy "staff_treatment_rooms_branch" on public.treatment_rooms
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'STAFF' and p.branch_id = treatment_rooms.branch_id
    )
  );

-- updated_at 자동 업데이트 트리거
create trigger handle_treatment_records_updated_at
  before update on public.treatment_records
  for each row execute procedure public.handle_updated_at();

create trigger handle_treatment_programs_updated_at
  before update on public.treatment_programs
  for each row execute procedure public.handle_updated_at();

create trigger handle_treatment_rooms_updated_at
  before update on public.treatment_rooms
  for each row execute procedure public.handle_updated_at();

