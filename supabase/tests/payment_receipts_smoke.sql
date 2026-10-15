-- Lote 3: PIX direto + comprovante + aprovacao auditada. Cobre os casos da secao 38.
-- Fixtures em transacao; rollback ao final. Nao toca MEU CAMP, usuarios reais nem Asaas.
begin;

do $$
declare
  owner_a uuid := gen_random_uuid();
  organizer_a uuid := gen_random_uuid();
  finance_a uuid := gen_random_uuid();
  staff_a uuid := gen_random_uuid();
  owner_b uuid := gen_random_uuid();
  payer_a uuid := gen_random_uuid();
  payer_b uuid := gen_random_uuid();
  stranger uuid := gen_random_uuid();
  org_a uuid := gen_random_uuid();
  org_b uuid := gen_random_uuid();
  team_a uuid := gen_random_uuid();
  athlete_a uuid := gen_random_uuid();
  athlete_b uuid := gen_random_uuid();
  event_a uuid := gen_random_uuid();
  event_b uuid := gen_random_uuid();
  rule_a uuid := gen_random_uuid();
  category_a uuid := gen_random_uuid();
  registration_a uuid := gen_random_uuid();
  registration_b uuid := gen_random_uuid();
  payment_a uuid;
  payment_b uuid;
  receipt_missing uuid := gen_random_uuid();
  receipt_wrong_type uuid := gen_random_uuid();
  receipt_big uuid := gen_random_uuid();
  receipt_1 uuid := gen_random_uuid();
  receipt_2 uuid := gen_random_uuid();
  base_path text;
  payload jsonb;
  visible integer;
  rejected boolean;
  message text;
