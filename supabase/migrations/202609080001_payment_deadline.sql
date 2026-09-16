begin;

create or replace function public.reserve_payment_batch(
  target_event_id uuid,
  target_registration_ids uuid[],
  target_method public.payment_method
)
returns table (payment_id uuid, external_reference text, total numeric(12,2), registration_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event public.events%rowtype;
  payment_phase public.event_phases%rowtype;
  registration_record public.registrations%rowtype;
  new_payment_id uuid := gen_random_uuid();
  new_reference text := 'meucamp:' || new_payment_id::text;
  selected_count integer := 0;
  expected_count integer := 0;
  locked_count integer := 0;
  total_value numeric(12,2) := 0;
begin
  if auth.uid() is null then raise exception 'Autenticacao obrigatoria'; end if;
  if target_method is null then raise exception 'Metodo de pagamento obrigatorio'; end if;
  if coalesce(array_length(target_registration_ids, 1), 0) = 0 then
    raise exception 'Selecione ao menos uma inscricao';
  end if;
  if array_length(target_registration_ids, 1) > 100 then
    raise exception 'Limite de 100 inscricoes por pagamento';
  end if;

  select count(distinct registration_id), count(*) into selected_count, expected_count
  from unnest(target_registration_ids) as selected(registration_id);
  if selected_count <> expected_count then raise exception 'Lista de inscricoes duplicada'; end if;

  select * into target_event from public.events where id = target_event_id for share;
  if not found then raise exception 'Evento inexistente'; end if;
  select * into payment_phase from public.event_phases
  where event_id = target_event_id and tipo = 'pagamento'
  for share;
  if not found or now() < payment_phase.inicio or now() > payment_phase.fim
    or target_event.status <> 'pagamento' then
    raise exception 'Evento fora da fase de pagamento';
  end if;

  for registration_record in
    select r.* from public.registrations r
    where r.id = any(target_registration_ids) order by r.id for update
  loop
    locked_count := locked_count + 1;
    if registration_record.event_id <> target_event_id then raise exception 'Inscricoes devem pertencer ao mesmo evento'; end if;
    if not public.manages_athlete(registration_record.athlete_id) then raise exception 'Inscricao sem permissao'; end if;
    if registration_record.status <> 'pendente_pagamento' then raise exception 'Inscricao nao esta pendente de pagamento'; end if;
    if exists (
      select 1 from public.payment_registrations pr
      join public.payments p on p.id = pr.payment_id
      where pr.registration_id = registration_record.id and p.status in ('aguardando', 'pago')
    ) then raise exception 'Inscricao ja possui pagamento ativo'; end if;
    total_value := total_value + registration_record.valor;
  end loop;

  if locked_count <> selected_count then raise exception 'Inscricao inexistente'; end if;
  if total_value <= 0 then raise exception 'Cobranca deve possuir valor positivo'; end if;

  insert into public.payments (id, event_id, created_by, valor_total, metodo, status, gateway, external_reference)
  values (new_payment_id, target_event_id, auth.uid(), total_value, target_method, 'aguardando', 'asaas', new_reference);
  insert into public.payment_registrations (payment_id, registration_id, amount)
  select new_payment_id, r.id, r.valor from public.registrations r where r.id = any(target_registration_ids);
  return query select new_payment_id, new_reference, total_value, selected_count;
end;
$$;

revoke execute on function public.reserve_payment_batch(uuid, uuid[], public.payment_method) from public;
grant execute on function public.reserve_payment_batch(uuid, uuid[], public.payment_method) to authenticated;

commit;
