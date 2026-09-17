-- Sprint 8: IS DISTINCT FROM trata dois NULL como iguais e rejeita
-- final_2 / semifinais (ambos os source_match nulos) e a final de semi_4
-- (ambos os entry nulos). Trocar por desigualdade apenas quando os dois
-- lados estao preenchidos.
begin;

do $fix$
declare
  constraint_row record;
begin
  for constraint_row in
    select con.conname
      from pg_constraint con
     where con.conrelid = 'public.bracket_matches'::regclass
       and con.contype = 'c'
       and pg_get_constraintdef(con.oid) ilike '%is distinct from%'
  loop
    execute format(
      'alter table public.bracket_matches drop constraint %I',
      constraint_row.conname
    );
  end loop;
end;
$fix$;

alter table public.bracket_matches
  add constraint bracket_matches_distinct_entries
  check (
    side_a_entry_id is null
    or side_b_entry_id is null
    or side_a_entry_id <> side_b_entry_id
  );

alter table public.bracket_matches
  add constraint bracket_matches_distinct_sources
  check (
    side_a_source_match_id is null
    or side_b_source_match_id is null
    or side_a_source_match_id <> side_b_source_match_id
  );

commit;
