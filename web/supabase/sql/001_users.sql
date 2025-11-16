-- users 테이블
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  phone text,
  birthdate date,
  role text not null default 'pending',
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS 활성화
alter table public.users enable row level security;

-- 본인 행 열람 허용 정책
do $$
begin
  if not exists (
    select 1 from pg_policies where polname = 'users select own' and tablename = 'users'
  ) then
    create policy "users select own" on public.users
    for select using (auth.uid() = id);
  end if;
end $$;

-- 신규 가입 사용자 자동 행 생성 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, phone, birthdate)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'name'), null),
    coalesce((new.raw_user_meta_data->>'phone'), null),
    nullif((new.raw_user_meta_data->>'birthdate'), '')::date
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


