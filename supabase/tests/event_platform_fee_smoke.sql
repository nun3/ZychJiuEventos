-- Sprint 12 lote 2: taxa MEU CAMP por inscricao efetivada. Fixtures roll back.
-- Cobre permissao, snapshot na efetivacao, imutabilidade do historico e isolamento da consulta.
begin;
do $$
declare
  platform_admin uuid := gen_random_uuid();
  owner uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
  org uuid := gen_random_uuid();
  team uuid := gen_random_uuid();
  event uuid := gen_random_uuid();
  rules uuid := gen_random_uuid();
  category uuid := gen_random_uuid();
  athlete_ids uuid[] := array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
  registration_ids uuid[] := array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
  payment_ids uuid[] := array[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
  hook uuid := gen_random_uuid();
  idx integer;
  payload jsonb;
  rejected boolean;
  visible integer;
begin
  insert into auth.users(id, email, raw_user_meta_data) values
    (platform_admin, platform_admin::text || '@example.invalid', '{}'),
    (owner, owner::text || '@example.invalid', '{}'),
    (outsider, outsider::text || '@example.invalid', '{}');
  insert into public.platform_user_roles(user_id, role) values (platform_admin, 'admin');
  insert into public.organizations(id, nome, slug, created_by)
    values (org, 'Taxa smoke', org::text, owner);
  insert into public.organization_members(organization_id, user_id, role)
    values (org, owner, 'owner');
  insert into public.teams(id, organization_id, nome, created_by)
    values (team, org, 'Equipe taxa', owner);
  insert into public.events(
    id, organization_id, nome, slug, data_evento, local, status, created_by, valor_inscricao
  ) values (
    event, org, 'Evento taxa', event::text, current_date, 'Teste', 'pagamento', owner, 80
  );
  insert into public.category_rule_sets(id, event_id, nome, versao, ativo)
    values (rules, event, 'Taxa', 1, true);
  insert into public.event_categories(
    id, rule_set_id, nome, idade_min, idade_max, faixa_min_ordem,
    faixa_max_ordem, peso_min_kg, peso_max_kg, genero, ordem
  ) values (category, rules, 'Taxa adulto', 18, 99, 1, 1, 0, 120, 'M', 1);

  for idx in 1..4 loop
    insert into public.athletes(
      id, organization_id, team_id, nome_completo, data_nascimento, genero, faixa, peso_kg
    ) values (
      athlete_ids[idx], org, team, 'Taxa atleta ' || idx::text,
      current_date - interval '25 years', 'M', 'Branca', 80
    );
    insert into public.registrations(
      id, event_id, athlete_id, category_id, registered_by, status, valor,
      athlete_snapshot, category_snapshot, rule_set_version, terms_version, terms_accepted_at
    ) values (
      registration_ids[idx], event, athlete_ids[idx], category, owner, 'pendente_pagamento', 80,
      jsonb_build_object('nome_completo', 'Taxa atleta ' || idx::text),
      jsonb_build_object('nome', 'Taxa adulto'),
      1, 'MVP-2026-09', now()
    );
    insert into public.payments(id, event_id, created_by, valor_total, metodo, status, gateway, external_reference)
      values (payment_ids[idx], event, owner, 80, 'pix', 'aguardando', 'asaas', 'meucamp:' || payment_ids[idx]);
    insert into public.payment_registrations(payment_id, registration_id, amount)
      values (payment_ids[idx], registration_ids[idx], 80);
  end loop;
  insert into public.payment_attempts(payment_id, gateway_payment_id, status)
    values (payment_ids[4], 'pay_fee_webhook', 'aguardando');

  if exists (select 1 from public.event_platform_fees where event_id = event) then
    raise exception 'FAIL: fee row created without configuration';
  end if;

  -- Evento sem configuracao equivale a taxa zero na efetivacao.
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  payload := public.settle_payment_manually(payment_ids[1], 'Baixa manual conferida no smoke de taxa zero');
  if (payload->>'platformFeeCents')::integer is distinct from 0 then
    raise exception 'FAIL: zero fee snapshot % ', payload;
  end if;
  if (select platform_fee_cents from public.payment_registrations where registration_id = registration_ids[1]) is distinct from 0 then
    raise exception 'FAIL: zero fee not persisted on the financial link';
  end if;

  -- Organizador nao contrata a propria taxa.
  rejected := false;
  begin
    perform public.set_event_platform_fee(event, 500);
  exception when others then
    if sqlerrm <> 'Somente a plataforma configura a taxa' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: owner configured the platform fee'; end if;

  reset role;
  perform set_config('request.jwt.claim.sub', outsider::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.set_event_platform_fee(event, 500);
  exception when others then
    if sqlerrm <> 'Somente a plataforma configura a taxa' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: outsider configured the platform fee'; end if;
  select count(*) into visible from public.event_platform_fees where event_id = event;
  if visible <> 0 then raise exception 'FAIL: outsider read the contracted fee'; end if;

  -- Plataforma contrata R$ 5,00 por inscricao efetivada.
  reset role;
  perform set_config('request.jwt.claim.sub', platform_admin::text, true);
  set local role authenticated;
  payload := public.set_event_platform_fee(event, 500);
  if (payload->>'feeCents')::integer is distinct from 500 then
    raise exception 'FAIL: fee not contracted %', payload;
  end if;
  rejected := false;
  begin
    perform public.set_event_platform_fee(event, -1);
  exception when others then
    if sqlerrm <> 'Taxa da plataforma invalida' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: negative fee accepted'; end if;

  -- Efetivacao posterior congela a taxa vigente.
  reset role;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  payload := public.settle_payment_manually(payment_ids[2], 'Baixa manual conferida no smoke de taxa contratada');
  if (payload->>'platformFeeCents')::integer is distinct from 500 then
    raise exception 'FAIL: contracted fee snapshot %', payload;
  end if;
  if (select platform_fee_cents from public.payment_registrations where registration_id = registration_ids[2]) is distinct from 500 then
    raise exception 'FAIL: contracted fee not frozen on the financial link';
  end if;
  select count(*) into visible from public.event_platform_fees where event_id = event;
  if visible <> 1 then raise exception 'FAIL: owner cannot read the contracted fee'; end if;

  -- Alterar a taxa depois nao reescreve inscricao ja efetivada.
  reset role;
  perform set_config('request.jwt.claim.sub', platform_admin::text, true);
  set local role authenticated;
  perform public.set_event_platform_fee(event, 900);
  if (select platform_fee_cents from public.payment_registrations where registration_id = registration_ids[1]) is distinct from 0
     or (select platform_fee_cents from public.payment_registrations where registration_id = registration_ids[2]) is distinct from 500 then
    raise exception 'FAIL: changing the fee rewrote settled registrations';
  end if;

  -- Nova efetivacao usa a taxa vigente.
  reset role;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;
  payload := public.settle_payment_manually(payment_ids[3], 'Baixa manual conferida no smoke de taxa alterada');
  if (payload->>'platformFeeCents')::integer is distinct from 900 then
    raise exception 'FAIL: new settlement ignored the new fee %', payload;
  end if;

  -- Recebimento confirmado pelo gateway congela a mesma taxa vigente.
  reset role;
  insert into public.webhook_events(id, gateway, external_event_id, event_type, payload)
  values (
    hook, 'asaas', 'evt_fee_received', 'PAYMENT_RECEIVED',
    jsonb_build_object(
      'id', 'evt_fee_received',
      'event', 'PAYMENT_RECEIVED',
      'payment', jsonb_build_object(
        'id', 'pay_fee_webhook',
        'externalReference', 'meucamp:' || payment_ids[4],
        'value', 80,
        'billingType', 'PIX',
        'status', 'RECEIVED'
      )
    )
  );
  set local role service_role;
  payload := public.process_payment_webhook(hook);
  if payload->>'kind' <> 'processed' then
    raise exception 'FAIL: webhook de recebimento nao processou %', payload;
  end if;
  reset role;
  if not exists (select 1 from public.payments where id = payment_ids[4] and status = 'pago')
     or not exists (select 1 from public.registrations where id = registration_ids[4] and status = 'efetivada') then
    raise exception 'FAIL: webhook nao efetivou a inscricao';
  end if;
  if (select platform_fee_cents from public.payment_registrations where registration_id = registration_ids[4]) is distinct from 900 then
    raise exception 'FAIL: webhook nao congelou a taxa vigente';
  end if;

  -- Estorno preserva o historico, mas tira a inscricao da base da taxa.
  reset role;
  update public.payments set status = 'estornado', updated_at = now() where id = payment_ids[3];
  update public.registrations set status = 'estornada', updated_at = now() where id = registration_ids[3];
  if (select platform_fee_cents from public.payment_registrations where registration_id = registration_ids[3]) is distinct from 900 then
    raise exception 'FAIL: refund erased the historical fee snapshot';
  end if;
  if (
    select coalesce(sum(link.platform_fee_cents), 0)
    from public.payment_registrations link
    join public.registrations registration on registration.id = link.registration_id
    join public.payments payment on payment.id = link.payment_id
    where registration.event_id = event
      and registration.status = 'efetivada'
      and payment.status = 'pago'
  ) <> 1400 then
    raise exception 'FAIL: refunded registration still composes the platform fee';
  end if;

  -- Consulta publica nao expoe a taxa contratada.
  set local role anon;
  visible := -1;
  rejected := false;
  begin
    select count(*) into visible from public.event_platform_fees where event_id = event;
  exception when insufficient_privilege then
    rejected := true;
  end;
  if not rejected and visible <> 0 then raise exception 'FAIL: anon read the contracted fee'; end if;

  reset role;
  if not exists (
    select 1 from public.event_audit_logs
     where event_id = event and action = 'event_platform_fee_updated'
  ) then
    raise exception 'FAIL: platform fee audit trail missing';
  end if;
end;
$$;
rollback;
select 'APROVADO: taxa por evento, permissao de plataforma, snapshot na efetivacao, historico imutavel e isolamento da consulta' as resultado;
