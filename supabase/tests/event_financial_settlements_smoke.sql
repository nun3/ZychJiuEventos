-- Lote 4: fechamento financeiro (R$ 8 por inscricao paga), emissao com split e webhook de fechamento.
-- Fixtures em transacao; rollback ao final. Nao toca MEU CAMP, usuarios reais nem Asaas.
begin;

do $$
declare
  owner_a uuid := gen_random_uuid();
  organizer_a uuid := gen_random_uuid();
  finance_a uuid := gen_random_uuid();
  staff_a uuid := gen_random_uuid();
  owner_b uuid := gen_random_uuid();
  payer uuid := gen_random_uuid();
  stranger uuid := gen_random_uuid();
  org_a uuid := gen_random_uuid();
  org_b uuid := gen_random_uuid();
  team_a uuid := gen_random_uuid();
  event_a uuid := gen_random_uuid();
  event_b uuid := gen_random_uuid();
  rule_a uuid := gen_random_uuid();
  category_a uuid := gen_random_uuid();
  athlete_ids uuid[] := array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
  registration_ids uuid[] := array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
  payment_ids uuid[] := array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
  settlement_1 uuid;
  settlement_2 uuid;
  settlement_b uuid;
  token uuid;
  webhook uuid;
  payload jsonb;
  visible integer;
  rejected boolean;
  message text;
  reference text;
  i integer;
