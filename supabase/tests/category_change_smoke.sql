-- Sprint 7: realocacao operacional por adjacencia. Fixtures roll back.
begin;
do $$
declare
  owner uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
  other_owner uuid := gen_random_uuid();
  org uuid := gen_random_uuid();
  other_org uuid := gen_random_uuid();
  team uuid := gen_random_uuid();
  event uuid := gen_random_uuid();
  other_event uuid := gen_random_uuid();
  rules uuid := gen_random_uuid();
  other_rules uuid := gen_random_uuid();
  cat_leve uuid := gen_random_uuid();
  cat_medio uuid := gen_random_uuid();
  cat_pesado uuid := gen_random_uuid();
  cat_juvenil uuid := gen_random_uuid();
  cat_master uuid := gen_random_uuid();
  cat_master_medio uuid := gen_random_uuid();
  cat_leve_f uuid := gen_random_uuid();
  cat_leve_azul uuid := gen_random_uuid();
  cat_other uuid := gen_random_uuid();
  cat_dup uuid := gen_random_uuid();
  athlete_alone uuid := gen_random_uuid();
  athlete_medio uuid := gen_random_uuid();
  athlete_juvenil uuid := gen_random_uuid();
  athlete_pair_one uuid := gen_random_uuid();
  athlete_pair_two uuid := gen_random_uuid();
  reg_alone uuid := gen_random_uuid();
  reg_medio uuid := gen_random_uuid();
  reg_juvenil uuid := gen_random_uuid();
  reg_pair_one uuid := gen_random_uuid();
  reg_pair_two uuid := gen_random_uuid();
  request_id uuid;
  rejected boolean;
  snapshot jsonb;
  leve_snapshot jsonb;
  current_override uuid;
  eligible_ids uuid[];
