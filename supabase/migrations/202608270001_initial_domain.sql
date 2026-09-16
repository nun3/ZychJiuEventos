begin;

create extension if not exists pgcrypto;

-- Reset autorizado do schema de testes anterior. Esta migracao ainda nao foi
-- aplicada em producao e os registros existentes foram confirmados como mocks.
drop trigger if exists auth_user_created on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_auth_user() cascade;
drop function if exists public.handle_new_user() cascade;

drop table if exists public.payment_registrations cascade;
drop table if exists public.category_change_requests cascade;
drop table if exists public.payment_attempts cascade;
drop table if exists public.webhook_events cascade;
drop table if exists public.event_audit_logs cascade;
drop table if exists public.registrations cascade;
drop table if exists public.payments cascade;
drop table if exists public.event_categories cascade;
drop table if exists public.category_rule_sets cascade;
drop table if exists public.event_phases cascade;
drop table if exists public.events cascade;
drop table if exists public.athlete_managers cascade;
drop table if exists public.athletes cascade;
drop table if exists public.teams cascade;
drop table if exists public.organization_members cascade;
drop table if exists public.organizations cascade;
drop table if exists public.platform_user_roles cascade;
drop table if exists public.profiles cascade;

drop type if exists public.webhook_processing_status cascade;
drop type if exists public.change_request_status cascade;
drop type if exists public.payment_status cascade;
drop type if exists public.payment_method cascade;
drop type if exists public.registration_status cascade;
drop type if exists public.event_phase_type cascade;
drop type if exists public.event_status cascade;
drop type if exists public.manager_relationship cascade;
drop type if exists public.organization_role cascade;
drop type if exists public.platform_role cascade;

create type public.platform_role as enum ('admin');
create type public.organization_role as enum ('owner', 'organizer', 'staff', 'finance');
create type public.manager_relationship as enum ('professor', 'responsavel');
create type public.event_status as enum (
  'rascunho', 'publicado', 'inscricao', 'pagamento', 'checagem',
  'chaves', 'em_andamento', 'concluido', 'cancelado'
);
create type public.event_phase_type as enum ('inscricao', 'pagamento', 'checagem', 'chaves');
create type public.registration_status as enum (
  'rascunho', 'pendente_pagamento', 'efetivada', 'expirada', 'cancelada', 'estornada'
);
create type public.payment_method as enum ('pix', 'boleto');
create type public.payment_status as enum ('aguardando', 'pago', 'expirado', 'cancelado', 'estornado');
create type public.change_request_status as enum ('pendente', 'aprovada', 'recusada');
create type public.webhook_processing_status as enum ('recebido', 'processado', 'falhou', 'ignorado');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome_completo text not null check (length(trim(nome_completo)) >= 3),
  cpf text unique,
  telefone text,
  data_nascimento date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.platform_role not null,
  granted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) >= 2),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  ativo boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.organization_role not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id, role)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  nome text not null check (length(trim(nome)) >= 2),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, nome)
);

create table public.athletes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  nome_completo text not null check (length(trim(nome_completo)) >= 3),
  cpf text unique,
  data_nascimento date not null check (data_nascimento <= current_date),
  genero text not null,
  faixa text not null,
  peso_kg numeric(6,2) not null check (peso_kg > 0),
  team_id uuid not null references public.teams(id) on delete restrict,
  user_id uuid unique references public.profiles(id) on delete set null,
  possui_necessidade_especial boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.athlete_managers (
  manager_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  relationship_type public.manager_relationship not null,
  created_at timestamptz not null default now(),
  primary key (manager_id, athlete_id, relationship_type)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  nome text not null check (length(trim(nome)) >= 3),
  slug text not null,
  data_evento date not null,
  timezone text not null default 'America/Sao_Paulo',
  local text not null,
  status public.event_status not null default 'rascunho',
  imagem_cartaz_url text,
  regulamento_url text,
  tabela_peso_url text,
  informacoes text,
  results_publicados boolean not null default false,
  checagem_travada_em timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.event_phases (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  tipo public.event_phase_type not null,
  inicio timestamptz not null,
  fim timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fim > inicio),
  unique (event_id, tipo)
);

create table public.category_rule_sets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  nome text not null,
  versao integer not null check (versao > 0),
  ativo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (event_id, versao)
);

