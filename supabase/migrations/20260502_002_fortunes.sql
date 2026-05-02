-- 20260502_002_fortunes.sql

create table public.fortunes (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(user_id) on delete cascade,
  fortune_date         date not null,
  mbti_at_generation   text not null
                       check (mbti_at_generation in (
                         'INTJ','INTP','ENTJ','ENTP',
                         'INFJ','INFP','ENFJ','ENFP',
                         'ISTJ','ISFJ','ESTJ','ESFJ',
                         'ISTP','ISFP','ESTP','ESFP'
                       )),
  payload              jsonb not null,
  model                text not null,
  created_at           timestamptz not null default now(),
  unique (user_id, fortune_date)
);

create index fortunes_user_date_idx
  on public.fortunes (user_id, fortune_date desc);

alter table public.fortunes enable row level security;

create policy fortunes_select_self on public.fortunes
  for select using (auth.uid() = user_id);

create policy fortunes_insert_self on public.fortunes
  for insert with check (auth.uid() = user_id);
-- intentional: no update / delete policies → fortunes are immutable
