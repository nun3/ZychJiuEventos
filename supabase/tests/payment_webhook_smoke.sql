-- Execute after 202609080001 through 202609080004. All fixtures roll back.
begin;

do $$
declare
  u uuid := gen_random_uuid(); org uuid := gen_random_uuid(); team uuid := gen_random_uuid();
  e uuid := gen_random_uuid(); rules uuid := gen_random_uuid(); category uuid := gen_random_uuid();
  athletes uuid[] := array[gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
  regs uuid[] := array[gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
  pays uuid[] := array[null::uuid,gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
  hooks uuid[] := array[gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
  v_payment_id uuid; v_total numeric; result jsonb; customer_claim jsonb; customer_token uuid;
  rejected boolean; i integer;
begin
  insert into auth.users(id,email,raw_user_meta_data) values (u,u::text||'@example.invalid','{}');
  update public.profiles set nome_completo='Payment webhook smoke',cpf='52998224725' where id=u;
  insert into public.organizations(id,nome,slug,created_by) values(org,'Payment webhook smoke',org::text,u);
  insert into public.teams(id,organization_id,nome,created_by) values(team,org,'Payment webhook smoke',u);
  insert into public.events(id,organization_id,nome,slug,data_evento,local,status,created_by,valor_inscricao)
  values(e,org,'Payment webhook smoke',e::text,current_date+30,'Teste','pagamento',u,123.45);
  insert into public.event_phases(event_id,tipo,inicio,fim)
  values(e,'pagamento',now()-interval '3 days',now()-interval '2 days');
  insert into public.category_rule_sets(id,event_id,nome,versao,ativo) values(rules,e,'Smoke',1,true);
  insert into public.event_categories(id,rule_set_id,nome,idade_min,idade_max,faixa_min_ordem,faixa_max_ordem,peso_max_kg,genero)
  values(category,rules,'Smoke',18,99,1,1,120,'M');
  for i in 1..8 loop
    insert into public.athletes(id,organization_id,team_id,nome_completo,data_nascimento,genero,faixa,peso_kg)
    values(athletes[i],org,team,'Payment athlete '||i,current_date-interval '25 years','M','Branca',70);
    insert into public.athlete_managers(manager_id,athlete_id,relationship_type) values(u,athletes[i],'professor');
    insert into public.registrations(id,event_id,athlete_id,category_id,registered_by,status,valor,athlete_snapshot,category_snapshot,rule_set_version,terms_version,terms_accepted_at)
    values(regs[i],e,athletes[i],category,u,'pendente_pagamento',123.45,jsonb_build_object('nome_completo','Payment athlete '||i),jsonb_build_object('nome','Smoke'),1,'MVP-2026-09',now());
  end loop;

  perform set_config('request.jwt.claim.sub',u::text,true);
  set local role authenticated;
  rejected:=false;
  begin
    perform public.reserve_payment_batch(e,array[regs[1]],'pix');
  exception when others then
    if sqlerrm<>'Evento fora da fase de pagamento' then raise; end if;
    rejected:=true;
  end;
  if not rejected then raise exception 'FAIL: prazo encerrado aceito pela RPC'; end if;
  rejected:=false;
  begin
    perform public.reserve_payment_batch(e,array_fill(regs[1],array[101]),'pix');
  exception when others then
    if sqlerrm<>'Limite de 100 inscricoes por pagamento' then raise; end if;
    rejected:=true;
  end;
  if not rejected then raise exception 'FAIL: lote acima do limite aceito'; end if;
  reset role;

  update public.event_phases set inicio=now()-interval '1 day',fim=now()+interval '1 day' where event_id=e and tipo='pagamento';
  set local role authenticated;
  select payment_id,total into strict v_payment_id,v_total
  from public.reserve_payment_batch(e,array[regs[1]],'pix');
  if v_total is distinct from 123.45 then raise exception 'FAIL: total da reserva'; end if;
  pays[1]:=v_payment_id;
  reset role;

  for i in 2..8 loop
    insert into public.payments(id,event_id,created_by,valor_total,metodo,status,gateway,external_reference,paid_at)
    values(pays[i],e,u,123.45,case when i=4 then 'boleto'::public.payment_method else 'pix'::public.payment_method end,
      case when i=6 then 'pago'::public.payment_status else 'aguardando'::public.payment_status end,
      'asaas','meucamp:'||pays[i],case when i=6 then now() else null end);
    insert into public.payment_registrations(payment_id,registration_id,amount) values(pays[i],regs[i],123.45);
  end loop;
  update public.registrations set status='efetivada' where id=regs[6];
  for i in 1..8 loop
    insert into public.payment_attempts(payment_id,gateway_payment_id,status)
    values(pays[i],'pay_smoke_'||i,case when i=6 then 'pago'::public.payment_status else 'aguardando'::public.payment_status end);
  end loop;

  insert into public.webhook_events(id,gateway,external_event_id,event_type,payload) values
    (hooks[1],'asaas','evt_received','PAYMENT_RECEIVED',jsonb_build_object('id','evt_received','event','PAYMENT_RECEIVED','payment',jsonb_build_object('id','pay_smoke_1','externalReference','meucamp:'||pays[1],'value',123.45,'billingType','PIX','status','RECEIVED'))),
    (hooks[2],'asaas','evt_value','PAYMENT_RECEIVED',jsonb_build_object('id','evt_value','event','PAYMENT_RECEIVED','payment',jsonb_build_object('id','pay_smoke_2','externalReference','meucamp:'||pays[2],'value',1,'billingType','PIX','status','RECEIVED'))),
    (hooks[3],'asaas','evt_reference','PAYMENT_RECEIVED',jsonb_build_object('id','evt_reference','event','PAYMENT_RECEIVED','payment',jsonb_build_object('id','pay_smoke_3','externalReference','meucamp:missing','value',123.45,'billingType','PIX','status','RECEIVED'))),
    (hooks[4],'asaas','evt_method','PAYMENT_RECEIVED',jsonb_build_object('id','evt_method','event','PAYMENT_RECEIVED','payment',jsonb_build_object('id','pay_smoke_4','externalReference','meucamp:'||pays[4],'value',123.45,'billingType','PIX','status','RECEIVED'))),
    (hooks[5],'asaas','evt_confirmed','PAYMENT_CONFIRMED',jsonb_build_object('id','evt_confirmed','event','PAYMENT_CONFIRMED','payment',jsonb_build_object('id','pay_smoke_5','externalReference','meucamp:'||pays[5],'value',123.45,'billingType','PIX','status','CONFIRMED'))),
    (hooks[6],'asaas','evt_late_overdue','PAYMENT_OVERDUE',jsonb_build_object('id','evt_late_overdue','event','PAYMENT_OVERDUE','payment',jsonb_build_object('id','pay_smoke_6','externalReference','meucamp:'||pays[6],'value',123.45,'billingType','PIX','status','OVERDUE'))),
    (hooks[7],'asaas','evt_bad_refund','PAYMENT_REFUNDED',jsonb_build_object('id','evt_bad_refund','event','PAYMENT_REFUNDED','payment',jsonb_build_object('id','pay_smoke_7','externalReference','meucamp:'||pays[7],'value',123.45,'billingType','PIX','status','REFUNDED')));

  set local role service_role;
  result:=public.process_payment_webhook(hooks[1]);
  if result->>'kind'<>'processed' then raise exception 'FAIL: recebimento valido'; end if;
  if not exists(select 1 from public.payments where id=pays[1] and status='pago')
    or not exists(select 1 from public.registrations where id=regs[1] and status='efetivada') then raise exception 'FAIL: efetivacao atomica'; end if;
  result:=public.process_payment_webhook(hooks[1]);
  if result->>'kind'<>'duplicate' or (select attempts from public.webhook_events where id=hooks[1])<>1 then raise exception 'FAIL: duplicidade'; end if;
  for i in 2..7 loop
    result:=public.process_payment_webhook(hooks[i]);
    if result->>'kind'<>'review' then raise exception 'FAIL: evento % deveria exigir conciliacao',i; end if;
  end loop;
  if exists(select 1 from public.payments where id=any(pays[2:5]) and status<>'aguardando') then raise exception 'FAIL: divergencia alterou pagamento'; end if;
  if not exists(select 1 from public.payments where id=pays[6] and status='pago')
    or not exists(select 1 from public.registrations where id=regs[6] and status='efetivada') then raise exception 'FAIL: evento atrasado regrediu estado'; end if;
  if not exists(select 1 from public.payments where id=pays[7] and status='aguardando') then raise exception 'FAIL: estorno inconsistente alterou estado'; end if;

  customer_claim:=public.claim_payment_customer(u);
  if customer_claim->>'kind'<>'claimed' then raise exception 'FAIL: claim do pagador'; end if;
  customer_token:=(customer_claim->>'token')::uuid;
  if (public.claim_payment_customer(u)->>'kind')<>'busy' then raise exception 'FAIL: claim concorrente do pagador'; end if;
  perform public.complete_payment_customer(u,customer_token,'cus_smoke');
  customer_claim:=public.claim_payment_customer(u);
  if customer_claim->>'kind'<>'ready' or customer_claim->>'customerId'<>'cus_smoke' then raise exception 'FAIL: reuso do pagador'; end if;
  insert into public.payment_issuance_jobs(payment_id,state,token) values(pays[8],'claimed',customer_token);
  perform public.release_payment_issuance_claim(pays[8],customer_token);
  if exists(select 1 from public.payment_issuance_jobs where payment_id=pays[8]) then raise exception 'FAIL: claim recusado nao foi liberado'; end if;
  reset role;

  set local role authenticated;
  rejected:=false;
  begin
    perform public.settle_payment_manually(pays[8],'motivo curto e valido');
  exception when others then
    if sqlerrm<>'Sem permissao para baixa manual' then raise; end if;
    rejected:=true;
  end;
  if not rejected then raise exception 'FAIL: baixa manual sem papel foi aceita'; end if;
  rejected:=false;
  begin
    perform public.settle_payment_manually(pays[8],'curto');
  exception when others then
    if sqlerrm<>'Justificativa deve ter entre 10 e 500 caracteres' then raise; end if;
    rejected:=true;
  end;
  if not rejected then raise exception 'FAIL: justificativa curta foi aceita'; end if;
  reset role;

  insert into public.organization_members(organization_id,user_id,role) values(org,u,'owner');
  set local role authenticated;
  result:=public.settle_payment_manually(pays[8],'Baixa manual controlada no smoke');
  if result->>'kind'<>'settled'
    or not exists(select 1 from public.payments where id=pays[8] and status='pago')
    or not exists(select 1 from public.registrations where id=regs[8] and status='efetivada')
    or not exists(select 1 from public.event_audit_logs where resource_id=pays[8] and action='payment_manually_settled' and actor_id=u and reason='Baixa manual controlada no smoke')
  then raise exception 'FAIL: baixa manual atomica ou auditoria'; end if;
  reset role;

  if has_function_privilege('authenticated','public.process_payment_webhook(uuid)','EXECUTE')
    or has_function_privilege('authenticated','public.claim_payment_customer(uuid)','EXECUTE')
    or has_function_privilege('authenticated','public.release_payment_issuance_claim(uuid,uuid)','EXECUTE')
    or has_table_privilege('authenticated','public.webhook_events','INSERT') then raise exception 'FAIL: acesso interno exposto'; end if;
end;
$$;

rollback;
select 'APROVADO: prazo, limite, recebimento, duplicidade, divergencias, ordem, estorno, pagador, recusa, baixa manual, auditoria e privilegios' as resultado;
