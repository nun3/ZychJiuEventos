-- Lote 2: identidade financeira por organizacao + isolamento multi-tenant.
-- Fixtures em transacao; rollback ao final. Nao toca MEU CAMP nem Ricardo.
begin;

do $$
declare
  platform_admin uuid := gen_random_uuid();
  owner_a uuid := gen_random_uuid();
  owner_b uuid := gen_random_uuid();
  organizer_a uuid := gen_random_uuid();
  finance_a uuid := gen_random_uuid();
  staff_a uuid := gen_random_uuid();
  stranger uuid := gen_random_uuid();
  org_a uuid := gen_random_uuid();
  org_b uuid := gen_random_uuid();
  account_a uuid;
  account_b uuid;
  payload jsonb;
  visible integer;
  rejected boolean;
begin
  insert into auth.users(id, email, raw_user_meta_data) values
    (platform_admin, 'opa-admin-' || platform_admin::text || '@example.invalid',
      jsonb_build_object('nome_completo', 'Admin OPA', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')),
    (owner_a, 'opa-owner-a-' || owner_a::text || '@example.invalid',
      jsonb_build_object('nome_completo', 'Owner A OPA', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')),
    (owner_b, 'opa-owner-b-' || owner_b::text || '@example.invalid',
      jsonb_build_object('nome_completo', 'Owner B OPA', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')),
    (organizer_a, 'opa-organizer-' || organizer_a::text || '@example.invalid',
      jsonb_build_object('nome_completo', 'Organizer OPA', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')),
    (finance_a, 'opa-finance-' || finance_a::text || '@example.invalid',
      jsonb_build_object('nome_completo', 'Finance OPA', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')),
    (staff_a, 'opa-staff-' || staff_a::text || '@example.invalid',
      jsonb_build_object('nome_completo', 'Staff OPA', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')),
    (stranger, 'opa-stranger-' || stranger::text || '@example.invalid',
      jsonb_build_object('nome_completo', 'Stranger OPA', 'tipo_cadastro', 'atleta', 'data_nascimento', '1990-01-01'));

  insert into public.platform_user_roles(user_id, role) values (platform_admin, 'admin');

  insert into public.organizations(id, nome, slug, created_by) values
    (org_a, 'OPA Org A', 'opa-org-a-' || substr(replace(org_a::text, '-', ''), 1, 8), owner_a),
    (org_b, 'OPA Org B', 'opa-org-b-' || substr(replace(org_b::text, '-', ''), 1, 8), owner_b);

  insert into public.organization_members(organization_id, user_id, role) values
    (org_a, owner_a, 'owner'),
    (org_b, owner_b, 'owner'),
    (org_a, organizer_a, 'organizer'),
    (org_a, finance_a, 'finance'),
    (org_a, staff_a, 'staff');

  -- 1) Owner A inicializa org A
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  payload := public.create_organization_payment_account_pending(org_a, 'asaas');
  if payload->>'kind' is distinct from 'organization_payment_account' then
    raise exception 'FAIL: create owner A nao retornou kind esperado';
  end if;
  if payload->>'status' is distinct from 'not_started' then
    raise exception 'FAIL: create deve gravar not_started, got %', payload->>'status';
  end if;
  account_a := (payload->>'id')::uuid;
  reset role;

  -- 8) Unicidade (organization_id, provider)
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.create_organization_payment_account_pending(org_a, 'asaas');
  exception when others then
    if sqlerrm not like '%ja existe%' then
      raise exception 'FAIL: unicidade com mensagem incorreta: %', sqlerrm;
    end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: unicidade nao bloqueou segundo create'; end if;
  reset role;

  -- Finance nao inicializa
  perform set_config('request.jwt.claim.sub', finance_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.create_organization_payment_account_pending(org_b, 'asaas');
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: finance inicializou conta'; end if;
  reset role;

  -- Organizer A pode inicializar org B? Nao — sem membership em B
  perform set_config('request.jwt.claim.sub', organizer_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.create_organization_payment_account_pending(org_b, 'asaas');
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: organizer A inicializou org B'; end if;
  reset role;

  -- Platform admin inicializa org B
  perform set_config('request.jwt.claim.sub', platform_admin::text, true);
  set local role authenticated;
  payload := public.create_organization_payment_account_pending(org_b);
  account_b := (payload->>'id')::uuid;
  reset role;

  -- 2) Owner A le org A; nao le org B
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  select count(*) into visible
    from public.organization_payment_accounts
   where organization_id = org_a;
  if visible <> 1 then raise exception 'FAIL: owner A nao leu org A'; end if;
  select count(*) into visible
    from public.organization_payment_accounts
   where organization_id = org_b;
  if visible <> 0 then raise exception 'FAIL: owner A leu org B'; end if;
  reset role;

  -- 4) Owner B nao le org A
  perform set_config('request.jwt.claim.sub', owner_b::text, true);
  set local role authenticated;
  select count(*) into visible
    from public.organization_payment_accounts
   where organization_id = org_a;
  if visible <> 0 then raise exception 'FAIL: owner B leu org A'; end if;
  select count(*) into visible
    from public.organization_payment_accounts
   where organization_id = org_b;
  if visible <> 1 then raise exception 'FAIL: owner B nao leu org B'; end if;
  reset role;

  -- Finance le propria org
  perform set_config('request.jwt.claim.sub', finance_a::text, true);
  set local role authenticated;
  select count(*) into visible
    from public.organization_payment_accounts
   where organization_id = org_a;
  if visible <> 1 then raise exception 'FAIL: finance nao leu org A'; end if;
  reset role;

  -- 5) Staff e stranger sem acesso de leitura
  perform set_config('request.jwt.claim.sub', staff_a::text, true);
  set local role authenticated;
  select count(*) into visible from public.organization_payment_accounts;
  if visible <> 0 then raise exception 'FAIL: staff leu contas financeiras'; end if;
  reset role;

  perform set_config('request.jwt.claim.sub', stranger::text, true);
  set local role authenticated;
  select count(*) into visible from public.organization_payment_accounts;
  if visible <> 0 then raise exception 'FAIL: stranger leu contas financeiras'; end if;
  rejected := false;
  begin
    perform public.create_organization_payment_account_pending(org_a, 'asaas');
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: stranger criou conta financeira'; end if;
  reset role;

  -- 6) Cliente nao forja wallet/status via UPDATE direto
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    update public.organization_payment_accounts
       set wallet_id = 'fake-wallet', status = 'ready'
     where id = account_a;
    if found then
      -- RLS sem policy de update deve bloquear (0 rows) ou erro
      null;
    end if;
  exception when others then
    rejected := true;
  end;
  -- Mesmo sem exception, nenhuma linha pode ter sido alterada
  reset role;
  if exists (
    select 1 from public.organization_payment_accounts
     where id = account_a and (wallet_id is not null or status = 'ready')
  ) then
    raise exception 'FAIL: owner A forjou wallet/status READY';
  end if;

  -- 3) Owner A nao atualiza org B via RPC admin
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.admin_update_organization_payment_account(
      account_b, 'account_created', 'ext-b', 'wallet-b', null, null
    );
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: owner A atualizou conta de org B'; end if;
  reset role;

  -- 7) Platform admin atualiza campos; READY bloqueado
  perform set_config('request.jwt.claim.sub', platform_admin::text, true);
  set local role authenticated;
  payload := public.admin_update_organization_payment_account(
    account_a, 'account_created', 'asaas_acc_a', null, 'pending', null
  );
  if payload->>'status' is distinct from 'account_created' then
    raise exception 'FAIL: admin update status %', payload->>'status';
  end if;
  if payload->>'providerAccountId' is distinct from 'asaas_acc_a' then
    raise exception 'FAIL: admin update provider_account_id';
  end if;

  rejected := false;
  begin
    perform public.admin_update_organization_payment_account(
      account_a, 'ready', null, null, null, null
    );
  exception when others then
    if sqlerrm not like '%READY bloqueado%' then
      raise exception 'FAIL: bloqueio READY com mensagem incorreta: %', sqlerrm;
    end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: platform admin marcou READY'; end if;
  reset role;

  -- 9) Linha existente nao esta READY
  if exists (
    select 1 from public.organization_payment_accounts where status = 'ready'
  ) then
    raise exception 'FAIL: existe conta READY neste lote';
  end if;

  if not exists (
    select 1 from public.event_audit_logs
     where action = 'organization_payment_account_created'
       and organization_id = org_a
       and resource_id = account_a
  ) then
    raise exception 'FAIL: auditoria de create ausente';
  end if;
end $$;

rollback;