create table public.event_categories (
  id uuid primary key default gen_random_uuid(),
  rule_set_id uuid not null references public.category_rule_sets(id) on delete restrict,
  nome text not null,
  idade_min integer not null check (idade_min >= 0),
  idade_max integer not null check (idade_max >= idade_min),
  faixa_min_ordem integer not null,
  faixa_max_ordem integer not null check (faixa_max_ordem >= faixa_min_ordem),
  peso_min_kg numeric(6,2) not null default 0 check (peso_min_kg >= 0),
  peso_max_kg numeric(6,2) not null check (peso_max_kg >= peso_min_kg),
  genero text not null,
  ordem integer not null default 0,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  unique (rule_set_id, nome)
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  athlete_id uuid not null references public.athletes(id) on delete restrict,
  category_id uuid not null references public.event_categories(id) on delete restrict,
  registered_by uuid not null references public.profiles(id),
  numero bigint generated always as identity,
  status public.registration_status not null default 'rascunho',
  valor numeric(12,2) not null check (valor >= 0),
  athlete_snapshot jsonb not null,
  category_snapshot jsonb not null,
  rule_set_version integer not null check (rule_set_version > 0),
  terms_version text not null,
  terms_accepted_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, numero)
);

create unique index registrations_one_active_per_event
  on public.registrations (event_id, athlete_id)
  where status in ('rascunho', 'pendente_pagamento', 'efetivada');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  created_by uuid not null references public.profiles(id),
  valor_total numeric(12,2) not null check (valor_total > 0),
  metodo public.payment_method not null,
  status public.payment_status not null default 'aguardando',
  gateway text not null,
  data_expiracao timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  gateway_payment_id text not null,
  status public.payment_status not null default 'aguardando',
  pix_qrcode text,
  pix_copia_cola text,
  boleto_url text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gateway_payment_id)
);

create table public.payment_registrations (
  payment_id uuid not null references public.payments(id) on delete cascade,
  registration_id uuid not null references public.registrations(id) on delete restrict,
  amount numeric(12,2) not null check (amount >= 0),
  primary key (payment_id, registration_id)
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  gateway text not null,
  external_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  status public.webhook_processing_status not null default 'recebido',
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (gateway, external_event_id)
);

create table public.category_change_requests (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  current_category_id uuid not null references public.event_categories(id),
  requested_category_id uuid not null references public.event_categories(id),
  reason text not null check (length(trim(reason)) >= 5),
  status public.change_request_status not null default 'pendente',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (current_category_id <> requested_category_id),
  check ((status = 'pendente' and reviewed_by is null and reviewed_at is null) or
         (status <> 'pendente' and reviewed_by is not null and reviewed_at is not null))
);

