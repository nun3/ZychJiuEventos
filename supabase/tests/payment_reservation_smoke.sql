-- Execute after 202609060001_payment_reservation.sql. All fixtures roll back.
begin;
do $$
declare
  u uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
  org uuid := gen_random_uuid();
  team uuid := gen_random_uuid();
  v_event_id uuid := gen_random_uuid();
  rules uuid := gen_random_uuid();
  category uuid := gen_random_uuid();
  athlete_one uuid := gen_random_uuid();
  athlete_two uuid := gen_random_uuid();
  v_payment_id uuid;
  v_registration_one_id uuid;
  v_registration_two_id uuid;
  returned_total numeric;
  returned_count integer;
  rejected boolean;
begin
  insert into auth.users(id, email, raw_user_meta_data)
  values
    (u, u::text || '@example.invalid', '{}'),
    (outsider, outsider::text || '@example.invalid', '{}');
  insert into public.organizations(id, nome, slug, created_by)
    values (org, 'Payment smoke', org::text, u);
  insert into public.organization_members(organization_id, user_id, role)
    values (org, u, 'owner');
  insert into public.teams(id, organization_id, nome, created_by)
    values (team, org, 'Payment smoke', u);
  insert into public.events(
    id, organization_id, nome, slug, data_evento, local, status, created_by, valor_inscricao
  ) values (
    v_event_id, org, 'Payment smoke', v_event_id::text, current_date, 'Teste', 'inscricao', u, 123.45
  );
  insert into public.event_phases(event_id, tipo, inicio, fim)
    values (v_event_id, 'inscricao', now() - interval '1 day', now() + interval '1 day');
  insert into public.category_rule_sets(id, event_id, nome, versao, ativo)
    values (rules, v_event_id, 'Payment smoke', 1, true);
  insert into public.event_categories(
    id, rule_set_id, nome, idade_min, idade_max, faixa_min_ordem, faixa_max_ordem,
    peso_min_kg, peso_max_kg, genero, ordem
  ) values (
    category, rules, 'Payment smoke', 18, 99, 1, 1, 40, 120, 'M', 1
  );
  insert into public.athletes(
    id, organization_id, team_id, nome_completo, data_nascimento, genero, faixa, peso_kg, user_id
  ) values
    (athlete_one, org, team, 'Payment one', current_date - interval '25 years', 'M', 'Branca', 70, u),
    (athlete_two, org, team, 'Payment two', current_date - interval '26 years', 'M', 'Branca', 75, null);
  insert into public.athlete_managers(manager_id, athlete_id, relationship_type)
    values (u, athlete_two, 'professor');

  perform set_config('request.jwt.claim.sub', u::text, true);
  set local role authenticated;
  perform public.create_event_registrations(
    v_event_id, array[athlete_one, athlete_two], 'MVP-2026-09', true
  );
  -- Capture fixture IDs while authorized. The outsider cannot read these rows.
  select r.id into strict v_registration_one_id
    from public.registrations r
    where r.event_id = v_event_id and r.athlete_id = athlete_one;
  select r.id into strict v_registration_two_id
    from public.registrations r
    where r.event_id = v_event_id and r.athlete_id = athlete_two;
  reset role;
  update public.events set status = 'pagamento' where id = v_event_id;
  set local role authenticated;

  select r.payment_id, r.total, r.registration_count
    into strict v_payment_id, returned_total, returned_count
  from public.reserve_payment_batch(
    v_event_id,
    array[v_registration_one_id, v_registration_two_id],
    'pix'
  ) r;
  if returned_total is distinct from 246.90 or returned_count is distinct from 2 then
    raise exception 'FAIL: total ou quantidade da reserva';
  end if;
  if not exists (
    select 1 from public.payments p
    where p.id = v_payment_id and p.event_id = v_event_id and p.valor_total = 246.90
      and p.metodo = 'pix' and p.status = 'aguardando' and p.gateway = 'asaas'
  ) then raise exception 'FAIL: pagamento nao persistido'; end if;
  if (select count(*) from public.payment_registrations pr where pr.payment_id = v_payment_id) <> 2 then
    raise exception 'FAIL: vinculos da reserva';
  end if;

  rejected := false;
  begin
    perform public.reserve_payment_batch(
      v_event_id,
      array[v_registration_one_id],
      'pix'
    );
  exception when others then
    if sqlerrm <> 'Inscricao ja possui pagamento ativo' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: pagamento duplicado aceito'; end if;

  perform set_config('request.jwt.claim.sub', outsider::text, true);
  rejected := false;
  begin
    perform public.reserve_payment_batch(
      v_event_id,
      array[v_registration_one_id],
      'boleto'
    );
  exception when others then
    if sqlerrm <> 'Inscricao sem permissao' then raise; end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: usuario sem permissao aceito'; end if;

  if has_table_privilege('authenticated', 'public.payments', 'INSERT')
     or has_table_privilege('authenticated', 'public.payment_registrations', 'INSERT') then
    raise exception 'FAIL: escrita direta permitida';
  end if;
end;
$$;
rollback;
select 'APROVADO: reserva, total persistido, duplicidade, permissao, vinculos e escrita direta' as resultado;