begin
  insert into auth.users(id, email, raw_user_meta_data)
  select id, 'pix-smoke-' || label || '-' || id::text || '@example.invalid',
         jsonb_build_object('nome_completo', 'PIX Smoke ' || label, 'tipo_cadastro', 'organizador', 'data_nascimento', '1990-01-01')
    from (values
      (owner_a, 'owner-a'), (organizer_a, 'organizer-a'), (finance_a, 'finance-a'), (staff_a, 'staff-a'),
      (owner_b, 'owner-b'), (payer_a, 'payer-a'), (payer_b, 'payer-b'), (stranger, 'stranger')
    ) as fixture(id, label);

  insert into public.organizations(id, nome, slug, created_by) values
    (org_a, 'PIX Smoke Org A', 'pix-smoke-a-' || substr(replace(org_a::text, '-', ''), 1, 8), owner_a),
    (org_b, 'PIX Smoke Org B', 'pix-smoke-b-' || substr(replace(org_b::text, '-', ''), 1, 8), owner_b);
  insert into public.organization_members(organization_id, user_id, role) values
    (org_a, owner_a, 'owner'), (org_a, organizer_a, 'organizer'), (org_a, finance_a, 'finance'),
    (org_a, staff_a, 'staff'), (org_b, owner_b, 'owner');

  insert into public.teams(id, organization_id, nome, created_by) values (team_a, org_a, 'PIX Smoke Equipe', owner_a);
  insert into public.athletes(id, organization_id, team_id, nome_completo, data_nascimento, genero, faixa, peso_kg) values
    (athlete_a, org_a, team_a, 'Atleta PIX A', '1995-01-01', 'M', 'Branca', 70),
    (athlete_b, org_a, team_a, 'Atleta PIX B', '1995-01-01', 'M', 'Branca', 70);
  insert into public.athlete_managers(manager_id, athlete_id, relationship_type) values
    (payer_a, athlete_a, 'responsavel'), (payer_b, athlete_b, 'responsavel');

  insert into public.events(id, organization_id, nome, slug, data_evento, local, status, created_by, valor_inscricao) values
    (event_a, org_a, 'PIX Smoke Evento A', 'pix-smoke-evento-' || event_a::text, current_date + 30, 'Sandbox', 'pagamento', owner_a, 80),
    (event_b, org_b, 'PIX Smoke Evento B', 'pix-smoke-evento-' || event_b::text, current_date + 30, 'Sandbox', 'pagamento', owner_b, 50);
  insert into public.event_phases(event_id, tipo, inicio, fim) values
    (event_a, 'pagamento', now() - interval '1 day', now() + interval '1 day'),
    (event_b, 'pagamento', now() - interval '1 day', now() + interval '1 day');
  insert into public.category_rule_sets(id, event_id, nome, versao, ativo) values (rule_a, event_a, 'PIX Smoke', 1, true);
  insert into public.event_categories(id, rule_set_id, nome, idade_min, idade_max, faixa_min_ordem, faixa_max_ordem, peso_max_kg, genero)
    values (category_a, rule_a, 'Adulto PIX', 18, 99, 1, 1, 120, 'M');
  insert into public.registrations(
    id, event_id, athlete_id, category_id, registered_by, status, valor,
    athlete_snapshot, category_snapshot, rule_set_version, terms_version, terms_accepted_at
  ) values
    (registration_a, event_a, athlete_a, category_a, payer_a, 'pendente_pagamento', 80,
      '{"nome_completo":"Atleta PIX A"}', '{"nome":"Adulto PIX"}', 1, 'MVP-2026-09', now()),
    (registration_b, event_a, athlete_b, category_a, payer_b, 'pendente_pagamento', 80,
      '{"nome_completo":"Atleta PIX B"}', '{"nome":"Adulto PIX"}', 1, 'MVP-2026-09', now());

  -- 1) Configuracao PIX: somente owner da propria organizacao.
  perform set_config('request.jwt.claim.sub', organizer_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.set_organization_pix_settings(org_a, 'email', 'x@orga.com.br', 'Organizer tenta');
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 1: organizer configurou PIX'; end if;
  reset role;

  perform set_config('request.jwt.claim.sub', finance_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.set_organization_pix_settings(org_a, 'email', 'x@orga.com.br', 'Finance tenta');
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 1: finance configurou PIX'; end if;
  reset role;

  perform set_config('request.jwt.claim.sub', owner_b::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.set_organization_pix_settings(org_a, 'email', 'golpe@orgb.com.br', 'Owner B desvia');
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 1/11: owner B configurou PIX da org A'; end if;
  reset role;

  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.set_organization_pix_settings(org_a, 'email', 'sem-arroba', 'Academia Org A');
  exception when others then
    rejected := sqlerrm like '%Chave PIX invalida%';
  end;
  if not rejected then raise exception 'FAIL 1: chave invalida aceita'; end if;
  rejected := false;
  begin
    perform public.set_organization_pix_settings(org_a, 'email', 'ok@orga.com.br', E'Nome\noculto');
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 1: favorecido com controle aceito'; end if;

  payload := public.set_organization_pix_settings(org_a, 'email', '  Financeiro@OrgA.com.br ', 'Academia Org A');
  if payload->>'kind' is distinct from 'organization_pix_settings' then raise exception 'FAIL 1: kind %', payload; end if;

  rejected := false;
  begin
    update public.organization_pix_settings set pix_key = 'golpe@x.com' where organization_id = org_a;
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 1: UPDATE direto em organization_pix_settings permitido'; end if;
  rejected := false;
  begin
    insert into public.organization_pix_settings(organization_id, pix_key_type, pix_key, recipient_name)
    values (org_b, 'email', 'golpe@x.com', 'Golpe');
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 1: INSERT direto em organization_pix_settings permitido'; end if;
  reset role;

  if not exists (
    select 1 from public.organization_pix_settings
     where organization_id = org_a and pix_key = 'financeiro@orga.com.br' and pix_key_type = 'email'
  ) then
    raise exception 'FAIL 1: chave nao normalizada/persistida';
  end if;
  if not exists (
    select 1 from public.event_audit_logs
     where organization_id = org_a and action = 'organization_pix_settings_updated'
       and after_data->>'pixKeyEnding' = 'm.br'
       and after_data::text not like '%financeiro@%'
  ) then
    raise exception 'FAIL 1: auditoria ausente ou com chave completa';
  end if;

  -- 2) Leitura isolada da configuracao.
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  select count(*) into visible from public.organization_pix_settings where organization_id = org_a;
  if visible <> 1 then raise exception 'FAIL 2: owner A nao le propria chave'; end if;
  reset role;
  perform set_config('request.jwt.claim.sub', finance_a::text, true);
  set local role authenticated;
  select count(*) into visible from public.organization_pix_settings where organization_id = org_a;
  if visible <> 1 then raise exception 'FAIL 2: finance A nao le chave'; end if;
  reset role;
  foreach message in array array[owner_b::text, staff_a::text, payer_a::text, stranger::text] loop
    perform set_config('request.jwt.claim.sub', message, true);
    set local role authenticated;
    select count(*) into visible from public.organization_pix_settings where organization_id = org_a;
    if visible <> 0 then raise exception 'FAIL 2: % leu chave PIX da org A', message; end if;
    reset role;
  end loop;

  -- 3) Gate: evento pago com e sem PIX configurado; anon nao consulta.
  perform set_config('request.jwt.claim.sub', payer_a::text, true);
  set local role authenticated;
  if public.event_direct_pix_configured(event_a) is not true then raise exception 'FAIL 3: evento A deveria aceitar PIX'; end if;
  if public.event_direct_pix_configured(event_b) is not false then raise exception 'FAIL 3: evento B sem PIX liberado'; end if;
  reset role;
  set local role anon;
  rejected := false;
  begin
    perform public.event_direct_pix_configured(event_a);
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 3: anon executou event_direct_pix_configured'; end if;
  reset role;

  -- 5/6) Reserva grava snapshot das instrucoes; troca posterior da chave nao altera o snapshot.
  perform set_config('request.jwt.claim.sub', payer_a::text, true);
  set local role authenticated;
  select reserved.payment_id into payment_a
    from public.reserve_payment_batch(event_a, array[registration_a], 'pix') as reserved;
  reset role;

  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  perform public.set_organization_pix_settings(org_a, 'cnpj', '11.222.333/0001-81', 'Academia Org A LTDA');
  reset role;

  if not exists (
    select 1 from public.payment_pix_instructions
     where payment_id = payment_a and organization_id = org_a and pix_key_type = 'email'
       and pix_key = 'financeiro@orga.com.br' and recipient_name = 'Academia Org A'
  ) then
    raise exception 'FAIL 6: snapshot ausente ou alterado pela troca da chave';
  end if;

  perform set_config('request.jwt.claim.sub', payer_b::text, true);
  set local role authenticated;
  select reserved.payment_id into payment_b
    from public.reserve_payment_batch(event_a, array[registration_b], 'pix') as reserved;
  select count(*) into visible from public.payment_pix_instructions where payment_id = payment_a;
  if visible <> 0 then raise exception 'FAIL 10: payer B leu instrucoes do payer A'; end if;
  reset role;
  if not exists (select 1 from public.payment_pix_instructions where payment_id = payment_b and pix_key = '11222333000181') then
    raise exception 'FAIL 6: nova reserva nao usou chave atualizada';
  end if;

  perform set_config('request.jwt.claim.sub', payer_a::text, true);
  set local role authenticated;
  select count(*) into visible from public.payment_pix_instructions where payment_id = payment_a;
  if visible <> 1 then raise exception 'FAIL 6: payer A nao le proprias instrucoes'; end if;
  reset role;
  perform set_config('request.jwt.claim.sub', owner_b::text, true);
  set local role authenticated;
  select count(*) into visible from public.payment_pix_instructions where organization_id = org_a;
  if visible <> 0 then raise exception 'FAIL 11: owner B leu instrucoes da org A'; end if;
  reset role;

  -- Objetos simulados no bucket (o servidor grava com credencial privada apos validar conteudo).
  base_path := org_a::text || '/' || event_a::text || '/' || payment_a::text || '/';
  insert into storage.objects(bucket_id, name, metadata) values
    ('payment-receipts', base_path || receipt_wrong_type::text || '.pdf', '{"size": 2048, "mimetype": "image/png"}'),
    ('payment-receipts', base_path || receipt_big::text || '.pdf', '{"size": 5000000, "mimetype": "application/pdf"}'),
    ('payment-receipts', base_path || receipt_1::text || '.pdf', '{"size": 120000, "mimetype": "application/pdf"}'),
    ('payment-receipts', base_path || receipt_2::text || '.jpg', '{"size": 340000, "mimetype": "image/jpeg"}');

  -- 8) Uploads invalidos.
  perform set_config('request.jwt.claim.sub', payer_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.submit_payment_receipt(payment_a, receipt_missing, 'pdf');
  exception when others then rejected := sqlerrm like '%nao encontrado%';
  end;
  if not rejected then raise exception 'FAIL 8: registro sem arquivo aceito'; end if;
  rejected := false;
  begin
    perform public.submit_payment_receipt(payment_a, receipt_1, 'exe');
  exception when others then rejected := sqlerrm like '%Formato%';
  end;
  if not rejected then raise exception 'FAIL 8: extensao exe aceita'; end if;
  rejected := false;
  begin
    perform public.submit_payment_receipt(payment_a, receipt_wrong_type, 'pdf');
  exception when others then rejected := sqlerrm like '%Formato%';
  end;
  if not rejected then raise exception 'FAIL 8: MIME divergente aceito'; end if;
  rejected := false;
  begin
    perform public.submit_payment_receipt(payment_a, receipt_big, 'pdf');
  exception when others then rejected := sqlerrm like '%Tamanho%';
  end;
  if not rejected then raise exception 'FAIL 8: arquivo acima de 4 MB aceito'; end if;
  reset role;

  perform set_config('request.jwt.claim.sub', payer_b::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.submit_payment_receipt(payment_a, receipt_1, 'pdf');
  exception when others then rejected := sqlerrm like '%indisponivel%';
  end;
  if not rejected then raise exception 'FAIL 10: payer B enviou comprovante no pagamento do payer A'; end if;
  reset role;

  -- 7) Upload valido.
  perform set_config('request.jwt.claim.sub', payer_a::text, true);
  set local role authenticated;
  payload := public.submit_payment_receipt(payment_a, receipt_1, 'pdf');
  if payload->>'status' is distinct from 'em_analise' then raise exception 'FAIL 7: status %', payload; end if;
  rejected := false;
  begin
    perform public.submit_payment_receipt(payment_a, receipt_2, 'jpg');
  exception when others then rejected := sqlerrm like '%em analise%';
  end;
  if not rejected then raise exception 'FAIL 7: segundo comprovante ativo aceito'; end if;
  reset role;
  if not exists (
    select 1 from public.payment_receipts
     where id = receipt_1 and payment_id = payment_a and organization_id = org_a and event_id = event_a
       and uploaded_by = payer_a and storage_path = base_path || receipt_1::text || '.pdf'
       and mime_type = 'application/pdf' and size_bytes = 120000 and status = 'em_analise'
  ) then
    raise exception 'FAIL 7: metadados do comprovante incorretos';
  end if;
  if not exists (select 1 from public.event_audit_logs where action = 'payment_receipt_submitted' and resource_id = receipt_1 and actor_id = payer_a) then
    raise exception 'FAIL 7: auditoria de envio ausente';
  end if;

  -- 9) Storage privado.
  if exists (select 1 from storage.buckets where id = 'payment-receipts' and public) then
    raise exception 'FAIL 9: bucket publico';
  end if;
  set local role anon;
  begin
    select count(*) into visible from storage.objects where bucket_id = 'payment-receipts';
  exception when insufficient_privilege then visible := 0;
  end;
  if visible <> 0 then raise exception 'FAIL 9: anon listou comprovantes'; end if;
  reset role;
  foreach message in array array[payer_b::text, stranger::text, staff_a::text, owner_b::text] loop
    perform set_config('request.jwt.claim.sub', message, true);
    set local role authenticated;
    select count(*) into visible from storage.objects where bucket_id = 'payment-receipts' and name like base_path || '%';
    if visible <> 0 then raise exception 'FAIL 9/10/11: % acessou objeto de comprovante', message; end if;
    reset role;
  end loop;
  foreach message in array array[payer_a::text, owner_a::text, finance_a::text] loop
    perform set_config('request.jwt.claim.sub', message, true);
    set local role authenticated;
    select count(*) into visible from storage.objects where bucket_id = 'payment-receipts' and name like base_path || '%';
    if visible <> 1 then raise exception 'FAIL 9: % deveria ver somente o objeto registrado, viu %', message, visible; end if;
    reset role;
  end loop;
  perform set_config('request.jwt.claim.sub', payer_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    insert into storage.objects(bucket_id, name, metadata)
    values ('payment-receipts', base_path || gen_random_uuid()::text || '.pdf', '{"size": 10, "mimetype": "application/pdf"}');
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 9: cliente gravou direto no bucket'; end if;
  reset role;

  -- 10/11) Leitura dos registros de comprovante.
  perform set_config('request.jwt.claim.sub', payer_b::text, true);
  set local role authenticated;
  select count(*) into visible from public.payment_receipts where payment_id = payment_a;
  if visible <> 0 then raise exception 'FAIL 10: payer B leu comprovante do payer A'; end if;
  reset role;
  perform set_config('request.jwt.claim.sub', owner_b::text, true);
  set local role authenticated;
  select count(*) into visible from public.payment_receipts where organization_id = org_a;
  if visible <> 0 then raise exception 'FAIL 11: owner B leu comprovantes da org A'; end if;
  reset role;
  perform set_config('request.jwt.claim.sub', organizer_a::text, true);
  set local role authenticated;
  select count(*) into visible from public.payment_receipts where organization_id = org_a;
  if visible <> 1 then raise exception 'FAIL 11: organizer A nao le comprovantes da org A'; end if;
  reset role;

  -- 13) Aprovacao/rejeicao nao autorizada; escrita direta bloqueada.
  foreach message in array array[owner_b::text, finance_a::text, staff_a::text, payer_a::text, stranger::text] loop
    perform set_config('request.jwt.claim.sub', message, true);
    set local role authenticated;
    rejected := false;
    begin
      perform public.approve_payment_receipt(receipt_1);
    exception when others then rejected := true;
    end;
    if not rejected then raise exception 'FAIL 13: % aprovou comprovante', message; end if;
    rejected := false;
    begin
      perform public.reject_payment_receipt(receipt_1, 'Tentativa sem permissao');
    exception when others then rejected := true;
    end;
    if not rejected then raise exception 'FAIL 13: % rejeitou comprovante', message; end if;
    reset role;
  end loop;

  perform set_config('request.jwt.claim.sub', payer_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    update public.payment_receipts set status = 'aprovado', reviewed_at = now() where id = receipt_1;
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 13: UPDATE direto em payment_receipts permitido'; end if;
  rejected := false;
  begin
    update public.payments set status = 'pago' where id = payment_a;
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 13: UPDATE direto em payments permitido'; end if;
  rejected := false;
  begin
    insert into public.payment_receipts(id, payment_id, organization_id, event_id, uploaded_by, storage_path, mime_type, size_bytes)
    values (gen_random_uuid(), payment_a, org_a, event_a, payer_a, 'forjado.pdf', 'application/pdf', 10);
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL 13: INSERT direto em payment_receipts permitido'; end if;
  reset role;

  -- 18) Antes da aprovacao nada esta confirmado.
  if not exists (select 1 from public.payments where id = payment_a and status = 'aguardando')
     or not exists (select 1 from public.registrations where id = registration_a and status = 'pendente_pagamento')
     or not exists (select 1 from public.payment_receipts where id = receipt_1 and status = 'em_analise') then
    raise exception 'FAIL 18: estado alterado antes da aprovacao';
  end if;

  -- 15) Rejeicao mantem pagamento aguardando.
  perform set_config('request.jwt.claim.sub', organizer_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.reject_payment_receipt(receipt_1, 'ruim');
  exception when others then rejected := sqlerrm like '%Motivo%';
  end;
  if not rejected then raise exception 'FAIL 15: motivo curto aceito'; end if;
  payload := public.reject_payment_receipt(receipt_1, 'Valor diferente do total');
  if payload->>'status' is distinct from 'rejeitado' or (payload->>'alreadyReviewed')::boolean then
    raise exception 'FAIL 15: rejeicao %', payload;
  end if;
  payload := public.reject_payment_receipt(receipt_1, 'Valor diferente do total');
  if not (payload->>'alreadyReviewed')::boolean then raise exception 'FAIL 15: rejeicao repetida nao idempotente'; end if;
  rejected := false;
  begin
    perform public.approve_payment_receipt(receipt_1);
  exception when others then rejected := sqlerrm like '%nao esta em analise%';
  end;
  if not rejected then raise exception 'FAIL 15: comprovante rejeitado foi aprovado'; end if;
  reset role;
  if not exists (select 1 from public.payments where id = payment_a and status = 'aguardando')
     or not exists (select 1 from public.registrations where id = registration_a and status = 'pendente_pagamento')
     or not exists (
       select 1 from public.payment_receipts
        where id = receipt_1 and status = 'rejeitado' and rejection_reason = 'Valor diferente do total' and reviewed_by = organizer_a
     ) then
    raise exception 'FAIL 15: estado apos rejeicao incorreto';
  end if;
  if not exists (
    select 1 from public.event_audit_logs
     where action = 'payment_receipt_rejected' and resource_id = receipt_1 and actor_id = organizer_a and reason = 'Valor diferente do total'
  ) then
    raise exception 'FAIL 15: auditoria de rejeicao ausente';
  end if;

  -- 16) Reenvio apos rejeicao, preservando historico.
  perform set_config('request.jwt.claim.sub', payer_a::text, true);
  set local role authenticated;
  payload := public.submit_payment_receipt(payment_a, receipt_2, 'jpg');
  if payload->>'status' is distinct from 'em_analise' then raise exception 'FAIL 16: reenvio %', payload; end if;
  select count(*) into visible from public.payment_receipts where payment_id = payment_a;
  if visible <> 2 then raise exception 'FAIL 16: historico nao preservado (% registros)', visible; end if;
  reset role;

  -- 12/17/18) Aprovacao autorizada reutiliza settle_payment_manually.
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  payload := public.approve_payment_receipt(receipt_2);
  if payload->>'status' is distinct from 'aprovado' or (payload->>'alreadyReviewed')::boolean then
    raise exception 'FAIL 12: aprovacao %', payload;
  end if;
  -- 14) Idempotencia.
  payload := public.approve_payment_receipt(receipt_2);
  if not (payload->>'alreadyReviewed')::boolean then raise exception 'FAIL 14: aprovacao repetida nao idempotente'; end if;
  reset role;

  if not exists (select 1 from public.payments where id = payment_a and status = 'pago' and paid_at is not null) then
    raise exception 'FAIL 17: pagamento nao ficou pago';
  end if;
  if not exists (select 1 from public.registrations where id = registration_a and status = 'efetivada') then
    raise exception 'FAIL 18: inscricao nao efetivada apos aprovacao';
  end if;
  if not exists (select 1 from public.registrations where id = registration_b and status = 'pendente_pagamento') then
    raise exception 'FAIL 18: inscricao de outro pagador foi efetivada';
  end if;
  select count(*) into visible from public.event_audit_logs
   where action = 'payment_manually_settled' and resource_id = payment_a
     and actor_id = owner_a and reason like '%' || receipt_2::text || '%';
  if visible <> 1 then raise exception 'FAIL 14/17: baixa manual auditada % vezes (esperado 1)', visible; end if;
  if not exists (select 1 from public.event_audit_logs where action = 'payment_receipt_approved' and resource_id = receipt_2 and actor_id = owner_a) then
    raise exception 'FAIL 17: auditoria de aprovacao ausente';
  end if;
  if not exists (select 1 from public.payment_receipts where id = receipt_2 and status = 'aprovado' and reviewed_by = owner_a) then
    raise exception 'FAIL 12: comprovante nao marcado aprovado';
  end if;

  perform set_config('request.jwt.claim.sub', payer_a::text, true);
  set local role authenticated;
  rejected := false;
  begin
    perform public.submit_payment_receipt(payment_a, receipt_missing, 'pdf');
  exception when others then rejected := sqlerrm like '%nao esta aguardando%';
  end;
  if not rejected then raise exception 'FAIL 16: comprovante aceito apos pagamento pago'; end if;
  reset role;

  -- 19) Nenhum Asaas: sem tentativas, jobs ou cliente de gateway para estes pagamentos.
  if exists (select 1 from public.payment_attempts where payment_id in (payment_a, payment_b))
     or exists (select 1 from public.payment_issuance_jobs where payment_id in (payment_a, payment_b)) then
    raise exception 'FAIL 19: fluxo PIX direto acionou gateway';
  end if;

  raise notice 'OK: payment_receipts_smoke passou (secao 38: 1-3, 5-19; caso 4 coberto por teste unitario do gate)';
end $$;

rollback;
