alter table public.scans replica identity full;
alter table public.scan_sources replica identity full;
alter table public.candidates replica identity full;
alter table public.findings replica identity full;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['scans', 'scan_sources', 'candidates', 'findings'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;
