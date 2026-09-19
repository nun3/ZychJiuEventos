# PRD do MVP - Plataforma Meu Camp

## 1. Controle do documento

- Produto: Meu Camp
- Versao: 1.0
- Status: aprovado para refinamento e execucao tecnica
- Estado operacional registrado em 2026-09-19: fluxo §3, Sprints 8–13 e Full Event BDD comprovados; pendencias de go-live listadas nas secoes 10 e 11
- Fonte primaria: PDFs de projeto e benchmarking fornecidos pelo cliente
- Escopo detalhado: `docs/escopo_funcional_plataforma.md`
- Criterios verificaveis: `docs/criterios_aceite_mvp.md`
- Regras normativas: `docs/maquinas_de_estado.md`, `docs/matriz_permissoes.md`, `docs/modelo_dominio_banco.md` e `docs/regras_categorizacao_pagamentos.md`

Este e o documento principal de produto. Em caso de divergencia, uma decisao confirmada pelo cliente deve primeiro ser registrada aqui e depois refletida nos documentos tecnicos.

## 2. Problema

Organizadores de campeonatos de Jiu-Jitsu precisam coordenar eventos, atletas, categorias, inscricoes, pagamentos e checagem em processos hoje sujeitos a retrabalho e inconsistencias. Professores e responsaveis precisam reutilizar o cadastro de seus atletas em varios eventos, pagar inscricoes em conjunto e solicitar correcoes sem depender de atendimento manual.

## 3. Objetivo do MVP

Entregar um fluxo confiavel desde o cadastro da conta ate a checagem do evento:

1. organizador configura e publica um evento;
2. professor, responsavel ou atleta gerencia seu cadastro esportivo;
3. usuario inscreve um ou mais atletas elegiveis;
4. sistema calcula e congela a categoria;
5. usuario paga individualmente ou em grupo;
6. webhook confirma o pagamento sem duplicidade;
7. atletas efetivados aparecem na checagem publica;
8. solicitacoes de categoria sao aprovadas ou recusadas com auditoria.

Estado vigente (2026-09-19): o fluxo acima esta entregue e comprovado pelo Full Event BDD canonico. Chaves, pesagem operacional por subchave, resultados, areas, programacao, duracao oficial e fechamento financeiro foram entregues nas Sprints 8–12 e permanecem congelados. Nao sao trabalho futuro do primeiro incremento; ja fazem parte do produto operacional atual. Exportacao, placar, cronometro, chamada ao vivo, horario automatico e pesagem individual continuam fora deste recorte.

## 4. Publicos e papeis

- Administrador da plataforma: administra clientes, parametros globais, suporte e auditoria.
- Organizador: opera apenas organizacoes e eventos em que possui vinculo.
- Professor: gerencia equipe e atletas vinculados. Nao e `organization_role`. A intencao de cadastro fica em `tipo_cadastro`; o vinculo operacional e `athlete_managers.relationship_type = professor`.
- Responsavel: gerencia atletas dependentes, especialmente menores.
- Atleta maior: administra o proprio perfil e inscricoes.
- Publico: consulta somente eventos e informacoes publicadas.

Uma conta pode acumular papeis. A autorizacao depende do recurso, da organizacao e do vinculo com o atleta; nao existe um unico perfil mutuamente exclusivo.

## 5. Escopo funcional do MVP

### 5.1 Fundacao e acesso

- Supabase Auth com e-mail e senha.
- Recuperacao de senha por e-mail.
- Perfil criado automaticamente no cadastro.
- Organizacoes, membros e papeis acumulaveis.
- Isolamento entre organizacoes por RLS.
- Auditoria de operacoes sensiveis.

Estado vigente (2026-09-19): Auth, perfil, recuperacao de senha, RLS e auditoria de operacoes sensiveis estao entregues. O modelo de organizacoes, membros e papeis existe. Permanecem pendentes o onboarding self-service de organizacao e a gestao/convite de membros na UI.

### 5.2 Equipes e Meus Atletas

- Cadastro e edicao de atleta gerenciado.
- Um atleta pertence a exatamente uma equipe por vez.
- Professor e responsavel acessam somente atletas autorizados.
- Menor nao possui login proprio.
- Troca de equipe preserva historico auditavel.
- Historico de inscricoes por atleta.

Estado vigente (2026-09-19): o Professor nasce no cadastro/login, cria/assume equipe pela RPC `create_managed_team` sem membership administrativo e reutiliza Meus Atletas, inscricoes e a checagem publica. Responsavel gerencia menores sem login proprio do atleta. Permanecem pendentes o atleta independente completo (autoinscricao) e o enforcement de que menor nao cria conta no cadastro publico.

### 5.3 Eventos e categorias

- CRUD, publicacao, cancelamento e conclusao de eventos.
- Fuso IANA por evento e fases com inicio e fim.
- Upload de banner, regulamento e tabela de peso.
- Conjuntos versionados de categorias por idade, genero, faixa e peso.
- Lista publica ordenada por data e pagina de detalhes.

