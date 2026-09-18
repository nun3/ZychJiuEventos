# Plano e Status das Sprints - Meu Camp

## 1. Uso deste documento

Este e o plano operacional unico do projeto. O PRD oficial esta em `docs/roadmap_plataforma_meu_camp.md`. As sprints abaixo sao sequenciais por dependencia, mas nao recebem duracao fixa ate que capacidade, equipe e disponibilidade do cliente sejam confirmadas.

Status permitidos: `planejada`, `pronta`, `em andamento`, `bloqueada` e `concluida`.

## 2. Definicao de pronto para iniciar

Uma sprint fica `pronta` quando possui:

- objetivo e criterios de aceite identificados;
- decisoes de negocio necessarias resolvidas;
- dependencias tecnicas disponiveis;
- ambiente e credenciais de teste preparados;
- riscos relevantes conhecidos.

## 3. Definicao de concluido

Uma entrega so fica `concluida` quando:

- implementacao revisada e sem dados sensiveis no repositorio;
- lint, tipagem e build aprovados;
- testes proporcionais ao risco aprovados;
- RLS e autorizacao verificadas quando houver dados;
- estados de loading, vazio e erro contemplados;
- criterios de aceite da sprint demonstrados;
- documentacao e status atualizados.

Ter uma tela navegavel ou dados mockados nao significa funcionalidade concluida.

## 4. Estado atual

### Sprint 0 - Descoberta, PRD e dominio

- Status: concluida documentalmente
- Resultado: escopo consolidado, PRD, criterios de aceite, estados, permissoes, regras e modelo relacional definidos.
- Entrega tecnica: `supabase/migrations/202608270001_initial_domain.sql` criada, aplicada e validada no Sandbox.
- Observacao: a migracao para dados reais iniciou pela autenticacao; os modulos funcionais ainda possuem mocks a substituir nas sprints seguintes.

### Proximo marco

Sprint 6 concluida em 2026-09-11. Sprint 7 em andamento: primeiro incremento da lista oficial de efetivados.

## 5. Backlog ordenado por sprints

### Sprint 1 - Validacao da fundacao Supabase

- Status: concluida
- Objetivo: provar que o schema, as funcoes e o isolamento de dados funcionam em uma instancia descartavel.
- Escopo:
  - configurar Supabase local ou projeto Sandbox;
  - aplicar e revisar a migracao inicial;
  - gerar tipos TypeScript a partir do banco;
  - criar dados de teste para duas organizacoes;
  - testar constraints, funcoes e RLS com usuarios distintos;
  - definir rollback e ajustes em nova migracao, sem editar migracao ja aplicada.
- Criterios de saida:
  - migracao sobe do zero sem erro;
  - professor cadastra atleta gerenciado;
  - pagamento nao aceita inscricao de outro evento;
  - usuario da organizacao A nao le nem altera dados privados da B;
  - acesso anonimo retorna apenas dados publicos permitidos.

#### Checkpoint de 2026-09-03

- reset dos 36 registros de teste autorizado pelo cliente;
- migracao ajustada para recriar o schema de testes de forma reproduzivel;
- migracao executada em PostgreSQL descartavel compativel: aprovada;
- 18 tabelas criadas e 18 tabelas com RLS ativa;
- trigger de criacao de perfil: aprovado;
- cadastro transacional de atleta gerenciado: aprovado;
- isolamento de leitura e escrita entre duas organizacoes: aprovado;
- visibilidade anonima restrita ao evento publicado: aprovada;
- privilegios SQL de `anon` e `authenticated` corrigidos e retestados;
- lint aprovado com quatro avisos de imagens nao otimizadas;
- build de producao aprovado apos correcoes de tipagem;
- aplicacao no projeto Supabase Sandbox `kfvypacjzlzwwblsbpwj`: aprovada;
- smoke test usando o runtime e `auth` reais do Supabase: aprovado;
- geracao de tipos TypeScript transferida para a fundacao da aplicacao na Sprint 2.

#### Conclusao de 2026-09-03

- migracao aplicada com sucesso no projeto Supabase Sandbox;
- smoke test transacional executado no runtime real do Supabase: aprovado;
- 18 tabelas e 18 configuracoes de RLS confirmadas remotamente;
- isolamento, trigger de perfil, atleta gerenciado e acesso publico confirmados;
- divida tecnica transferida para a Sprint 2: gerar tipos TypeScript apos configurar acesso local ao projeto.

### Sprint 2 - Base da aplicacao e autenticacao

- Status: concluida
- Dependencia: Sprint 1.
- Objetivo: substituir a autenticacao simulada por sessao real e preparar a camada de dados.
- Escopo:
  - instalar e configurar clientes Supabase para servidor e navegador;
  - documentar variaveis de ambiente sem valores secretos;
  - cadastro, login, logout e recuperacao de senha;
  - protecao server-side das areas administrativa e autenticada;
  - selecao de organizacao/contexto e autorizacao por papel;
  - remover `admin_authenticated` e credenciais aceitas localmente;
  - padronizar tratamento de erro e observabilidade inicial.
- Criterios de saida:
  - usuario sem sessao nao acessa rota protegida;
  - papel ou organizacao incorretos resultam em negacao segura;
  - sessao permanece e expira conforme configuracao;
  - fluxo de recuperacao funciona no ambiente de teste.

#### Checkpoint de 2026-09-03

- `@supabase/supabase-js` e `@supabase/ssr` instalados;
- Next.js atualizado de `14.0.4` para `14.2.35`, removendo o alerta critico da auditoria;
- clientes Supabase de navegador e servidor adicionados;
- middleware de renovacao de sessao e protecao inicial de rotas adicionado;
- callback PKCE adicionado;
- variaveis publicas documentadas em `.env.example`;
- build de producao aprovado com configuracao placeholder;
- `.env.local` configurado pelo cliente e endpoint do Supabase Auth validado com HTTP 200;
- cadastro por e-mail, login, logout, recuperacao e definicao de nova senha integrados ao Supabase Auth;
- autenticacao falsa e chaves `admin_authenticated`/`admin_usuario` removidas;
- login administrativo alterado para e-mail e senha reais;
- acesso anonimo a `/admin/eventos` confirmado com redirecionamento seguro para `/admin/autenticacao`;
- tela de login verificada em navegador: conteudo e controles presentes, sem overlay de erro;
- lint aprovado com quatro avisos preexistentes de imagens nao otimizadas;
- build de producao aprovado com as variaveis reais do Sandbox;
- pendente: validar confirmacao de e-mail, recuperacao e expiracao de sessao com uma conta de teste;
- pendente: atribuir uma conta de teste a organizacao e validar autorizacao permitida/negada para dois papeis;
- pendente: gerar tipos TypeScript do schema remoto.

