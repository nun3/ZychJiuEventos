-- Gestao assistida de organizacoes e membros.
-- Platform admin cria tenant e owner inicial.
-- Owner adiciona organizer/finance e remove nao-owner.
-- Sem convite, sem self-service, sem transferencia de ownership.
-- staff permanece no enum para operacao ja existente; owner nao o atribui neste lote.
begin;

drop policy if exists organization_members_owner_write on public.organization_members;

create or replace function public.create_organization_with_owner(
  organization_name text,
  owner_email text,
  organization_slug text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  clean_name text := trim(organization_name);
  clean_email text := lower(trim(owner_email));
  clean_slug text := nullif(trim(organization_slug), '');
  owner_id uuid;
  new_org uuid;
begin
  if actor is null then
    raise exception 'Autenticacao obrigatoria';
  end if;
  if not public.is_platform_admin() then
    raise exception 'Acesso negado';
  end if;
  if length(clean_name) < 2 then
    raise exception 'Informe um nome de organizacao valido';
  end if;
  if clean_email is null or position('@' in clean_email) < 2 then
    raise exception 'Informe um e-mail valido';
  end if;

  if clean_slug is null then
    clean_slug := trim(both '-' from regexp_replace(lower(clean_name), '[^a-z0-9]+', '-', 'g'));
    if clean_slug is null or clean_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
      clean_slug := 'organizacao';
    end if;
    clean_slug := clean_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  elsif clean_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Slug invalido';
  end if;

  if exists (select 1 from public.organizations existing where existing.slug = clean_slug) then
    raise exception 'Slug ja existe';
  end if;

  select auth_user.id
    into owner_id
    from auth.users auth_user
   where lower(auth_user.email) = clean_email
   limit 1;

  if owner_id is null then
    raise exception 'O usuario precisa criar uma conta antes de ser associado a organizacao.';
  end if;
  if not exists (select 1 from public.profiles profile where profile.id = owner_id) then
    raise exception 'O usuario precisa criar uma conta antes de ser associado a organizacao.';
  end if;

  insert into public.organizations(nome, slug, created_by)
    values (clean_name, clean_slug, actor)
    returning id into new_org;

  insert into public.organization_members(organization_id, user_id, role)
    values (new_org, owner_id, 'owner');

  return new_org;
end;
$fn$;

create or replace function public.add_organization_member(
  target_organization_id uuid,
  member_email text,
  member_role public.organization_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  clean_email text := lower(trim(member_email));
  member_id uuid;
begin
  if actor is null then
    raise exception 'Autenticacao obrigatoria';
  end if;
  if not exists (select 1 from public.organizations org where org.id = target_organization_id) then
    raise exception 'Organizacao inexistente';
  end if;
  if not exists (
    select 1
      from public.organization_members membership
     where membership.organization_id = target_organization_id
       and membership.user_id = actor
       and membership.role = 'owner'
  ) then
    raise exception 'Acesso negado';
  end if;
  if member_role not in ('organizer', 'finance') then
    raise exception 'Papel nao permitido para inclusao pelo owner.';
  end if;
  if clean_email is null or position('@' in clean_email) < 2 then
    raise exception 'Informe um e-mail valido';
  end if;

  select auth_user.id
    into member_id
    from auth.users auth_user
   where lower(auth_user.email) = clean_email
   limit 1;

  if member_id is null or not exists (select 1 from public.profiles profile where profile.id = member_id) then
    raise exception 'O usuario precisa criar uma conta antes de ser associado a organizacao.';
  end if;

  if exists (
    select 1
      from public.organization_members membership
     where membership.organization_id = target_organization_id
       and membership.user_id = member_id
  ) then
    raise exception 'Usuario ja e membro desta organizacao.';
  end if;

  insert into public.organization_members(organization_id, user_id, role)
    values (target_organization_id, member_id, member_role);
end;
$fn$;

create or replace function public.remove_organization_member(
  target_organization_id uuid,
  member_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  owner_count integer;
begin
  if actor is null then
    raise exception 'Autenticacao obrigatoria';
  end if;
  if not exists (select 1 from public.organizations org where org.id = target_organization_id) then
    raise exception 'Organizacao inexistente';
  end if;
  if not exists (
    select 1
      from public.organization_members membership
     where membership.organization_id = target_organization_id
       and membership.user_id = actor
       and membership.role = 'owner'
  ) then
    raise exception 'Acesso negado';
  end if;
  if member_user_id = actor then
    raise exception 'Nao e permitido remover a si mesmo.';
  end if;
  if not exists (
    select 1
      from public.organization_members membership
     where membership.organization_id = target_organization_id
       and membership.user_id = member_user_id
  ) then
    raise exception 'Membro inexistente.';
  end if;
  if exists (
    select 1
      from public.organization_members membership
     where membership.organization_id = target_organization_id
       and membership.user_id = member_user_id
       and membership.role = 'owner'
  ) then
    raise exception 'Nao e permitido remover o owner.';
  end if;

  select count(*)
    into owner_count
    from public.organization_members membership
   where membership.organization_id = target_organization_id
     and membership.role = 'owner';
  if owner_count <= 1 and exists (
    select 1
      from public.organization_members membership
     where membership.organization_id = target_organization_id
       and membership.user_id = member_user_id
       and membership.role = 'owner'
  ) then
    raise exception 'Nao e permitido remover o ultimo owner.';
  end if;

  delete from public.organization_members membership
   where membership.organization_id = target_organization_id
     and membership.user_id = member_user_id;
end;
$fn$;

create or replace function public.list_organization_members(target_organization_id uuid)
returns table (
  user_id uuid,
  nome_completo text,
  email text,
  role public.organization_role,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
begin
  if auth.uid() is null then
    raise exception 'Autenticacao obrigatoria';
  end if;
  if not exists (select 1 from public.organizations org where org.id = target_organization_id) then
    raise exception 'Organizacao inexistente';
  end if;
  if not public.is_platform_admin() and not exists (
    select 1
      from public.organization_members membership
     where membership.organization_id = target_organization_id
       and membership.user_id = auth.uid()
  ) then
    raise exception 'Acesso negado';
  end if;

  return query
  select
    membership.user_id,
    profile.nome_completo,
    auth_user.email::text,
    membership.role,
    membership.created_at
  from public.organization_members membership
  join public.profiles profile on profile.id = membership.user_id
  join auth.users auth_user on auth_user.id = membership.user_id
  where membership.organization_id = target_organization_id
  order by
    case membership.role
      when 'owner' then 0
      when 'organizer' then 1
      when 'finance' then 2
      else 3
    end,
    profile.nome_completo;
end;
$fn$;

comment on function public.create_organization_with_owner(text, text, text) is
  'Platform admin cria organizacao e associa owner ja cadastrado. Sem convite e sem criar Auth.';
comment on function public.add_organization_member(uuid, text, public.organization_role) is
  'Owner adiciona organizer ou finance ja cadastrado na propria organizacao.';
comment on function public.remove_organization_member(uuid, uuid) is
  'Owner remove membro nao-owner da propria organizacao. Nao remove Auth, perfil nem historico.';
comment on function public.list_organization_members(uuid) is
  'Lista membros da organizacao para platform admin ou membro da propria org.';

revoke all on function public.create_organization_with_owner(text, text, text) from public;
revoke all on function public.add_organization_member(uuid, text, public.organization_role) from public;
revoke all on function public.remove_organization_member(uuid, uuid) from public;
revoke all on function public.list_organization_members(uuid) from public;

grant execute on function public.create_organization_with_owner(text, text, text) to authenticated;
grant execute on function public.add_organization_member(uuid, text, public.organization_role) to authenticated;
grant execute on function public.remove_organization_member(uuid, uuid) to authenticated;
grant execute on function public.list_organization_members(uuid) to authenticated;

commit;
