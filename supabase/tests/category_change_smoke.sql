-- Sprint 7 lote 2. Fixtures roll back.
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
  cat_a uuid := gen_random_uuid();
  cat_b uuid := gen_random_uuid();
  athlete_alone uuid := gen_random_uuid();
  athlete_pair_one uuid := gen_random_uuid();
  athlete_pair_two uuid := gen_random_uuid();
  reg_alone uuid := gen_random_uuid();
  reg_pair_one uuid := gen_random_uuid();
  reg_pair_two uuid := gen_random_uuid();
  request_id uuid;
  rejected boolean;
  snapshot jsonb;
  current_override uuid;
begin
  insert into auth.users(id, email, raw_user_meta_data) values
    (owner, owner::text || '@example.invalid', '{}'),
    (outsider, outsider::text || '@example.invalid', '{}'),
    (other_owner, other_owner::text || '@example.invalid', '{}');
  insert into public.organizations(id,nome,slug,created_by) values
    (org,'Checagem lote 2',org::text,owner),
    (other_org,'Outra org',other_org::text,other_owner);
  insert into public.organization_members(organization_id,user_id,role) values
    (org,owner,'owner'), (other_org,other_owner,'owner');
  insert into public.teams(id,organization_id,nome,created_by) values(team,org,'Equipe',owner);
  insert into public.events(id,organization_id,nome,slug,data_evento,local,status,created_by,valor_inscricao)
    values
      (event,org,'Evento checagem',event::text,current_date,'Teste','checagem',owner,80),
      (other_event,other_org,'Outro evento',other_event::text,current_date,'Teste','checagem',other_owner,80);
  insert into public.category_rule_sets(id,event_id,nome,versao,ativo) values(rules,event,'Regras',1,true);
  insert into public.event_categories(id,rule_set_id,nome,idade_min,idade_max,faixa_min_ordem,faixa_max_ordem,peso_min_kg,peso_max_kg,genero,ordem)
    values
      (cat_a,rules,'Leve',18,99,1,1,0,80,'M',1),
      (cat_b,rules,'Medio',18,99,1,1,0,120,'M',2);
  insert into public.athletes(id,organization_id,team_id,nome_completo,data_nascimento,genero,faixa,peso_kg)
    values
      (athlete_alone,org,team,'Sozinho',current_date-interval '25 years','M','Branca',70),
      (athlete_pair_one,org,team,'Par 1',current_date-interval '25 years','M','Branca',70),
      (athlete_pair_two,org,team,'Par 2',current_date-interval '25 years','M','Branca',70);
  insert into public.athlete_managers(manager_id,athlete_id,relationship_type) values
    (owner,athlete_alone,'professor'),
    (owner,athlete_pair_one,'professor'),
    (owner,athlete_pair_two,'professor');

  snapshot := jsonb_build_object(
    'nome_completo','Sozinho','data_nascimento',(current_date-interval '25 years')::date,
    'genero','M','faixa','Branca','peso_kg',70,'team_id',team,'team_name','Equipe'
  );
  insert into public.registrations(
    id,event_id,athlete_id,category_id,registered_by,status,valor,
    athlete_snapshot,category_snapshot,rule_set_version,terms_version,terms_accepted_at
  ) values
    (reg_alone,event,athlete_alone,cat_a,owner,'efetivada',80,snapshot,jsonb_build_object('nome','Leve'),1,'MVP-2026-09',now()),
    (reg_pair_one,event,athlete_pair_one,cat_a,owner,'efetivada',80,snapshot || jsonb_build_object('nome_completo','Par 1'),jsonb_build_object('nome','Leve'),1,'MVP-2026-09',now()),
    (reg_pair_two,event,athlete_pair_two,cat_a,owner,'efetivada',80,snapshot || jsonb_build_object('nome_completo','Par 2'),jsonb_build_object('nome','Leve'),1,'MVP-2026-09',now());

  -- pair occupies Leve; alone athlete is also Leve so NOT alone. Move pairs to Medio via override as table owner to isolate sozinho.
  update public.registrations set current_category_id = cat_b where id in (reg_pair_one, reg_pair_two);

  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;

  if exists(select 1 from public.list_eligible_category_changes(reg_pair_one)) then
    raise exception 'FAIL: paired athlete listed as eligible';
  end if;

  rejected := false;
  begin
    perform public.request_category_change(reg_pair_one, cat_b, 'motivo valido');
  exception when others then
    if sqlerrm <> 'Atleta nao esta sozinho na categoria' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: request allowed for occupied category'; end if;

  if not exists(select 1 from public.list_eligible_category_changes(reg_alone) where id = cat_b) then
    raise exception 'FAIL: eligible destination missing';
  end if;

  select (public.request_category_change(reg_alone, cat_b, 'troca por atleta sozinho'))->>'requestId' into request_id;
  if request_id is null then raise exception 'FAIL: request not created'; end if;

  rejected := false;
  begin
    perform public.request_category_change(reg_alone, cat_b, 'segunda tentativa');
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
    perform public.request_category_change(reg_alone, cat_b, 'pedido cruzado');
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

  select (public.request_category_change(reg_alone, cat_b, 'pedido para aprovar'))->>'requestId' into request_id;
  if (public.review_category_change(request_id, true)->>'status') <> 'aprovada' then
    raise exception 'FAIL: approval status';
  end if;
  select current_category_id into current_override from public.registrations where id = reg_alone;
  if current_override is distinct from cat_b then raise exception 'FAIL: override missing'; end if;
  if exists(select 1 from public.registrations where id = reg_alone and (category_id <> cat_a or athlete_snapshot->>'nome_completo' <> 'Sozinho')) then
    raise exception 'FAIL: snapshot mutated';
  end if;
  if not exists(
    select 1 from public.event_audit_logs
    where resource_id = request_id and action = 'category_change_approved'
      and before_data->>'fromCategoryId' = cat_a::text
      and after_data->>'toCategoryId' = cat_b::text
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

  -- After approval the athlete is in Medio with the pair; lock tests use a pending created while still alone.
  -- Reset occupancy: pairs leave Medio so the approved athlete can request Leve again.
  reset role;
  update public.registrations set current_category_id = null where id in (reg_pair_one, reg_pair_two);
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;

  update public.events set checagem_travada_em = now() where id = event;
  rejected := false;
  begin
    perform public.request_category_change(reg_alone, cat_a, 'depois do travamento');
  exception when others then
    if sqlerrm <> 'Checagem travada' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: request after lock'; end if;

  update public.events set checagem_travada_em = null where id = event;
  perform public.request_category_change(reg_alone, cat_a, 'antes de travar pendente');
  select id into request_id from public.category_change_requests
    where registration_id = reg_alone and status = 'pendente';
  update public.events set checagem_travada_em = now() where id = event;
  rejected := false;
  begin
    perform public.review_category_change(request_id, true);
  exception when others then
    if sqlerrm <> 'Checagem travada' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: approve after lock'; end if;
  update public.events set checagem_travada_em = null where id = event;

  update public.event_categories set ativa = false where id = cat_a;
  rejected := false;
  begin
    perform public.review_category_change(request_id, true);
  exception when others then
    if sqlerrm <> 'Categoria de destino invalida' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: invalid destination approved'; end if;
  update public.event_categories set ativa = true where id = cat_a;

  if has_table_privilege('authenticated','public.registrations','UPDATE')
    or has_table_privilege('authenticated','public.category_change_requests','INSERT')
  then raise exception 'FAIL: direct write allowed'; end if;

  rejected := false;
  begin
    update public.registrations set category_id = cat_b where id = reg_alone;
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: direct category_id update'; end if;
end;
$$;
rollback;
