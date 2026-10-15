-- Financeiro Lote 3: PIX direto ao organizador + comprovante + validacao auditada.
-- O dinheiro nao passa pelo MEU CAMP. Sem Asaas, sem BaaS, sem split.
-- Pagamento so vira pago por settle_payment_manually, chamado na aprovacao do comprovante.
-- Cliente autenticado nao escreve em nenhuma tabela nova nem no bucket: somente RPC/servidor.
begin;

do $$
begin
  create type public.pix_key_type as enum ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_receipt_status as enum ('em_analise', 'aprovado', 'rejeitado');
exception
  when duplicate_object then null;
end $$;

-- Formato canonico da chave ja normalizada. Checksum de CPF/CNPJ fica na camada de dominio.
create or replace function public.is_valid_pix_key(key_type public.pix_key_type, key_value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case key_type
    when 'cpf' then key_value ~ '^[0-9]{11}$'
    when 'cnpj' then key_value ~ '^[0-9]{14}$'
    when 'email' then char_length(key_value) <= 77
      and key_value ~ '^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$'
    when 'telefone' then key_value ~ '^\+55[1-9][1-9]9[0-9]{8}$'
    when 'aleatoria' then key_value ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    else false
  end;
$$;

-- Configuracao PIX de recebimento da organizacao (uma por organizacao).
create table if not exists public.organization_pix_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  pix_key_type public.pix_key_type not null,
  pix_key text not null,
  recipient_name text not null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_pix_settings_key_valid
    check (public.is_valid_pix_key(pix_key_type, pix_key)),
  constraint organization_pix_settings_recipient_valid
    check (char_length(btrim(recipient_name)) between 3 and 120 and recipient_name !~ '[[:cntrl:]]')
);

comment on table public.organization_pix_settings is
  'Chave PIX de recebimento direto da organizacao. Contem dado pessoal: nunca exposta ao publico. Escrita somente via set_organization_pix_settings (owner ou platform admin).';

alter table public.organization_pix_settings enable row level security;

drop policy if exists organization_pix_settings_staff_select on public.organization_pix_settings;
create policy organization_pix_settings_staff_select
  on public.organization_pix_settings
  for select
  using (
    public.has_organization_role(
      organization_id,
      array['owner', 'organizer', 'finance']::public.organization_role[]
    )
  );

revoke all on public.organization_pix_settings from anon, authenticated;
grant select on public.organization_pix_settings to authenticated;

-- Snapshot imutavel das instrucoes apresentadas ao pagador no momento da reserva.
create table if not exists public.payment_pix_instructions (
  payment_id uuid primary key references public.payments(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  pix_key_type public.pix_key_type not null,
  pix_key text not null,
  recipient_name text not null,
  created_at timestamptz not null default now()
);

comment on table public.payment_pix_instructions is
  'Snapshot das instrucoes PIX exibidas ao pagador. Gravado por reserve_payment_batch; nunca reescrito por mudanca posterior da chave.';

alter table public.payment_pix_instructions enable row level security;

drop policy if exists payment_pix_instructions_payer_or_staff_select on public.payment_pix_instructions;
create policy payment_pix_instructions_payer_or_staff_select
  on public.payment_pix_instructions
  for select
  using (
    exists (
      select 1 from public.payments payment
      where payment.id = payment_id and payment.created_by = auth.uid()
    )
    or public.has_organization_role(
      organization_id,
      array['owner', 'organizer', 'finance']::public.organization_role[]
    )
  );

revoke all on public.payment_pix_instructions from anon, authenticated;
grant select on public.payment_pix_instructions to authenticated;

-- Comprovantes enviados pelo pagador. Historico preservado; um em analise por pagamento.
create table if not exists public.payment_receipts (
  id uuid primary key,
  payment_id uuid not null references public.payments(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete restrict,
  uploaded_by uuid not null references public.profiles(id),
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'application/pdf')),
  size_bytes integer not null check (size_bytes between 1 and 4194304),
  status public.payment_receipt_status not null default 'em_analise',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_receipts_review_consistent check (
    (status = 'em_analise' and reviewed_by is null and reviewed_at is null and rejection_reason is null)
    or (status = 'aprovado' and reviewed_at is not null and rejection_reason is null)
    or (
      status = 'rejeitado'
      and reviewed_at is not null
      and char_length(btrim(rejection_reason)) between 5 and 300
    )
  )
);

comment on table public.payment_receipts is
  'Comprovantes de PIX direto. Arquivo em bucket privado payment-receipts. Aprovacao efetiva via settle_payment_manually.';

create unique index if not exists payment_receipts_one_in_review
  on public.payment_receipts (payment_id)
  where status = 'em_analise';
create index if not exists payment_receipts_payment_created_idx
  on public.payment_receipts (payment_id, created_at desc);