create table public.event_audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  event_id uuid references public.events(id) on delete restrict,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  before_data jsonb,
  after_data jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.has_organization_role(target_organization_id uuid, allowed_roles public.organization_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_admin() or exists (
    select 1 from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

create or replace function public.manages_athlete(target_athlete_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.athletes a
    where a.id = target_athlete_id and a.user_id = auth.uid()
  ) or exists (
    select 1 from public.athlete_managers am
    where am.athlete_id = target_athlete_id and am.manager_id = auth.uid()
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome_completo)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome_completo'), ''), 'Usuario'));
  return new;
end;
$$;

create trigger auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.create_managed_athlete(
  target_team_id uuid,
  athlete_name text,
  athlete_birth_date date,
  athlete_gender text,
  athlete_belt text,
  athlete_weight numeric,
  relationship public.manager_relationship,
  athlete_cpf text default null,
  special_needs boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_organization_id uuid;
  new_athlete_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Autenticacao obrigatoria';
  end if;

  select organization_id into target_organization_id
  from public.teams where id = target_team_id;

  if target_organization_id is null then
    raise exception 'Equipe inexistente';
  end if;

  insert into public.athletes (
    organization_id, nome_completo, cpf, data_nascimento, genero,
    faixa, peso_kg, team_id, possui_necessidade_especial
  ) values (
    target_organization_id, athlete_name, athlete_cpf, athlete_birth_date,
    athlete_gender, athlete_belt, athlete_weight, target_team_id, special_needs
  ) returning id into new_athlete_id;

  insert into public.athlete_managers (manager_id, athlete_id, relationship_type)
  values (auth.uid(), new_athlete_id, relationship);

  return new_athlete_id;
end;
$$;

create or replace function public.validate_payment_registration_event()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  payment_event_id uuid;
  registration_event_id uuid;
begin
  select event_id into payment_event_id from public.payments where id = new.payment_id;
  select event_id into registration_event_id from public.registrations where id = new.registration_id;
  if payment_event_id is null or registration_event_id is null or payment_event_id <> registration_event_id then
    raise exception 'Pagamento e inscricao devem pertencer ao mesmo evento';
  end if;
  return new;
end;
$$;

create trigger payment_registration_same_event
before insert or update on public.payment_registrations
for each row execute function public.validate_payment_registration_event();

alter table public.profiles enable row level security;
alter table public.platform_user_roles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.teams enable row level security;
alter table public.athletes enable row level security;
alter table public.athlete_managers enable row level security;
alter table public.events enable row level security;
alter table public.event_phases enable row level security;
alter table public.category_rule_sets enable row level security;
alter table public.event_categories enable row level security;
alter table public.registrations enable row level security;
alter table public.payments enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.payment_registrations enable row level security;
alter table public.webhook_events enable row level security;
alter table public.category_change_requests enable row level security;
alter table public.event_audit_logs enable row level security;

create policy profiles_self_select on public.profiles for select using (id = auth.uid() or public.is_platform_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy organizations_member_select on public.organizations for select
using (public.has_organization_role(id, array['owner','organizer','staff','finance']::public.organization_role[]));
create policy organizations_admin_insert on public.organizations for insert with check (public.is_platform_admin());
create policy organizations_admin_update on public.organizations for update using (public.is_platform_admin());

create policy organization_members_member_select on public.organization_members for select
using (public.has_organization_role(organization_id, array['owner','organizer','staff','finance']::public.organization_role[]));
create policy organization_members_owner_write on public.organization_members for all
using (public.has_organization_role(organization_id, array['owner']::public.organization_role[]))
with check (public.has_organization_role(organization_id, array['owner']::public.organization_role[]));

create policy teams_public_select on public.teams for select using (true);
create policy teams_scoped_write on public.teams for all
using (public.has_organization_role(organization_id, array['owner','organizer']::public.organization_role[]))
with check (public.has_organization_role(organization_id, array['owner','organizer']::public.organization_role[]));

create policy athletes_scoped_select on public.athletes for select
using (public.manages_athlete(id) or public.has_organization_role(organization_id, array['owner','organizer','staff']::public.organization_role[]));
create policy athletes_scoped_write on public.athletes for all
using (public.manages_athlete(id) or public.has_organization_role(organization_id, array['owner','organizer']::public.organization_role[]))
with check (public.has_organization_role(organization_id, array['owner','organizer']::public.organization_role[]) or user_id = auth.uid());

create policy athlete_managers_self_select on public.athlete_managers for select
using (manager_id = auth.uid() or public.manages_athlete(athlete_id));

create policy events_public_or_member_select on public.events for select
using (status <> 'rascunho' or public.has_organization_role(organization_id, array['owner','organizer','staff','finance']::public.organization_role[]));
create policy events_organizer_write on public.events for all
using (public.has_organization_role(organization_id, array['owner','organizer']::public.organization_role[]))
with check (public.has_organization_role(organization_id, array['owner','organizer']::public.organization_role[]));

create policy event_phases_public_or_staff_select on public.event_phases for select
using (exists (
  select 1 from public.events e where e.id = event_id and
  (e.status <> 'rascunho' or public.has_organization_role(e.organization_id, array['owner','organizer','staff']::public.organization_role[]))
));
create policy event_phases_staff_write on public.event_phases for all
using (exists (
  select 1 from public.events e where e.id = event_id and
  public.has_organization_role(e.organization_id, array['owner','organizer']::public.organization_role[])
))
with check (exists (
  select 1 from public.events e where e.id = event_id and
  public.has_organization_role(e.organization_id, array['owner','organizer']::public.organization_role[])
));

create policy category_rule_sets_public_or_staff_select on public.category_rule_sets for select
using (exists (
  select 1 from public.events e where e.id = event_id and
  (e.status <> 'rascunho' or public.has_organization_role(e.organization_id, array['owner','organizer','staff']::public.organization_role[]))
));
create policy category_rule_sets_staff_write on public.category_rule_sets for all
using (exists (
  select 1 from public.events e where e.id = event_id and
  public.has_organization_role(e.organization_id, array['owner','organizer']::public.organization_role[])
))
with check (exists (
  select 1 from public.events e where e.id = event_id and
  public.has_organization_role(e.organization_id, array['owner','organizer']::public.organization_role[])
));

create policy event_categories_public_or_staff_select on public.event_categories for select
using (exists (
  select 1 from public.category_rule_sets rs
  join public.events e on e.id = rs.event_id
  where rs.id = rule_set_id and
  (e.status <> 'rascunho' or public.has_organization_role(e.organization_id, array['owner','organizer','staff']::public.organization_role[]))
));
create policy event_categories_staff_write on public.event_categories for all
using (exists (
  select 1 from public.category_rule_sets rs
  join public.events e on e.id = rs.event_id
  where rs.id = rule_set_id and
  public.has_organization_role(e.organization_id, array['owner','organizer']::public.organization_role[])
))
with check (exists (
  select 1 from public.category_rule_sets rs
  join public.events e on e.id = rs.event_id
  where rs.id = rule_set_id and
  public.has_organization_role(e.organization_id, array['owner','organizer']::public.organization_role[])
));

create policy registrations_owner_or_event_staff_select on public.registrations for select
using (public.manages_athlete(athlete_id) or exists (
  select 1 from public.events e where e.id = event_id and
  public.has_organization_role(e.organization_id, array['owner','organizer','staff','finance']::public.organization_role[])
));
create policy registrations_owner_insert on public.registrations for insert
with check (registered_by = auth.uid() and public.manages_athlete(athlete_id));

create policy payments_owner_or_event_staff_select on public.payments for select
using (created_by = auth.uid() or exists (
  select 1 from public.events e where e.id = event_id and
  public.has_organization_role(e.organization_id, array['owner','organizer','finance']::public.organization_role[])
));
create policy payments_owner_insert on public.payments for insert with check (created_by = auth.uid());

create policy payment_attempts_owner_or_staff_select on public.payment_attempts for select
using (exists (
  select 1 from public.payments p
  join public.events e on e.id = p.event_id
  where p.id = payment_id and (p.created_by = auth.uid() or
  public.has_organization_role(e.organization_id, array['owner','organizer','finance']::public.organization_role[]))
));

create policy payment_registrations_owner_or_staff_select on public.payment_registrations for select
using (exists (
  select 1 from public.payments p
  join public.events e on e.id = p.event_id
  where p.id = payment_id and (p.created_by = auth.uid() or
  public.has_organization_role(e.organization_id, array['owner','organizer','finance']::public.organization_role[]))
));

create policy category_change_requests_owner_or_staff_select on public.category_change_requests for select
using (requested_by = auth.uid() or exists (
  select 1 from public.registrations r
  join public.events e on e.id = r.event_id
  where r.id = registration_id and
  public.has_organization_role(e.organization_id, array['owner','organizer']::public.organization_role[])
));
create policy category_change_requests_owner_insert on public.category_change_requests for insert
with check (requested_by = auth.uid() and exists (
  select 1 from public.registrations r
  where r.id = registration_id and public.manages_athlete(r.athlete_id)
));

create policy audit_event_staff_select on public.event_audit_logs for select
using (public.has_organization_role(organization_id, array['owner','organizer']::public.organization_role[]));

grant usage on schema public to anon, authenticated;

grant select on table
  public.teams,
  public.events,
  public.event_phases,
  public.category_rule_sets,
  public.event_categories
to anon;

grant select, insert, update, delete on table
  public.profiles,
  public.organizations,
  public.organization_members,
  public.teams,
  public.athletes,
  public.athlete_managers,
  public.events,
  public.event_phases,
  public.category_rule_sets,
  public.event_categories,
  public.registrations,
  public.payments,
  public.payment_attempts,
  public.payment_registrations,
  public.category_change_requests
to authenticated;

grant usage, select on all sequences in schema public to authenticated;

revoke all on public.platform_user_roles, public.webhook_events, public.event_audit_logs from anon, authenticated;
grant select on public.event_audit_logs to authenticated;
revoke execute on function public.handle_new_auth_user() from public;
revoke execute on function public.validate_payment_registration_event() from public;
revoke execute on function public.create_managed_athlete(uuid, text, date, text, text, numeric, public.manager_relationship, text, boolean) from public;
grant execute on function public.create_managed_athlete(uuid, text, date, text, text, numeric, public.manager_relationship, text, boolean) to authenticated;

commit;
