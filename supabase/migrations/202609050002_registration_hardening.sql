begin;

create or replace function public.create_event_registrations(
  target_event_id uuid,
  target_athlete_ids uuid[],
  accepted_terms_version text,
  terms_accepted boolean
)
returns table (registration_id uuid, athlete_id uuid, category_id uuid, numero bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event public.events%rowtype;
  selected_athlete_id uuid;
  active_rule public.category_rule_sets%rowtype;
  athlete_record record;
  chosen_category public.event_categories%rowtype;
  athlete_age integer;
  athlete_belt_order integer;
  tied_categories integer;
  new_registration_id uuid;
  new_registration_number bigint;
begin
  if auth.uid() is null then raise exception 'Autenticacao obrigatoria'; end if;
  if terms_accepted is distinct from true or accepted_terms_version is distinct from 'MVP-2026-09' then
    raise exception 'Aceite dos termos obrigatorio';
  end if;
  if coalesce(array_length(target_athlete_ids, 1), 0) = 0 then
    raise exception 'Selecione ao menos um atleta';
  end if;
  if array_length(target_athlete_ids, 1) <> (select count(distinct selected.id) from unnest(target_athlete_ids) as selected(id)) then
    raise exception 'Lista de atletas duplicada';
  end if;

  select * into target_event from public.events where id = target_event_id for share;
  if not found then raise exception 'Evento inexistente'; end if;
  if target_event.status <> 'inscricao' then raise exception 'Evento fora da fase de inscricao'; end if;
  if not exists (
    select 1 from public.event_phases
    where event_id = target_event_id and tipo = 'inscricao'
      and now() between inicio and fim
  ) then raise exception 'Prazo de inscricao encerrado'; end if;

  select * into active_rule from public.category_rule_sets
  where event_id = target_event_id and ativo = true
  order by versao desc limit 1;
  if not found then raise exception 'Evento sem conjunto de categorias ativo'; end if;

  foreach selected_athlete_id in array target_athlete_ids loop
    if not public.manages_athlete(selected_athlete_id) then raise exception 'Atleta fora do seu escopo'; end if;
    if exists (
      select 1 from public.registrations r where r.event_id = target_event_id
        and r.athlete_id = selected_athlete_id
        and r.status in ('rascunho', 'pendente_pagamento', 'efetivada')
    ) then raise exception 'Atleta ja possui inscricao ativa no evento'; end if;

    select a.*, t.nome as team_name into athlete_record
    from public.athletes a join public.teams t on t.id = a.team_id
    where a.id = selected_athlete_id for share of a;
    if not found then raise exception 'Atleta inexistente'; end if;

    athlete_age := extract(year from age(target_event.data_evento, athlete_record.data_nascimento));
    athlete_belt_order := public.belt_order(athlete_record.faixa);
    if athlete_belt_order is null then raise exception 'Faixa do atleta nao reconhecida'; end if;

    select c.* into chosen_category
    from public.event_categories c
    where c.rule_set_id = active_rule.id and c.ativa = true
      and athlete_age between c.idade_min and c.idade_max
      and upper(c.genero) = upper(athlete_record.genero)
      and athlete_belt_order between c.faixa_min_ordem and c.faixa_max_ordem
      and athlete_record.peso_kg between c.peso_min_kg and c.peso_max_kg
    order by c.ordem, c.id limit 1;
    if not found then raise exception 'Nenhuma categoria elegivel para %', athlete_record.nome_completo; end if;

    select count(*) into tied_categories from public.event_categories c
    where c.rule_set_id = active_rule.id and c.ativa = true and c.ordem = chosen_category.ordem
      and athlete_age between c.idade_min and c.idade_max
      and upper(c.genero) = upper(athlete_record.genero)
      and athlete_belt_order between c.faixa_min_ordem and c.faixa_max_ordem
      and athlete_record.peso_kg between c.peso_min_kg and c.peso_max_kg;
    if tied_categories > 1 then raise exception 'Categorizacao ambigua para %', athlete_record.nome_completo; end if;

    insert into public.registrations (
      event_id, athlete_id, category_id, registered_by, status, valor,
      athlete_snapshot, category_snapshot, rule_set_version,
      terms_version, terms_accepted_at
    ) values (
      target_event_id, athlete_record.id, chosen_category.id, auth.uid(),
      'pendente_pagamento', target_event.valor_inscricao,
      jsonb_build_object(
        'nome_completo', athlete_record.nome_completo,
        'data_nascimento', athlete_record.data_nascimento,
        'genero', athlete_record.genero,
        'faixa', athlete_record.faixa,
        'peso_kg', athlete_record.peso_kg,
        'team_id', athlete_record.team_id,
        'team_name', athlete_record.team_name
      ),
      to_jsonb(chosen_category) || jsonb_build_object(
        'rule_set_id', active_rule.id,
        'rule_set_name', active_rule.nome,
        'rule_set_version', active_rule.versao,
        'valor', target_event.valor_inscricao
      ),
      active_rule.versao, accepted_terms_version, now()
    ) returning id, registrations.numero into new_registration_id, new_registration_number;

    registration_id := new_registration_id;
    athlete_id := selected_athlete_id;
    category_id := chosen_category.id;
    numero := new_registration_number;
    return next;
  end loop;
end;
$$;


-- All client writes must use the validated transaction.
revoke insert, update, delete on public.registrations from authenticated, anon;
drop policy if exists registrations_owner_insert on public.registrations;

commit;
