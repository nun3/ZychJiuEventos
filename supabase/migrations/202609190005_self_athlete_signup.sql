-- Cadastro público exige maioridade. Atleta independente completa o registro esportivo
-- em equipe já existente da organização informada, sem criar equipe nem duplicar user_id.
begin;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  signup_role text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'tipo_cadastro'), ''), '');
  birth_text text := nullif(trim(new.raw_user_meta_data ->> 'data_nascimento'), '');
  birth_date date;
  phone_text text := nullif(trim(new.raw_user_meta_data ->> 'telefone'), '');
  cpf_text text := nullif(trim(new.raw_user_meta_data ->> 'cpf'), '');
begin
  if signup_role in ('atleta', 'professor', 'responsavel', 'organizador') then
    if birth_text is null then
      raise exception 'Data de nascimento obrigatoria';
    end if;
    if birth_text !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception 'Data de nascimento invalida';
    end if;
    birth_date := birth_text::date;
    if birth_date > (current_date - interval '18 years')::date then
      raise exception 'Menor de idade nao pode criar conta';
    end if;
  elsif birth_text is not null then
    if birth_text !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception 'Data de nascimento invalida';
    end if;
    birth_date := birth_text::date;
    if birth_date > (current_date - interval '18 years')::date then
      raise exception 'Menor de idade nao pode criar conta';
    end if;
  end if;

  insert into public.profiles (id, nome_completo, data_nascimento, telefone, cpf)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome_completo'), ''), 'Usuario'),
    birth_date,
    phone_text,
    cpf_text
  );
  return new;
end;
$$;

create or replace function public.create_self_athlete(
  target_team_id uuid,
  target_organization_id uuid,
  athlete_gender text,
  athlete_belt text,
  athlete_weight numeric,
  special_needs boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  team_organization uuid;
  existing_id uuid;
  new_athlete_id uuid;
  gender_value text := upper(trim(athlete_gender));
  signup_role text;
begin
  if actor is null then
    raise exception 'Autenticacao obrigatoria';
  end if;

  select coalesce(user_row.raw_user_meta_data->>'tipo_cadastro', '')
    into signup_role
    from auth.users user_row
   where user_row.id = actor;
  if signup_role is distinct from 'atleta' then
    raise exception 'Somente conta atleta completa o cadastro esportivo proprio';
  end if;

  select athlete_row.id into existing_id
    from public.athletes athlete_row
   where athlete_row.user_id = actor;
  if existing_id is not null then
    return existing_id;
  end if;

  select * into actor_profile from public.profiles where id = actor;
  if actor_profile.id is null then
    raise exception 'Perfil inexistente';
  end if;
  if length(trim(actor_profile.nome_completo)) < 3 then
    raise exception 'Informe o nome completo';
  end if;
  if actor_profile.data_nascimento is null then
    raise exception 'Data de nascimento obrigatoria';
  end if;
  if actor_profile.data_nascimento > (current_date - interval '18 years')::date then
    raise exception 'Menor de idade nao pode criar conta';
  end if;

  if target_organization_id is null then
    raise exception 'Organizacao ativa indisponivel';
  end if;

  select organization_id into team_organization
    from public.teams
   where id = target_team_id;
  if team_organization is null then
    raise exception 'Equipe inexistente';
  end if;
  if team_organization is distinct from target_organization_id then
    raise exception 'Equipe fora da organizacao ativa';
  end if;

  if gender_value not in ('F', 'M', 'O') then
    raise exception 'Genero invalido';
  end if;
  if public.belt_order(athlete_belt) is null then
    raise exception 'Faixa do atleta nao reconhecida';
  end if;
  if athlete_weight is null or athlete_weight <= 0 then
    raise exception 'Peso invalido';
  end if;

  begin
    insert into public.athletes (
      organization_id, nome_completo, cpf, data_nascimento, genero,
      faixa, peso_kg, team_id, user_id, possui_necessidade_especial
    ) values (
      team_organization,
      trim(actor_profile.nome_completo),
      actor_profile.cpf,
      actor_profile.data_nascimento,
      gender_value,
      trim(athlete_belt),
      athlete_weight,
      target_team_id,
      actor,
      coalesce(special_needs, false)
    )
    returning id into new_athlete_id;
  exception
    when unique_violation then
      select athlete_row.id into existing_id
        from public.athletes athlete_row
       where athlete_row.user_id = actor;
      if existing_id is not null then
        return existing_id;
      end if;
      raise;
  end;

  return new_athlete_id;
end;
$fn$;

comment on function public.create_self_athlete(uuid, uuid, text, text, numeric, boolean) is
  'Cria o registro esportivo do atleta autenticado em equipe já existente da organização informada. Não cria equipe nem duplica user_id.';

revoke all on function public.create_self_athlete(uuid, uuid, text, text, numeric, boolean) from public, anon;
grant execute on function public.create_self_athlete(uuid, uuid, text, text, numeric, boolean) to authenticated;

commit;