#### Validacao de autenticacao e autorizacao de 2026-09-03

- recuperacao de senha por e-mail concluida com conta real de teste;
- callback de link expirado tratado e redirecionado para nova solicitacao;
- sessao autenticada confirmou acesso a `/dashboard`;
- conta sem vinculo administrativo foi negada em `/admin/eventos` e redirecionada para `erro=sem_permissao`;
- perfil legado ausente foi corrigido pela migracao incremental `202609030002_backfill_auth_profiles.sql`;
- organizacao de teste criada e conta vinculada como `owner`;
- a mesma conta passou a acessar `/admin/eventos`, confirmando o caminho permitido;
- pendente: validar expiracao/renovacao da sessao, contexto explicito de organizacao e gerar tipos TypeScript do schema remoto.

#### Contexto autenticado de 2026-09-03

- navbar deixou de simular usuario fixo e passou a observar a sessao do Supabase Auth;
- nome e inicial agora derivam do usuario autenticado, e visitante anonimo visualiza `Entrar`;
- logout da navbar encerra a sessao real;
- area administrativa passou a consultar e exibir organizacao e papel do vinculo real;
- lint, tipagem e build de producao aprovados; permanecem quatro avisos de imagens nao otimizadas;
- tipos TypeScript oficiais gerados diretamente do schema remoto em `lib/supabase/database.types.ts`;
- clientes Supabase de navegador, servidor e middleware parametrizados com o tipo `Database`;
- comando `npm run db:types` adicionado para atualizacoes futuras do schema.

### Sprint 3 - Equipes e Meus Atletas

- Status: concluida
- Dependencia: Sprint 2.
- Objetivo: entregar o primeiro modulo com persistencia real.
- Escopo:
  - listar equipes permitidas;
  - cadastrar, consultar e editar atletas gerenciados;
  - vincular professor/responsavel e atleta;
  - representar atleta maior vinculado a propria conta;
  - registrar troca de equipe em auditoria;
  - substituir mocks das telas de Meus Atletas.
- Criterios de saida: secao correspondente de `criterios_aceite_mvp.md` aprovada, incluindo teste de acesso indevido.

#### Primeiro incremento de 2026-09-03

- tela `Meus Atletas` deixou de consumir a lista mockada;
- equipes e atletas permitidos pela RLS passam a ser lidos no servidor;
- cadastro de equipe implementado por Server Action no contexto da organizacao;
- cadastro de atleta gerenciado implementado pela RPC transacional validada na Sprint 1;
- estados vazio, busca, sucesso e erro adicionados;
- rota sem sessao redireciona para login preservando o destino;
- lint, tipagem e build de producao aprovados;
- pendente: validar cadastro real de equipe e atleta no navegador autenticado;
- pendente: implementar consulta individual, edicao, vinculo de atleta maior e auditoria de troca de equipe.

#### Validacao funcional de 2026-09-03

- equipe de teste cadastrada pela interface e persistida no Supabase;
- atleta ficticio cadastrado pela RPC `create_managed_athlete`;
- relacionamento com equipe, faixa e peso retornados corretamente na lista;
- atualizacao da listagem apos a gravacao confirmada no navegador;
- fluxo criar equipe, cadastrar atleta e listar atleta: aprovado;
- proximo incremento: consulta e edicao reais com controle de troca de equipe.

#### Edicao e historico de 2026-09-03

- migracao `202609030003_athlete_update_audit.sql` aplicada no Sandbox;
- edicao de atleta implementada por RPC com verificacao de gestor e organizacao;
- troca de equipe exige motivo e grava auditoria na mesma transacao;
- atleta maior pode ser vinculado a propria conta, sem sobrescrever vinculo de terceiro;
- tela individual carrega dados reais e apresenta historico de trocas permitido pela RLS;
- historico de inscricoes deixou de usar mocks e apresenta os registros reais ou estado vazio;
- smoke test ampliado para edicao cruzada negada, auditoria e vinculo proprio;
- lint, tipagem remota e build de producao aprovados;
- pendente para concluir a sprint: executar o smoke ampliado no Sandbox e validar a edicao pelo navegador autenticado.

#### Conclusao de 2026-09-04

- fluxo real de equipes, cadastro, consulta e edicao de atleta aprovado no navegador;
- troca de equipe com motivo e auditoria aprovada;
- historico real de inscricoes aprovado em estado vazio;
- autorizacao permitida e negada validada com duas contas distintas;
- suite BDD/E2E concluida com 13 de 13 cenarios aprovados, incluindo escrita controlada no Sandbox;
- Sprint 4 liberada para execucao com automacao pareada a cada incremento.

### Sprint 4 - Eventos, fases, categorias e arquivos

- Status: concluida
- Dependencia: Sprint 2; usa atletas na integracao posterior.
- Objetivo: tornar o cadastro e a publicacao de eventos reais.
- Escopo:
  - CRUD no escopo da organizacao;
  - transicoes validas de estado;
  - fases e fuso do evento;
  - conjuntos versionados de categorias;
  - Storage para banner, regulamento e tabela de peso;
  - home e detalhes consumindo dados reais;
  - remocao gradual de `eventStorage` e mocks de eventos.
- Criterios de saida: evento publicado aparece publicamente e rascunho permanece privado.

#### Primeiro incremento de 2026-09-04

