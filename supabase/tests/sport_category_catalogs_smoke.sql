-- Category Finder V2: catálogo GI v1, pesos abertos e leitura pública protegida.
begin;

do $$
declare
  official_catalog_id uuid := 'ca7a1000-0000-4000-8000-000000000001';
  total integer;
  unlimited integer;
  matched text;
  rejected boolean := false;
begin
  select count(*) into total
  from public.sport_category_definitions
  where sport_category_definitions.catalog_id = official_catalog_id;
  if total <> 99 then
    raise exception 'FAIL: catálogo GI v1 deveria possuir 99 definições, encontrou %', total;
  end if;

  select count(*) into unlimited
  from public.sport_category_definitions
  where sport_category_definitions.catalog_id = official_catalog_id
    and peso_max_kg is null;
  if unlimited <> 11 then
    raise exception 'FAIL: deveria existir uma categoria sem limite por divisão, encontrou %', unlimited;
  end if;

  select nome into matched
  from public.sport_category_definitions
  where sport_category_definitions.catalog_id = official_catalog_id
    and divisao_etaria = 'ADULTO/MASTER'
    and genero = 'M'
    and 92 between peso_min_kg and peso_max_kg;
  if matched is distinct from 'Pesado' then
    raise exception 'FAIL: 92 kg deveria classificar como Pesado, encontrou %', matched;
  end if;

  if not exists (
    select 1 from public.sport_category_catalogs
    where id = official_catalog_id and sport = 'jiu-jitsu' and modality = 'gi' and versao = 1 and publicado_em is not null
  ) then
    raise exception 'FAIL: catálogo oficial GI v1 não está publicado';
  end if;

  begin
    update public.sport_category_definitions
    set nome = 'Alteração indevida'
    where catalog_id = official_catalog_id;
  exception when check_violation then
    rejected := true;
  end;
  if not rejected then
    raise exception 'FAIL: definição de catálogo publicado foi alterada';
  end if;
end;
$$;

set local role anon;
do $$
begin
  if (select count(*) from public.sport_category_catalogs where publicado_em is not null) < 1 then
    raise exception 'FAIL: catálogo publicado não está visível anonimamente';
  end if;
  if (select count(*) from public.sport_category_definitions where catalog_id = 'ca7a1000-0000-4000-8000-000000000001') <> 99 then
    raise exception 'FAIL: definições publicadas não estão visíveis anonimamente';
  end if;
end;
$$;
reset role;

rollback;
