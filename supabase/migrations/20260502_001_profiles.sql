-- 20260502_001_profiles.sql

create table public.profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  mbti           text not null
                 check (mbti in (
                   'INTJ','INTP','ENTJ','ENTP',
                   'INFJ','INFP','ENFJ','ENFP',
                   'ISTJ','ISFJ','ESTJ','ESFJ',
                   'ISTP','ISFP','ESTP','ESFP'
                 )),
  display_name   text,
  avatar_url     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy profiles_select_self on public.profiles
  for select using (auth.uid() = user_id);

create policy profiles_insert_self on public.profiles
  for insert with check (auth.uid() = user_id);

create policy profiles_update_self on public.profiles
  for update using (auth.uid() = user_id);