- migracao incremental criada para impedir regressao de status e auditar transicoes validas;
- listagem administrativa substituida por eventos reais no escopo da organizacao;
- cadastro real de evento iniciado com nome, data, local, fuso IANA e quatro fases ordenadas;
- gravacao como rascunho e publicacao conectadas ao Supabase;
- automacao BDD ampliada para listagem, publicacao e rejeicao de fases sobrepostas;
- migracao de transicoes aplicada no projeto Sandbox correto;
- regressao completa aprovada com 16 de 16 cenarios, incluindo os tres cenarios de eventos;
- CRUD administrativo de eventos ampliado com edicao de rascunho, publicacao, cancelamento e exclusao segura;
- home e detalhes publicos passaram a consumir somente eventos publicaveis do Supabase, sem `eventStorage`;
- rascunho permaneceu invisivel em teste anonimo e a atualizacao publica foi configurada sem cache obsoleto;
- conjuntos versionados e categoria ativa implementados e validados pela interface;
- banner, regulamento e tabela de peso implementados sobre bucket publico com escrita isolada por organizacao;
- trilha de auditoria confirmou quatro transicoes de status no Sandbox;
- automacao ampliada para 20 cenarios; 19 cenarios sem Storage validados, incluindo categorias e privacidade;
- migracao `202609040002_event_storage.sql` aplicada no Sandbox e bucket `event-assets` validado;
- hostname publico do Supabase limitado ao caminho do bucket na configuracao de imagens;
- formulario de login endurecido para impedir envio nativo de credenciais pela URL antes da hidratacao;
- horarios locais das fases convertidos para UTC pelo fuso IANA do evento e validados na exibicao publica;
- cenario de banner, regulamento e tabela de peso aprovado;
- regressao final concluida com 20 de 20 cenarios aprovados em 1,9 minuto;
- lint, tipagem, build de producao e verificacao visual sem overlay aprovados;
- Sprint 5 liberada para implementar inscricao e categorizacao sobre os eventos e atletas reais.

### Sprint 5 - Inscricao e categorizacao

- Status: concluida
- Dependencias: Sprints 3 e 4.
- Objetivo: criar inscricoes consistentes antes de integrar pagamentos.
- Escopo:
  - servico puro e testavel de idade e categoria;
  - inscricao propria e selecao multipla de atletas;
  - validacao de fase, duplicidade e permissao;
  - snapshot imutavel e aceite versionado de termos;
  - explicacao de nenhuma categoria ou ambiguidade;
  - testes de limites de idade, faixa e peso.
- Criterios de saida: todos os cenarios de inscricao e categorizacao do PRD passam sem gateway.

#### Fundacao de dominio de 2026-09-05

- migracao incremental preparada com preco de inscricao por evento;
- RPC transacional criada para uma ou varias inscricoes no mesmo evento;
- validacoes de sessao, gestor do atleta, fase, prazo, duplicidade e aceite de termos centralizadas no banco;
- idade calculada pela data completa na data oficial do evento;
- categoria selecionada por genero, faixa, idade, peso inclusivo e ordem, com erros explicitos para ausencia e ambiguidade;
- estado inicial definido como `pendente_pagamento` e snapshots esportivo, categoria, preco, regra e termos congelados;
- trigger preparado para impedir alteracao posterior do snapshot;
- migracao `202609050001_registration_domain.sql` aplicada no Sandbox e tipos remotos regenerados;
- migracao incremental `202609050002_registration_hardening.sql` aplicada: resolve ambiguidade de variavel SQL, rejeita aceite nulo/versao desconhecida e restringe escrita de inscricoes a RPC validada;
- preco por evento e abertura das inscricoes integrados a gestao;
- inscricao propria e selecao multipla de atletas gerenciados conectadas a RPC;
- formulario informa categoria, preco total, termos versionados, indisponibilidade e duplicidade;
- historicos individual e consolidado usam dados reais e categoria congelada no snapshot;
- modulo puro de categorizacao e quatro testes unitarios aprovados (aniversario, ano bissexto, limites, genero, faixa, prioridade e ambiguidade);
- smoke SQL transacional aprovado no Sandbox: lote proprio/gerenciado, atomicidade, escopo/RLS, duplicidade, termos, prazo, fase, ausencia/ambiguidade, limites e imutabilidade;
- regressao final aprovada: 23 de 23 cenarios BDD/E2E em 2,6 minutos, incluindo os tres de inscricao e a consulta consolidada;
- build, lint e tipagem aprovados; permanece aviso preexistente de imagem em `components/EventDetails.tsx`;
- revisao React aplicada com consultas independentes em paralelo, estados de carregamento/erro e selecao controlada.

#### Conclusao da Sprint 5

- inscricao individual/propria e em lote entregue sem gateway, com persistencia transacional e estado inicial pendente de pagamento;
- banco remoto validado com papel authenticated e usuario sem vinculo ao atleta; escrita direta bloqueada e RPC autorizada;
- snapshots esportivos, categoria, valor, regra e termos preservados apos alteracoes no cadastro;
- quatro testes unitarios, smoke SQL remoto e 23 cenarios E2E aprovados, sem cenarios ignorados;
- build de producao, lint, tipagem e verificacao visual aprovados; aviso legado de imagem mantido fora do escopo;
- migracoes da Sprint 5 aplicadas no Sandbox; nenhuma execucao SQL pendente para esta entrega;
- massa E2E unica mantida no Sandbox para consulta; massa do smoke SQL revertida por ROLLBACK;
- proximo trabalho: Sprint 6 (pagamentos Sandbox). Texto de aceite MVP deve passar pela revisao de producao prevista na Sprint 10.

### Sprint 6 - Pagamentos em Sandbox

- Status: concluida
- Dependencia: Sprint 5.
- Bloqueios para producao: politica comercial, estorno e modelo de recebimento.
- Objetivo: validar cobranca individual/unificada e conciliacao automatica.
- Escopo:
  - contrato de gateway independente;
  - adaptador Asaas Sandbox;
  - PIX e boleto;
  - tentativas de pagamento e expiracao;
  - endpoint de webhook autenticado e idempotente;
  - efetivacao transacional das inscricoes;
  - baixa manual auditada;
  - conciliacao e reprocessamento seguro.
- Criterios de saida: pagamento repetido ou evento fora de ordem nao duplica nem regride dados.

#### Revisao e sequencia de execucao

