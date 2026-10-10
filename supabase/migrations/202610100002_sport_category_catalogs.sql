begin;

create table public.sport_category_catalogs (
  id uuid primary key default gen_random_uuid(),
  sport text not null,
  modality text not null check (modality in ('gi', 'no_gi')),
  nome text not null check (length(trim(nome)) >= 3),
  versao integer not null check (versao > 0),
  fonte text not null check (length(trim(fonte)) >= 3),
  publicado_em timestamptz,
  created_at timestamptz not null default now(),
  unique (sport, modality, versao)
);

create table public.sport_category_definitions (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.sport_category_catalogs(id) on delete restrict,
  codigo text not null check (codigo ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  nome text not null check (length(trim(nome)) >= 2),
  divisao_etaria text not null check (length(trim(divisao_etaria)) >= 2),
  idade_min integer not null check (idade_min >= 0),
  idade_max integer check (idade_max is null or idade_max >= idade_min),
  genero text not null check (genero in ('M', 'F', 'U')),
  faixa_min_ordem integer not null check (faixa_min_ordem > 0),
  faixa_max_ordem integer not null check (faixa_max_ordem >= faixa_min_ordem),
  peso_min_kg numeric(6,2) not null default 0 check (peso_min_kg >= 0),
  peso_max_kg numeric(6,2) check (peso_max_kg is null or peso_max_kg >= peso_min_kg),
  ordem integer not null check (ordem > 0),
  created_at timestamptz not null default now(),
  unique (catalog_id, codigo),
  unique (id, catalog_id)
);

alter table public.category_rule_sets
  add column category_catalog_id uuid references public.sport_category_catalogs(id) on delete restrict;

alter table public.event_categories
  add column catalog_category_id uuid references public.sport_category_definitions(id) on delete restrict;

create index category_rule_sets_catalog_idx on public.category_rule_sets(category_catalog_id)
  where category_catalog_id is not null;
create index event_categories_catalog_category_idx on public.event_categories(catalog_category_id)
  where catalog_category_id is not null;

create or replace function public.enforce_event_category_catalog_mapping()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rule_catalog_id uuid;
  definition_catalog_id uuid;
begin
  if new.catalog_category_id is null then
    return new;
  end if;

  select category_catalog_id into rule_catalog_id
  from public.category_rule_sets
  where id = new.rule_set_id;

  if rule_catalog_id is null then
    raise exception 'Rule set sem catalogo nao aceita associacao de categoria'
      using errcode = '23514';
  end if;

  select catalog_id into definition_catalog_id
  from public.sport_category_definitions
  where id = new.catalog_category_id;

  if definition_catalog_id is distinct from rule_catalog_id then
    raise exception 'Categoria do evento e rule set usam catalogos diferentes'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger event_categories_catalog_guard
before insert or update of rule_set_id, catalog_category_id on public.event_categories
for each row execute function public.enforce_event_category_catalog_mapping();

create or replace function public.guard_rule_set_catalog_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.category_catalog_id is not distinct from old.category_catalog_id then
    return new;
  end if;

  if exists (
    select 1 from public.event_categories
    where rule_set_id = old.id and catalog_category_id is not null
  ) then
    raise exception 'Remova as associacoes de categoria antes de trocar o catalogo do rule set'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger category_rule_sets_catalog_change_guard
before update of category_catalog_id on public.category_rule_sets
for each row execute function public.guard_rule_set_catalog_change();

alter table public.sport_category_catalogs enable row level security;
alter table public.sport_category_definitions enable row level security;

create policy sport_category_catalogs_published_select
on public.sport_category_catalogs for select
using (publicado_em is not null or public.is_platform_admin());

create policy sport_category_definitions_published_select
on public.sport_category_definitions for select
using (
  exists (
    select 1 from public.sport_category_catalogs catalog
    where catalog.id = catalog_id
      and (catalog.publicado_em is not null or public.is_platform_admin())
  )
);

grant select on public.sport_category_catalogs, public.sport_category_definitions to anon, authenticated;
revoke insert, update, delete on public.sport_category_catalogs, public.sport_category_definitions from anon, authenticated;
revoke execute on function public.enforce_event_category_catalog_mapping() from public, anon, authenticated;
revoke execute on function public.guard_rule_set_catalog_change() from public, anon, authenticated;

insert into public.sport_category_catalogs (
  id, sport, modality, nome, versao, fonte, publicado_em
) values (
  'ca7a1000-0000-4000-8000-000000000001',
  'jiu-jitsu',
  'gi',
  'MEU CAMP GI',
  1,
  'Tabela GI enviada e aprovada para o MEU CAMP',
  null
);

with catalog_groups as (
  select * from jsonb_to_recordset($catalog$
  [
    {"codigo":"pre_mirim","nome":"PRÉ-MIRIM","idade_min":4,"idade_max":5,"genero":"U","maximos":[14.7,17.9,20.0,24.0,26.0,29.0,32.0,35.0,null]},
    {"codigo":"mirim_a","nome":"MIRIM A","idade_min":6,"idade_max":7,"genero":"U","maximos":[21.0,24.0,27.0,30.2,33.2,36.2,39.3,42.3,null]},
    {"codigo":"mirim_b","nome":"MIRIM B","idade_min":8,"idade_max":9,"genero":"U","maximos":[24.0,27.0,30.2,33.2,36.0,39.2,42.3,45.3,null]},
    {"codigo":"infantil_a","nome":"INFANTIL A","idade_min":10,"idade_max":11,"genero":"U","maximos":[30.2,33.2,36.2,39.3,42.3,45.3,48.3,51.5,null]},
    {"codigo":"infantil_b","nome":"INFANTIL B","idade_min":12,"idade_max":13,"genero":"U","maximos":[36.2,40.3,44.4,48.3,52.8,56.5,60.5,65.0,null]},
    {"codigo":"infanto_juvenil_m","nome":"INFANTO-JUVENIL","idade_min":14,"idade_max":15,"genero":"M","maximos":[44.3,48.3,52.5,56.5,60.5,65.0,69.0,73.0,null]},
    {"codigo":"infanto_juvenil_f","nome":"INFANTO-JUVENIL","idade_min":14,"idade_max":15,"genero":"F","maximos":[40.3,44.3,48.3,52.5,56.3,60.5,65.0,69.0,null]},
    {"codigo":"juvenil_m","nome":"JUVENIL","idade_min":16,"idade_max":17,"genero":"M","maximos":[53.5,58.5,64.0,69.0,74.0,79.3,84.3,89.3,null]},
    {"codigo":"juvenil_f","nome":"JUVENIL","idade_min":16,"idade_max":17,"genero":"F","maximos":[44.3,48.3,52.5,56.5,60.5,65.0,69.0,73.0,null]},
    {"codigo":"adulto_master_m","nome":"ADULTO/MASTER","idade_min":18,"idade_max":null,"genero":"M","maximos":[57.5,64.0,70.0,76.0,82.3,88.3,94.3,100.5,null]},
    {"codigo":"adulto_master_f","nome":"ADULTO/MASTER","idade_min":18,"idade_max":null,"genero":"F","maximos":[48.5,53.5,58.5,64.0,69.0,74.0,79.3,84.3,null]}
  ]
  $catalog$::jsonb) as group_row(
    codigo text,
    nome text,
    idade_min integer,
    idade_max integer,
    genero text,
    maximos jsonb
  )
), expanded as (
  select
    group_row.*,
    category_order,
    maximum.value #>> '{}' as peso_max_text
  from catalog_groups group_row
  cross join lateral jsonb_array_elements(group_row.maximos) with ordinality as maximum(value, category_order)
), numbered as (
  select
    expanded.*,
    dense_rank() over (order by idade_min, coalesce(idade_max, 2147483647), genero) as stable_group_order,
    case
      when category_order = 1 then 0::numeric
      else lag((peso_max_text)::numeric) over (
        partition by codigo order by category_order
      ) + 0.1
    end as peso_min
  from expanded
), category_names as (
  select * from unnest(
    array['Galo','Pluma','Pena','Leve','Médio','Meio-Pesado','Pesado','Super-Pesado','Pesadissimo'],
    array['galo','pluma','pena','leve','medio','meio_pesado','pesado','super_pesado','pesadissimo']
  ) with ordinality as category(nome, codigo, ordem)
)
insert into public.sport_category_definitions (
  id, catalog_id, codigo, nome, divisao_etaria,
  idade_min, idade_max, genero, faixa_min_ordem, faixa_max_ordem,
  peso_min_kg, peso_max_kg, ordem
)
select
  ('ca7a1001-0000-4000-8000-' || lpad(((stable_group_order - 1) * 9 + numbered.category_order)::text, 12, '0'))::uuid,
  'ca7a1000-0000-4000-8000-000000000001'::uuid,
  numbered.codigo || '_' || category_names.codigo,
  category_names.nome,
  numbered.nome,
  numbered.idade_min,
  numbered.idade_max,
  numbered.genero,
  1,
  9,
  numbered.peso_min,
  numbered.peso_max_text::numeric,
  ((stable_group_order - 1) * 9 + numbered.category_order)::integer
from numbered
join category_names on category_names.ordem = numbered.category_order
order by stable_group_order, numbered.category_order;

update public.sport_category_catalogs
set publicado_em = now()
where id = 'ca7a1000-0000-4000-8000-000000000001';

create or replace function public.guard_published_category_catalog()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.publicado_em is not null then
      raise exception 'Catalogos publicados sao imutaveis' using errcode = '23514';
    end if;
    return old;
  end if;

  if old.publicado_em is not null and new is distinct from old then
    raise exception 'Catalogos publicados sao imutaveis' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger sport_category_catalogs_immutable_guard
before update or delete on public.sport_category_catalogs
for each row execute function public.guard_published_category_catalog();

create or replace function public.guard_published_category_definition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_catalog_id uuid;
begin
  target_catalog_id := case when tg_op = 'DELETE' then old.catalog_id else new.catalog_id end;
  if exists (
    select 1 from public.sport_category_catalogs
    where id = target_catalog_id and publicado_em is not null
  ) then
    raise exception 'Definicoes de catalogos publicados sao imutaveis' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger sport_category_definitions_immutable_guard
before insert or update or delete on public.sport_category_definitions
for each row execute function public.guard_published_category_definition();

revoke execute on function public.guard_published_category_catalog() from public, anon, authenticated;
revoke execute on function public.guard_published_category_definition() from public, anon, authenticated;

comment on table public.sport_category_catalogs is
  'Catalogos esportivos completos, versionados e independentes de eventos.';
comment on table public.sport_category_definitions is
  'Definicoes imutaveis usadas para classificacao teorica; peso_max_kg nulo significa sem limite.';
comment on column public.category_rule_sets.category_catalog_id is
  'Catalogo explicito usado para classificar; nulo preserva eventos legados.';
comment on column public.event_categories.catalog_category_id is
  'Associacao explicita com a categoria teorica; nulo representa categoria customizada ou legada.';

commit;
