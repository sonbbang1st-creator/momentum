-- 20260502_003_fix_set_updated_at_search_path.sql
-- Fixes WARN: function_search_path_mutable on public.set_updated_at
-- Sets search_path = '' and security invoker to prevent search-path injection.

create or replace function public.set_updated_at()
returns trigger language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
