-- Execute after both Sprint 5 migrations. All fixtures roll back.
begin;
do $$
declare
  u uuid := gen_random_uuid(); outsider uuid := gen_random_uuid();
  org uuid := gen_random_uuid(); team uuid := gen_random_uuid();
  event uuid := gen_random_uuid(); rules uuid := gen_random_uuid();
  cat uuid := gen_random_uuid(); a uuid := gen_random_uuid(); b uuid := gen_random_uuid();
  forbidden uuid := gen_random_uuid(); invalid uuid := gen_random_uuid();
  saved uuid; count_rows integer; rejected boolean;
begin
  insert into auth.users(id, email, raw_user_meta_data) values
    (u, u::text || '@example.invalid', '{}'), (outsider, outsider::text || '@example.invalid', '{}');
  insert into public.organizations(id,nome,slug,created_by) values(org,'Sprint5 Smoke',org::text,u);
  insert into public.organization_members(organization_id,user_id,role) values(org,u,'owner');
  insert into public.teams(id,organization_id,nome,created_by) values(team,org,'Smoke',u);
  insert into public.events(id,organization_id,nome,slug,data_evento,local,status,created_by,valor_inscricao)
    values(event,org,'Smoke inscrição',event::text,current_date,'Teste','inscricao',u,123.45);
  insert into public.event_phases(event_id,tipo,inicio,fim) values(event,'inscricao',now()-interval '1 day',now()+interval '1 day');
  insert into public.category_rule_sets(id,event_id,nome,versao,ativo) values(rules,event,'Smoke',1,true);
  insert into public.event_categories(id,rule_set_id,nome,idade_min,idade_max,faixa_min_ordem,faixa_max_ordem,peso_min_kg,peso_max_kg,genero,ordem)
    values(cat,rules,'Categoria congelada',18,99,1,1,60,76,'M',1);
  insert into public.athletes(id,organization_id,team_id,nome_completo,data_nascimento,genero,faixa,peso_kg,user_id) values
    (a,org,team,'Próprio',current_date-interval '25 years','M','Branca',60,u),
    (b,org,team,'Gerenciado',current_date-interval '26 years','M','Branca',76,null),
    (forbidden,org,team,'Terceiro',current_date-interval '25 years','M','Branca',70,outsider),
    (invalid,org,team,'Sem categoria',current_date-interval '25 years','M','Branca',76.01,null);
  insert into public.athlete_managers(manager_id,athlete_id,relationship_type) values(u,b,'professor'),(u,invalid,'professor');
  perform set_config('request.jwt.claim.sub',u::text,true);

  rejected := false;
  begin perform public.create_event_registrations(event,array[a],'MVP-2026-09',null);
  exception when others then if sqlerrm <> 'Aceite dos termos obrigatorio' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'FAIL: null terms accepted'; end if;
  rejected := false;
  begin perform public.create_event_registrations(event,array[a],'invalido',true);
  exception when others then if sqlerrm <> 'Aceite dos termos obrigatorio' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'FAIL: invalid terms version'; end if;
  rejected := false;
  begin perform public.create_event_registrations(event,array[a,a],'MVP-2026-09',true);
  exception when others then if sqlerrm <> 'Lista de atletas duplicada' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'FAIL: duplicate input'; end if;
  rejected := false;
  begin perform public.create_event_registrations(event,array[a,forbidden],'MVP-2026-09',true);
  exception when others then if sqlerrm <> 'Atleta fora do seu escopo' then raise; end if; rejected := true; end;
  if not rejected or exists(select 1 from public.registrations where event_id=event) then raise exception 'FAIL: scope or atomicity'; end if;
  rejected := false;
  begin perform public.create_event_registrations(event,array[a,invalid],'MVP-2026-09',true);
  exception when others then if sqlerrm not like 'Nenhuma categoria elegivel%' then raise; end if; rejected := true; end;
  if not rejected or exists(select 1 from public.registrations where event_id=event) then raise exception 'FAIL: category or atomicity'; end if;

  insert into public.event_categories(rule_set_id,nome,idade_min,idade_max,faixa_min_ordem,faixa_max_ordem,peso_min_kg,peso_max_kg,genero,ordem)
    values(rules,'Ambígua',18,99,1,1,60,76,'M',1);
  rejected := false;
  begin perform public.create_event_registrations(event,array[a],'MVP-2026-09',true);
  exception when others then if sqlerrm not like 'Categorizacao ambigua%' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'FAIL: ambiguity'; end if;
  update public.event_categories set ordem=2 where rule_set_id=rules and id<>cat;

  update public.event_phases set inicio=now()-interval '3 days',fim=now()-interval '2 days' where event_id=event;
  rejected := false;
  begin perform public.create_event_registrations(event,array[a],'MVP-2026-09',true);
  exception when others then if sqlerrm <> 'Prazo de inscricao encerrado' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'FAIL: expired deadline'; end if;
  update public.event_phases set inicio=now()-interval '1 day',fim=now()+interval '1 day' where event_id=event;

  set local role authenticated;
  select count(*) into count_rows from public.create_event_registrations(event,array[a,b],'MVP-2026-09',true);
  if count_rows<>2 then raise exception 'FAIL: batch size'; end if;
  select id into saved from public.registrations where event_id=event and athlete_id=a;
  if not exists(select 1 from public.registrations where id=saved and status='pendente_pagamento' and valor=123.45 and category_id=cat and terms_version='MVP-2026-09') then raise exception 'FAIL: persisted values'; end if;
  rejected := false;
  begin perform public.create_event_registrations(event,array[a],'MVP-2026-09',true);
  exception when others then if sqlerrm <> 'Atleta ja possui inscricao ativa no evento' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'FAIL: active duplicate'; end if;
  if has_table_privilege('authenticated','public.registrations','INSERT') or has_table_privilege('authenticated','public.registrations','UPDATE') then raise exception 'FAIL: direct write allowed'; end if;
  perform set_config('request.jwt.claim.sub',outsider::text,true);
  if exists(select 1 from public.registrations where event_id=event) then raise exception 'FAIL: cross-user read'; end if;
  reset role;
  perform set_config('request.jwt.claim.sub',u::text,true);
  update public.event_categories set nome='Nome alterado' where id=cat;
  update public.athletes set peso_kg=75 where id=a;
  if not exists(select 1 from public.registrations where id=saved and category_snapshot->>'nome'='Categoria congelada' and athlete_snapshot->>'peso_kg'='60.00') then raise exception 'FAIL: snapshot changed'; end if;
  rejected := false;
  begin update public.registrations set valor=1 where id=saved;
  exception when check_violation then rejected := true; end;
  if not rejected then raise exception 'FAIL: immutable snapshot'; end if;
  update public.events set status='pagamento' where id=event;
  rejected := false;
  begin perform public.create_event_registrations(event,array[invalid],'MVP-2026-09',true);
  exception when others then if sqlerrm <> 'Evento fora da fase de inscricao' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'FAIL: event phase'; end if;
  perform set_config('request.jwt.claim.sub','',true);
  rejected := false;
  begin perform public.create_event_registrations(event,array[invalid],'MVP-2026-09',true);
  exception when others then if sqlerrm <> 'Autenticacao obrigatoria' then raise; end if; rejected := true; end;
  if not rejected then raise exception 'FAIL: anonymous'; end if;
end;
$$;
select 'APROVADO: lote, proprio/gerenciado, RLS, atomicidade, duplicidade, termos, prazo, fase, limites, ambiguidade e snapshot' as resultado;
rollback;
