-- Sprint 7 lote 3. Fixtures roll back.
begin;
do $$
declare
  owner uuid := gen_random_uuid();
  outsider uuid := gen_random_uuid();
  other_owner uuid := gen_random_uuid();
  org uuid := gen_random_uuid();
  other_org uuid := gen_random_uuid();
  event uuid := gen_random_uuid();
  other_event uuid := gen_random_uuid();
  locked boolean;
begin
  insert into auth.users(id, email, raw_user_meta_data) values
    (owner, owner::text || '@example.invalid', '{}'),
    (outsider, outsider::text || '@example.invalid', '{}'),
    (other_owner, other_owner::text || '@example.invalid', '{}');
  insert into public.organizations(id,nome,slug,created_by) values
    (org,'Lock lote 3',org::text,owner),
    (other_org,'Outra org lock',other_org::text,other_owner);
  insert into public.organization_members(organization_id,user_id,role) values
    (org,owner,'owner'), (other_org,other_owner,'owner');
  insert into public.events(id,organization_id,nome,slug,data_evento,local,status,created_by,valor_inscricao)
    values
      (event,org,'Evento lock',event::text,current_date,'Teste','checagem',owner,80),
      (other_event,other_org,'Outro evento lock',other_event::text,current_date,'Teste','checagem',other_owner,80);

  perform set_config('request.jwt.claim.sub', outsider::text, true);
  set local role authenticated;
  locked := false;
  begin
    perform public.lock_event_checagem(event);
  exception when others then
    if sqlerrm <> 'Sem permissao para travar checagem' then raise; end if;
    locked := true;
  end;
  if not locked then raise exception 'FAIL: outsider locked'; end if;

  reset role;
  perform set_config('request.jwt.claim.sub', other_owner::text, true);
  set local role authenticated;
  locked := false;
  begin
    perform public.lock_event_checagem(event);
  exception when others then
    if sqlerrm <> 'Sem permissao para travar checagem' then raise; end if;
    locked := true;
  end;
  if not locked then raise exception 'FAIL: cross-org organizer locked'; end if;

  reset role;
  perform set_config('request.jwt.claim.sub', owner::text, true);
  set local role authenticated;

  locked := false;
  begin
    update public.events set checagem_travada_em = now() where id = event;
  exception when others then
    if sqlerrm <> 'Travamento da checagem so via operacao autorizada' then raise; end if;
    locked := true;
  end;
  if not locked then raise exception 'FAIL: direct lock allowed'; end if;
  if exists(select 1 from public.events where id = event and checagem_travada_em is not null) then
    raise exception 'FAIL: direct lock persisted';
  end if;

  if (public.lock_event_checagem(event)->>'kind') <> 'locked' then
    raise exception 'FAIL: owner lock';
  end if;
  if not exists(select 1 from public.events where id = event and checagem_travada_em is not null) then
    raise exception 'FAIL: lock timestamp missing';
  end if;
  if not exists(
    select 1 from public.event_audit_logs
    where resource_id = event and action = 'checagem_locked' and actor_id = owner
      and after_data->>'lockedBy' = owner::text
  ) then raise exception 'FAIL: lock audit'; end if;

  locked := false;
  begin
    perform public.lock_event_checagem(event);
  exception when others then
    if sqlerrm <> 'Checagem ja travada' then raise; end if;
    locked := true;
  end;
  if not locked then raise exception 'FAIL: second lock allowed'; end if;

  reset role;
  locked := false;
  begin
    update public.events set checagem_travada_em = null where id = event;
  exception when others then
    if sqlerrm <> 'Reabertura da checagem nao permitida' then raise; end if;
    locked := true;
  end;
  if not locked then raise exception 'FAIL: unlock allowed'; end if;
  if not exists(select 1 from public.events where id = event and checagem_travada_em is not null) then
    raise exception 'FAIL: unlock persisted';
  end if;
end;
$$;
rollback;
