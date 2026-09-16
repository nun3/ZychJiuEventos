-- Execute no SQL Editor do projeto Supabase Sandbox depois da migracao inicial.
-- Todos os dados criados por este teste sao descartados pelo ROLLBACK final.

begin;

do $$
declare
  public_table_count integer;
  rls_table_count integer;
begin
  select count(*) into public_table_count
  from pg_tables
  where schemaname = 'public'
    and tablename in (
      'profiles', 'platform_user_roles', 'organizations', 'organization_members',
      'teams', 'athletes', 'athlete_managers', 'events', 'event_phases',
      'category_rule_sets', 'event_categories', 'registrations', 'payments',
      'payment_attempts', 'payment_registrations', 'webhook_events',
      'category_change_requests', 'event_audit_logs'
    );

  select count(*) into rls_table_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relrowsecurity
    and c.relname in (
      'profiles', 'platform_user_roles', 'organizations', 'organization_members',
      'teams', 'athletes', 'athlete_managers', 'events', 'event_phases',
      'category_rule_sets', 'event_categories', 'registrations', 'payments',
      'payment_attempts', 'payment_registrations', 'webhook_events',
      'category_change_requests', 'event_audit_logs'
    );

  if public_table_count <> 18 then
    raise exception 'Falha: esperadas 18 tabelas, encontradas %', public_table_count;
  end if;

  if rls_table_count <> 18 then
    raise exception 'Falha: esperadas 18 tabelas com RLS, encontradas %', rls_table_count;
  end if;
end;
$$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000001', 'smoke-admin@example.invalid', '{"nome_completo":"Admin Smoke"}'),
  ('00000000-0000-0000-0000-000000000002', 'smoke-a@example.invalid', '{"nome_completo":"Usuario A"}'),
  ('00000000-0000-0000-0000-000000000003', 'smoke-b@example.invalid', '{"nome_completo":"Usuario B"}');

do $$
begin
  if (select count(*) from public.profiles where id in (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
  )) <> 3 then
    raise exception 'Falha: trigger de criacao automatica de perfil';
  end if;
end;
$$;

insert into public.platform_user_roles (user_id, role)
values ('00000000-0000-0000-0000-000000000001', 'admin');

insert into public.organizations (id, nome, slug, created_by) values
  ('10000000-0000-0000-0000-000000000001', 'Organizacao Smoke A', 'smoke-a', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'Organizacao Smoke B', 'smoke-b', '00000000-0000-0000-0000-000000000001');

insert into public.organization_members (organization_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'owner'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'owner');

insert into public.teams (id, organization_id, nome, created_by) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Equipe Smoke A', '00000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Equipe Smoke A 2', '00000000-0000-0000-0000-000000000002');

insert into public.events (
  id, organization_id, nome, slug, data_evento, local, status, created_by
) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Evento Smoke Publicado', 'smoke-publicado', '2027-01-10', 'Ginasio A', 'publicado', '00000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Evento Smoke Rascunho', 'smoke-rascunho', '2027-02-10', 'Ginasio B', 'rascunho', '00000000-0000-0000-0000-000000000003');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);

do $$
declare
  visible_count integer;
  changed_count integer;
  new_athlete_id uuid;
begin
  select count(*) into visible_count from public.organizations;
  if visible_count <> 1 then
    raise exception 'Falha: usuario A enxerga % organizacoes; esperado 1', visible_count;
  end if;

  update public.organizations
  set nome = 'Alteracao Indevida'
  where id = '10000000-0000-0000-0000-000000000002';
  get diagnostics changed_count = row_count;
  if changed_count <> 0 then
    raise exception 'Falha: RLS permitiu alterar outra organizacao';
  end if;

  select public.create_managed_athlete(
    '20000000-0000-0000-0000-000000000001',
    'Atleta Smoke',
    '1990-05-20',
    'masculino',
    'branca',
    42.50,
    'professor',
    null,
    false
  ) into new_athlete_id;

  if not public.manages_athlete(new_athlete_id) then
    raise exception 'Falha: vinculo do atleta gerenciado nao foi criado';
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
  begin
    perform public.update_managed_athlete(
      new_athlete_id,
      '20000000-0000-0000-0000-000000000002',
      'Alteracao Indevida', '1990-05-20', 'masculino', 'branca', 43,
      null, false, 'tentativa cruzada'
    );
    raise exception 'Falha: usuario B editou atleta da organizacao A';
  exception
    when others then
      if sqlerrm = 'Falha: usuario B editou atleta da organizacao A' then
        raise;
      end if;
  end;

  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
  perform public.update_managed_athlete(
    new_athlete_id,
    '20000000-0000-0000-0000-000000000002',
    'Atleta Smoke Editado', '1990-05-20', 'masculino', 'azul', 43,
    null, false, 'Mudanca de academia'
  );

  if not exists (
    select 1 from public.event_audit_logs
    where resource_id = new_athlete_id
      and action = 'athlete.team_changed'
      and reason = 'Mudanca de academia'
  ) then
    raise exception 'Falha: troca de equipe nao gerou auditoria';
  end if;

  perform public.link_athlete_to_current_user(new_athlete_id);
  if not exists (
    select 1 from public.athletes
    where id = new_athlete_id
      and user_id = '00000000-0000-0000-0000-000000000002'
  ) then
    raise exception 'Falha: atleta maior nao foi vinculado a propria conta';
  end if;
end;
$$;

reset role;
set local role anon;

do $$
declare
  visible_count integer;
  visible_slug text;
begin
  select count(*), min(slug) into visible_count, visible_slug
  from public.events;

  if visible_count <> 1 or visible_slug <> 'smoke-publicado' then
    raise exception 'Falha: acesso anonimo retornou % eventos, slug %', visible_count, visible_slug;
  end if;
end;
$$;

reset role;

select
  'APROVADO' as resultado,
  18 as tabelas_criadas,
  18 as tabelas_com_rls,
  'perfil, isolamento, escrita cruzada, atleta gerenciado, edicao negada, auditoria, vinculo proprio e acesso publico' as verificacoes;

rollback;
