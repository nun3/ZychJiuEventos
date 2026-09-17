-- Sprint 8 lote 2: dominio de chaves. Fixtures roll back.
-- Nao usa MC-SIM r1/r2. Nao persiste massa.
begin;

create function pg_temp.groups_payload(target_bracket_id uuid)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'groups',
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'label', g.label,
        'topology', g.topology,
        'slots', (
          select jsonb_agg(jsonb_build_object(
            'slot', e.slot,
            'participant_id', e.participant_id
          ) order by e.slot)
          from public.bracket_entries e
          where e.group_id = g.id
        )
      ) order by g.sort_order)
      from public.bracket_groups g
      where g.bracket_id = target_bracket_id
    ), '[]'::jsonb)
  );
$$;

create function pg_temp.slot_pid(target_bracket_id uuid, group_label text, slot_no integer)
returns uuid
language sql
stable
as $$
  select e.participant_id
    from public.bracket_entries e
    join public.bracket_groups g on g.id = e.group_id
   where g.bracket_id = target_bracket_id
     and g.label = group_label
     and e.slot = slot_no;
$$;

create function pg_temp.slot_team(target_bracket_id uuid, group_label text, slot_no integer)
returns uuid
language sql
stable
as $$
  select p.team_id
    from public.bracket_entries e
    join public.bracket_groups g on g.id = e.group_id
    join public.bracket_participants p on p.id = e.participant_id
   where g.bracket_id = target_bracket_id
     and g.label = group_label
     and e.slot = slot_no;
$$;

create function pg_temp.participant_fingerprint(target_bracket_id uuid)
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id,
    'registrationId', registration_id,
    'athleteId', athlete_id,
    'nome', nome_exibido,
    'teamId', team_id,
    'teamName', team_name,
    'sourceOrder', source_order
  ) order by source_order, id), '[]'::jsonb)
  from public.bracket_participants
  where bracket_id = target_bracket_id;
$$;

do $$
declare
  owner uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
  other_owner uuid := gen_random_uuid();
  org uuid := gen_random_uuid();
  other_org uuid := gen_random_uuid();
  team_alfa uuid := gen_random_uuid();
  team_beta uuid := gen_random_uuid();
  event uuid := gen_random_uuid();
  unlocked_event uuid := gen_random_uuid();
  other_event uuid := gen_random_uuid();
  rules uuid := gen_random_uuid();
  unlocked_rules uuid := gen_random_uuid();
  other_rules uuid := gen_random_uuid();
  cat_one uuid := gen_random_uuid();
  cat_two uuid := gen_random_uuid();
  cat_two_same uuid := gen_random_uuid();
  cat_three uuid := gen_random_uuid();
  cat_four uuid := gen_random_uuid();
  cat_five uuid := gen_random_uuid();
  cat_origin uuid := gen_random_uuid();
  cat_dest uuid := gen_random_uuid();
  cat_unlocked uuid := gen_random_uuid();
  cat_other uuid := gen_random_uuid();
  a_one uuid := gen_random_uuid();
  a_two_a uuid := gen_random_uuid();
  a_two_b uuid := gen_random_uuid();
  a_same_1 uuid := gen_random_uuid();
  a_same_2 uuid := gen_random_uuid();
  a_three_a1 uuid := gen_random_uuid();
  a_three_a2 uuid := gen_random_uuid();
  a_three_b uuid := gen_random_uuid();
  a_four_a1 uuid := gen_random_uuid();
  a_four_a2 uuid := gen_random_uuid();
  a_four_b1 uuid := gen_random_uuid();
  a_four_b2 uuid := gen_random_uuid();
  a_five_1 uuid := gen_random_uuid();
  a_five_2 uuid := gen_random_uuid();
  a_five_3 uuid := gen_random_uuid();
  a_five_4 uuid := gen_random_uuid();
  a_five_5 uuid := gen_random_uuid();
  a_moved uuid := gen_random_uuid();
  a_dest uuid := gen_random_uuid();
  a_pending uuid := gen_random_uuid();
  a_cancel uuid := gen_random_uuid();
  a_unlocked_1 uuid := gen_random_uuid();
  a_unlocked_2 uuid := gen_random_uuid();
  r_one uuid := gen_random_uuid();
  r_two_a uuid := gen_random_uuid();
  r_two_b uuid := gen_random_uuid();
  r_same_1 uuid := gen_random_uuid();
  r_same_2 uuid := gen_random_uuid();
  r_three_a1 uuid := gen_random_uuid();
  r_three_a2 uuid := gen_random_uuid();
  r_three_b uuid := gen_random_uuid();
  r_four_a1 uuid := gen_random_uuid();
  r_four_a2 uuid := gen_random_uuid();
  r_four_b1 uuid := gen_random_uuid();
  r_four_b2 uuid := gen_random_uuid();
  r_five_1 uuid := gen_random_uuid();
  r_five_2 uuid := gen_random_uuid();
  r_five_3 uuid := gen_random_uuid();
  r_five_4 uuid := gen_random_uuid();
  r_five_5 uuid := gen_random_uuid();
  r_moved uuid := gen_random_uuid();
  r_dest uuid := gen_random_uuid();
  r_pending uuid := gen_random_uuid();
  r_cancel uuid := gen_random_uuid();
  r_unlocked_1 uuid := gen_random_uuid();
  r_unlocked_2 uuid := gen_random_uuid();
  regs_before jsonb;
  snapshot jsonb;
  result jsonb;
  rejected boolean;
  b_one uuid;
  b_two uuid;
  b_two_same uuid;
  b_three uuid;
  b_four uuid;
  b_five uuid;
  b_dest uuid;
  b_two_again uuid;
  b_v2 uuid;
  p_three_before jsonb;
  p_three_after jsonb;
  slot2_before uuid;
  slot2_manual uuid;
  slot1_before uuid;
  alfa_ids uuid[];
  beta_ids uuid[];
  five_ids uuid[];
  payload jsonb;
  foreign_group uuid;
  foreign_entry uuid;
  local_group uuid;
  generated_audits integer;
