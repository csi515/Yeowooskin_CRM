-- HQ 관리자 기능을 위한 테이블 생성
-- 승인 히스토리, 감사 로그, API 키, 알림, 권한 관리 등

-- 승인 히스토리 테이블
create table if not exists public.approval_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  approved_by uuid references auth.users(id) on delete set null,
  approved boolean not null,
  reason text,
  created_at timestamptz not null default now()
);

-- 감사 로그 테이블 (사용 안 함 - 데이터가 너무 많이 쌓임)
-- create table if not exists public.audit_logs (
--   id uuid primary key default gen_random_uuid(),
--   user_id uuid references auth.users(id) on delete set null,
--   action text not null,
--   resource_type text not null,
--   resource_id uuid,
--   details jsonb,
--   ip_address text,
--   user_agent text,
--   created_at timestamptz not null default now()
-- );

-- API 키 테이블
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_hash text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  permissions jsonb default '[]'::jsonb,
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 알림 설정 테이블
create table if not exists public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  notification_type text not null, -- 'approval_pending', 'branch_event', 'system_error', etc.
  enabled boolean not null default true,
  channel text not null default 'email', -- 'email', 'in_app', 'sms'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, notification_type)
);

-- 알림 이력 테이블
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

-- 권한 관리 테이블
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('HQ', 'OWNER', 'STAFF')),
  resource text not null, -- 'customers', 'appointments', 'finance', etc.
  action text not null, -- 'read', 'write', 'delete', 'manage'
  granted boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(role, resource, action)
);

-- 시스템 설정 테이블 (확장)
create table if not exists public.system_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  description text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 백업 이력 테이블
create table if not exists public.backup_history (
  id uuid primary key default gen_random_uuid(),
  backup_type text not null, -- 'full', 'incremental', 'manual'
  file_path text,
  file_size bigint,
  status text not null default 'pending', -- 'pending', 'completed', 'failed'
  created_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

-- 인덱스 생성
create index if not exists idx_approval_history_user_id on public.approval_history(user_id);
create index if not exists idx_approval_history_created_at on public.approval_history(created_at desc);
-- audit_logs 인덱스 (사용 안 함)
-- create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
-- create index if not exists idx_audit_logs_action on public.audit_logs(action);
-- create index if not exists idx_audit_logs_resource on public.audit_logs(resource_type, resource_id);
-- create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_api_keys_created_by on public.api_keys(created_by);
create index if not exists idx_api_keys_is_active on public.api_keys(is_active);
create index if not exists idx_notification_settings_user_id on public.notification_settings(user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(read, created_at desc);
create index if not exists idx_permissions_role on public.permissions(role);
create index if not exists idx_backup_history_status on public.backup_history(status, created_at desc);

-- RLS 활성화
alter table public.approval_history enable row level security;
-- alter table public.audit_logs enable row level security; (사용 안 함)
alter table public.api_keys enable row level security;
alter table public.notification_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.permissions enable row level security;
alter table public.system_settings enable row level security;
alter table public.backup_history enable row level security;

-- RLS 정책: HQ만 모든 데이터 접근 가능
-- approval_history
create policy "HQ can view all approval history" on public.approval_history
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'HQ'
    )
  );

-- audit_logs RLS 정책 (사용 안 함)
-- create policy "HQ can view all audit logs" on public.audit_logs
--   for select using (
--     exists (
--       select 1 from public.profiles
--       where id = auth.uid() and role = 'HQ'
--     )
--   );
-- 
-- create policy "HQ can insert audit logs" on public.audit_logs
--   for insert with check (
--     exists (
--       select 1 from public.profiles
--       where id = auth.uid() and role = 'HQ'
--     )
--   );

-- api_keys
create policy "HQ can manage api keys" on public.api_keys
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'HQ'
    )
  );

-- notification_settings
create policy "Users can manage own notification settings" on public.notification_settings
  for all using (auth.uid() = user_id);

-- notifications
create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- permissions
create policy "HQ can manage permissions" on public.permissions
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'HQ'
    )
  );

-- system_settings
create policy "HQ can manage system settings" on public.system_settings
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'HQ'
    )
  );

-- backup_history
create policy "HQ can view backup history" on public.backup_history
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'HQ'
    )
  );

-- 기본 권한 데이터 삽입
insert into public.permissions (role, resource, action, granted) values
  ('HQ', 'customers', 'read', true),
  ('HQ', 'customers', 'write', true),
  ('HQ', 'customers', 'delete', true),
  ('HQ', 'customers', 'manage', true),
  ('HQ', 'appointments', 'read', true),
  ('HQ', 'appointments', 'write', true),
  ('HQ', 'appointments', 'delete', true),
  ('HQ', 'appointments', 'manage', true),
  ('HQ', 'finance', 'read', true),
  ('HQ', 'finance', 'write', true),
  ('HQ', 'finance', 'delete', true),
  ('HQ', 'finance', 'manage', true),
  ('HQ', 'branches', 'read', true),
  ('HQ', 'branches', 'write', true),
  ('HQ', 'branches', 'delete', true),
  ('HQ', 'branches', 'manage', true),
  ('HQ', 'users', 'read', true),
  ('HQ', 'users', 'write', true),
  ('HQ', 'users', 'delete', true),
  ('HQ', 'users', 'manage', true),
  ('OWNER', 'customers', 'read', true),
  ('OWNER', 'customers', 'write', true),
  ('OWNER', 'appointments', 'read', true),
  ('OWNER', 'appointments', 'write', true),
  ('OWNER', 'finance', 'read', true),
  ('OWNER', 'finance', 'write', true),
  ('STAFF', 'customers', 'read', true),
  ('STAFF', 'appointments', 'read', true),
  ('STAFF', 'appointments', 'write', true)
on conflict (role, resource, action) do nothing;

-- 기본 시스템 설정 삽입
insert into public.system_settings (key, value, description) values
  ('maintenance_mode', '{"enabled": false}', '시스템 유지보수 모드'),
  ('backup_auto_enabled', '{"enabled": true, "interval_hours": 24}', '자동 백업 설정'),
  ('email_notifications_enabled', '{"enabled": true}', '이메일 알림 활성화'),
  ('approval_auto_enabled', '{"enabled": false}', '자동 승인 설정')
on conflict (key) do nothing;

