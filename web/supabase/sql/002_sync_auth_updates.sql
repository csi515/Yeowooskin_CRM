-- auth.users의 email, raw_user_meta_data 변경 시 public.users에 자동 동기화
create or replace function public.handle_user_updated()
returns trigger as $$
begin
  update public.users
  set
    email = new.email,
    name = coalesce(new.raw_user_meta_data->>'name', name),
    phone = coalesce(new.raw_user_meta_data->>'phone', phone),
    birthdate = nullif(new.raw_user_meta_data->>'birthdate','')::date
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, raw_user_meta_data on auth.users
  for each row execute procedure public.handle_user_updated();