begin
  insert into auth.users(id, email, raw_user_meta_data) values
    (owner, owner::text || '@example.invalid', '{}'),
    (outsider, outsider::text || '@example.invalid', '{}'),
    (other_owner, other_owner::text || '@example.invalid', '{}');
  insert into public.organizations(id,nome,slug,created_by) values
    (org,'Checagem realocacao',org::text,owner),
    (other_org,'Outra org',other_org::text,other_owner);
  insert into public.organization_members(organization_id,user_id,role) values
    (org,owner,'owner'), (other_org,other_owner,'owner');
  insert into public.teams(id,organization_id,nome,created_by) values(team,org,'Equipe',owner);
  insert into public.events(id,organization_id,nome,slug,data_evento,local,status,created_by,valor_inscricao)
    values
      (event,org,'Evento checagem',event::text,current_date,'Teste','checagem',owner,80),
      (other_event,other_org,'Outro evento',other_event::text,current_date,'Teste','checagem',other_owner,80);
  insert into public.category_rule_sets(id,event_id,nome,versao,ativo) values
    (rules,event,'Regras',1,true),
    (other_rules,other_event,'Outras',1,true);
  insert into public.event_categories(
    id,rule_set_id,nome,idade_min,idade_max,faixa_min_ordem,faixa_max_ordem,peso_min_kg,peso_max_kg,genero,ordem
  ) values
    (cat_juvenil,rules,'Juvenil Leve',16,17,1,1,0,76,'M',1),
    (cat_leve,rules,'Adulto Leve',18,29,1,1,0,76,'M',2),
    (cat_medio,rules,'Adulto Medio',18,29,1,1,76.01,88,'M',3),
    (cat_pesado,rules,'Adulto Pesado',18,29,1,1,88.01,100,'M',4),
    (cat_master,rules,'Master Leve',30,35,1,1,0,76,'M',5),
    (cat_master_medio,rules,'Master Medio',30,35,1,1,76.01,88,'M',6),
    (cat_leve_f,rules,'Adulto Leve F',18,29,1,1,0,76,'F',7),
    (cat_leve_azul,rules,'Adulto Leve Azul',18,29,4,4,0,76,'M',8),
    (cat_other,other_rules,'Outro Leve',18,29,1,1,0,76,'M',1);
  insert into public.athletes(id,organization_id,team_id,nome_completo,data_nascimento,genero,faixa,peso_kg)
    values
      (athlete_alone,org,team,'Sozinho',current_date-interval '25 years','M','Branca',70),
      (athlete_medio,org,team,'Medio sozinho',current_date-interval '25 years','M','Branca',82),
      (athlete_juvenil,org,team,'Juvenil sozinho',current_date-interval '16 years','M','Branca',70),
      (athlete_pair_one,org,team,'Par 1',current_date-interval '25 years','M','Branca',92),
      (athlete_pair_two,org,team,'Par 2',current_date-interval '25 years','M','Branca',92);
  insert into public.athlete_managers(manager_id,athlete_id,relationship_type) values
    (owner,athlete_alone,'professor'),
    (owner,athlete_medio,'professor'),
    (owner,athlete_juvenil,'professor'),
    (owner,athlete_pair_one,'professor'),
    (owner,athlete_pair_two,'professor');

  snapshot := jsonb_build_object(
    'nome_completo','Sozinho','data_nascimento',(current_date-interval '25 years')::date,
    'genero','M','faixa','Branca','peso_kg',70,'team_id',team,'team_name','Equipe'
  );
  leve_snapshot := jsonb_build_object('nome','Adulto Leve');
  insert into public.registrations(
    id,event_id,athlete_id,category_id,registered_by,status,valor,
    athlete_snapshot,category_snapshot,rule_set_version,terms_version,terms_accepted_at
  ) values
    (reg_alone,event,athlete_alone,cat_leve,owner,'efetivada',80,snapshot,leve_snapshot,1,'MVP-2026-09',now()),
    (reg_medio,event,athlete_medio,cat_medio,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','Medio sozinho','peso_kg',82),
      jsonb_build_object('nome','Adulto Medio'),1,'MVP-2026-09',now()),
    (reg_juvenil,event,athlete_juvenil,cat_juvenil,owner,'efetivada',80,
      snapshot || jsonb_build_object(
        'nome_completo','Juvenil sozinho',
        'data_nascimento',(current_date-interval '16 years')::date
      ),
      jsonb_build_object('nome','Juvenil Leve'),1,'MVP-2026-09',now()),
    (reg_pair_one,event,athlete_pair_one,cat_pesado,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','Par 1','peso_kg',92),
      jsonb_build_object('nome','Adulto Pesado'),1,'MVP-2026-09',now()),
    (reg_pair_two,event,athlete_pair_two,cat_pesado,owner,'efetivada',80,
      snapshot || jsonb_build_object('nome_completo','Par 2','peso_kg',92),
      jsonb_build_object('nome','Adulto Pesado'),1,'MVP-2026-09',now());

  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;

  if exists(select 1 from public.list_eligible_category_changes(reg_pair_one)) then
    raise exception 'FAIL: paired athlete listed as eligible';
  end if;
  rejected := false;
  begin
    perform public.request_category_change(reg_pair_one, cat_medio, 'motivo valido');
  exception when others then
    if sqlerrm <> 'Atleta nao esta sozinho na categoria' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: request allowed for occupied category'; end if;

  select coalesce(array_agg(id), '{}') into eligible_ids from public.list_eligible_category_changes(reg_alone);
  if not (cat_medio = any(eligible_ids)) then raise exception 'FAIL: Leve did not list immediate Medio'; end if;
  if cat_pesado = any(eligible_ids) then raise exception 'FAIL: Leve listed skipped Pesado'; end if;
  if cat_juvenil = any(eligible_ids) then null; else raise exception 'FAIL: Leve missing age predecessor'; end if;
  if cat_master = any(eligible_ids) then null; else raise exception 'FAIL: Leve missing age successor'; end if;
  if cat_master_medio = any(eligible_ids) then raise exception 'FAIL: XOR Master Medio listed'; end if;
  if cat_leve_f = any(eligible_ids) then raise exception 'FAIL: different gender listed'; end if;
  if cat_leve_azul = any(eligible_ids) then raise exception 'FAIL: different belt listed'; end if;
  if cat_other = any(eligible_ids) then raise exception 'FAIL: other rule set listed'; end if;

  select coalesce(array_agg(id), '{}') into eligible_ids from public.list_eligible_category_changes(reg_medio);
  if cat_leve = any(eligible_ids) then raise exception 'FAIL: Medio listed weight predecessor'; end if;
  if not (cat_pesado = any(eligible_ids)) then raise exception 'FAIL: Medio missing weight successor'; end if;

  rejected := false;
  begin
    perform public.request_category_change(reg_medio, cat_leve, 'descer peso');
  exception when others then
    if sqlerrm <> 'Categoria de destino invalida' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: weight down allowed'; end if;

  rejected := false;
  begin
    perform public.request_category_change(reg_alone, cat_pesado, 'pular peso');
  exception when others then
    if sqlerrm <> 'Categoria de destino invalida' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: skipped weight class allowed'; end if;

  rejected := false;
  begin
    perform public.request_category_change(reg_alone, cat_master_medio, 'xor idade e peso');
  exception when others then
    if sqlerrm <> 'Categoria de destino invalida' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: XOR destination allowed'; end if;

  rejected := false;
  begin
    perform public.request_category_change(reg_alone, cat_leve_f, 'outro genero');
  exception when others then
    if sqlerrm <> 'Categoria de destino invalida' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: different gender allowed'; end if;

  rejected := false;
  begin
    perform public.request_category_change(reg_alone, cat_leve_azul, 'outra faixa');
  exception when others then
    if sqlerrm <> 'Categoria de destino invalida' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: different belt allowed'; end if;

  rejected := false;
  begin
    perform public.request_category_change(reg_alone, cat_other, 'outro rule set');
  exception when others then
    if sqlerrm <> 'Categoria de destino invalida' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: other rule set allowed'; end if;

  select coalesce(array_agg(id), '{}') into eligible_ids from public.list_eligible_category_changes(reg_juvenil);
  if not (cat_leve = any(eligible_ids)) then raise exception 'FAIL: Juvenil missing Adulto successor'; end if;
  if cat_master = any(eligible_ids) then raise exception 'FAIL: Juvenil listed skipped Master'; end if;
  rejected := false;
  begin
    perform public.request_category_change(reg_juvenil, cat_master, 'pular idade');
  exception when others then
    if sqlerrm <> 'Categoria de destino invalida' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: skipped age class allowed'; end if;

  reset role;
  update public.event_categories set ativa = false where id = cat_medio;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  select coalesce(array_agg(id), '{}') into eligible_ids from public.list_eligible_category_changes(reg_alone);
  if cat_medio = any(eligible_ids) then raise exception 'FAIL: inactive Medio listed'; end if;
  if not (cat_pesado = any(eligible_ids)) then raise exception 'FAIL: gap successor missing while Medio inactive'; end if;
  reset role;
  update public.event_categories set ativa = true where id = cat_medio;

  update public.event_categories set peso_min_kg = 70 where id = cat_pesado;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  select coalesce(array_agg(id), '{}') into eligible_ids from public.list_eligible_category_changes(reg_alone);
  if cat_medio = any(eligible_ids) or cat_pesado = any(eligible_ids) then
    raise exception 'FAIL: weight overlap did not fail closed';
  end if;
  if not (cat_juvenil = any(eligible_ids) and cat_master = any(eligible_ids)) then
    raise exception 'FAIL: age destinations lost during weight overlap';
  end if;
  reset role;
  update public.event_categories set peso_min_kg = 88.01 where id = cat_pesado;

  insert into public.event_categories(
    id,rule_set_id,nome,idade_min,idade_max,faixa_min_ordem,faixa_max_ordem,peso_min_kg,peso_max_kg,genero,ordem
  ) values (cat_dup,rules,'Adulto Leve Dup',18,29,1,1,0,76,'M',9);
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  select coalesce(array_agg(id), '{}') into eligible_ids from public.list_eligible_category_changes(reg_alone);
  if cat_medio = any(eligible_ids) then raise exception 'FAIL: duplicate interval did not fail closed'; end if;
  reset role;
  delete from public.event_categories where id = cat_dup;

  update public.event_categories
    set idade_max = 32
    where id in (cat_leve, cat_medio, cat_pesado);
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  select coalesce(array_agg(id), '{}') into eligible_ids from public.list_eligible_category_changes(reg_alone);
  if cat_juvenil = any(eligible_ids) or cat_master = any(eligible_ids) then
    raise exception 'FAIL: age overlap did not fail closed';
  end if;
  if not (cat_medio = any(eligible_ids)) then
    raise exception 'FAIL: weight destination lost during age overlap';
  end if;
  reset role;
  update public.event_categories
    set idade_max = 29
    where id in (cat_leve, cat_medio, cat_pesado);
  update public.registrations
    set current_category_id = cat_master_medio
    where id = reg_medio;

  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;

  select (public.request_category_change(reg_alone, cat_medio, 'troca por atleta sozinho'))->>'requestId' into request_id;
  if request_id is null then raise exception 'FAIL: request not created'; end if;

  rejected := false;
  begin
    perform public.request_category_change(reg_alone, cat_medio, 'segunda tentativa');
  exception when others then
    if sqlerrm <> 'Ja existe solicitacao pendente' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: duplicate pending allowed'; end if;

  reset role;
  perform set_config('request.jwt.claim.sub', outsider::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.request_category_change(reg_alone, cat_medio, 'pedido cruzado');
  exception when others then
    if sqlerrm <> 'Sem permissao para solicitar alteracao' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: outsider requested'; end if;

  rejected := false;
  begin
    perform public.review_category_change(request_id, true);
  exception when others then
    if sqlerrm <> 'Sem permissao para decidir alteracao' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: outsider approved'; end if;

  reset role;
  perform set_config('request.jwt.claim.sub', other_owner::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.review_category_change(request_id, true);
  exception when others then
    if sqlerrm <> 'Sem permissao para decidir alteracao' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: cross-event organizer approved'; end if;

  reset role;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  if (public.review_category_change(request_id, false)->>'status') <> 'recusada' then
    raise exception 'FAIL: rejection status';
  end if;
  if exists(select 1 from public.registrations where id = reg_alone and current_category_id is not null) then
    raise exception 'FAIL: rejection mutated allocation';
  end if;

  select (public.request_category_change(reg_alone, cat_medio, 'pedido para aprovar'))->>'requestId' into request_id;
  if (public.review_category_change(request_id, true)->>'status') <> 'aprovada' then
    raise exception 'FAIL: approval status';
  end if;
  select current_category_id into current_override from public.registrations where id = reg_alone;
  if current_override is distinct from cat_medio then raise exception 'FAIL: override missing'; end if;
  if exists(
    select 1 from public.registrations
    where id = reg_alone
      and (
        category_id <> cat_leve
        or athlete_snapshot is distinct from snapshot
        or category_snapshot is distinct from leve_snapshot
      )
  ) then raise exception 'FAIL: snapshot or original category mutated'; end if;
  if not exists(
    select 1 from public.event_audit_logs
    where resource_id = request_id and action = 'category_change_approved'
      and before_data->>'fromCategoryId' = cat_leve::text
      and after_data->>'toCategoryId' = cat_medio::text
      and after_data->>'reviewedBy' = owner::text
      and after_data->>'requesterId' = owner::text
  ) then raise exception 'FAIL: approval audit'; end if;

  rejected := false;
  begin
    perform public.review_category_change(request_id, true);
  exception when others then
    if sqlerrm <> 'Solicitacao nao esta pendente' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: second approval allowed'; end if;

  select coalesce(array_agg(id), '{}') into eligible_ids from public.list_eligible_category_changes(reg_alone);
  if cat_leve = any(eligible_ids) then
    raise exception 'FAIL: after override, original Leve still offered';
  end if;
  if not (cat_pesado = any(eligible_ids)) then
    raise exception 'FAIL: after override, Medio did not list Pesado';
  end if;

  select (public.request_category_change(reg_alone, cat_pesado, 'antes de travar pendente'))->>'requestId'
    into request_id;

  reset role;
  update public.event_categories set ativa = false where id = cat_pesado;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.review_category_change(request_id, true);
  exception when others then
    if sqlerrm <> 'Categoria de destino invalida' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: inactive destination approved'; end if;
  reset role;
  update public.event_categories set ativa = true where id = cat_pesado;

  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;

  if has_table_privilege('authenticated','public.registrations','UPDATE')
    or has_table_privilege('authenticated','public.category_change_requests','INSERT')
  then raise exception 'FAIL: direct write allowed'; end if;

  rejected := false;
  begin
    update public.registrations set category_id = cat_medio where id = reg_alone;
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: direct category_id update'; end if;

  perform public.lock_event_checagem(event);
  rejected := false;
  begin
    perform public.request_category_change(reg_alone, cat_pesado, 'depois do travamento');
  exception when others then
    if sqlerrm <> 'Checagem travada' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: request after lock'; end if;

  rejected := false;
  begin
    perform public.review_category_change(request_id, true);
  exception when others then
    if sqlerrm <> 'Checagem travada' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: approve after lock'; end if;
end;
$$;
rollback;
