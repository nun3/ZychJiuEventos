-- Sprint 13 lote 1: projecao publica da checagem.
-- Identidade = nome completo de competicao do snapshot. Sem SELECT anonimo nas tabelas administrativas.
begin;

create or replace function public.get_public_event_checking(target_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  result jsonb;
begin
  if target_event_id is null or not exists (
    select 1
      from public.events event_row
     where event_row.id = target_event_id
       and event_row.status in ('checagem', 'chaves', 'em_andamento', 'concluido')
  ) then
    return jsonb_build_object('kind', 'public_checking', 'athletes', '[]'::jsonb);
  end if;

  select jsonb_build_object(
    'kind', 'public_checking',
    'athletes', coalesce(jsonb_agg(
      jsonb_build_object(
        'name', projected.athlete_name,
        'team', projected.team_name,
        'category', projected.category_name,
        'alone', projected.alone
      )
      order by projected.category_name, projected.athlete_name
    ), '[]'::jsonb)
  )
    into result
    from (
      select
        nullif(trim(registration.athlete_snapshot->>'nome_completo'), '') as athlete_name,
        nullif(trim(registration.athlete_snapshot->>'team_name'), '') as team_name,
        category.nome as category_name,
        count(*) over (
          partition by coalesce(registration.current_category_id, registration.category_id)
        ) = 1 as alone
      from public.registrations registration
      join public.event_categories category
        on category.id = coalesce(registration.current_category_id, registration.category_id)
      where registration.event_id = target_event_id
        and registration.status = 'efetivada'
    ) projected
   where projected.athlete_name is not null;

  return coalesce(result, jsonb_build_object('kind', 'public_checking', 'athletes', '[]'::jsonb));
end;
$fn$;

comment on function public.get_public_event_checking(uuid) is
  'Lista publica da checagem: nome completo de competicao, equipe e categoria vigente das inscricoes efetivadas. Sem IDs, dados pessoais, peso ou financeiro.';

revoke all on function public.get_public_event_checking(uuid) from public;
grant execute on function public.get_public_event_checking(uuid) to anon, authenticated;

commit;