1. Contrato de gateway, dinheiro em centavos, estados conservadores e testes de transporte.
2. Migracao incremental: reserva atomica das inscricoes, total calculado no banco, trava contra cobrancas concorrentes e bloqueio de insert direto em payments. Toda cobranca deve ter contexto explicito do evento/organizacao.
3. Cadastro/reuso do pagador Asaas, tentativas persistidas e checkout PIX/boleto. Timeout de criacao deixa resultado desconhecido; consultar por referencia antes de tentar criar novamente.
4. Webhook autenticado com inbox persistida e deduplicacao, verificacao de referencia/valor/metodo, efetivacao atomica e reprocessamento.
5. Expiracao, recebimento tardio e baixa manual com justificativa, papel autorizado e auditoria. Nao reativar automaticamente inscricao substituida ou evento cancelado.
6. Homologacao no Asaas Sandbox e regressao completa antes de concluir.

#### Primeiro incremento

- contrato independente em `lib/payments/gateway.ts`;
- validacao pura de lotes e valores inteiros em `lib/payments/domain.ts`;
- adaptador Asaas com host fixo de Sandbox, PIX/boleto, consulta por referencia e instrucoes PIX;
- criacao sem retry automatico: resposta incerta exige conciliacao;
- fabrica `server-only` e variaveis privadas documentadas em `.env.example`;
- autenticacao de webhook e normalizacao de eventos testaveis, ainda sem endpoint publicado;
- estados desconhecidos, CONFIRMED, estorno parcial e recebimento apos expiracao exigem conciliacao;
- migração incremental `202609060001_payment_reservation.sql` aplicada no Sandbox pelo SQL Editor; smoke comportamental corrigido (variavel ambigua e IDs ocultos pela RLS) e aprovado pelo usuario: reserva, total, duplicidade, permissao, vinculos e escrita direta;
- 19 testes unitarios/contratuais aprovados, incluindo os quatro da Sprint 5; testes de transporte usam respostas controladas, nao o Asaas real;
- build de producao, lint e tipagem aprovados neste incremento; permanece aviso legado de imagem;
- cliente informou que criou conta Asaas e configurou a chave Sandbox; consulta autenticada a `GET /v3/customers?limit=1` retornou HTTP 200 em 2026-09-04, sem criar cobranca;
- 6A (configuracao e conectividade do pagador) validada; a chave nao foi registrada em codigo, documentacao, logs ou relatorios;
- pendentes: itens 2 a 6 acima, incluindo persistencia transacional, checkout, webhook e homologacao de cobranca. Este checkpoint nao conclui a Sprint 6.

#### Continuidade apos aprovacao da reserva

- adaptador ampliado com criacao e consulta de pagador por referencia; notificacoes desabilitadas no cadastro de teste;
- servico de emissao criado em `lib/payments/issuance.ts`, com contrato de claim atomico, persistencia antes da consulta PIX e recuperacao por conciliacao;
- nove cenarios novos em `automação/tests/payment-issuance.test.ts`; suite unitária/contratual aprovada com 28 testes;
- esses testes usam persistencia e gateway controlados: nao provam concorrencia real no PostgreSQL nem representam E2E de checkout;
- armazenamento concreto de claim/tentativa implementado em `lib/payments/issuance-store.ts`, com cliente privado server-only; falta integrar provisionamento seguro do pagador e checkout, e executar a jornada real; nao existe ainda chamada de emissao exposta ao usuario;
- apos configuracao pelo usuario, `SUPABASE_SECRET_KEY` validada no projeto `kfvypacjzlzwwblsbpwj`: consulta somente leitura a `payment_issuance_jobs`, com `limit=0`, retornou HTTP 200 sem retornar registros; `.env.local` confirmado como ignorado pelo Git;
- regressao unitária/contratual reexecutada apos configurar a credencial: 28/28 aprovados; esta verificacao nao criou clientes ou cobrancas no Asaas e nao substitui E2E de checkout;
- nenhuma cobranca externa criada neste incremento; reserva aprovada nao equivale a pagamento emitido ou recebido.

#### Endurecimento do prazo e emissao Sandbox — 2026-09-08

- migração incremental `202609080001_payment_deadline.sql` criada para que a RPC de reserva valide no banco o inicio e o fim da fase de pagamento, alem do status do evento;
- cadastro/reuso server-only do pagador Asaas por usuario implementado com referencia externa estavel e notificacoes desabilitadas;
- emissao PIX/boleto conectada ao resumo persistido, com claim atomico, consulta por referencia antes de criar e estado de conciliacao em resposta incerta;
- QR PIX e link de boleto exibidos somente apos resposta validada do Sandbox; a resposta do gateway nunca efetiva a inscricao;
- testes de emissao 9/9, tipagem, lint e build aprovados; nenhum POST real ao Asaas foi executado neste incremento;
- pendente: aplicar a migracao no Sandbox, executar E2E autenticado com pagador real de teste e homologar PIX/boleto antes de considerar cobranca emitida.

#### Inbox de webhook — 2026-09-08

- endpoint `POST /api/payments/webhook` adicionado com token `asaas-access-token` e comparacao em tempo constante;
- payload Asaas validado antes da persistencia, sem registrar eventos incompletos;
- eventos gravados em `webhook_events` com unicidade por gateway e ID externo; reenvios sao aceitos sem duplicar a inbox;
- migracao `202609080002_payment_webhook_processing.sql` adiciona processamento atomico com conferencia de referencia, valor, metodo e tentativa;
- somente `PAYMENT_RECEIVED` com status `RECEIVED` efetiva pagamento e inscricoes; `CONFIRMED`, divergencias e eventos fora de ordem ficam para conciliacao;
- pendente: aplicar as migracoes no Sandbox e homologar webhook, PIX/boleto e recebimento simulado.

#### Aplicação remota e integração real controlada — 2026-09-08

