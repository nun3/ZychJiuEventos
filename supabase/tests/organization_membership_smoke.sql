-- Gestao de organizacoes/membros. Rollback. Nao toca MEU CAMP nem Ricardo.
begin;

do $$
declare
  platform_admin uuid := gen_random_uuid();
  owner_a uuid := gen_random_uuid();
  owner_b uuid := gen_random_uuid();
  organizer_a uuid := gen_random_uuid();
  finance_a uuid := gen_random_uuid();
  stranger uuid := gen_random_uuid();
  org_a uuid;
  org_b uuid;
  listed integer;
  rejected boolean;
begin
  insert into auth.users(id, email, raw_user_meta_data) values
    (platform_admin, 'admin-' || platform_admin::text || '@example.invalid', jsonb_build_object('nome_completo', 'Admin smoke', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')),
    (owner_a, 'owner-a-' || owner_a::text || '@example.invalid', jsonb_build_object('nome_completo', 'Owner A smoke', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')),
    (owner_b, 'owner-b-' || owner_b::text || '@example.invalid', jsonb_build_object('nome_completo', 'Owner B smoke', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')),
    (organizer_a, 'organizer-' || organizer_a::text || '@example.invalid', jsonb_build_object('nome_completo', 'Organizer smoke', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')),
    (finance_a, 'finance-' || finance_a::text || '@example.invalid', jsonb_build_object('nome_completo', 'Finance smoke', 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')),
    (stranger, 'stranger-' || stranger::text || '@example.invalid', jsonb_build_object('nome_completo', 'Stranger smoke', 'tipo_cadastro', 'atleta', 'data_nascimento', '1990-01-01'));

  insert into public.platform_user_roles(user_id, role) values (platform_admin, 'admin');

  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.create_organization_with_owner('Org indevida', 'owner-a-' || owner_a::text || '@example.invalid');
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: usuario normal criou organizacao'; end if;
  reset role;

  perform set_config('request.jwt.claim.sub', platform_admin::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.create_organization_with_owner('Org sem usuario', 'nao-existe-' || gen_random_uuid()::text || '@example.invalid');
  exception when others then
    if sqlerrm not like '%precisa criar uma conta%' then
      raise exception 'FAIL: mensagem de usuario inexistente incorreta: %', sqlerrm;
    end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: owner inexistente foi associado'; end if;

  org_a := public.create_organization_with_owner(
    'Org A smoke',
    'owner-a-' || owner_a::text || '@example.invalid',
    'org-a-smoke-' || substr(replace(owner_a::text, '-', ''), 1, 8)
  );
  if org_a is null then raise exception 'FAIL: org A nao criada'; end if;
  reset role;

  perform set_config('request.jwt.claim.sub', platform_admin::text, true);
  set local role authenticated;
  org_b := public.create_organization_with_owner(
    'Org B smoke',
    'owner-b-' || owner_b::text || '@example.invalid'
  );
  if org_b is null then raise exception 'FAIL: org B nao criada'; end if;
  if not exists (
    select 1 from public.organization_members
     where organization_id = org_a and user_id = owner_a and role = 'owner'
  ) then
    raise exception 'FAIL: owner inicial da org A ausente';
  end if;
  reset role;

  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  perform public.add_organization_member(org_a, 'organizer-' || organizer_a::text || '@example.invalid', 'organizer');
  perform public.add_organization_member(org_a, 'finance-' || finance_a::text || '@example.invalid', 'finance');

  rejected := false;
  begin
    perform public.add_organization_member(org_a, 'organizer-' || organizer_a::text || '@example.invalid', 'organizer');
  exception when others then
    if sqlerrm not like '%ja e membro%' then
      raise exception 'FAIL: duplicidade com mensagem incorreta: %', sqlerrm;
    end if;
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: membro duplicado foi inserido'; end if;

  rejected := false;
  begin
    perform public.add_organization_member(org_a, 'stranger-' || stranger::text || '@example.invalid', 'owner');
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: owner promoveu outro owner'; end if;

  rejected := false;
  begin
    perform public.add_organization_member(org_a, 'stranger-' || stranger::text || '@example.invalid', 'staff');
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: owner atribuiu staff'; end if;

  rejected := false;
  begin
    perform public.remove_organization_member(org_a, owner_a);
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: owner removeu a si mesmo'; end if;

  select count(*) into listed from public.list_organization_members(org_a);
  if listed <> 3 then raise exception 'FAIL: lista da org A deveria ter 3 membros, veio %', listed; end if;
  reset role;

  perform set_config('request.jwt.claim.sub', organizer_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.add_organization_member(org_a, 'stranger-' || stranger::text || '@example.invalid', 'organizer');
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: organizer gerenciou membros'; end if;
  reset role;

  perform set_config('request.jwt.claim.sub', finance_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.remove_organization_member(org_a, organizer_a);
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: finance gerenciou membros'; end if;
  reset role;

  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.add_organization_member(org_b, 'organizer-' || organizer_a::text || '@example.invalid', 'organizer');
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: owner A alterou org B'; end if;

  rejected := false;
  begin
    perform public.remove_organization_member(org_b, owner_b);
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: owner A removeu owner B'; end if;

  rejected := false;
  begin
    perform public.list_organization_members(org_b);
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: owner A listou org B'; end if;

  perform public.remove_organization_member(org_a, organizer_a);
  if exists (
    select 1 from public.organization_members
     where organization_id = org_a and user_id = organizer_a
  ) then
    raise exception 'FAIL: organizer nao foi removido';
  end if;
  reset role;
  if not exists (select 1 from auth.users where id = organizer_a) then
    raise exception 'FAIL: remocao apagou Auth user';
  end if;

  perform set_config('request.jwt.claim.sub', stranger::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.list_organization_members(org_a);
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: estranho listou membros'; end if;
  reset role;
end;
$$;

rollback;