create index if not exists payment_receipts_organization_status_idx
  on public.payment_receipts (organization_id, status);

alter table public.payment_receipts enable row level security;

drop policy if exists payment_receipts_payer_or_staff_select on public.payment_receipts;
create policy payment_receipts_payer_or_staff_select
  on public.payment_receipts
  for select
  using (
    exists (
      select 1 from public.payments payment
      where payment.id = payment_id and payment.created_by = auth.uid()
    )
    or public.has_organization_role(
      organization_id,
      array['owner', 'organizer', 'finance']::public.organization_role[]
    )
  );

revoke all on public.payment_receipts from anon, authenticated;
grant select on public.payment_receipts to authenticated;

-- Bucket privado. Escrita somente pelo servidor apos validacao do conteudo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-receipts',
  'payment-receipts',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Leitura (necessaria para URL assinada) somente de objetos referenciados por comprovante visivel.
drop policy if exists payment_receipts_authorized_read on storage.objects;
create policy payment_receipts_authorized_read on storage.objects for select to authenticated
using (
  bucket_id = 'payment-receipts'
  and exists (
    select 1
    from public.payment_receipts receipt
    join public.payments payment on payment.id = receipt.payment_id
    where receipt.storage_path = objects.name
      and (
        payment.created_by = auth.uid()
        or public.has_organization_role(
          receipt.organization_id,
          array['owner', 'organizer', 'finance']::public.organization_role[]
        )
      )
  )
);

-- Informa apenas se a organizacao do evento aceita PIX direto. Nao revela a chave.
create or replace function public.event_direct_pix_configured(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.events event_row
    join public.organization_pix_settings settings
      on settings.organization_id = event_row.organization_id
    where event_row.id = target_event_id
  );
$$;

revoke all on function public.event_direct_pix_configured(uuid) from public, anon;
grant execute on function public.event_direct_pix_configured(uuid) to authenticated;

create or replace function public.set_organization_pix_settings(
  target_organization_id uuid,
  key_type public.pix_key_type,
  key_value text,
  recipient text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  normalized_key text;
  digits text;
  normalized_recipient text := btrim(coalesce(recipient, ''));
  previous public.organization_pix_settings%rowtype;
  had_previous boolean;
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if target_organization_id is null or key_type is null then
    raise exception 'Configuracao PIX invalida';
  end if;
  -- Destino do dinheiro dos atletas: somente owner da organizacao ou platform admin.
  if not public.has_organization_role(target_organization_id, array['owner']::public.organization_role[]) then
    raise exception 'Sem permissao para configurar PIX';
  end if;
  if not exists (select 1 from public.organizations where id = target_organization_id) then
    raise exception 'Organizacao inexistente';
  end if;

  digits := regexp_replace(coalesce(key_value, ''), '[^0-9]', '', 'g');
  normalized_key := case key_type
    when 'cpf' then digits
    when 'cnpj' then digits
    when 'email' then lower(btrim(coalesce(key_value, '')))
    when 'telefone' then case
      when char_length(digits) = 11 then '+55' || digits
      when char_length(digits) = 13 and left(digits, 2) = '55' then '+' || digits
      else digits
    end
    when 'aleatoria' then lower(btrim(coalesce(key_value, '')))
  end;

  if not public.is_valid_pix_key(key_type, normalized_key) then
    raise exception 'Chave PIX invalida';
  end if;
  if char_length(normalized_recipient) < 3 or char_length(normalized_recipient) > 120
     or normalized_recipient ~ '[[:cntrl:]]' then
    raise exception 'Favorecido invalido';
  end if;

  select * into previous
    from public.organization_pix_settings
   where organization_id = target_organization_id
   for update;
  had_previous := found;

  insert into public.organization_pix_settings (
    organization_id, pix_key_type, pix_key, recipient_name, updated_by, updated_at
  ) values (
    target_organization_id, key_type, normalized_key, normalized_recipient, actor, now()
  )
  on conflict (organization_id) do update set
    pix_key_type = excluded.pix_key_type,
    pix_key = excluded.pix_key,
    recipient_name = excluded.recipient_name,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

  -- Auditoria guarda apenas o final da chave (minimizacao).
  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data
  ) values (
    target_organization_id, null, actor,
    'organization_pix_settings_updated', 'organization', target_organization_id,
    case when had_previous then jsonb_build_object(
      'pixKeyType', previous.pix_key_type,
      'pixKeyEnding', right(previous.pix_key, 4),
      'recipientName', previous.recipient_name
    ) end,
    jsonb_build_object(
      'pixKeyType', key_type,
      'pixKeyEnding', right(normalized_key, 4),
      'recipientName', normalized_recipient
    )
  );

  return jsonb_build_object(
    'kind', 'organization_pix_settings',
    'organizationId', target_organization_id,
    'pixKeyType', key_type
  );
end;
$fn$;

