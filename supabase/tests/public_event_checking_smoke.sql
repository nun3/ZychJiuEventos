-- Sprint 13 lote 1: projecao publica da checagem. Fixtures com rollback.
begin;

do $$
declare
  owner uuid := gen_random_uuid();
  org uuid := gen_random_uuid();
  team_a uuid := gen_random_uuid();
  team_b uuid := gen_random_uuid();
  event uuid := gen_random_uuid();
  rules uuid := gen_random_uuid();
  cat_leve uuid := gen_random_uuid();
  cat_medio uuid := gen_random_uuid();
  cat_pesado uuid := gen_random_uuid();
  athletes uuid[] := array[
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
  ];
  registrations uuid[] := array[
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
  ];
  statuses public.registration_status[] := array[
    'efetivada', 'efetivada', 'efetivada',
    'pendente_pagamento', 'cancelada', 'efetivada'
  ];
  idx integer;
  payload jsonb;
  names text[];
  keys text[];
begin
  insert into auth.users(id, email, raw_user_meta_data)
    values (owner, owner::text || '@example.invalid', '{}');
  insert into public.organizations(id, nome, slug, created_by)
    values (org, 'Checagem publica smoke', org::text, owner);
  insert into public.organization_members(organization_id, user_id, role)
    values (org, owner, 'owner');
  insert into public.teams(id, organization_id, nome, created_by) values
    (team_a, org, 'Equipe Alfa', owner),
    (team_b, org, 'Equipe Beta', owner);
  insert into public.events(
    id, organization_id, nome, slug, data_evento, local, status, created_by, valor_inscricao
  ) values (
    event, org, 'Evento checagem publica', event::text, current_date, 'Teste', 'checagem', owner, 80
  );
  insert into public.category_rule_sets(id, event_id, nome, versao, ativo)
    values (rules, event, 'Checagem publica', 1, true);
  insert into public.event_categories(
    id, rule_set_id, nome, idade_min, idade_max, faixa_min_ordem,
    faixa_max_ordem, peso_min_kg, peso_max_kg, genero
  ) values
    (cat_leve, rules, 'Leve publico', 18, 99, 1, 1, 0, 70, 'M'),
    (cat_medio, rules, 'Medio publico', 18, 99, 1, 1, 70.01, 85, 'M'),
    (cat_pesado, rules, 'Pesado publico', 18, 99, 1, 1, 85.01, 120, 'M');

  for idx in 1..6 loop
    insert into public.athletes(
      id, organization_id, team_id, nome_completo, data_nascimento, genero, faixa, peso_kg
    ) values (
      athletes[idx], org, case when idx = 2 then team_b else team_a end,
      'Publico atleta ' || idx::text,
      current_date - interval '25 years', 'M', 'Branca', 70 + idx
    );
    insert into public.registrations(
      id, event_id, athlete_id, category_id, current_category_id, registered_by, status, valor,
      athlete_snapshot, category_snapshot, rule_set_version, terms_version, terms_accepted_at
    ) values (
      registrations[idx], event, athletes[idx],
      case when idx = 3 then cat_medio else cat_leve end,
      case when idx = 6 then cat_pesado else null end,
      owner, statuses[idx], 80,
      jsonb_build_object(
        'nome_completo', 'Publico atleta ' || idx::text,
        'data_nascimento', (current_date - interval '25 years')::date,
        'genero', 'M',
        'faixa', 'Branca',
        'peso_kg', 70 + idx,
        'cpf', '5299822472' || idx::text,
        'team_id', case when idx = 2 then team_b else team_a end,
        'team_name', case when idx = 2 then 'Equipe Beta' else 'Equipe Alfa' end
      ),
      jsonb_build_object('nome', case when idx = 3 then 'Medio publico' else 'Leve publico' end),
      1, 'MVP-2026-09', now()
    );
  end loop;

  set local role anon;
  payload := public.get_public_event_checking(event);
  if payload->>'kind' <> 'public_checking' then
    raise exception 'FAIL: kind %', payload;
  end if;

  select coalesce(array_agg(athlete->>'name' order by athlete->>'name'), '{}')
    into names
    from jsonb_array_elements(payload->'athletes') athlete;
  if names <> array['Publico atleta 1', 'Publico atleta 2', 'Publico atleta 3', 'Publico atleta 6'] then
    raise exception 'FAIL: visible names %', names;
  end if;

  if exists (
    select 1 from jsonb_array_elements(payload->'athletes') athlete
    where athlete->>'name' in ('Publico atleta 4', 'Publico atleta 5')
  ) then
    raise exception 'FAIL: pending or cancelled leaked %', payload;
  end if;

  if (
    select athlete->>'category'
      from jsonb_array_elements(payload->'athletes') athlete
     where athlete->>'name' = 'Publico atleta 6'
  ) <> 'Pesado publico' then
    raise exception 'FAIL: current category not projected %', payload;
  end if;

  if (
    select (athlete->>'alone')::boolean
      from jsonb_array_elements(payload->'athletes') athlete
     where athlete->>'name' = 'Publico atleta 3'
  ) is not true then
    raise exception 'FAIL: alone athlete not marked %', payload;
  end if;

  select coalesce(array_agg(distinct key order by key), '{}')
    into keys
    from jsonb_array_elements(payload->'athletes') athlete,
         jsonb_object_keys(athlete) key;
  if keys <> array['alone', 'category', 'name', 'team'] then
    raise exception 'FAIL: unexpected public keys %', keys;
  end if;

  if payload::text like '%cpf%'
     or payload::text like '%peso%'
     or payload::text like '%data_nascimento%'
     or payload::text like '%5299822472%'
     or payload::text like '%registration%'
     or payload::text like '%payment%' then
    raise exception 'FAIL: private fields leaked %', payload;
  end if;

  if exists (
    select 1
      from public.registrations
     where event_id = event
  ) then
    raise exception 'FAIL: anon administrative registration read';
  end if;

  reset role;
end;
$$;

rollback;