begin
  insert into auth.users(id, email, raw_user_meta_data) values
    (owner, owner::text || '@example.invalid', '{}'),
    (outsider, outsider::text || '@example.invalid', '{}'),
    (other_owner, other_owner::text || '@example.invalid', '{}');
  insert into public.organizations(id,nome,slug,created_by) values
    (org,'Chaves smoke',org::text,owner),
    (other_org,'Outra org chaves',other_org::text,other_owner);
  insert into public.organization_members(organization_id,user_id,role) values
    (org,owner,'owner'), (other_org,other_owner,'owner');
  insert into public.teams(id,organization_id,nome,created_by) values
    (team_alfa,org,'Alfa',owner),
    (team_beta,org,'Beta',owner);
  insert into public.events(id,organization_id,nome,slug,data_evento,local,status,created_by,valor_inscricao)
    values
      (event,org,'Evento chaves',event::text,current_date,'Teste','checagem',owner,80),
      (unlocked_event,org,'Evento sem lock',unlocked_event::text,current_date,'Teste','checagem',owner,80),
      (other_event,other_org,'Outro evento chaves',other_event::text,current_date,'Teste','checagem',other_owner,80);
  insert into public.category_rule_sets(id,event_id,nome,versao,ativo) values
    (rules,event,'Regras',1,true),
    (unlocked_rules,unlocked_event,'Regras unlocked',1,true),
    (other_rules,other_event,'Outras',1,true);
  insert into public.event_categories(
    id,rule_set_id,nome,idade_min,idade_max,faixa_min_ordem,faixa_max_ordem,peso_min_kg,peso_max_kg,genero,ordem
  ) values
    (cat_one,rules,'N1',18,29,1,1,0,76,'M',1),
    (cat_two,rules,'N2',18,29,1,1,76.01,80,'M',2),
    (cat_two_same,rules,'N2 mesma equipe',18,29,1,1,80.01,84,'M',3),
    (cat_three,rules,'N3',18,29,1,1,84.01,88,'M',4),
    (cat_four,rules,'N4',18,29,1,1,88.01,92,'M',5),
    (cat_five,rules,'N5',18,29,1,1,92.01,96,'M',6),
    (cat_origin,rules,'Origem vigente',18,29,1,1,96.01,100,'M',7),
    (cat_dest,rules,'Destino vigente',18,29,1,1,100.01,110,'M',8),
    (cat_unlocked,unlocked_rules,'Unlocked',18,29,1,1,0,80,'M',1),
    (cat_other,other_rules,'Outra org cat',18,29,1,1,0,80,'M',1);

  insert into public.athletes(id,organization_id,team_id,nome_completo,data_nascimento,genero,faixa,peso_kg) values
    (a_one,org,team_alfa,'N1 Sozinho',current_date-interval '25 years','M','Branca',70),
    (a_two_a,org,team_alfa,'N2 Alfa',current_date-interval '25 years','M','Branca',78),
    (a_two_b,org,team_beta,'N2 Beta',current_date-interval '25 years','M','Branca',78),
    (a_same_1,org,team_alfa,'N2 Same 1',current_date-interval '25 years','M','Branca',82),
    (a_same_2,org,team_alfa,'N2 Same 2',current_date-interval '25 years','M','Branca',82),
    (a_three_a1,org,team_alfa,'N3 Alfa 1',current_date-interval '25 years','M','Branca',86),
    (a_three_a2,org,team_alfa,'N3 Alfa 2',current_date-interval '25 years','M','Branca',86),
    (a_three_b,org,team_beta,'N3 Beta',current_date-interval '25 years','M','Branca',86),
    (a_four_a1,org,team_alfa,'Alfa 1',current_date-interval '25 years','M','Branca',90),
    (a_four_a2,org,team_alfa,'Alfa 2',current_date-interval '25 years','M','Branca',90),
    (a_four_b1,org,team_beta,'Beta 1',current_date-interval '25 years','M','Branca',90),
    (a_four_b2,org,team_beta,'Beta 2',current_date-interval '25 years','M','Branca',90),
    (a_five_1,org,team_alfa,'N5 1',current_date-interval '25 years','M','Branca',94),
    (a_five_2,org,team_alfa,'N5 2',current_date-interval '25 years','M','Branca',94),
    (a_five_3,org,team_beta,'N5 3',current_date-interval '25 years','M','Branca',94),
    (a_five_4,org,team_beta,'N5 4',current_date-interval '25 years','M','Branca',94),
    (a_five_5,org,team_alfa,'N5 5',current_date-interval '25 years','M','Branca',94),
    (a_moved,org,team_alfa,'Movido vigente',current_date-interval '25 years','M','Branca',102),
    (a_dest,org,team_beta,'Nativo destino',current_date-interval '25 years','M','Branca',102),
    (a_pending,org,team_alfa,'Pendente',current_date-interval '25 years','M','Branca',102),
    (a_cancel,org,team_beta,'Cancelado',current_date-interval '25 years','M','Branca',102),
    (a_unlocked_1,org,team_alfa,'Unlocked 1',current_date-interval '25 years','M','Branca',70),
    (a_unlocked_2,org,team_beta,'Unlocked 2',current_date-interval '25 years','M','Branca',70);

  snapshot := jsonb_build_object(
    'genero','M','faixa','Branca','data_nascimento',(current_date-interval '25 years')::date
  );
  insert into public.registrations(
    id,event_id,athlete_id,category_id,registered_by,status,valor,
    athlete_snapshot,category_snapshot,rule_set_version,terms_version,terms_accepted_at
  ) values
    (r_one,event,a_one,cat_one,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','N1 Sozinho','peso_kg',70,'team_id',team_alfa,'team_name','Alfa'),
      jsonb_build_object('nome','N1'),1,'MVP-2026-09',now()),
    (r_two_a,event,a_two_a,cat_two,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','N2 Alfa','peso_kg',78,'team_id',team_alfa,'team_name','Alfa'),
      jsonb_build_object('nome','N2'),1,'MVP-2026-09',now()),
    (r_two_b,event,a_two_b,cat_two,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','N2 Beta','peso_kg',78,'team_id',team_beta,'team_name','Beta'),
      jsonb_build_object('nome','N2'),1,'MVP-2026-09',now()),
    (r_same_1,event,a_same_1,cat_two_same,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','N2 Same 1','peso_kg',82,'team_id',team_alfa,'team_name','Alfa'),
      jsonb_build_object('nome','N2 mesma equipe'),1,'MVP-2026-09',now()),
    (r_same_2,event,a_same_2,cat_two_same,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','N2 Same 2','peso_kg',82,'team_id',team_alfa,'team_name','Alfa'),
      jsonb_build_object('nome','N2 mesma equipe'),1,'MVP-2026-09',now()),
    (r_three_a1,event,a_three_a1,cat_three,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','N3 Alfa 1','peso_kg',86,'team_id',team_alfa,'team_name','Alfa'),
      jsonb_build_object('nome','N3'),1,'MVP-2026-09',now()),
    (r_three_a2,event,a_three_a2,cat_three,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','N3 Alfa 2','peso_kg',86,'team_id',team_alfa,'team_name','Alfa'),
      jsonb_build_object('nome','N3'),1,'MVP-2026-09',now()),
    (r_three_b,event,a_three_b,cat_three,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','N3 Beta','peso_kg',86,'team_id',team_beta,'team_name','Beta'),
      jsonb_build_object('nome','N3'),1,'MVP-2026-09',now()),
    (r_four_a1,event,a_four_a1,cat_four,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','Alfa 1','peso_kg',90,'team_id',team_alfa,'team_name','Alfa'),
      jsonb_build_object('nome','N4'),1,'MVP-2026-09',now()),
    (r_four_a2,event,a_four_a2,cat_four,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','Alfa 2','peso_kg',90,'team_id',team_alfa,'team_name','Alfa'),
      jsonb_build_object('nome','N4'),1,'MVP-2026-09',now()),
    (r_four_b1,event,a_four_b1,cat_four,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','Beta 1','peso_kg',90,'team_id',team_beta,'team_name','Beta'),
      jsonb_build_object('nome','N4'),1,'MVP-2026-09',now()),
    (r_four_b2,event,a_four_b2,cat_four,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','Beta 2','peso_kg',90,'team_id',team_beta,'team_name','Beta'),
      jsonb_build_object('nome','N4'),1,'MVP-2026-09',now()),
    (r_five_1,event,a_five_1,cat_five,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','N5 1','peso_kg',94,'team_id',team_alfa,'team_name','Alfa'),
      jsonb_build_object('nome','N5'),1,'MVP-2026-09',now()),
    (r_five_2,event,a_five_2,cat_five,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','N5 2','peso_kg',94,'team_id',team_alfa,'team_name','Alfa'),
      jsonb_build_object('nome','N5'),1,'MVP-2026-09',now()),
    (r_five_3,event,a_five_3,cat_five,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','N5 3','peso_kg',94,'team_id',team_beta,'team_name','Beta'),
      jsonb_build_object('nome','N5'),1,'MVP-2026-09',now()),
    (r_five_4,event,a_five_4,cat_five,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','N5 4','peso_kg',94,'team_id',team_beta,'team_name','Beta'),
      jsonb_build_object('nome','N5'),1,'MVP-2026-09',now()),
    (r_five_5,event,a_five_5,cat_five,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','N5 5','peso_kg',94,'team_id',team_alfa,'team_name','Alfa'),
      jsonb_build_object('nome','N5'),1,'MVP-2026-09',now()),
    (r_moved,event,a_moved,cat_origin,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','Movido vigente','peso_kg',102,'team_id',team_alfa,'team_name','Alfa'),
      jsonb_build_object('nome','Origem vigente'),1,'MVP-2026-09',now()),
    (r_dest,event,a_dest,cat_dest,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','Nativo destino','peso_kg',102,'team_id',team_beta,'team_name','Beta'),
      jsonb_build_object('nome','Destino vigente'),1,'MVP-2026-09',now()),
    (r_pending,event,a_pending,cat_dest,owner,'pendente_pagamento',80,
      snapshot || jsonb_build_object('nome_completo','Pendente','peso_kg',102,'team_id',team_alfa,'team_name','Alfa'),
      jsonb_build_object('nome','Destino vigente'),1,'MVP-2026-09',now()),
    (r_cancel,event,a_cancel,cat_dest,owner,'cancelada',80,
      snapshot || jsonb_build_object('nome_completo','Cancelado','peso_kg',102,'team_id',team_beta,'team_name','Beta'),
      jsonb_build_object('nome','Destino vigente'),1,'MVP-2026-09',now()),
    (r_unlocked_1,unlocked_event,a_unlocked_1,cat_unlocked,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','Unlocked 1','peso_kg',70,'team_id',team_alfa,'team_name','Alfa'),
      jsonb_build_object('nome','Unlocked'),1,'MVP-2026-09',now()),
    (r_unlocked_2,unlocked_event,a_unlocked_2,cat_unlocked,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','Unlocked 2','peso_kg',70,'team_id',team_beta,'team_name','Beta'),
      jsonb_build_object('nome','Unlocked'),1,'MVP-2026-09',now());

  update public.registrations
     set current_category_id = cat_dest
   where id = r_moved;

  select jsonb_agg(jsonb_build_object(
    'id', id,
    'categoryId', category_id,
    'currentCategoryId', current_category_id,
    'athleteSnapshot', athlete_snapshot,
    'categorySnapshot', category_snapshot,
    'status', status
  ) order by id)
    into regs_before
    from public.registrations
   where registrations.event_id in (event, unlocked_event);

  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;

  rejected := false;
  begin
    perform public.generate_category_bracket(unlocked_event, cat_unlocked);
  exception when others then
    if sqlerrm <> 'Checagem ainda nao travada' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: generate without lock'; end if;

  if (public.lock_event_checagem(event)->>'kind') <> 'locked' then
    raise exception 'FAIL: lock checagem';
  end if;

  -- N=1
  result := public.generate_category_bracket(event, cat_one);
  b_one := (result->>'bracketId')::uuid;
  if result->>'mode' <> 'sem_confronto' or result->>'status' <> 'draft' then
    raise exception 'FAIL: N=1 mode/status %', result;
  end if;
  if (select count(*) from public.bracket_participants where bracket_id = b_one) <> 1 then
    raise exception 'FAIL: N=1 participant count';
  end if;
  if exists(select 1 from public.bracket_groups where bracket_id = b_one)
     or exists(select 1 from public.bracket_entries where bracket_id = b_one)
     or exists(
       select 1 from public.bracket_matches m
       join public.bracket_groups g on g.id = m.group_id
       where g.bracket_id = b_one
     )
  then raise exception 'FAIL: N=1 has groups/entries/matches'; end if;

  rejected := false;
  begin
    perform public.save_category_bracket_composition(b_one, '{"groups":[]}'::jsonb);
  exception when others then
    if sqlerrm <> 'Composicao manual indisponivel para categoria sem confronto' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: N=1 save allowed'; end if;

  -- N=2 equipes distintas
  result := public.generate_category_bracket(event, cat_two);
  b_two := (result->>'bracketId')::uuid;
  if result->>'mode' <> 'competicao' then raise exception 'FAIL: N=2 mode'; end if;
  if jsonb_array_length(coalesce(result->'warnings','[]'::jsonb)) <> 0 then
    raise exception 'FAIL: N=2 unexpected warning %', result->'warnings';
  end if;
  if (select count(*) from public.bracket_participants where bracket_id = b_two) <> 2
     or (select count(*) from public.bracket_groups where bracket_id = b_two) <> 1
     or (select topology from public.bracket_groups where bracket_id = b_two) <> 'final_2'
     or (select count(*) from public.bracket_entries where bracket_id = b_two) <> 2
  then raise exception 'FAIL: N=2 shape'; end if;
  if not exists(
    select 1 from public.bracket_matches m
    join public.bracket_groups g on g.id = m.group_id
    join public.bracket_entries a on a.id = m.side_a_entry_id
    join public.bracket_entries b on b.id = m.side_b_entry_id
   where g.bracket_id = b_two
     and m.round = 'final' and m.pair_index = 1
     and m.side_a_source_match_id is null and m.side_b_source_match_id is null
     and m.winner_entry_id is null and m.status = 'pendente'
     and a.slot = 1 and b.slot = 2
  ) or (select count(*) from public.bracket_matches m join public.bracket_groups g on g.id = m.group_id where g.bracket_id = b_two) <> 1
  then raise exception 'FAIL: N=2 match graph'; end if;

  -- N=2 mesma equipe: warning, nao erro
  result := public.generate_category_bracket(event, cat_two_same);
  b_two_same := (result->>'bracketId')::uuid;
  if not exists(
    select 1 from jsonb_array_elements(result->'warnings') w
    where w->>'type' = 'same_team'
      and w->'slots' = '[1, 2]'::jsonb
  ) then raise exception 'FAIL: N=2 same team missing warning %', result->'warnings'; end if;
  if pg_temp.slot_team(b_two_same,'A',1) is distinct from pg_temp.slot_team(b_two_same,'A',2) then
    raise exception 'FAIL: N=2 same team slots';
  end if;

  -- N=3 copo
  result := public.generate_category_bracket(event, cat_three);
  b_three := (result->>'bracketId')::uuid;
  if (select topology from public.bracket_groups where bracket_id = b_three) <> 'copo_3' then
    raise exception 'FAIL: N=3 topology';
  end if;
  if (select count(*) from public.bracket_entries where bracket_id = b_three) <> 3 then
    raise exception 'FAIL: N=3 entries';
  end if;
  if pg_temp.slot_team(b_three,'A',1) is not distinct from pg_temp.slot_team(b_three,'A',3) then
    raise exception 'FAIL: N=3 auto did not separate teams in SF';
  end if;
  if pg_temp.slot_team(b_three,'A',2) is distinct from team_alfa then
    raise exception 'FAIL: N=3 copo should be majority team';
  end if;
  if (select count(*) from public.bracket_matches m join public.bracket_groups g on g.id = m.group_id where g.bracket_id = b_three) <> 2 then
    raise exception 'FAIL: N=3 match count (bye should not exist)';
  end if;
  if not exists(
    select 1
      from public.bracket_matches sf
      join public.bracket_groups g on g.id = sf.group_id
      join public.bracket_entries a on a.id = sf.side_a_entry_id
      join public.bracket_entries b on b.id = sf.side_b_entry_id
      join public.bracket_matches fin on fin.group_id = g.id and fin.round = 'final'
     where g.bracket_id = b_three
       and sf.round = 'semifinal' and sf.pair_index = 1
       and a.slot = 1 and b.slot = 3
       and fin.side_a_source_match_id = sf.id
       and fin.side_a_entry_id is null
       and fin.side_b_source_match_id is null
       and (select slot from public.bracket_entries where id = fin.side_b_entry_id) = 2
  ) then raise exception 'FAIL: N=3 match template'; end if;

  p_three_before := pg_temp.participant_fingerprint(b_three);
  slot1_before := pg_temp.slot_pid(b_three,'A',1);
  slot2_before := pg_temp.slot_pid(b_three,'A',2);
  payload := jsonb_build_object('groups', jsonb_build_array(jsonb_build_object(
    'label','A','topology','copo_3','slots', jsonb_build_array(
      jsonb_build_object('slot',1,'participant_id',slot2_before),
      jsonb_build_object('slot',2,'participant_id',slot1_before),
      jsonb_build_object('slot',3,'participant_id',pg_temp.slot_pid(b_three,'A',3))
    )
  )));
  result := public.save_category_bracket_composition(b_three, payload);
  slot2_manual := pg_temp.slot_pid(b_three,'A',2);
  if slot2_manual is distinct from slot1_before then
    raise exception 'FAIL: N=3 manual copo did not change';
  end if;
  p_three_after := pg_temp.participant_fingerprint(b_three);
  if p_three_after is distinct from p_three_before then
    raise exception 'FAIL: N=3 save mutated participants';
  end if;
  if (select count(*) from public.bracket_matches m join public.bracket_groups g on g.id = m.group_id where g.bracket_id = b_three) <> 2 then
    raise exception 'FAIL: N=3 matches after save';
  end if;
  if not exists(select 1 from public.event_audit_logs where resource_id = b_three and action = 'bracket_composition_saved') then
    raise exception 'FAIL: composition audit';
  end if;

  result := public.restore_category_bracket_suggestion(b_three);
  if pg_temp.slot_pid(b_three,'A',2) is distinct from slot2_before then
    raise exception 'FAIL: N=3 restore copo';
  end if;
  if pg_temp.participant_fingerprint(b_three) is distinct from p_three_before then
    raise exception 'FAIL: N=3 restore mutated participants';
  end if;
  if not exists(select 1 from public.event_audit_logs where resource_id = b_three and action = 'bracket_suggestion_restored') then
    raise exception 'FAIL: restore audit';
  end if;

  -- N=4 custo 0
  result := public.generate_category_bracket(event, cat_four);
  b_four := (result->>'bracketId')::uuid;
  if (select topology from public.bracket_groups where bracket_id = b_four) <> 'semi_4' then
    raise exception 'FAIL: N=4 topology';
  end if;
  if pg_temp.slot_team(b_four,'A',1) is not distinct from pg_temp.slot_team(b_four,'A',3)
     or pg_temp.slot_team(b_four,'A',2) is not distinct from pg_temp.slot_team(b_four,'A',4)
  then raise exception 'FAIL: N=4 auto same-team SF'; end if;
  if (select count(*) from public.bracket_matches m join public.bracket_groups g on g.id = m.group_id where g.bracket_id = b_four) <> 3 then
    raise exception 'FAIL: N=4 match count';
  end if;
  if not exists(
    select 1
      from public.bracket_matches sf1
      join public.bracket_groups g on g.id = sf1.group_id
      join public.bracket_matches sf2 on sf2.group_id = g.id and sf2.round = 'semifinal' and sf2.pair_index = 2
      join public.bracket_matches fin on fin.group_id = g.id and fin.round = 'final'
      join public.bracket_entries a1 on a1.id = sf1.side_a_entry_id
      join public.bracket_entries b1 on b1.id = sf1.side_b_entry_id
      join public.bracket_entries a2 on a2.id = sf2.side_a_entry_id
      join public.bracket_entries b2 on b2.id = sf2.side_b_entry_id
     where g.bracket_id = b_four
       and sf1.round = 'semifinal' and sf1.pair_index = 1
       and a1.slot = 1 and b1.slot = 3 and a2.slot = 2 and b2.slot = 4
       and fin.side_a_source_match_id = sf1.id
       and fin.side_b_source_match_id = sf2.id
       and fin.side_a_entry_id is null and fin.side_b_entry_id is null
  ) then raise exception 'FAIL: N=4 match template'; end if;

  select array_agg(p.id order by p.source_order)
    into alfa_ids
    from public.bracket_participants p
   where p.bracket_id = b_four and p.team_id = team_alfa;
  select array_agg(p.id order by p.source_order)
    into beta_ids
    from public.bracket_participants p
   where p.bracket_id = b_four and p.team_id = team_beta;
  payload := jsonb_build_object('groups', jsonb_build_array(jsonb_build_object(
    'label','A','topology','semi_4','slots', jsonb_build_array(
      jsonb_build_object('slot',1,'participant_id',alfa_ids[1]),
      jsonb_build_object('slot',2,'participant_id',beta_ids[1]),
      jsonb_build_object('slot',3,'participant_id',alfa_ids[2]),
      jsonb_build_object('slot',4,'participant_id',beta_ids[2])
    )
  )));
  result := public.save_category_bracket_composition(b_four, payload);
  if not exists(
    select 1 from jsonb_array_elements(result->'warnings') w
    where w->>'type' = 'same_team' and w->'slots' = '[1, 3]'::jsonb
  ) then raise exception 'FAIL: N=4 manual same_team warning %', result->'warnings'; end if;
  if pg_temp.slot_pid(b_four,'A',1) is distinct from alfa_ids[1]
     or pg_temp.slot_pid(b_four,'A',3) is distinct from alfa_ids[2]
  then raise exception 'FAIL: N=4 manual composition not persisted'; end if;
  perform public.restore_category_bracket_suggestion(b_four);
  if pg_temp.slot_team(b_four,'A',1) is not distinct from pg_temp.slot_team(b_four,'A',3) then
    raise exception 'FAIL: N=4 restore lost cost 0';
  end if;

  -- N=5 split 3+2
  result := public.generate_category_bracket(event, cat_five);
  b_five := (result->>'bracketId')::uuid;
  if (select count(*) from public.bracket_participants where bracket_id = b_five) <> 5
     or (select count(*) from public.bracket_entries where bracket_id = b_five) <> 5
     or (select count(distinct participant_id) from public.bracket_entries where bracket_id = b_five) <> 5
     or (select count(*) from public.bracket_groups where bracket_id = b_five) <> 2
  then raise exception 'FAIL: N=5 coverage'; end if;
  if not exists(select 1 from public.bracket_groups where bracket_id = b_five and label = 'A' and topology = 'copo_3')
     or not exists(select 1 from public.bracket_groups where bracket_id = b_five and label = 'B' and topology = 'final_2')
  then raise exception 'FAIL: N=5 partition 3+2'; end if;
  if exists(
    select 1 from public.bracket_participants p
    join public.registrations r on r.id = p.registration_id
   where p.bracket_id = b_five
     and coalesce(r.current_category_id, r.category_id) is distinct from cat_five
  ) then raise exception 'FAIL: N=5 participant from other category'; end if;

  select array_agg(id order by source_order) into five_ids
    from public.bracket_participants where bracket_id = b_five;
  payload := jsonb_build_object('groups', jsonb_build_array(
    jsonb_build_object('label','A','topology','final_2','slots', jsonb_build_array(
      jsonb_build_object('slot',1,'participant_id',five_ids[1]),
      jsonb_build_object('slot',2,'participant_id',five_ids[2])
    )),
    jsonb_build_object('label','B','topology','copo_3','slots', jsonb_build_array(
      jsonb_build_object('slot',1,'participant_id',five_ids[3]),
      jsonb_build_object('slot',2,'participant_id',five_ids[4]),
      jsonb_build_object('slot',3,'participant_id',five_ids[5])
    ))
  ));
  result := public.save_category_bracket_composition(b_five, payload);
  if (select topology from public.bracket_groups where bracket_id = b_five and label = 'A') <> 'final_2'
     or (select topology from public.bracket_groups where bracket_id = b_five and label = 'B') <> 'copo_3'
  then raise exception 'FAIL: N=5 manual 2+3'; end if;

  -- payloads invalidos sobre N=5
  rejected := false;
  begin
    perform public.save_category_bracket_composition(b_five, jsonb_build_object('groups', jsonb_build_array(
      jsonb_build_object('label','A','topology','final_2','slots', jsonb_build_array(
        jsonb_build_object('slot',1,'participant_id',five_ids[1]),
        jsonb_build_object('slot',2,'participant_id',five_ids[1])
      )),
      jsonb_build_object('label','B','topology','copo_3','slots', jsonb_build_array(
        jsonb_build_object('slot',1,'participant_id',five_ids[3]),
        jsonb_build_object('slot',2,'participant_id',five_ids[4]),
        jsonb_build_object('slot',3,'participant_id',five_ids[5])
      ))
    )));
  exception when others then
    if sqlerrm <> 'Participante duplicado na composicao' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: duplicate participant allowed'; end if;

  rejected := false;
  begin
    perform public.save_category_bracket_composition(b_five, jsonb_build_object('groups', jsonb_build_array(
      jsonb_build_object('label','A','topology','final_2','slots', jsonb_build_array(
        jsonb_build_object('slot',1,'participant_id',five_ids[1]),
        jsonb_build_object('slot',2,'participant_id',five_ids[2])
      ))
    )));
  exception when others then
    if sqlerrm <> 'A composicao deve cobrir exatamente os participantes congelados' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: missing participant allowed'; end if;

  rejected := false;
  begin
    perform public.save_category_bracket_composition(b_five, jsonb_build_object('groups', jsonb_build_array(
      jsonb_build_object('label','A','topology','final_2','slots', jsonb_build_array(
        jsonb_build_object('slot',1,'participant_id',five_ids[1]),
        jsonb_build_object('slot',2,'participant_id',five_ids[2])
      )),
      jsonb_build_object('label','B','topology','copo_3','slots', jsonb_build_array(
        jsonb_build_object('slot',1,'participant_id',five_ids[3]),
        jsonb_build_object('slot',2,'participant_id',five_ids[4]),
        jsonb_build_object('slot',3,'participant_id',(select id from public.bracket_participants where bracket_id = b_two limit 1))
      ))
    )));
  exception when others then
    if sqlerrm <> 'Participante fora da chave' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: extra/cross-bracket participant allowed'; end if;

  rejected := false;
  begin
    perform public.save_category_bracket_composition(b_five, jsonb_build_object('groups', jsonb_build_array(
      jsonb_build_object('label','A','topology','final_2','slots', jsonb_build_array(
        jsonb_build_object('slot',1,'participant_id',five_ids[1]),
        jsonb_build_object('slot',2,'participant_id',five_ids[2]),
        jsonb_build_object('slot',3,'participant_id',five_ids[3])
      )),
      jsonb_build_object('label','B','topology','final_2','slots', jsonb_build_array(
        jsonb_build_object('slot',1,'participant_id',five_ids[4]),
        jsonb_build_object('slot',2,'participant_id',five_ids[5])
      ))
    )));
  exception when others then
    if sqlerrm <> 'Grupo com slots incompativeis com a topologia' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: incompatible topology allowed'; end if;

  rejected := false;
  begin
    perform public.save_category_bracket_composition(b_five, jsonb_build_object('groups', jsonb_build_array(
      jsonb_build_object('label','A','topology','copo_3','slots', jsonb_build_array(
        jsonb_build_object('slot',1,'participant_id',five_ids[1]),
        jsonb_build_object('slot',2,'participant_id',five_ids[2]),
        jsonb_build_object('slot',4,'participant_id',five_ids[3])
      )),
      jsonb_build_object('label','B','topology','final_2','slots', jsonb_build_array(
        jsonb_build_object('slot',1,'participant_id',five_ids[4]),
        jsonb_build_object('slot',2,'participant_id',five_ids[5])
      ))
    )));
  exception when others then
    if sqlerrm <> 'Slot invalido para a topologia' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: hole slots allowed'; end if;

  -- vigente Sprint 7
  rejected := false;
  begin
    perform public.generate_category_bracket(event, cat_origin);
  exception when others then
    if sqlerrm <> 'Categoria sem inscricoes efetivadas' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: origin category generated after move'; end if;

  result := public.generate_category_bracket(event, cat_dest);
  b_dest := (result->>'bracketId')::uuid;
  if (select count(*) from public.bracket_participants where bracket_id = b_dest) <> 2 then
    raise exception 'FAIL: dest should have moved+native only';
  end if;
  if not exists(select 1 from public.bracket_participants where bracket_id = b_dest and registration_id = r_moved)
     or exists(select 1 from public.bracket_participants where bracket_id = b_dest and registration_id in (r_pending, r_cancel))
  then raise exception 'FAIL: pending/cancel/moved snapshot'; end if;
  if (select category_id from public.registrations where id = r_moved) is distinct from cat_origin
     or (select current_category_id from public.registrations where id = r_moved) is distinct from cat_dest
  then raise exception 'FAIL: generate rewrote moved registration'; end if;

  -- idempotencia
  result := public.generate_category_bracket(event, cat_one);
  b_two_again := (result->>'bracketId')::uuid;
  if result->>'kind' <> 'existing_draft' or b_two_again is distinct from b_one then
    raise exception 'FAIL: generate not idempotent %', result;
  end if;
  if (select count(*) from public.category_brackets where event_id = event and category_id = cat_one) <> 1 then
    raise exception 'FAIL: second generate created version';
  end if;

  -- publicacao + regenerate em N=2
  result := public.publish_category_bracket(b_two);
  if result->>'status' <> 'publicada' then raise exception 'FAIL: publish status'; end if;
  if not exists(
    select 1 from public.category_brackets
     where id = b_two and status = 'publicada'
       and published_at is not null and published_by = owner
  ) then raise exception 'FAIL: publish columns'; end if;
  if (select count(*) from public.bracket_entries where bracket_id = b_two) <> 2 then
    raise exception 'FAIL: publish lost composition';
  end if;
  if not exists(select 1 from public.event_audit_logs where resource_id = b_two and action = 'bracket_published') then
    raise exception 'FAIL: publish audit';
  end if;

  rejected := false;
  begin
    perform public.save_category_bracket_composition(b_two, pg_temp.groups_payload(b_two));
  exception when others then
    if sqlerrm <> 'Somente chave em rascunho pode ser editada' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: save after publish'; end if;

  rejected := false;
  begin
    perform public.restore_category_bracket_suggestion(b_two);
  exception when others then
    if sqlerrm <> 'Somente chave em rascunho pode ser restaurada' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: restore after publish'; end if;

  rejected := false;
  begin
    perform public.regenerate_category_bracket(b_two, '');
  exception when others then
    if sqlerrm <> 'Motivo obrigatorio para regenerar a chave' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: regenerate empty reason'; end if;

  rejected := false;
  begin
    perform public.regenerate_category_bracket(b_two, 'abcd');
  exception when others then
    if sqlerrm <> 'Motivo obrigatorio para regenerar a chave' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: regenerate short reason'; end if;

  reset role;
  update public.athletes set nome_completo = 'Nome relido indevido' where id = a_two_a;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;

  result := public.regenerate_category_bracket(b_two, 'nova chave draft');
  b_v2 := (result->>'bracketId')::uuid;
  if result->>'kind' <> 'regenerated' or result->>'status' <> 'draft' or (result->>'version')::int <> 2 then
    raise exception 'FAIL: regenerate payload %', result;
  end if;
  if not exists(
    select 1 from public.category_brackets
     where id = b_two and status = 'publicada' and version = 1
  ) then raise exception 'FAIL: v1 should stay published'; end if;
  if not exists(
    select 1 from public.category_brackets
     where id = b_v2 and status = 'draft' and version = 2 and supersedes_id = b_two
  ) then raise exception 'FAIL: v2 draft link'; end if;
  if exists(select 1 from public.bracket_participants where bracket_id = b_v2 and nome_exibido = 'Nome relido indevido')
     or not exists(select 1 from public.bracket_participants where bracket_id = b_v2 and nome_exibido = 'N2 Alfa')
  then raise exception 'FAIL: regenerate reread athletes'; end if;
  if exists(
    select 1
      from public.bracket_participants v1
      join public.bracket_participants v2
        on v2.bracket_id = b_v2
       and v2.registration_id = v1.registration_id
     where v1.bracket_id = b_two
       and (v2.source_order, v2.nome_exibido, v2.team_id, v2.team_name)
           is distinct from (v1.source_order, v1.nome_exibido, v1.team_id, v1.team_name)
  ) then raise exception 'FAIL: regenerate snapshot copy'; end if;
  if not exists(select 1 from public.event_audit_logs where resource_id = b_v2 and action = 'bracket_regenerated') then
    raise exception 'FAIL: regenerate audit';
  end if;

  rejected := false;
  begin
    perform public.save_category_bracket_composition(b_v2, jsonb_build_object('groups', jsonb_build_array(
      jsonb_build_object('label','A','topology','final_2','slots', jsonb_build_array(
        jsonb_build_object('slot',1,'participant_id',(select id from public.bracket_participants where bracket_id = b_two order by source_order limit 1)),
        jsonb_build_object('slot',2,'participant_id',(select id from public.bracket_participants where bracket_id = b_v2 order by source_order desc limit 1))
      ))
    )));
  exception when others then
    if sqlerrm <> 'Participante fora da chave' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: cross-version participant allowed'; end if;

  result := public.publish_category_bracket(b_v2);
  if not exists(select 1 from public.category_brackets where id = b_two and status = 'substituida') then
    raise exception 'FAIL: v1 not substituted';
  end if;
  if not exists(select 1 from public.category_brackets where id = b_v2 and status = 'publicada') then
    raise exception 'FAIL: v2 not published';
  end if;
  if (select count(*) from public.category_brackets
       where event_id = event and category_id = cat_two
         and status in ('publicada','em_andamento','concluida')) <> 1
  then raise exception 'FAIL: more than one live version'; end if;
  if (select count(*) from public.bracket_entries where bracket_id = b_two) <> 2
     or (select count(*) from public.bracket_entries where bracket_id = b_v2) <> 2
  then raise exception 'FAIL: historical composition deleted'; end if;

  -- seguranca
  reset role;
  perform set_config('request.jwt.claim.sub', outsider::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.generate_category_bracket(event, cat_one);
  exception when others then
    if sqlerrm <> 'Sem permissao para operar chaves' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: outsider generate'; end if;
  rejected := false;
  begin
    perform public.save_category_bracket_composition(b_five, pg_temp.groups_payload(b_five));
  exception when others then
    if sqlerrm <> 'Sem permissao para operar chaves' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: outsider save'; end if;
  rejected := false;
  begin
    perform public.publish_category_bracket(b_five);
  exception when others then
    if sqlerrm <> 'Sem permissao para operar chaves' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: outsider publish'; end if;

  reset role;
  perform set_config('request.jwt.claim.sub', other_owner::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.generate_category_bracket(event, cat_one);
  exception when others then
    if sqlerrm <> 'Sem permissao para operar chaves' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: cross-org generate'; end if;

  reset role;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  rejected := false;
  begin
    insert into public.category_brackets(
      event_id, category_id, version, mode, status, source_checagem_travada_em, generated_by
    ) values (
      event, cat_one, 9, 'sem_confronto', 'draft', now(), owner
    );
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: direct insert category_brackets'; end if;

  rejected := false;
  begin
    delete from public.bracket_groups where bracket_id = b_five;
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: direct delete groups'; end if;

  reset role;
  rejected := false;
  begin
    update public.bracket_participants
       set nome_exibido = 'HACK'
     where bracket_id = b_one;
  exception when others then
    if sqlerrm <> 'Participantes da chave sao imutaveis' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: participant update allowed'; end if;
  if exists(select 1 from public.bracket_participants where bracket_id = b_one and nome_exibido = 'HACK') then
    raise exception 'FAIL: participant update persisted';
  end if;

  select g.id into foreign_group from public.bracket_groups where bracket_id = b_five and label = 'A';
  select e.id into foreign_entry
    from public.bracket_entries e
    join public.bracket_groups g on g.id = e.group_id
   where g.bracket_id = b_five and g.label = 'B'
   limit 1;
  select g.id into local_group from public.bracket_groups where bracket_id = b_five and label = 'B';
  rejected := false;
  begin
    insert into public.bracket_matches(group_id, round, pair_index, side_a_entry_id, side_b_entry_id)
    values (
      foreign_group, 'final', 9, foreign_entry,
      (select e.id from public.bracket_entries e where e.group_id = foreign_group limit 1)
    );
  exception when others then
    if sqlstate <> '23503' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: cross-group match FK'; end if;

  rejected := false;
  begin
    insert into public.category_brackets(
      event_id, category_id, version, mode, status, source_checagem_travada_em, generated_by
    ) values (
      event, cat_one, 9, 'sem_confronto', 'draft', now(), owner
    );
  exception when others then
    if sqlstate <> '23505' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: second draft unique'; end if;

  rejected := false;
  begin
    insert into public.category_brackets(
      event_id, category_id, version, mode, status,
      source_checagem_travada_em, generated_by, published_by, published_at
    ) values (
      event, cat_two, 9, 'competicao', 'publicada', now(), owner, owner, now()
    );
  exception when others then
    if sqlstate <> '23505' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: second live unique'; end if;

  rejected := false;
  begin
    insert into public.category_brackets(
      event_id, category_id, version, mode, status, source_checagem_travada_em, generated_by
    ) values (
      event, cat_two, 2, 'competicao', 'draft', now(), owner
    );
  exception when others then
    if sqlstate <> '23505' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: duplicate version unique'; end if;

  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;

  select count(*) into generated_audits
    from public.event_audit_logs
   where event_id = event and action = 'bracket_generated';
  if generated_audits <> 7 then
    raise exception 'FAIL: generated audit count %', generated_audits;
  end if;
  if not exists(select 1 from public.event_audit_logs where event_id = event and action = 'bracket_composition_saved')
     or not exists(select 1 from public.event_audit_logs where event_id = event and action = 'bracket_suggestion_restored')
     or not exists(select 1 from public.event_audit_logs where event_id = event and action = 'bracket_published')
     or not exists(select 1 from public.event_audit_logs where event_id = event and action = 'bracket_regenerated')
  then raise exception 'FAIL: missing audit actions'; end if;

  if (
    select jsonb_agg(jsonb_build_object(
      'id', id,
      'categoryId', category_id,
      'currentCategoryId', current_category_id,
      'athleteSnapshot', athlete_snapshot,
      'categorySnapshot', category_snapshot,
      'status', status
    ) order by id)
      from public.registrations
     where registrations.event_id in (event, unlocked_event)
  ) is distinct from regs_before then
    raise exception 'FAIL: Sprint 7 registration mutated';
  end if;
end;
$$;

rollback;
