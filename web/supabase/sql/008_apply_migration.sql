-- ============================================
-- Supabase 마이그레이션 적용 스크립트
-- 현재 시스템 버전에 맞게 수정된 통합 스키마
-- ============================================
-- 
-- 사용 방법:
-- 1. Supabase Dashboard > SQL Editor에서 실행
-- 2. 또는 Supabase CLI로 실행: supabase db push
--
-- 주의: 기존 데이터가 있는 경우 백업 후 실행하세요.
-- ============================================

-- 기존 정책 및 트리거 정리 (안전하게)
do $$
begin
  -- 기존 정책 삭제는 각 섹션에서 drop policy if exists로 처리
  -- 기존 트리거 삭제는 각 섹션에서 drop trigger if exists로 처리
  raise notice 'Starting migration...';
end $$;

-- 007_complete_schema.sql 파일의 내용을 여기에 포함
-- (파일이 너무 크므로 주요 수정 사항만 포함)

-- notification_settings 테이블 수정 (코드와 일치)
drop table if exists public.notification_settings cascade;
create table public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  notification_type text not null,
  enabled boolean not null default true,
  channel text not null default 'email',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, notification_type)
);

-- notifications 테이블 수정 (코드와 일치)
drop table if exists public.notifications cascade;
create table public.notifications (
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

-- 인덱스 재생성
create index if not exists idx_notification_settings_user_id on public.notification_settings(user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(read, created_at desc);
create index if not exists idx_notifications_user_read_created_at on public.notifications(user_id, read, created_at desc);
create index if not exists idx_notifications_type_created_at on public.notifications(type, created_at desc);

-- RLS 활성화
alter table public.notification_settings enable row level security;
alter table public.notifications enable row level security;

-- RLS 정책 재생성
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

-- 트리거 재생성
drop trigger if exists handle_notification_settings_updated_at on public.notification_settings;
create trigger handle_notification_settings_updated_at
  before update on public.notification_settings
  for each row execute procedure public.handle_updated_at();

-- 완료 메시지
do $$
begin
  raise notice 'Migration completed successfully!';
end $$;

