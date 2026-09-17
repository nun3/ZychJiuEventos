# Modelo de Dominio e Banco

## Objetivo

Definir a base relacional para contas, atletas, eventos, inscricoes, pagamentos e operacao esportiva. A implementacao prevista usa PostgreSQL via Supabase.

## Entidades principais

### profiles
Extensao de `auth.users` do Supabase.

- `id` UUID, PK e FK para `auth.users.id`
- `nome_completo`
- `cpf`, unico quando informado
- `telefone`
- `created_at`, `updated_at`

Menores nao possuem usuario proprio. Seus dados ficam em `athletes` e o acesso ocorre por um ou mais responsaveis autorizados.
Uma conta pode exercer mais de um papel. Papeis globais ficam em `platform_user_roles`; papeis de organizacao ficam em `organization_members`, evitando um unico `tipo_perfil` mutuamente exclusivo.

### organizations e organization_members

- `organizations`: cliente/tenant proprietario de eventos, equipes e dados operacionais.
- `organization_members`: liga usuario, organizacao e papel (`owner`, `organizer`, `staff`, `finance`).
- Administrador da plataforma e global; organizadores e operadores sempre atuam no escopo de uma organizacao.

### teams

- `id` UUID, PK
- `nome`
- `created_by` FK para `profiles.id`
- `organization_id` FK obrigatoria para `organizations.id`
- `created_at`, `updated_at`

### athletes

- `id` UUID, PK
- `nome_completo`
- `cpf`, opcional e unico quando informado
- `data_nascimento`
- `genero`
- `faixa`
- `peso_kg`
- `team_id` FK obrigatoria para `teams.id`
- `possui_necessidade_especial`
- `created_at`, `updated_at`

Regra: cada atleta pertence a exatamente uma equipe. A troca de equipe deve ser auditada.

### athlete_managers

Relaciona professores e responsaveis aos atletas que podem administrar.

- `manager_id` FK para `profiles.id`
- `athlete_id` FK para `athletes.id`
- `relationship_type`: `professor` ou `responsavel`
- PK composta: `manager_id`, `athlete_id`

### events

- `id` UUID, PK
- `nome`
- `data_evento`
- `local`
- `status`: `rascunho`, `publicado`, `inscricao`, `pagamento`, `checagem`, `chaves`, `em_andamento`, `concluido`, `cancelado`
- `imagem_cartaz_url`
- `regulamento_url`
- `informacoes`
- `results_publicados`
- `created_by` FK para `profiles.id`
- `organization_id` FK obrigatoria para `organizations.id`
- `timezone` no formato IANA, por exemplo `America/Sao_Paulo`
- `checagem_travada_em` timestamptz nulo: lista oficial aberta; preenchido somente pela RPC de travamento, com auditoria
- `created_at`, `updated_at`

Travamento operacional grava `checagem_travada_em` uma vez. Reabertura nao faz parte deste contrato. Escritas diretas na coluna sao bloqueadas.

### event_phases

- `id` UUID, PK
- `event_id` FK
- `tipo`: `inscricao`, `pagamento`, `checagem`, `chaves`
- `inicio`, `fim`
- restricao unica por `event_id` e `tipo`

### event_categories

- `id` UUID, PK
- `rule_set_id` FK para um conjunto de regras versionado do evento
- `nome`
- `idade_min`, `idade_max`
- `faixa_min`, `faixa_max`
- `peso_min_kg`, `peso_max_kg`
- `genero`
- `ordem`

### registrations

- `id` UUID, PK
- `numero` unico por evento
- `athlete_id` FK
- `event_id` FK
- `category_id` FK (alocacao original, imutavel com o snapshot)
- `current_category_id` FK opcional: override da alocacao vigente; nulo significa que a vigente e `category_id`
- `registered_by` FK para `profiles.id`
- `status`: `rascunho`, `pendente_pagamento`, `efetivada`, `expirada`, `cancelada`, `estornada`
- `valor`
- `created_at`, `updated_at`

A inscricao preserva um snapshot imutavel dos dados usados no aceite: nome, nascimento, genero, faixa, peso, equipe, categoria, valor, versao das regras e versao dos termos. Mudancas futuras no perfil do atleta nao alteram o historico. A posicao operacional na checagem usa a alocacao vigente (`coalesce(current_category_id, category_id)`), alterada somente por solicitacao aprovada.

Realocacao na checagem (atleta sozinho) e distinta da categorizacao de inscricao. Destinos sao classes adjacentes no mesmo `category_rule_set` da categoria original: subir 1 classe de peso; idade ±1 classe; um eixo por movimento; genero e intervalo de faixa congelados. Sobreposicao ou duplicidade de intervalos no grupo falha fechado. `category_is_eligible_for_registration` nao governa esse destino.

Nao ha flags em `category_rule_sets` nesta versao. A politica acima e o default da plataforma; configurar eixos por rule set permanece divida consciente, sem schema morto.

Restricao unica: um atleta nao pode possuir duas inscricoes ativas no mesmo evento.

### payments

- `id` UUID, PK
- `event_id` FK obrigatoria
- `valor_total`
- `metodo`: `pix`, `boleto`
- `status`: `aguardando`, `pago`, `expirado`, `cancelado`, `estornado`
- `gateway`
- `data_expiracao`
- `created_at`, `updated_at`

Identificadores, QR Code, copia e cola, boleto e expiracao de cada tentativa ficam em `payment_attempts`. O estado financeiro nao e duplicado em `registrations`; ele e derivado do pagamento e a efetivacao da inscricao ocorre transacionalmente.

### payment_registrations

Tabela intermediaria para pagamento individual ou unificado.

- `payment_id` FK
- `registration_id` FK
- PK composta: `payment_id`, `registration_id`

Regra: todas as inscricoes ligadas ao mesmo pagamento devem pertencer ao mesmo evento.

### category_change_requests

- `id` UUID, PK
- `registration_id` FK
- `requested_by` FK
- `current_category_id` FK
- `requested_category_id` FK
- `reason`
- `status`: `pendente`, `aprovada`, `recusada`
- `reviewed_by`, `reviewed_at`
- `created_at`

Uma inscricao efetivada pode ter no maximo uma solicitacao `pendente`. Insert/update direto pelo cliente e bloqueado; criacao e decisao passam por RPC.

### brackets, matches e weigh_ins

Representam a operacao esportiva depois do fechamento da checagem.

- `brackets`: chave por categoria e versao publicada
- `matches`: confronto, rodada, atletas, vencedor e status
- `weigh_ins`: pesagem, resultado, observacao e operador

### event_audit_logs

Registra alteracoes sensiveis: mudanca de equipe, categoria, pagamento, status, checagem e resultados.

### webhook_events e payment_attempts

- `webhook_events` guarda identificador externo unico, payload, estado de processamento, tentativas e erro para reprocessamento idempotente.
- `payment_attempts` preserva cada tentativa feita no gateway; uma cobranca logica pode expirar e receber nova tentativa sem apagar o historico.

## Integridade obrigatoria

- RLS deve impedir acesso entre organizadores diferentes.
- Perfil so pode consultar e alterar os atletas que gerencia.
- Menor nao pode autenticar diretamente.
- Somente inscricoes com pagamento confirmado ou baixa manual entram na checagem.
- A lista de checagem fica imutavel apos o encerramento da fase.
- Chaves so podem ser geradas a partir da lista de checagem travada.
- Valores financeiros devem usar `numeric`, nunca `float`.
- Datas devem ser armazenadas em UTC e exibidas no fuso definido para o evento.