Estado vigente (2026-09-19): CRUD, publicacao, cancelamento, conclusao, fuso, arquivos, categorias e lista publica estao entregues. Evento concluido permanece consultavel com resultados publicados. Evento cancelado nao aceita novas inscricoes.

### 5.4 Inscricoes

- Inscricao propria ou de varios atletas gerenciados.
- Validacao da fase do evento e prevencao de duplicidade.
- Idade calculada pela data completa de nascimento na data do evento.
- Categorizacao automatica explicavel.
- Snapshot imutavel de atleta, equipe, categoria, preco, regra e termo aceito.
- Estado inicial confirmado como `pendente_pagamento`.

Estado vigente (2026-09-19): inscricao de atletas gerenciados, fase, duplicidade, idade, categorizacao, snapshot e `pendente_pagamento` estao entregues. Inscricao propria do atleta maior permanece pendente.

### 5.5 Pagamentos

- PIX e boleto, individual ou unificado no mesmo evento.
- Adaptador inicial para Asaas Sandbox, sem acoplamento do dominio ao fornecedor.
- Webhook autenticado, persistido, idempotente e reprocessavel.
- Efetivacao transacional de todas as inscricoes vinculadas.
- Baixa manual exclusivamente autorizada e auditada.
- Historico de tentativas sem apagar cobrancas anteriores.

Implementacao incremental da Sprint 6:

- host externo limitado ao Asaas Sandbox e credenciais apenas no servidor;
- total calculado a partir dos registros autorizados; centavos inteiros na aplicacao e `numeric` no banco;
- referencia interna para conciliacao; ela nao substitui uma trava transacional de criacao;
- resultado desconhecido de uma criacao deve ser consultado antes de reenviar;
- recebimento definitivo e validado libera efetivacao; estados em analise, recebimento tardio e estorno parcial permanecem para conciliacao;
- conta Sandbox ainda deve ser criada pelo cliente. Testes contratuais com transporte simulado nao representam homologacao do gateway.

