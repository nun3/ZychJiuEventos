begin;

-- O codigo antigo (duas atualizacoes sequenciais sem transacao) pode ter deixado algum evento
-- com mais de uma versao ativa; sem este saneamento, o indice unico abaixo falharia ao criar.
-- Mantem ativa a versao mais recente (maior "versao") de cada evento; desativa as demais.
with keep as (
  select distinct on (event_id) id
  from public.category_rule_sets
  where ativo
  order by event_id, versao desc
)
update public.category_rule_sets
set ativo = false
where ativo
  and id not in (select id from keep);

-- Garante no maximo uma versao ativa de categorias por evento mesmo se algum caminho de codigo
-- (atual ou futuro) esquecer de desativar as demais antes de ativar uma nova. Backstop no banco,
-- independente da funcao abaixo.
create unique index if not exists category_rule_sets_one_active_per_event
  on public.category_rule_sets (event_id)
  where ativo;

-- Troca atomica da versao ativa de um evento. Antes desta funcao, a aplicacao fazia duas
-- atualizacoes sequenciais (desativar as demais, depois ativar a nova) sem transacao nem lock:
-- uma falha entre as duas podia deixar o evento sem nenhuma versao ativa, e duas ativacoes
-- concorrentes do mesmo evento podiam intercalar as atualizacoes e deixar duas versoes ativas
-- ao mesmo tempo. SECURITY INVOKER preserva a autorizacao via RLS existente
-- (category_rule_sets_staff_write) em vez de contornar as politicas.
create or replace function public.activate_category_rule_set(p_rule_set_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_event_id uuid;
  v_checagem_travada_em timestamptz;
  v_status public.event_status;
begin
  select crs.event_id, e.checagem_travada_em, e.status
    into v_event_id, v_checagem_travada_em, v_status
  from public.category_rule_sets crs
  join public.events e on e.id = crs.event_id
  where crs.id = p_rule_set_id
  for update of e;

  if v_event_id is null then
    raise exception 'Conjunto de categorias nao encontrado.' using errcode = 'P0002';
  end if;

  if v_status in ('cancelado', 'concluido') then
    raise exception 'Este evento esta cancelado ou concluido; a versao ativa de categorias nao pode mais ser alterada.' using errcode = 'P0003';
  end if;

  if v_checagem_travada_em is not null then
    raise exception 'A checagem deste evento ja foi travada; a versao ativa de categorias nao pode mais ser alterada.' using errcode = 'P0001';
  end if;

  -- Lock de todas as linhas do evento para serializar ativacoes concorrentes do mesmo evento;
  -- o lock em events acima ja serializa por evento, esta linha e defesa adicional direto na
  -- tabela que o indice unico parcial protege.
  perform 1 from public.category_rule_sets where event_id = v_event_id for update;

  update public.category_rule_sets set ativo = false where event_id = v_event_id and id <> p_rule_set_id and ativo;
  update public.category_rule_sets set ativo = true where id = p_rule_set_id;
end;
$$;

grant execute on function public.activate_category_rule_set(uuid) to authenticated;

comment on function public.activate_category_rule_set(uuid) is
  'Troca atomica da versao ativa de categorias de um evento; bloqueia depois que a checagem foi travada.';

commit;