revoke all on function public.set_organization_pix_settings(uuid, public.pix_key_type, text, text) from public, anon;
grant execute on function public.set_organization_pix_settings(uuid, public.pix_key_type, text, text) to authenticated;

-- Reserva vigente (202609080001_payment_deadline) + snapshot das instrucoes PIX da organizacao.
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

  if target_method = 'pix' then
    insert into public.payment_pix_instructions (
      payment_id, organization_id, pix_key_type, pix_key, recipient_name
    )
    select new_payment_id, settings.organization_id, settings.pix_key_type, settings.pix_key, settings.recipient_name
    from public.organization_pix_settings settings
    where settings.organization_id = target_event.organization_id;
  end if;

  return query select new_payment_id, new_reference, total_value, selected_count;
end;
$$;

revoke execute on function public.reserve_payment_batch(uuid, uuid[], public.payment_method) from public, anon;
grant execute on function public.reserve_payment_batch(uuid, uuid[], public.payment_method) to authenticated;

-- Registra o comprovante ja gravado pelo servidor no bucket privado.
-- O caminho e derivado aqui; tamanho e tipo vem dos metadados do Storage, nao do cliente.
create or replace function public.submit_payment_receipt(
  target_payment_id uuid,
  target_receipt_id uuid,
  file_extension text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  payment_record public.payments%rowtype;
  event_record public.events%rowtype;
  normalized_extension text := lower(btrim(coalesce(file_extension, '')));
  expected_mime text;
  object_path text;
  object_size bigint;
  object_mime text;
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if target_payment_id is null or target_receipt_id is null then
    raise exception 'Comprovante invalido';
  end if;
  expected_mime := case normalized_extension
    when 'jpg' then 'image/jpeg'
    when 'png' then 'image/png'
    when 'pdf' then 'application/pdf'
  end;
  if expected_mime is null then raise exception 'Formato de comprovante invalido'; end if;

  select * into payment_record from public.payments where id = target_payment_id for update;
  -- Mesmo erro para inexistente e alheio: nao revela pagamento de terceiros.
  if not found or payment_record.created_by is distinct from actor then
    raise exception 'Pagamento indisponivel para comprovante';
  end if;
  if payment_record.status <> 'aguardando' then
    raise exception 'Pagamento nao esta aguardando comprovante';
  end if;
  if payment_record.metodo <> 'pix'
     or not exists (select 1 from public.payment_pix_instructions where payment_id = payment_record.id) then
    raise exception 'Pagamento sem instrucoes PIX';
  end if;
  if exists (
    select 1 from public.payment_receipts
    where payment_id = payment_record.id and status = 'em_analise'
  ) then
    raise exception 'Ja existe comprovante em analise';
  end if;
  if (select count(*) from public.payment_receipts where payment_id = payment_record.id) >= 10 then
    raise exception 'Limite de comprovantes atingido';
  end if;

  select * into event_record from public.events where id = payment_record.event_id;
  object_path := event_record.organization_id::text || '/' || event_record.id::text || '/'
    || payment_record.id::text || '/' || target_receipt_id::text || '.' || normalized_extension;

  select (object_row.metadata->>'size')::bigint, lower(object_row.metadata->>'mimetype')
    into object_size, object_mime
    from storage.objects object_row
   where object_row.bucket_id = 'payment-receipts' and object_row.name = object_path;
  if not found then raise exception 'Arquivo do comprovante nao encontrado'; end if;
  if object_mime is distinct from expected_mime then
    raise exception 'Formato de comprovante invalido';
  end if;
  if object_size is null or object_size < 1 or object_size > 4194304 then
    raise exception 'Tamanho de comprovante invalido';
  end if;

  insert into public.payment_receipts (
    id, payment_id, organization_id, event_id, uploaded_by,
    storage_path, mime_type, size_bytes, status
  ) values (
    target_receipt_id, payment_record.id, event_record.organization_id, event_record.id, actor,
    object_path, expected_mime, object_size, 'em_analise'
  );

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data
  ) values (
    event_record.organization_id, event_record.id, actor,
    'payment_receipt_submitted', 'payment_receipt', target_receipt_id,
    null,
    jsonb_build_object(
      'paymentId', payment_record.id,
      'status', 'em_analise',
      'mimeType', expected_mime,
      'sizeBytes', object_size
    )
  );

  return jsonb_build_object(
    'kind', 'payment_receipt',
    'id', target_receipt_id,
    'paymentId', payment_record.id,
    'status', 'em_analise'
  );
end;
$fn$;

revoke all on function public.submit_payment_receipt(uuid, uuid, text) from public, anon;
grant execute on function public.submit_payment_receipt(uuid, uuid, text) to authenticated;