- migrações `202609080001_payment_deadline.sql`, `202609080002_payment_webhook_processing.sql` e `202609080003_payment_customer_provisioning.sql` aplicadas no projeto Sandbox `kfvypacjzlzwwblsbpwj`;
- smoke SQL remoto aprovado com `ROLLBACK`: prazo, limite de 100 inscrições, recebimento, duplicidade, divergências, ordem, estorno, claim do pagador e privilégios internos;
- provisionamento do pagador passou a usar claim persistido por usuário; concorrência retorna ocupado e resultado incerto exige consulta por referência, sem novo `POST` automático;
- parser e rota de webhook endurecidos com limite de 64 KiB, valores monetários canônicos e reprocessamento seguro de eventos persistidos após falha transitória;
- migração `202609080004_payment_issuance_rejection.sql` aplicada: recusa HTTP 4xx validada libera apenas o claim atual; timeout, 5xx, resposta inválida ou falha de persistência continuam obrigatoriamente em conciliação;
- emissão real de boleto pelo navegador aprovada no Asaas Sandbox: reserva, criação da cobrança, link na UI, tentativa persistida e reconsulta da mesma cobrança sem duplicação;
- chamada autenticada ao endpoint local, usando a cobrança real de boleto, efetivou pagamento e inscrição em uma transação; o reenvio do mesmo ID retornou duplicidade e manteve uma única tentativa;
- quatro cenários Gherkin da proteção HTTP aprovados: token ausente, token incorreto, JSON incompleto e corpo acima do limite;
- regressão Gherkin completa: **42 aprovados e 2 externos ignorados por padrão** em 6,7 min; o cenário externo de boleto foi executado separadamente e aprovado; suite unitária/contratual: **35/35 aprovada**;
- build de produção e tipagem aprovados; permanece somente o aviso legado de `<img>` em `components/EventDetails.tsx` e avisos de metadados de navegadores desatualizados;
- limpeza pós-teste confirmada por consulta: zero eventos, webhooks, claims e clientes locais da fixture; clientes e cobranças externos foram removidos pelos IDs/referências exatos;
- após a atualização cadastral informada pelo cliente, a criação real de PIX pela UI foi aprovada; a cobrança, tentativa, webhook simulado e idempotência passaram no Gherkin. O QR Code ainda retornou como instrução pendente, sem duplicar a cobrança;
- a entrega do webhook pelo próprio Asaas ainda **não** foi homologada: o teste atual chama a rota local com o mesmo contrato e autenticação. Sprint 6 permanece em andamento.

#### Baixa manual e conciliação — 2026-09-08

- tela financeira real substituiu o protótipo e lista pagamentos, inscrições, tentativas e pendências de conciliação;
- baixa manual restrita a admin, owner ou organizer, com confirmação explícita e justificativa obrigatória;
- pagamento e inscrições são efetivados atomicamente e a operação grava ator, motivo e estados na auditoria;
- smoke SQL remoto aprovado e Gherkin de integração **2/2 aprovado**, cobrindo operação autorizada e negação ao pagador comum;
- build e tipagem aprovados; dados da automação removidos;
- homologação HTTPS bloqueada somente pela ausência de login/vínculo com uma hospedagem: Vercel CLI retornou `Logged out` e não existe `.vercel/project.json`.

#### Conclusao da Sprint 6 — 2026-09-11

- deploy Production `https://jiu-three.vercel.app` validado como `Ready`; home respondeu HTTP 200 e webhook sem token respondeu HTTP 401;
- variaveis privadas de Asaas, webhook e Supabase confirmadas na Vercel sem leitura ou exposicao dos valores;
- entrega nativa do Asaas homologada: a inbox recebeu quatro eventos `PAYMENT_DELETED` com IDs externos do gateway pelo endpoint HTTPS;
- os eventos de exclusao chegaram depois da limpeza das fixtures e foram mantidos como falha de conciliacao, sem alterar pagamentos ou inscricoes, como previsto para referencia divergente;
- PIX e boleto Sandbox, reconsulta sem duplicacao, webhook idempotente, efetivacao transacional e baixa manual ja estavam aprovados por testes Gherkin/Playwright e SQL; regressao unitária reexecutada na conclusão: **35/35 aprovada**;
- criterio de saida atendido: repeticao, divergencia e evento fora de ordem nao duplicam nem regridem dados. Nenhuma cobranca real foi criada.

Comandos de reprodução, sempre com a aplicação local já iniciada e somente no Sandbox:

```bash
cd "/home/nune/Meus Projetos/jiu/automação"
npm run test:unit
npm run test:bdd
npm run test:payments:webhook
npm run test:payments:asaas:boleto
npm run test:payments:asaas:pix
```

Os comandos `test:payments:asaas:*` criam e removem recursos externos de teste e exigem autorização explícita por `E2E_ALLOW_ASAAS=true`, configurada pelo próprio script. O teste PIX somente deve ser repetido depois da aprovação da conta Sandbox.

#### Checkout de reserva server-side em 2026-09-05

- consulta consolidada passou a permitir selecionar inscrições pendentes do mesmo evento e escolher PIX ou boleto;
- Server Action autenticada envia somente IDs, evento e método, chama `reserve_payment_batch` e relê o pagamento persistido para exibir total, quantidade e referência;
- cenários Gherkin adicionados em `automação/tests/features/payment-checkout.feature` para resumo persistido e bloqueio de duplicidade, marcados com `@requires-payment-fixture`;
- 28 testes unitários/contratuais, geração BDD, tipagem e build aprovados; nenhum cliente ou cobrança Asaas foi criado;
- pendente: executar os cenários Gherkin com fixture de evento na janela de pagamento e integrar a emissão externa PIX/boleto.

#### Integração do checkout e Gherkin — 2026-09-08