Referencias tecnicas: [criacao de cobranca](https://docs.asaas.com/reference/create-new-payment), [eventos de pagamento](https://docs.asaas.com/docs/payment-events), [instrucoes PIX](https://docs.asaas.com/reference/get-qr-code-for-pix-payments) e [autenticacao do webhook](https://docs.asaas.com/docs/receive-asaas-events-at-your-webhook-endpoint).

### 5.6 Checagem

- Lista publica somente com inscricoes efetivadas.
- Filtros sem exposicao de dados pessoais indevidos.
- Deteccao de atleta sozinho na categoria.
- Solicitacao, aprovacao e recusa de mudanca com historico.
- Travamento da checagem antes da geracao de chaves.

Estado vigente (2026-09-19): o nucleo autenticado da checagem permanece entregue. A lista publica em `/eventos/[id]/checagem` exibe nome completo de competicao, equipe, professor operacional da inscricao e categoria vigente das inscricoes efetivadas. Correcao de categoria/realocacao do sozinho esta entregue. Solicitacao auditada de correcao de outros dados, como faixa, permanece pendente e nao faz parte da realocacao do sozinho.

### 5.7 Operacao esportiva e encerramento

Entregue e congelado nas Sprints 8–12, depois da validacao do fluxo §3:

- chaves apos lock, versionamento, `final_2`/`copo_3`/`semi_4` e tentativa de evitar mesma equipe na primeira luta;
- resultados, WO e colocacoes publicados;
- areas, numero global e programacao publica;
- duracao oficial da luta por categoria;
- pesagem e premiacao operacionais por subchave;
- fechamento financeiro sintetico e analitico, com Taxa MEU CAMP snapshotada.

Nao inclui automaticamente: exportacao, placar, cronometro, chamada ao vivo, horario automatico nem pesagem individual.

## 6. Fora do primeiro incremento operacional

- Aplicativo mobile nativo.
- Marketplace, venda de ingressos ou streaming.
- Filiacao federativa completa.
- Certificados e notificacoes por SMS/WhatsApp.
- Multiplos gateways ativos simultaneamente.
- Algoritmo de chaves diferente do recorte ja aprovado na Sprint 8.
- Split automatico ou repasse financeiro antes da definicao comercial.

Telas existentes desses assuntos podem continuar como prototipo, mas nao devem ser apresentadas como funcionalidades operacionais.

## 7. Requisitos nao funcionais

- Seguranca: autorizacao server-side, RLS, segredos apenas no servidor e verificacao de webhook.
- Privacidade: minimizacao de dados publicos, consentimento e tratamento de dados de menores conforme LGPD.
- Integridade: operacoes financeiras em transacao, valores em `numeric` e eventos externos idempotentes.
- Tempo: persistencia em UTC e exibicao no fuso do evento.
- Acessibilidade: navegacao por teclado, contraste adequado, rotulos e textos alternativos.
- Qualidade: testes unitarios do dominio, integracao do banco e fluxos E2E prioritarios.
- Observabilidade: erros, webhooks e operacoes administrativas rastreaveis.
- Desempenho: paginas publicas responsivas e imagens otimizadas.

## 8. Indicadores de sucesso

As metas numericas precisam de linha de base real. O MVP deve ao menos medir:

- taxa de conclusao de cadastro;
- taxa de conclusao da inscricao;
- pagamentos confirmados automaticamente versus baixas manuais;
- webhooks recebidos, repetidos e com falha;
- inscricoes que exigiram categorizacao manual;
- solicitacoes de mudanca e tempo ate decisao;
- erros por etapa do funil;
- tempo gasto pelo organizador na checagem.

## 9. Decisoes confirmadas

- foco inicial em Jiu-Jitsu;
- cada atleta pertence a uma equipe por vez;
- menor e gerenciado por responsavel, sem login proprio;
- idade usa a data completa de nascimento e a data oficial do evento;
- categoria e calculada e congelada na inscricao;
- mudanca durante a checagem exige aprovacao;
- pagamento unificado mistura somente inscricoes do mesmo evento;
- eventos concluidos preservam historico publico;
- Supabase e a fundacao prevista;
- Asaas deve ser avaliado primeiro em Sandbox; a contratacao definitiva ainda nao esta aprovada;
- na checagem publica, o MEU CAMP exibe o nome completo de competicao do atleta, equipe e categoria vigente. Dados pessoais, peso exato, dados financeiros e identificadores internos nao sao publicos. Nao ha abreviacao automatica;
- Professor e ator proprio do produto, sem `organization_role`: `tipo_cadastro = professor` define a experiencia inicial e `athlete_managers` autoriza a gestao dos atletas.
- Professor operacional e o treinador informado para o atleta naquele evento, com cardinalidade 1 por inscricao. O nome historico fica em `registrations.operational_professor_name`. A referencia a conta Professor e opcional. `athlete_managers` nao e fallback.

## 10. Decisoes pendentes e bloqueios

Pendencias comerciais e de liberacao:

- tarifa da plataforma, incidencia e responsavel pelo custo do gateway;
- modelo de recebimento e eventual split/repasse;
- cancelamento, estorno parcial, chargeback e prazos;
- contratacao definitiva do Asaas em producao; o adaptador Sandbox nao e homologacao de producao;
- regras definitivas das chaves se o produto quiser alterar o recorte ja aprovado de 2, 3 e 4 (5+ por agrupamento);
- formato comercial final dos relatorios (exportacao e fechamento historico repetido). O fechamento sintetico/analitico com bruto, taxa snapshot e liquido ja foi entregue;
- politica de retencao, exclusao e direitos de imagem;
- metas numericas dos indicadores de sucesso; a instrumentacao do §8 ainda nao existe;
- observabilidade de producao: backup, logs, monitoramento e procedimento de rollback.

Pendencias de produto ainda no PRD, sem impedir o fluxo §3 operado pelo owner seedado:

- onboarding self-service de organizacao;
- gestao/convite de membros na UI;
- atleta independente completo;
- enforcement da regra de menor sem login proprio;
- solicitacao auditada de correcao de dados alem da categoria.

Essas pendencias nao bloqueiam o teste local nem o fluxo operacional ja comprovado. Pagamentos reais e preparacao para producao dependem das decisoes comerciais e de liberacao. Nao iniciar preparacao para producao neste marco.

## 11. Criterio de liberacao do MVP

O MVP somente pode ser liberado quando:

- todos os itens aplicaveis de `criterios_aceite_mvp.md` estiverem aprovados;
- isolamento entre duas organizacoes tiver teste automatizado;
- nenhum acesso administrativo depender de `localStorage`;
- o fluxo cadastro -> atleta -> evento -> inscricao -> pagamento Sandbox -> checagem passar E2E;
- webhook repetido nao duplicar baixa nem inscricao;
- backup, logs, monitoramento e procedimento de rollback estiverem documentados;
- dados mockados nao forem misturados a dados reais no fluxo publicado.

Inventario vigente de `localStorage` (2026-09-19), sem correcao neste marco:

Rotas/prototipos que ainda leem `lib/eventStorage` (localStorage):

- `/admin/eventos/[id]/gerenciar`
- `/admin/eventos/[id]/regulamento`
- `/admin/eventos/[id]/pesagem` (prototipo; a pesagem operacional real esta em resultados)
- `/admin/eventos/[id]/placar`
- `/admin/eventos/[id]/secretaria`
- `/admin/eventos/[id]/filiacao`
- `/admin/eventos/[id]/tarefas`

Navegaveis a partir do produto real: checagem, chaves, programacao, resultados e financeiro linkam de volta para `/gerenciar`. A listagem `/admin/eventos` nao aponta para esse hub; o caminho operacional publicado usa Configurar, checagem, chaves, programacao, resultados e financeiro com persistencia Supabase.

## 12. Governanca de escopo

Cada nova necessidade deve ser classificada como requisito do MVP, pos-MVP ou decisao pendente. Mudancas que afetem pagamento, permissao, dados pessoais ou regras esportivas exigem atualizacao deste PRD e dos criterios de aceite antes da implementacao.