-- Aprovacao: mesma autorizacao da baixa manual. Reutiliza settle_payment_manually na mesma transacao.
create or replace function public.approve_payment_receipt(target_receipt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  receipt_record public.payment_receipts%rowtype;
  settlement jsonb;
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if target_receipt_id is null then raise exception 'Comprovante indisponivel'; end if;

  select * into receipt_record from public.payment_receipts where id = target_receipt_id for update;
  if not found then raise exception 'Comprovante indisponivel'; end if;
  if not public.is_platform_admin() and not exists (
    select 1 from public.organization_members member
    where member.organization_id = receipt_record.organization_id
      and member.user_id = actor
      and member.role in ('owner', 'organizer')
  ) then
    raise exception 'Comprovante indisponivel';
  end if;

  if receipt_record.status = 'aprovado' then
    return jsonb_build_object(
      'kind', 'payment_receipt',
      'id', receipt_record.id,
      'paymentId', receipt_record.payment_id,
      'status', 'aprovado',
      'alreadyReviewed', true
    );
  end if;
  if receipt_record.status <> 'em_analise' then
    raise exception 'Comprovante nao esta em analise';
  end if;

  settlement := public.settle_payment_manually(
    receipt_record.payment_id,
    'Comprovante PIX aprovado (' || receipt_record.id::text || ')'
  );

  update public.payment_receipts
     set status = 'aprovado', reviewed_by = actor, reviewed_at = now(), updated_at = now()
   where id = receipt_record.id;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data
  ) values (
    receipt_record.organization_id, receipt_record.event_id, actor,
    'payment_receipt_approved', 'payment_receipt', receipt_record.id,
    jsonb_build_object('status', 'em_analise', 'paymentId', receipt_record.payment_id),
    jsonb_build_object(
      'status', 'aprovado',
      'paymentId', receipt_record.payment_id,
      'registrationCount', settlement->'registrationCount'
    )
  );

  return jsonb_build_object(
    'kind', 'payment_receipt',
    'id', receipt_record.id,
    'paymentId', receipt_record.payment_id,
    'status', 'aprovado',
    'alreadyReviewed', false
  );
end;
$fn$;

revoke all on function public.approve_payment_receipt(uuid) from public, anon;
grant execute on function public.approve_payment_receipt(uuid) to authenticated;

-- Rejeicao: pagamento permanece aguardando; pagador pode reenviar.
create or replace function public.reject_payment_receipt(target_receipt_id uuid, reason_text text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  actor uuid := auth.uid();
  receipt_record public.payment_receipts%rowtype;
  normalized_reason text := btrim(coalesce(reason_text, ''));
begin
  if actor is null then raise exception 'Sessao obrigatoria'; end if;
  if target_receipt_id is null then raise exception 'Comprovante indisponivel'; end if;
  if char_length(normalized_reason) < 5 or char_length(normalized_reason) > 300
     or normalized_reason ~ '[[:cntrl:]]' then
    raise exception 'Motivo deve ter entre 5 e 300 caracteres';
  end if;

  select * into receipt_record from public.payment_receipts where id = target_receipt_id for update;
  if not found then raise exception 'Comprovante indisponivel'; end if;
  if not public.is_platform_admin() and not exists (
    select 1 from public.organization_members member
    where member.organization_id = receipt_record.organization_id
      and member.user_id = actor
      and member.role in ('owner', 'organizer')
  ) then
    raise exception 'Comprovante indisponivel';
  end if;

  if receipt_record.status = 'rejeitado' then
    return jsonb_build_object(
      'kind', 'payment_receipt',
      'id', receipt_record.id,
      'paymentId', receipt_record.payment_id,
      'status', 'rejeitado',
      'alreadyReviewed', true
    );
  end if;
  if receipt_record.status <> 'em_analise' then
    raise exception 'Comprovante nao esta em analise';
  end if;

  update public.payment_receipts
     set status = 'rejeitado', reviewed_by = actor, reviewed_at = now(),
         rejection_reason = normalized_reason, updated_at = now()
   where id = receipt_record.id;

  insert into public.event_audit_logs (
    organization_id, event_id, actor_id, action, resource_type,
    resource_id, before_data, after_data, reason
  ) values (
    receipt_record.organization_id, receipt_record.event_id, actor,
    'payment_receipt_rejected', 'payment_receipt', receipt_record.id,
    jsonb_build_object('status', 'em_analise', 'paymentId', receipt_record.payment_id),
    jsonb_build_object('status', 'rejeitado', 'paymentId', receipt_record.payment_id),
    normalized_reason
  );

  return jsonb_build_object(
    'kind', 'payment_receipt',
    'id', receipt_record.id,
    'paymentId', receipt_record.payment_id,
    'status', 'rejeitado',
    'alreadyReviewed', false
  );
end;
$fn$;

revoke all on function public.reject_payment_receipt(uuid, text) from public, anon;
grant execute on function public.reject_payment_receipt(uuid, text) to authenticated;

commit;