- reserva pela UI com estados de envio, sucesso e erro; total visual em centavos; método e IDs validados no servidor, total final calculado pela RPC;
- resumo persistente em `/dashboard/pagamentos/[id]`, restrito ao criador mesmo quando a RLS permite consulta administrativa; lista de reservas para recuperação após reload/falha de rede;
- formulários não reenviam reserva após sucesso; inscrições com pagamento próprio ativo saem da seleção; banco continua bloqueando duplicidade em telas antigas;
- dois cenários antigos dependentes do primeiro evento da lista substituídos por massa isolada; 15 cenários de checkout cobrem PIX/boleto, reserva individual/lote, seleção, abas desatualizadas, envios simultâneos, prazo, inscrição expirada, adulteração de IDs/preço/método e acesso indevido;
- nenhuma resposta da aplicação é mockada: navegador → Server Action autenticada → Supabase → resumo; a preparação usa inserts de fixture, não o fluxo de criação de inscrição;
- dados fictícios identificados por UUIDs exclusivos, sem CPF/contato; cleanup remove somente os IDs da própria execução, incluindo reservas e vínculos; não modifica cadastros existentes;
- validação em 2026-09-08: regressão completa **38/38 Gherkin/Playwright aprovados (6,4 min)**, incluindo **15 cenários de checkout**; **28/28 unitários/contratuais aprovados**; geração BDD, tipagem, lint e build de produção aprovados (mantido aviso legado de `<img>` e avisos de metadados de browsers desatualizados);
- rechecagem após tornar a data do evento da fixture dinâmica: **3/3 aprovados (46 s)** — reserva individual, envios simultâneos e inscrição expirada; o relatório HTML da regressão completa foi preservado;
- evidência de limpeza após a regressão: consulta somente leitura retornou zero organizações, equipes e eventos remanescentes da massa `Checkout E2E` desta data; as fixtures das sprints anteriores mantêm o comportamento preexistente de persistir seus dados de teste;
- `.gitignore` da automação protege relatórios, vídeos, estado de autenticação, dependências e arquivos BDD gerados; screenshots do resumo persistido anexados ao relatório HTML;
- limite: reserva não emite cobrança. Prazo validado na Server Action; falta endurecimento temporal na RPC histórica, pagador/emissão, webhook e homologação Asaas. Não concluir Sprint 6.

Para reproduzir (aplicação rodando em `http://localhost:3000`):

```bash
cd "/home/nune/Meus Projetos/jiu/automação"
npm run test:payments
npx playwright show-report
```

Pré-requisitos: migrações de reserva já aplicadas; URL/chaves públicas e `SUPABASE_SECRET_KEY` no `.env.local` da raiz; `E2E_OWNER_*`, outra conta `E2E_UNAUTHORIZED_*` e `E2E_ALLOW_WRITES=true` em `automação/.env.e2e`. O helper recusa projetos diferentes de `kfvypacjzlzwwblsbpwj`. Sem autorização de escrita, cenários mutáveis são ignorados, não aprovados. Não copiar chaves para features, steps ou relatórios. Não há chamadas ao Asaas nesta suíte.

#### Cobertura de automacao validada na conclusao

- lote proprio/gerenciado e multiplos atletas; rejeitar mistura de eventos, permissao cruzada, preco adulterado e inscricao nao pendente;
- duplo clique, requisicoes concorrentes e timeout apos criacao no gateway nao criam cobranca duplicada;
- PIX e boleto com instrucoes reais, vencimento e pagamento simulado pelo Sandbox;
- token invalido, valor/referencia divergentes, webhook repetido e eventos fora de ordem;
- webhook recebido antes de persistir a tentativa permanece reprocessavel;
- recebimento tardio, estorno parcial e estado desconhecido geram pendencia de conciliacao;
- baixa manual negada para usuario comum e auditada para papel autorizado;
- nenhuma inscricao pode ser efetivada apenas por resposta do navegador.

### Sprint 7 - Checagem e alteracoes

- Status: concluida (nucleo operacional)
- Dependencia: Sprint 6.
- Objetivo: publicar a lista oficial e reduzir atendimento manual.
- Escopo entregue:
  - checagem apenas de inscricoes efetivadas;
  - filtros operacionais por categoria e equipe;
  - deteccao de atleta sozinho na categoria vigente;
  - solicitacao e decisao de realocacao operacional;
  - travamento unico, sem reabertura, com trilha de auditoria.
- Criterio de saida: lista travada e imutavel para operacoes comuns e pronta para originar chaves. **Atendido.**

Revisao vigente: a alocacao operacional e `coalesce(current_category_id, category_id)`. Snapshot e `category_id` original permanecem imutaveis. Aprovacao, recusa e travamento sao atomicos, auditados e recusam concorrencia/segunda decisao. A identidade publica dos inscritos ainda depende de decisao do PRD; CPF, nascimento completo e dados de pagamento nunca entram em consulta publica.

MC-SIM r1 (`24fa57c3-…`, travado em `2026-09-17T14:00:59Z`) e MC-SIM r2 (`0c5d6eff-…`, travado em `2026-09-17T14:46:53Z`) sao evidencias permanentes do runbook. Nao reabrir, nao reciclar para cenario novo, nao usar como massa descartavel de E2E.

#### Regras de dominio vigentes

- `category_is_eligible_for_registration` governa so a **inscricao** (snapshot: nascimento, peso, faixa, genero).
- `category_is_eligible_for_checking_reallocation` governa a **checagem** do sozinho. Nao revalida peso/idade do snapshot contra o destino.
- Peso: subir exatamente 1 classe adjacente; nao descer; nao pular classe existente. Buraco em kg sem linha intermediaria conta como adjacente.
- Idade: ±1 classe adjacente; nao pular classe existente.
- XOR: um destino muda peso **ou** idade, nunca os dois.
- Genero e intervalo de faixa congelados.
- Overlap ou duplicidade de intervalos no grupo: fail closed naquele eixo.
- Politica por `category_rule_sets` (habilitar/desabilitar eixos) e divida futura, sem schema morto. O default da plataforma e a regra acima.
- Correcao de dados/faixa e outro fluxo. Nao faz parte da realocacao do sozinho.

#### Lote 1 — lista oficial (2026-09-15)

- lista autenticada consulta somente `registrations.status = efetivada`;
- filtros por categoria e equipe a partir do snapshot;
- deteccao de atleta sozinho na categoria vigente;
- evidencia BDD de checagem (pendente/expirada/estornada ausentes; sozinho identificado).

#### Lote 2 — alocacao vigente e solicitacoes (2026-09-15)

- `registrations.current_category_id` (nulo = original);
- RPCs `list_eligible_category_changes`, `request_category_change`, `review_category_change`;
- uma pendencia por inscricao; snapshot/`category_id` imutaveis;
- UI: solicitacao em `/dashboard/inscricoes`; decisao na checagem administrativa;
- migration `202609160001_category_change_allocation.sql` no Sandbox `kfvypacjzlzwwblsbpwj`.

#### Lote 3 — travamento (2026-09-15)

- RPC `lock_event_checagem`; trigger bloqueia escrita direta e reabertura;
- UI administrativa com confirmacao explicita;
- auditoria `checagem_locked`;
- migration `202609160002_lock_event_checagem.sql`;
- smoke `supabase/tests/checagem_lock_smoke.sql` aprovado (sucesso sem linhas).

