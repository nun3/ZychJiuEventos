-- Atleta independente: maioridade no cadastro público e registro esportivo na org ativa.
begin;

do $$
declare
  adult uuid := gen_random_uuid();
  minor uuid := gen_random_uuid();
  professor uuid := gen_random_uuid();
  owner uuid := gen_random_uuid();
  org uuid := gen_random_uuid();
  other_org uuid := gen_random_uuid();
  team uuid := gen_random_uuid();
  other_team uuid := gen_random_uuid();
  athlete uuid;
  again uuid;
  rejected boolean;
begin
  insert into auth.users(id, email, raw_user_meta_data) values
    (owner, owner::text || '@example.invalid', jsonb_build_object('nome_completo', 'Owner smoke')),
    (professor, professor::text || '@example.invalid', jsonb_build_object(
      'nome_completo', 'Professor smoke', 'tipo_cadastro', 'professor', 'data_nascimento', '1990-01-01'
    ));

  rejected := false;
  begin
    insert into auth.users(id, email, raw_user_meta_data) values
      (minor, minor::text || '@example.invalid', jsonb_build_object(
        'nome_completo', 'Menor smoke', 'tipo_cadastro', 'atleta', 'data_nascimento', (current_date - interval '10 years')::date::text
      ));
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: minor signup was accepted'; end if;

  rejected := false;
  begin
    insert into auth.users(id, email, raw_user_meta_data) values
      (gen_random_uuid(), 'missing-birth@example.invalid', jsonb_build_object(
        'nome_completo', 'Sem nascimento smoke', 'tipo_cadastro', 'atleta'
      ));
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: public signup without birth date was accepted'; end if;

  insert into auth.users(id, email, raw_user_meta_data) values
    (adult, adult::text || '@example.invalid', jsonb_build_object(
      'nome_completo', 'Atleta independente smoke', 'tipo_cadastro', 'atleta', 'data_nascimento', '1995-05-05'
    ));

  if (select data_nascimento from public.profiles where id = adult) is distinct from date '1995-05-05' then
    raise exception 'FAIL: adult birth date was not copied to profile';
  end if;

  insert into public.organizations(id, nome, slug, created_by)
    values (org, 'Org ativa smoke', org::text, owner),
           (other_org, 'Outra org smoke', other_org::text, owner);
  insert into public.organization_members(organization_id, user_id, role)
    values (org, owner, 'owner');
  insert into public.teams(id, organization_id, nome, created_by)
    values (team, org, 'Equipe ativa', owner),
           (other_team, other_org, 'Equipe alheia', owner);

  perform set_config('request.jwt.claim.sub', professor::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.create_self_athlete(team, org, 'M', 'Branca', 70::numeric, false);
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: professor completed self athlete profile'; end if;
  reset role;

  perform set_config('request.jwt.claim.sub', adult::text, true);
  set local role authenticated;

  rejected := false;
  begin
    perform public.create_self_athlete(other_team, org, 'M', 'Branca', 70::numeric, false);
  exception when others then
    rejected := true;
  end;
  if not rejected then raise exception 'FAIL: team from another organization was accepted'; end if;

  athlete := public.create_self_athlete(team, org, 'M', 'Branca', 72.5::numeric, false);
  if athlete is null then raise exception 'FAIL: self athlete not created'; end if;
  if (select user_id from public.athletes where id = athlete) is distinct from adult then
    raise exception 'FAIL: user_id was not linked';
  end if;
  if exists (select 1 from public.athlete_managers where athlete_id = athlete) then
    raise exception 'FAIL: self athlete received manager link';
  end if;

  again := public.create_self_athlete(team, org, 'F', 'Azul', 80::numeric, true);
  if again is distinct from athlete then
    raise exception 'FAIL: existing self athlete was duplicated';
  end if;
  if (select faixa from public.athletes where id = athlete) is distinct from 'Branca' then
    raise exception 'FAIL: duplicate call mutated the athlete';
  end if;
  reset role;
end;
$$;

rollback;