begin
  insert into auth.users(id, email, raw_user_meta_data)
  select id, 'settlement-smoke-' || label || '-' || id::text || '@example.invalid',
         jsonb_build_object('nome_completo', 'Settlement Smoke ' || label, 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')
    from (values
      (owner_a, 'owner-a'), (organizer_a, 'organizer-a'), (finance_a, 'finance-a'), (staff_a, 'staff-a'),
      (owner_b, 'owner-b'), (payer, 'payer'), (stranger, 'stranger')
    ) as fixture(id, label);

  insert into public.organizations(id, nome, slug, created_by) values
    (org_a, 'Settlement Smoke Org A', 'settlement-smoke-a-' || substr(replace(org_a::text, '-', ''), 1, 8), owner_a),
    (org_b, 'Settlement Smoke Org B', 'settlement-smoke-b-' || substr(replace(org_b::text, '-', ''), 1, 8), owner_b);
  insert into public.organization_members(organization_id, user_id, role) values
    (org_a, owner_a, 'owner'), (org_a, organizer_a, 'organizer'), (org_a, finance_a, 'finance'),
    (org_a, staff_a, 'staff'), (org_b, owner_b, 'owner');

  insert into public.teams(id, organization_id, nome, created_by) values (team_a, org_a, 'Settlement Smoke Equipe', owner_a);
  for i in 1..4 loop
    insert into public.athletes(id, organization_id, team_id, nome_completo, data_nascimento, genero, faixa, peso_kg)
    values (athlete_ids[i], org_a, team_a, 'Atleta Fechamento ' || i, '1995-01-01', 'M', 'Branca', 70);
  end loop;

  insert into public.events(id, organization_id, nome, slug, data_evento, local, status, created_by, valor_inscricao) values
    (event_a, org_a, 'Settlement Smoke Evento A', 'settlement-smoke-a-' || event_a::text, current_date + 30, 'Sandbox', 'pagamento', owner_a, 80),
    (event_b, org_b, 'Settlement Smoke Evento B', 'settlement-smoke-b-' || event_b::text, current_date + 30, 'Sandbox', 'pagamento', owner_b, 50);
  insert into public.category_rule_sets(id, event_id, nome, versao, ativo) values (rule_a, event_a, 'Settlement Smoke', 1, true);
  insert into public.event_categories(id, rule_set_id, nome, idade_min, idade_max, faixa_min_ordem, faixa_max_ordem, peso_max_kg, genero)
    values (category_a, rule_a, 'Adulto Fechamento', 18, 99, 1, 1, 120, 'M');

  -- Inscricoes 1 e 2 pagas e efetivadas; 3 pendente; 4 fica para o fechamento #2.
  for i in 1..4 loop
    insert into public.registrations(
      id, event_id, athlete_id, category_id, registered_by, status, valor,
      athlete_snapshot, category_snapshot, rule_set_version, terms_version, terms_accepted_at
    ) values (
      registration_ids[i], event_a, athlete_ids[i], category_a, payer,
      case when i in (1, 2) then 'efetivada' else 'pendente_pagamento' end::public.registration_status, 80,
      jsonb_build_object('nome_completo', 'Atleta Fechamento ' || i), '{"nome":"Adulto Fechamento"}', 1, 'MVP-2026-09', now()
    );
    insert into public.payments(id, event_id, created_by, valor_total, metodo, status, gateway, paid_at)
    values (payment_ids[i], event_a, payer, 80, 'pix', case when i in (1, 2) then 'pago' else 'aguardando' end::public.payment_status, 'manual',
            case when i in (1, 2) then now() else null end);
    insert into public.payment_registrations(payment_id, registration_id, amount) values (payment_ids[i], registration_ids[i], 80);
  end loop;

  -- 1) Somente owner/organizer da propria organizacao emite; anon nao executa.
  foreach message in array array[finance_a::text, staff_a::text, owner_b::text, stranger::text, payer::text] loop
    perform set_config('request.jwt.claim.sub', message, true);
    set local role authenticated;
    rejected := false;
    begin
      perform public.create_event_financial_settlement(event_a);
    exception when others then rejected := sqlerrm like '%Sem permissao%';
    end;
    if not rejected then raise exception 'FAIL 1: % emitiu fechamento da org A', message; end if;
    reset role;
  end loop;
  set local role anon;
  rejected := false;
  begin
    perform public.create_event_financial_settlement(event_a);
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 1: anon executou create_event_financial_settlement'; end if;
  reset role;

  -- 2) Gate: comprovante em analise bloqueia o fechamento.
  insert into public.payment_receipts(id, payment_id, organization_id, event_id, uploaded_by, storage_path, mime_type, size_bytes)
  values (gen_random_uuid(), payment_ids[3], org_a, event_a, payer, 'smoke/' || gen_random_uuid()::text || '.pdf', 'application/pdf', 10);
  perform set_config('request.jwt.claim.sub', organizer_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.create_event_financial_settlement(event_a);
  exception when others then rejected := sqlerrm like '%comprovantes em analise%';
  end;
  if not rejected then raise exception 'FAIL 2: fechamento emitido com comprovante em analise'; end if;
  reset role;
  delete from public.payment_receipts where event_id = event_a;

  -- 3) Emissao: 2 inscricoes pagas x R$ 8 = R$ 16, snapshot congelado.
  perform set_config('request.jwt.claim.sub', organizer_a::text, true);
  set local role authenticated;
  payload := public.create_event_financial_settlement(event_a);
  reset role;
  settlement_1 := (payload->>'settlementId')::uuid;
  if (payload->>'registrationCount')::int <> 2 or (payload->>'platformFeeGrossCents')::bigint <> 1600 or (payload->>'sequenceNumber')::int <> 1 then
    raise exception 'FAIL 3: payload %', payload;
  end if;
  if not exists (
    select 1 from public.event_financial_settlements
     where id = settlement_1 and fee_type = 'FIXED_PER_PAID_REGISTRATION' and fee_per_registration_cents = 800
       and gross_confirmed_cents = 16000 and status = 'pendente_emissao' and created_by = organizer_a
       and commercial_policy_snapshot->>'valueCents' = '800' and provider_external_reference = 'meucamp:settlement:' || settlement_1::text
  ) then
    raise exception 'FAIL 3: fechamento persistido incorreto';
  end if;
  select count(*) into visible from public.event_financial_settlement_items where settlement_id = settlement_1 and fee_cents = 800;
  if visible <> 2 then raise exception 'FAIL 3: itens %', visible; end if;
  if not exists (select 1 from public.event_audit_logs where action = 'event_financial_settlement_created' and resource_id = settlement_1 and actor_id = organizer_a) then
    raise exception 'FAIL 3: auditoria de criacao ausente';
  end if;

  -- 4) Dedup: nada novo para fechar; inscricao nao entra em dois fechamentos.
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.create_event_financial_settlement(event_a);
  exception when others then rejected := sqlerrm like '%Nenhuma inscricao paga%';
  end;
  if not rejected then raise exception 'FAIL 4: fechamento duplicado emitido'; end if;
  reset role;
  rejected := false;
  begin
    insert into public.event_financial_settlement_items(settlement_id, registration_id, payment_id, gross_cents, fee_cents)
    values (settlement_1, registration_ids[1], payment_ids[1], 8000, 800);
  exception when unique_violation then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 4: item duplicado aceito'; end if;

  -- Org B emite o proprio fechamento para o teste de isolamento.
  insert into public.registrations(
    id, event_id, athlete_id, category_id, registered_by, status, valor,
    athlete_snapshot, category_snapshot, rule_set_version, terms_version, terms_accepted_at
  ) select gen_random_uuid(), event_b, athlete_ids[1], category_a, payer, 'efetivada', 50, '{}', '{}', 1, 'MVP-2026-09', now();
  insert into public.payments(id, event_id, created_by, valor_total, metodo, status, gateway, paid_at)
  values (gen_random_uuid(), event_b, payer, 50, 'pix', 'pago', 'manual', now()) returning id into webhook;
  insert into public.payment_registrations(payment_id, registration_id, amount)
  select webhook, id, 50 from public.registrations where event_id = event_b;
  perform set_config('request.jwt.claim.sub', owner_b::text, true);
  set local role authenticated;
  settlement_b := (public.create_event_financial_settlement(event_b)->>'settlementId')::uuid;
  reset role;

  -- 5) Isolamento de leitura.
  foreach message in array array[owner_a::text, organizer_a::text, finance_a::text] loop
    perform set_config('request.jwt.claim.sub', message, true);
    set local role authenticated;
    select count(*) into visible from public.event_financial_settlements;
    if visible <> 1 then raise exception 'FAIL 5: % viu % fechamentos (esperado 1, da org A)', message, visible; end if;
    select count(*) into visible from public.event_financial_settlement_items;
    if visible <> 2 then raise exception 'FAIL 5: % viu % itens', message, visible; end if;
    reset role;
  end loop;
  foreach message in array array[staff_a::text, stranger::text, payer::text] loop
    perform set_config('request.jwt.claim.sub', message, true);
    set local role authenticated;
    select count(*) into visible from public.event_financial_settlements;
    if visible <> 0 then raise exception 'FAIL 5: % viu fechamentos', message; end if;
    reset role;
  end loop;
  perform set_config('request.jwt.claim.sub', owner_b::text, true);
  set local role authenticated;
  select count(*) into visible from public.event_financial_settlements where id = settlement_1;
  if visible <> 0 then raise exception 'FAIL 5: org B viu fechamento da org A'; end if;
  select count(*) into visible from public.event_financial_settlements where id = settlement_b;
  if visible <> 1 then raise exception 'FAIL 5: org B nao viu o proprio fechamento'; end if;
  reset role;
  set local role anon;
  begin
    select count(*) into visible from public.event_financial_settlements;
  exception when insufficient_privilege then visible := 0;
  end;
  if visible <> 0 then raise exception 'FAIL 5: anon leu fechamentos'; end if;
  reset role;

  -- 6) Organizador nao altera taxa, wallet nem percentual; nao escreve direto.
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    update public.event_financial_settlements set fee_per_registration_cents = 1 where id = settlement_1;
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 6: owner alterou taxa'; end if;
  rejected := false;
  begin
    update public.event_financial_settlements set split_recipient_wallet_id = 'golpe', split_percent = 100 where id = settlement_1;
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 6: owner alterou wallet/percentual'; end if;
  rejected := false;
  begin
    delete from public.event_financial_settlement_items where settlement_id = settlement_1;
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 6: owner apagou itens'; end if;
  rejected := false;
  begin
    perform public.claim_settlement_issuance(settlement_1, owner_a);
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 6: authenticated executou RPC privada de emissao'; end if;
  rejected := false;
  begin
    perform public.process_settlement_webhook(gen_random_uuid());
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 6: authenticated executou RPC privada de webhook'; end if;
  reset role;
  if exists (select 1 from public.event_financial_settlement_items where settlement_id = settlement_1 and fee_cents <> 800) then
    raise exception 'FAIL 6: itens alterados';
  end if;

  -- 7) Imutabilidade vale ate para a credencial privada.
  rejected := false;
  begin
    update public.event_financial_settlements set platform_fee_gross_cents = 1, eligible_registration_count = 1, fee_per_registration_cents = 1 where id = settlement_1;
  exception when others then rejected := sqlerrm like '%imutavel%';
  end;
  if not rejected then raise exception 'FAIL 7: valores do fechamento alterados'; end if;
  rejected := false;
  begin
    update public.event_financial_settlement_items set fee_cents = 1 where settlement_id = settlement_1;
  exception when others then rejected := sqlerrm like '%imutavel%';
  end;
  if not rejected then raise exception 'FAIL 7: item alterado'; end if;

  -- 8) Cliente Asaas da organizacao.
  rejected := false;
  begin
    perform public.claim_organization_billing_customer(org_a, stranger);
  exception when others then rejected := sqlerrm like '%Sem permissao%';
  end;
  if not rejected then raise exception 'FAIL 8: estranho provisionou cliente da org A'; end if;
  rejected := false;
  begin
    perform public.claim_settlement_issuance(settlement_1, owner_a);
  exception when others then rejected := sqlerrm like '%Cliente da organizacao indisponivel%';
  end;
  if not rejected then raise exception 'FAIL 8: emissao sem cliente da organizacao'; end if;
  payload := public.claim_organization_billing_customer(org_a, owner_a);
  if payload->>'kind' <> 'claimed' or payload->>'reference' <> 'meucamp:org:' || org_a::text then raise exception 'FAIL 8: claim %', payload; end if;
  if (public.claim_organization_billing_customer(org_a, organizer_a))->>'kind' <> 'busy' then raise exception 'FAIL 8: claim concorrente nao ficou busy'; end if;
  perform public.complete_organization_billing_customer(org_a, (payload->>'token')::uuid, 'cus_smoke_org_a');
  payload := public.claim_organization_billing_customer(org_a, organizer_a);
  if payload->>'kind' <> 'ready' or payload->>'customerId' <> 'cus_smoke_org_a' then raise exception 'FAIL 8: cliente pronto %', payload; end if;

  -- 9) Claim de emissao: papel, valor, idempotencia e persistencia do split.
  rejected := false;
  begin
    perform public.claim_settlement_issuance(settlement_1, owner_b);
  exception when others then rejected := sqlerrm like '%Sem permissao%';
  end;
  if not rejected then raise exception 'FAIL 9: owner B emitiu cobranca da org A'; end if;
  payload := public.claim_settlement_issuance(settlement_1, organizer_a);
  if payload->>'kind' <> 'claimed' or (payload->'input'->>'totalCents')::bigint <> 1600 or payload->'input'->>'method' <> 'pix'
     or payload->'input'->>'customerId' <> 'cus_smoke_org_a' or payload->'input'->>'reference' <> 'meucamp:settlement:' || settlement_1::text then
    raise exception 'FAIL 9: claim %', payload;
  end if;
  token := (payload->>'token')::uuid;
  if (public.claim_settlement_issuance(settlement_1, organizer_a))->>'kind' <> 'busy' then raise exception 'FAIL 9: segundo claim nao ficou busy'; end if;
  reference := 'meucamp:settlement:' || settlement_1::text;
  rejected := false;
  begin
    perform public.complete_settlement_issuance(settlement_1, token, 'pay_smoke_1', reference, 99.00, 'wallet-recebedora-smoke', 50, '');
  exception when others then rejected := sqlerrm like '%divergente%';
  end;
  if not rejected then raise exception 'FAIL 9: valor divergente aceito'; end if;
  rejected := false;
  begin
    perform public.complete_settlement_issuance(settlement_1, token, 'pay_smoke_1', reference, 16.00, 'wallet-recebedora-smoke', 40, '');
  exception when others then rejected := sqlerrm like '%Percentual%';
  end;
  if not rejected then raise exception 'FAIL 9: percentual diferente de 50 aceito'; end if;
  rejected := false;
  begin
    perform public.complete_settlement_issuance(settlement_1, gen_random_uuid(), 'pay_smoke_1', reference, 16.00, 'wallet-recebedora-smoke', 50, '');
  exception when others then rejected := sqlerrm like '%Claim%';
  end;
  if not rejected then raise exception 'FAIL 9: token invalido aceito'; end if;
  perform public.complete_settlement_issuance(settlement_1, token, 'pay_smoke_1', reference, 16.00, 'wallet-recebedora-smoke', 50, '');
  if not exists (
    select 1 from public.event_financial_settlements
     where id = settlement_1 and status = 'aguardando_pagamento' and provider_payment_id = 'pay_smoke_1'
       and provider_customer_id = 'cus_smoke_org_a' and split_percent = 50 and split_recipient_wallet_id = 'wallet-recebedora-smoke'
       and paid_at is null and issued_at is not null and due_at is not null
  ) then
    raise exception 'FAIL 9: emissao persistida incorreta (ou marcada paga)';
  end if;
  payload := public.claim_settlement_issuance(settlement_1, organizer_a);
  if payload->>'kind' <> 'issued' or payload->>'gatewayId' <> 'pay_smoke_1' then raise exception 'FAIL 9: reemissao nao idempotente %', payload; end if;
  rejected := false;
  begin
    update public.event_financial_settlements set provider_payment_id = 'pay_trocado' where id = settlement_1;
  exception when others then rejected := sqlerrm like '%imutavel%';
  end;
  if not rejected then raise exception 'FAIL 9: cobranca trocada apos emissao'; end if;

  -- 10) PAYMENT_RECEIVED: valida cobranca, referencia e valor; persiste netValue real.
  insert into public.webhook_events(gateway, external_event_id, event_type, payload, status)
  values ('asaas', 'evt_smoke_wrong_' || settlement_1::text, 'PAYMENT_RECEIVED', jsonb_build_object(
    'id', 'evt_smoke_wrong', 'event', 'PAYMENT_RECEIVED',
    'payment', jsonb_build_object('id', 'pay_smoke_1', 'externalReference', reference, 'value', 8, 'netValue', 7.01, 'billingType', 'PIX', 'status', 'RECEIVED')
  ), 'recebido') returning id into webhook;
  payload := public.process_settlement_webhook(webhook);
  if payload->>'kind' <> 'review' or exists (select 1 from public.event_financial_settlements where id = settlement_1 and status = 'pago') then
    raise exception 'FAIL 10: valor divergente marcou pago %', payload;
  end if;
  insert into public.webhook_events(gateway, external_event_id, event_type, payload, status)
  values ('asaas', 'evt_smoke_other_' || settlement_1::text, 'PAYMENT_RECEIVED', jsonb_build_object(
    'id', 'evt_smoke_other', 'event', 'PAYMENT_RECEIVED',
    'payment', jsonb_build_object('id', 'pay_outra', 'externalReference', reference, 'value', 16, 'netValue', 15.01, 'billingType', 'PIX', 'status', 'RECEIVED')
  ), 'recebido') returning id into webhook;
  if (public.process_settlement_webhook(webhook))->>'kind' <> 'review' then raise exception 'FAIL 10: cobranca divergente aceita'; end if;

  insert into public.webhook_events(gateway, external_event_id, event_type, payload, status)
  values ('asaas', 'evt_smoke_received_' || settlement_1::text, 'PAYMENT_RECEIVED', jsonb_build_object(
    'id', 'evt_smoke_received', 'event', 'PAYMENT_RECEIVED',
    'payment', jsonb_build_object('id', 'pay_smoke_1', 'externalReference', reference, 'value', 16, 'netValue', 15.01, 'billingType', 'PIX', 'status', 'RECEIVED')
  ), 'recebido') returning id into webhook;
  payload := public.process_settlement_webhook(webhook);
  if payload->>'kind' <> 'processed' then raise exception 'FAIL 10: recebimento %', payload; end if;
  if not exists (select 1 from public.event_financial_settlements where id = settlement_1 and status = 'pago' and paid_at is not null and provider_net_value_cents = 1501) then
    raise exception 'FAIL 10: fechamento nao ficou pago com netValue real';
  end if;
  if (public.process_settlement_webhook(webhook))->>'kind' <> 'duplicate' then raise exception 'FAIL 10: reprocessamento nao deduplicado'; end if;
  insert into public.webhook_events(gateway, external_event_id, event_type, payload, status)
  select 'asaas', 'evt_smoke_received_again_' || settlement_1::text, 'PAYMENT_RECEIVED', source.payload, 'recebido'
    from public.webhook_events source where source.id = webhook returning id into webhook;
  if (public.process_settlement_webhook(webhook))->>'kind' <> 'processed' then raise exception 'FAIL 10: reentrega nao idempotente'; end if;
  select count(*) into visible from public.event_audit_logs where action = 'event_financial_settlement_paid' and resource_id = settlement_1;
  if visible <> 1 then raise exception 'FAIL 10: pagamento auditado % vezes', visible; end if;
  rejected := false;
  begin
    update public.event_financial_settlements set status = 'aguardando_pagamento' where id = settlement_1;
  exception when others then rejected := sqlerrm like '%finalizado%';
  end;
  if not rejected then raise exception 'FAIL 10: fechamento pago voltou de estado'; end if;

  -- 11) PAYMENT_SPLIT_DONE: correlaciona splitId e conclui distribuicao uma unica vez.
  insert into public.webhook_events(gateway, external_event_id, event_type, payload, status)
  values ('asaas', 'evt_smoke_split_nosplit_' || settlement_1::text, 'PAYMENT_SPLIT_DONE', jsonb_build_object(
    'id', 'evt_smoke_split_nosplit', 'event', 'PAYMENT_SPLIT_DONE',
    'payment', jsonb_build_object('id', 'pay_smoke_1', 'externalReference', reference, 'value', 16, 'billingType', 'PIX', 'status', 'RECEIVED')
  ), 'recebido') returning id into webhook;
  if (public.process_settlement_webhook(webhook))->>'kind' <> 'review' then raise exception 'FAIL 11: split sem splitId aceito'; end if;
  insert into public.webhook_events(gateway, external_event_id, event_type, payload, status)
  values ('asaas', 'evt_smoke_split_' || settlement_1::text, 'PAYMENT_SPLIT_DONE', jsonb_build_object(
    'id', 'evt_smoke_split', 'event', 'PAYMENT_SPLIT_DONE', 'additionalInfo', jsonb_build_object('splitId', 'spl_smoke_1'),
    'payment', jsonb_build_object('id', 'pay_smoke_1', 'externalReference', reference, 'value', 16, 'netValue', 15.01, 'billingType', 'PIX', 'status', 'RECEIVED')
  ), 'recebido') returning id into webhook;
  if (public.process_settlement_webhook(webhook))->>'kind' <> 'processed' then raise exception 'FAIL 11: split nao processado'; end if;
  if not exists (
    select 1 from public.event_financial_settlements
     where id = settlement_1 and distribution_status = 'concluido' and split_id = 'spl_smoke_1'
       and distribution_provider_event_id = 'evt_smoke_split_' || settlement_1::text and distribution_done_at is not null and split_percent = 50
  ) then
    raise exception 'FAIL 11: distribuicao nao persistida';
  end if;
  insert into public.webhook_events(gateway, external_event_id, event_type, payload, status)
  select 'asaas', 'evt_smoke_split_again_' || settlement_1::text, 'PAYMENT_SPLIT_DONE', source.payload, 'recebido'
    from public.webhook_events source where source.id = webhook returning id into webhook;
  if (public.process_settlement_webhook(webhook))->>'kind' <> 'processed' then raise exception 'FAIL 11: split reentregue nao idempotente'; end if;
  select count(*) into visible from public.event_audit_logs where action = 'event_financial_settlement_split_done' and resource_id = settlement_1;
  if visible <> 1 then raise exception 'FAIL 11: split auditado % vezes', visible; end if;
  insert into public.webhook_events(gateway, external_event_id, event_type, payload, status)
  values ('asaas', 'evt_smoke_split_other_' || settlement_1::text, 'PAYMENT_SPLIT_DONE', jsonb_build_object(
    'id', 'evt_smoke_split_other', 'event', 'PAYMENT_SPLIT_DONE', 'additionalInfo', jsonb_build_object('splitId', 'spl_estranho'),
    'payment', jsonb_build_object('id', 'pay_smoke_1', 'externalReference', reference, 'value', 16, 'billingType', 'PIX', 'status', 'RECEIVED')
  ), 'recebido') returning id into webhook;
  if (public.process_settlement_webhook(webhook))->>'kind' <> 'review' then raise exception 'FAIL 11: split divergente aceito'; end if;
  if not exists (select 1 from public.event_financial_settlements where id = settlement_1 and split_id = 'spl_smoke_1') then
    raise exception 'FAIL 11: split trocado por evento divergente';
  end if;

  -- 12) Evento de fechamento sem transicao fica ignorado (HTTP 200 na rota).
  insert into public.webhook_events(gateway, external_event_id, event_type, payload, status)
  values ('asaas', 'evt_smoke_overdue_' || settlement_1::text, 'PAYMENT_OVERDUE', jsonb_build_object(
    'id', 'evt_smoke_overdue', 'event', 'PAYMENT_OVERDUE',
    'payment', jsonb_build_object('id', 'pay_smoke_1', 'externalReference', reference, 'value', 16, 'billingType', 'PIX', 'status', 'OVERDUE')
  ), 'recebido') returning id into webhook;
  if (public.process_settlement_webhook(webhook))->>'kind' <> 'ignored' then raise exception 'FAIL 12: evento sem transicao nao ignorado'; end if;

  -- 13) Reabertura: nova inscricao paga gera fechamento #2; o #1 continua intacto.
  update public.payments set status = 'pago', paid_at = now() where id = payment_ids[4];
  update public.registrations set status = 'efetivada' where id = registration_ids[4];
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  payload := public.create_event_financial_settlement(event_a);
  reset role;
  settlement_2 := (payload->>'settlementId')::uuid;
  if (payload->>'sequenceNumber')::int <> 2 or (payload->>'registrationCount')::int <> 1 or (payload->>'platformFeeGrossCents')::bigint <> 800 then
    raise exception 'FAIL 13: reabertura %', payload;
  end if;
  if not exists (select 1 from public.event_financial_settlement_items where settlement_id = settlement_2 and registration_id = registration_ids[4])
     or exists (select 1 from public.event_financial_settlement_items where settlement_id = settlement_2 and registration_id <> registration_ids[4]) then
    raise exception 'FAIL 13: itens do fechamento #2 incorretos';
  end if;
  if not exists (select 1 from public.event_financial_settlements where id = settlement_1 and eligible_registration_count = 2 and platform_fee_gross_cents = 1600 and status = 'pago') then
    raise exception 'FAIL 13: fechamento #1 alterado pela reabertura';
  end if;
  if exists (select 1 from public.event_financial_settlement_items where registration_id = registration_ids[3]) then
    raise exception 'FAIL 13: inscricao pendente entrou em fechamento';
  end if;

  raise notice 'OK: event_financial_settlements_smoke passou (emissao, gate, dedup, RLS, imutabilidade, cliente, claim, recebimento, split, reabertura)';
end $$;

rollback;