#### Correcao de dominio — elegibilidade de realocacao (2026-09-17)

O predicado de destino deixou de reutilizar a elegibilidade de inscricao. Helper interno `category_is_eligible_for_checking_reallocation`; as tres RPCs revalidam o mesmo contrato. Migration `202609170001_checking_reallocation_eligibility.sql` aplicada no Sandbox. Smoke `category_change_smoke.sql` reescrito com intervalos disjuntos: `Success. No rows returned`.

#### MC-SIM r1 — evidencia permanente

Evento canônico travado **antes** da regra nova. Atleta 4 sozinho no Medio, 82 kg; lista de destinos vazia pela regra antiga; checagem travada. Nao reabrir.

#### MC-SIM r2 — evidencia permanente

Evento novo. Atleta A sozinho no Leve (70 kg) → Medio adjacente → solicitacao → recusa → nova solicitacao → aprovacao → `current_category_id` = Medio, `category_id`/snapshots intactos → lista agrupa A com B e C no Medio → travamento. UI smoke autenticado por cookie do owner. Nao reciclar.

#### Matriz de aceite da Sprint 7

| Requisito | Implementacao | Evidencia | Status |
|---|---|---|---|
| Lista so de efetivadas | checagem admin filtra `status = efetivada` | BDD checagem; MC-SIM r1/r2 | aprovado |
| Detectar atleta sozinho | contagem pela categoria vigente | BDD; r1 Atleta 4; r2 Atleta A | aprovado |
| Sozinho solicita mudanca elegivel | RPC list/request com adjacencia operacional | smoke SQL; r2 Medio unico destino | aprovado |
| Organizador aprova/recusa com historico | `review_category_change` + `event_audit_logs` | smoke; r2 recusa + aprovacao | aprovado |
| Snapshot e `category_id` imutaveis | override so em `current_category_id` | smoke; r2 verify | aprovado |
| Lista usa alocacao vigente | `coalesce(current_category_id, category_id)` | r2 A no Medio com original Leve | aprovado |
| Travamento unico, sem reabertura | `lock_event_checagem` + trigger | smoke lock; r1 e r2 travados | aprovado |
| Bloqueios pos-lock | request/review recusam `Checagem travada` | smoke; r2 lock | aprovado |
| Filtros categoria e equipe | `EventRegistrationsList` | BDD; UI smoke r1/r2 | aprovado |
| Filtro por professor | — | — | nao entregue |
| Lista publica de checagem | — | identidade publica ainda e decisao de PRD | pendente de produto |
| Correcao de faixa/dados | — | fluxo distinto, fora da realocacao | futuro / decisao de modelo |
| Flags de realocacao no rule set | default de plataforma no SQL | divida consciente, sem schema | futuro |

#### Fora deste fechamento (nao bloquear o nucleo)

- lista publica e filtro por professor;
- correcao de faixa/dados cadastrais;
- configuracao por evento/rule set dos eixos de realocacao;
- unlock da checagem;
- Sprint 8 (chaves), check-in, pesagem.

Automacao proporcional: BDD de lista/sozinho; smokes SQL de realocacao e lock; RPCs autenticadas; MC-SIM r1 e r2. A hidratacao quebrada do login E2E no Playwright permanece limitacao de infraestrutura; o smoke de UI autenticado usou cookie de sessao do owner, nao `waitForTimeout`.

#### Fechamento

Nucleo operacional da Sprint 7 esta comprovado no Sandbox. A sprint fecha neste recorte. Nao iniciar Sprint 8, correcao de faixa, flags nem reabertura.

### Sprint 8 - Chaves e operacao esportiva

- Status: concluida no recorte aprovado em 2026-09-18.
- Dependencia atendida neste recorte: Sprint 7 (nucleo operacional concluido) e contrato de dominio aprovado.
- Objetivo aprovado neste fechamento: gerar, versionar e publicar chaves; operar resultados e WO ate as colocacoes; refletir o estado na consulta publica.
- Concluido:
  - migration de brackets aplicada no Sandbox;
  - topologias `final_2`, `copo_3` e `semi_4`, com 5+ por agrupamento 2/3/4 no recorte atual;
  - `sem_confronto` para N=1;
  - sugestao automatica, casamento manual no DRAFT, warnings de mesma equipe e restore;
  - publish, regenerate/versionamento, RLS/permissoes e auditoria;
  - consumo da alocacao vigente por `current_category_id`;
  - smoke SQL aprovado no Sandbox com rollback e sem massa residual.
  - Types regenerados e integracao por Server Actions e leitura server-side;
  - UI administrativa real para composicao DRAFT, publicacao e operacao de confrontos;
  - consulta publica sem IDs internos ou dados administrativos;
  - migration `202609170006_bracket_match_results.sql` aplicada no Sandbox;
  - vitoria normal e WO separados, avanco automatico, bloqueios de resultado invalido e protecao contra update direto;
  - conclusao e colocacoes derivadas para `final_2`, `copo_3` e `semi_4`;
  - smoke SQL de resultados aprovado com rollback;
  - smokes de UI autenticada e publica aprovados, incluindo 390px sem overflow.
  - MC-SIM proprio da Sprint 8 (`runId 4d17a535`) aprovado ponta a ponta;
  - massa temporaria do MC-SIM removida ao final.
- Fora do fechamento:
  - pesagem, area/tatame, programacao, premiacao e placar por pontos.
- Criterios de saida: algoritmo deterministico, testado e auditavel para todas as quantidades aprovadas.

Revisao: chaves DRAFT/publicadas, consulta publica e resultados/WO possuem implementacao real e foram validados no Sandbox. O MC-SIM cobriu checagem travada, grupos 4/3/2, `sem_confronto`, `final_2`, `copo_3`, `semi_4`, same-team inevitavel, casamento manual, restore, versionamento antes de resultado, bloqueio estrutural depois de resultado, vitoria normal, WO diferente de bye, avanco, final e colocacoes.

Automacao: os smokes transacionais cobrem DRAFT, autorizacao, invariantes, versionamento, auditoria, resultados, WO, avanco e colocacoes. Os smokes Playwright cobrem a operacao autenticada, reflexo publico, protecao das tabelas administrativas e responsividade. O MC-SIM Sprint 8 foi aprovado em identidade propria, sem reutilizar r1/r2, e executou cleanup confirmado.

### Sprint 9 - Areas/tatames e programacao

- Status: Lote 2 concluido e validado no Sandbox em 2026-09-18. Lote 1 permanece congelado.
- Dependencias atendidas: Sprint 8 concluida e benchmark operacional incorporado em `docs/benchmark-operacional.md`.
- Objetivo: organizar as lutas oficiais por numero global do evento e area operacional.
- Evidencias confirmadas:
  - `FESTIVAL.pdf` usa numeracao global de luta, de 1 a 44, enquanto a area varia;
  - a fila de uma area pode ser projetada filtrando a sequencia global;
  - `CHAVES_AREAS.pdf` identifica areas por numero e cor e tambem mostra area na visao da chave;
  - `ZYCH_JIU_JITSU_CATEGORIA.pdf` demonstra futura projecao por equipe com chave, luta, duracao, resultado e area;
  - horario previsto automatico nao foi demonstrado.
- Decisoes aprovadas:
  - uma area por grupo/subchave; todas as suas lutas permanecem juntas;
  - numero global de luta, recalculavel no DRAFT;
  - numeracao congelada depois da publicacao ou inicio;
  - WO, resultado, cancelamento e ausencia preservam numero e lacuna historica.
- Lote 1 entregue:
  - entidade de area por evento;
  - area vinculada ao grupo/subchave e numero global para cada confronto oficial;
  - fila por area derivada da numeracao global;
  - DRAFT com reordenacao atomica e publicacao/congelamento;
  - preservacao historica depois de resultado e WO;
  - operacoes transacionais, RLS, auditoria e smoke SQL aprovado;
  - visao administrativa server-side e mobile.
- Validacao:
  - migration principal e duas correcoes incrementais aplicadas no Sandbox;
  - smoke SQL transacional aprovado;
  - smoke autenticado aprovado para area, atribuicao integral da subchave, numeracao global, reordenacao, movimentacao, publicacao, congelamento, RLS/RPC, auditoria e viewport de 390 px;
  - TypeScript e build de producao aprovados.
- Lote 2 entregue:
  - projecao publica `get_public_event_schedule` sem SELECT anonimo nas tabelas administrativas;
  - rota `/eventos/[id]/programacao` com ordem global e filtros de area, categoria e equipe;
  - luta dependente exibida como `Vencedor da luta N` ate o resultado resolver o atleta;
  - WO e resultado posteriores refletem na consulta sem renumerar.
- Validacao do Lote 2:
  - smoke SQL transacional aprovado;
  - smoke publico autenticado/anonimo aprovado para draft invisivel, ordem global, filtro de area/equipe, dependente sem atleta inventado, WO, RLS e viewport de 390 px;
  - TypeScript, lint e build de producao aprovados.
- Fora da sprint: professor operacional, pesagem, premiacao, placar, horario calculado e chamada ao vivo.

### Marco posterior sem numero definido - Financeiro e encerramento

- Status: bloqueado
- Bloqueio: taxas, recebimento, estornos e formato do fechamento.
- Dependencias: Sprints 6 a 8.
- Objetivo: consolidar o evento e apresentar valores auditaveis.
- Escopo:
  - relatorio sintetico e analitico;
  - receita bruta, taxas, estornos e receita liquida;
  - fechamento e acesso historico;
  - exportacao no formato aprovado.
- Criterios de saida: totais reconciliam com inscricoes e pagamentos sem calculo por ponto flutuante.

Revisao: extratos precisam derivar de pagamentos/tentativas/estornos conciliados, nao do preco atual do evento nem de um status isolado. Fechamento deve bloquear divergencias e preservar o historico.

Automacao: bruto/taxas/liquido, pagamento unificado sem dupla contagem, baixa manual, estornos total/parcial, exportacao e fechamento repetido.

### Sprint 10 - Preparacao para producao

- Status: planejada
- Dependencia: funcionalidades selecionadas para o primeiro lancamento.
- Objetivo: liberar somente um fluxo seguro, observavel e recuperavel.
- Escopo:
  - E2E completo e testes de autorizacao;
  - acessibilidade e responsividade;
  - desempenho e otimizacao de imagens;
  - logs, alertas, backup e restauracao testada;
  - CI/CD, ambientes e rollback;
  - revisao LGPD, termos e direitos de imagem;
  - remocao de mocks do fluxo publicado.
- Criterios de saida: criterio de liberacao do PRD integralmente atendido.

Revisao: seguranca financeira, RLS e tratamento de segredos sao criterios da Sprint 6, nao tarefas adiadas para esta sprint. Revisar dependencias, remover caminhos mockados publicados e ensaiar restauracao antes da liberacao. A auditoria de dependencias continua sendo um gate de producao.

Automacao: jornada completa com multiplos papeis, regressao de isolamento, navegacao por teclado, tamanhos de tela, falhas de rede, repeticao de webhook, recuperacao de backup e smoke de deploy.

## 6. Riscos acompanhados

| Risco | Impacto | Tratamento |
|---|---|---|
| Dominios esportivos fora do fechamento da Sprint 8 | Impedem operacao esportiva alem de chaves e resultados | Definir contrato proprio antes de pesagem, area/tatame, programacao, premiacao ou placar |
| Politica financeira indefinida | Bloqueia pagamento real e fechamento | Decisao comercial antes da promocao do Sandbox |
| Dados de menores | Risco legal e reputacional | Minimizar exposicao, registrar consentimento e revisar LGPD |
| Prototipo confundido com sistema real | Expectativa e testes incorretos | Rotular mocks e migrar modulo a modulo |
| RLS incompleta | Vazamento entre clientes | Testes automatizados com duas organizacoes em toda sprint de dados |
| Webhook duplicado ou fora de ordem | Inconsistencia financeira | Idempotencia, transacao, historico e reconciliacao |

## 7. Registro resumido de progresso

Ao finalizar uma sprint, registrar aqui somente:

- data de conclusao;
- entregas realmente verificadas;
- testes executados;
- decisoes tomadas;
- divida tecnica aceita;
- proxima sprint pronta.

Detalhes diarios devem ficar no gerenciador de tarefas ou nos commits, nao neste documento.
