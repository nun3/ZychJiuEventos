# Sprint 6.5 - Fundacao do Design System

## Data

2026-09-12

## Escopo

Fase 0 - Baseline e protecao.

Fase 1 - Fundacao e tokens compativeis.

Fase 4 - Migracao visual piloto de `/eventos/[id]`, concluida.

Fase 4.1 - Refinamento final da pagina-piloto, concluida.

Fase 5A - Shell publico (Navbar, Footer, WhatsApp e identidade temporaria), concluida.

Fase 5B - Home e Login, concluida.

Fase 6 - Area interna principal do organizador, concluida.

Fase 7 - Inscricoes, participantes e categorias, concluida.

## Fases executadas

### Fase 0 - Baseline e protecao

- Repositorio e branch conferidos.
- Working tree existente preservado.
- Ponto de restauracao conferido em `/home/nune/meucamp-sprint65-FgfT2H`.
- Baseline de build, testes, lint e BDD consultado.
- Nenhum reset destrutivo ou limpeza do Git executado.

### Fase 1 - Fundacao e tokens compativeis

- Tokens semanticos `mc-*` adicionados como camada opt-in.
- Tipografia `Inter` e `Space Grotesk` configurada com `next/font`.
- Radius, spacing, sombras e movimento disponibilizados no CSS e no Tailwind.
- Foco visivel e suporte a `prefers-reduced-motion` adicionados na fundacao.
- Tokens e aliases legados preservados para evitar redesign em cascata.
- Nenhuma pagina ou componente-base foi migrado nesta fase.

### Fase 2 - Componentes-base do Design System

- Componentes reutilizaveis criados em `components/ui/`.
- Primitives mantidos sem `'use client'`, pois nao usam hooks, estado ou APIs do navegador.
- Classes compostas por utilitario local minimo, sem nova dependencia.
- Nenhuma pagina, componente funcional existente ou regra de negocio foi migrado.
- Nenhum componente de fases posteriores foi criado.

### Fase 3 - Componentes interativos do Design System

- `Dialog`, `Tabs` e `Dropdown` criados como primitives interativos acessiveis.
- `DataTable` e `MobileRecord` criados como primitives estruturais sem logica de dominio.
- Nenhuma pagina ou componente funcional existente foi migrado.
- Nenhuma regra de negocio, contrato, rota ou integracao foi alterada.
- Nenhum componente proibido das fases posteriores foi criado.

### Fase 3.1 - Correcoes da revisao dos primitives interativos

- `Dialog` passou a fechar ao clicar diretamente no backdrop visual.
- `Dialog` valida `initialFocusRef` contra o proprio Dialog antes de usa-lo.
- `TabsTrigger` preserva o `onClick` externo e respeita `event.defaultPrevented` antes de alterar a selecao.
- A navegacao de Tabs ignora triggers desabilitados.
- `DropdownTrigger` passou a declarar `aria-haspopup="menu"`.
- A navegacao do Dropdown ignora itens desabilitados e preserva Tab sem `preventDefault`.
- `DataTable` e `MobileRecord` nao foram alterados.
- Nenhuma pagina foi migrada durante a Fase 3.1.

### Fase 4 - Migracao visual piloto de `/eventos/[id]`

- A pagina foi reorganizada com `PageContainer`, `PageHeader`, `Card` e `StatusBadge`.
- Iconografia da pagina usa Lucide, com labels e estados acessiveis preservados.
- O layout apresenta cabecalho, metadados, cronograma, documentos e CTA em composicao responsiva.
- Desktop usa coluna lateral para a inscricao; em larguras menores os blocos empilham sem perda de contexto.
- Consultas, filtros de status, regras de inscricao, links de documentos, rota e contratos existentes foram preservados integralmente.
- Nenhum arquivo fora de `app/eventos/[id]/page.tsx` foi alterado para esta migracao.
- Evidencias visuais: `docs/design-system/evidencias/fase-4/evento-1440.png`, `evento-768.png` e `evento-390.png`.

### Fase 4.1 - Refinamento final da pagina-piloto

- Data e local passaram a compartilhar um unico bloco de informacoes no mobile, com separacao visual entre as duas secoes.
- O cronograma continua sendo um unico Card; suas fases agora sao linhas com divisores e composicao em duas colunas no desktop.
- Datas, textos, ordem, CTA, preco, cores, tipografia e layout desktop em duas colunas foram preservados.
- ModernNavbar, ModernFooter, WhatsApp global, logo e demais paginas nao foram alterados.
- Novas evidencias visuais: `docs/design-system/evidencias/fase-4.1/evento-1440.png`, `evento-768.png` e `evento-390.png`.

### Fase 5A - Shell publico

- Estado inicial: branch `master` e working tree amplo, com alteracoes de sprints anteriores preservadas sem reset ou limpeza.
- `ModernNavbar` e `ModernFooter` foram migrados para os tokens `mc-*`, sem alterar destinos, autenticacao, queries ou regras de negocio.
- Componentes compartilhados impactam Home, Login, Recuperacao de Senha, eventos publicos, Dashboard e Admin; somente o shell foi alterado, sem migrar o conteudo dessas telas.
- A navegacao horizontal e exibida a partir de `1024px` (`lg`); abaixo disso, o menu compacto evita o encavalamento de links em tablet.
- O menu compacto usa botao nativo, `aria-expanded`, `aria-controls`, Escape, retorno de foco e alvos de toque de no minimo 48px.
- O menu autenticado preserva o fluxo de conta e logout, inclusive o nome acessivel `Minha Conta` exigido pela navegacao por teclado e pelos testes.
- O Footer preserva todo o conteudo institucional existente e passa a usar grades de uma, duas, tres e cinco colunas conforme a largura disponivel.
- O botao global do WhatsApp preserva numero e destino; recebeu tamanho reduzido no mobile e offsets com `safe-area-inset`.
- O repositorio nao contem o asset oficial da marca com pata abstrata. O logo legado foi preservado temporariamente.
- Foram validados o shell em `/eventos/[id]` e a integridade visual da Home, sem redesenhar a Home.
- Evidencias visuais: `docs/design-system/evidencias/fase-5a/evento-1440.png`, `evento-1024.png`, `evento-768.png` e `evento-390.png`.

### Fase 5B - Home e Login

- O fechamento da Fase 5A confirmou o Footer responsivo em uma, duas, tres e cinco colunas e restaurou a automacao para `workers: 1`, mantendo `fullyParallel: false`.
- A Home recebeu hierarquia direta entre proposta principal, CTA, eventos publicados e explicacao essencial da plataforma, sem dados de marketing inventados.
- Hero, filtros, grade, cards e modal de eventos foram migrados para os tokens `mc-*`; consultas, dados reais, filtros e rotas foram preservados.
- O Login passou a usar composicao simples e responsiva, labels associados, foco visivel, feedback e primitives existentes do Design System.
- A selecao visual de cadastro foi ajustada no mesmo layout do Login; modal, Supabase, sessao, callbacks e redirects permaneceram inalterados.
- Recuperacao de senha dedicada nao foi migrada, pois nao compartilha atualmente o mesmo componente de layout.
- Evidencias visuais: `docs/design-system/evidencias/fase-5b/home-1440.png`, `home-390.png`, `login-1440.png` e `login-390.png`.

### Fase 6 - Area interna do organizador

- Dashboard, Eventos e Atletas foram migrados para uma interface operacional mais densa, usando tokens `mc-*` e primitives existentes.
- Uma navegacao interna compartilhada passou a indicar a rota ativa e permanece compacta, acessivel e rolavel horizontalmente no mobile.
- O Dashboard removeu blocos estaticos de resultados e ranking; manteve somente acessos operacionais e competicoes vindas da consulta existente.
- Eventos usa `DataTable` no desktop e `MobileRecord` no mobile, preservando consultas, permissoes, transicoes, exclusao de rascunho e rotas existentes.
- Atletas usa `DataTable` no desktop e `MobileRecord` no mobile, preservando busca, formularios, Server Actions, FormData e links existentes.
- Nenhum primitive foi alterado e nenhuma mudanca foi feita em Supabase, autenticacao, autorizacao, middleware, pagamentos ou Asaas.
- Evidencias visuais: `docs/design-system/evidencias/fase-6/dashboard-1440.png`, `dashboard-390.png`, `eventos-internos-1440.png`, `eventos-internos-390.png`, `atletas-1440.png` e `atletas-390.png`.

### Fase 7 - Inscricoes, participantes e categorias

- Foram consultados `docs/FLUXOGRAMA_INSCRICAO.md`, `docs/escopo_funcional_plataforma.md`, `docs/criterios_aceite_mvp.md`, `docs/maquinas_de_estado.md`, `docs/matriz_permissoes.md`, `docs/modelo_dominio_banco.md` e `docs/regras_categorizacao_pagamentos.md`.
- A inscricao multipla em `/eventos/[id]/inscricao/cadastrar-atleta` passou a explicitar evento, elegibilidade, categoria calculada, situacao do atleta, selecao, termos e resumo, sem alterar sequencia, categorizacao, FormData ou Server Action.
- As listagens reais em `/dashboard/inscricoes` e `/dashboard/meus-atletas/[id]/inscricoes` usam tabela densa no desktop e `MobileRecord` no mobile, preservando consultas, snapshots, status e links existentes.
- A configuracao em `/admin/eventos/[id]/configuracao` organiza criacao e versoes imutaveis de categorias, mantendo os mesmos campos, versionamento, query e Server Action.
- O evento usado na evidencia possuia inscricoes abertas sem versao de categorias; a interface apresenta esse estado real, sem checklist ou progresso ficticio.
- O fluxograma legado calcula idade pelo ano e descreve rotas/wizard anteriores; os requisitos atuais e o codigo usam a data completa na data do evento e alocacao automatica. O comportamento atual foi preservado.
- `RegisteredAthletesContent` permanece fora do lote por usar dados mockados e nao integrar a rota publica aprovada atual; nao existe hoje uma tela real especifica de inscritos do evento conectada ao Supabase.
- Nenhuma alteracao funcional foi necessaria em Supabase, autenticacao, autorizacao, middleware, APIs, pagamentos, queries, mutations, Server Actions ou contratos FormData.
- Evidencias visuais: `docs/design-system/evidencias/fase-7/inscricao-1440.png`, `inscricao-390.png`, `participantes-1440.png`, `participantes-390.png`, `categorias-1440.png` e `categorias-390.png`.

## Arquivos criados ou alterados

Arquivos alterados pela fundacao:

- `tailwind.config.js`
- `app/globals.css`
- `app/layout.tsx`

Documentacao criada nesta fase:

- `docs/design-system/README.md`
- `docs/design-system/sprint-6.5.md`

Componentes-base criados:

- `components/ui/Button.tsx`
- `components/ui/Input.tsx`
- `components/ui/Select.tsx`
- `components/ui/FormField.tsx`
- `components/ui/Card.tsx`
- `components/ui/Alert.tsx`
- `components/ui/StatusBadge.tsx`
- `components/ui/PageContainer.tsx`
- `components/ui/PageHeader.tsx`
- `components/ui/EmptyState.tsx`
- `components/ui/LoadingState.tsx`
- `components/ui/utils.ts`
- `components/ui/index.ts`

Componentes interativos e estruturais criados na Fase 3:

- `components/ui/Dialog.tsx`
- `components/ui/Tabs.tsx`
- `components/ui/Dropdown.tsx`
- `components/ui/DataTable.tsx`
- `components/ui/MobileRecord.tsx`

Correcoes da Fase 3.1:

- `components/ui/Dialog.tsx`
- `components/ui/Tabs.tsx`
- `components/ui/Dropdown.tsx`

Migracao da Fase 4:

- `app/eventos/[id]/page.tsx`
- `docs/design-system/evidencias/fase-4/evento-1440.png`
- `docs/design-system/evidencias/fase-4/evento-768.png`
- `docs/design-system/evidencias/fase-4/evento-390.png`

Refinamento da Fase 4.1:

- `app/eventos/[id]/page.tsx`
- `docs/design-system/evidencias/fase-4.1/evento-1440.png`
- `docs/design-system/evidencias/fase-4.1/evento-768.png`
- `docs/design-system/evidencias/fase-4.1/evento-390.png`

Shell da Fase 5A:

- `components/ModernNavbar.tsx`
- `components/ModernFooter.tsx`
- `docs/design-system/evidencias/fase-5a/evento-1440.png`
- `docs/design-system/evidencias/fase-5a/evento-1024.png`
- `docs/design-system/evidencias/fase-5a/evento-768.png`
- `docs/design-system/evidencias/fase-5a/evento-390.png`

Home e Login da Fase 5B:

- `app/HomeClient.tsx`
- `app/login/page.tsx`
- `components/ModernHero.tsx`
- `components/EventFilters.tsx`
- `components/ModernEventGrid.tsx`
- `components/NetflixEventCard.tsx`
- `components/EventModal.tsx`
- `automação/playwright.config.ts`
- `docs/design-system/evidencias/fase-5b/home-1440.png`
- `docs/design-system/evidencias/fase-5b/home-390.png`
- `docs/design-system/evidencias/fase-5b/login-1440.png`
- `docs/design-system/evidencias/fase-5b/login-390.png`

Area interna da Fase 6:

- `components/InternalNavigation.tsx`
- `app/dashboard/layout.tsx`
- `app/dashboard/page.tsx`
- `app/admin/eventos/page.tsx`
- `app/admin/eventos/EventActions.tsx`
- `app/dashboard/meus-atletas/page.tsx`
- `app/dashboard/meus-atletas/AthletesManager.tsx`
- `docs/design-system/evidencias/fase-6/dashboard-1440.png`
- `docs/design-system/evidencias/fase-6/dashboard-390.png`
- `docs/design-system/evidencias/fase-6/eventos-internos-1440.png`
- `docs/design-system/evidencias/fase-6/eventos-internos-390.png`
- `docs/design-system/evidencias/fase-6/atletas-1440.png`
- `docs/design-system/evidencias/fase-6/atletas-390.png`

Inscricoes, participantes e categorias da Fase 7:

- `app/eventos/[id]/inscricao/cadastrar-atleta/page.tsx`
- `app/eventos/[id]/inscricao/cadastrar-atleta/RegistrationForm.tsx`
- `app/dashboard/inscricoes/page.tsx`
- `app/dashboard/meus-atletas/[id]/inscricoes/page.tsx`
- `app/admin/eventos/[id]/configuracao/page.tsx`
- `app/admin/eventos/[id]/configuracao/CategoryManager.tsx`
- `docs/design-system/evidencias/fase-7/inscricao-1440.png`
- `docs/design-system/evidencias/fase-7/inscricao-390.png`
- `docs/design-system/evidencias/fase-7/participantes-1440.png`
- `docs/design-system/evidencias/fase-7/participantes-390.png`
- `docs/design-system/evidencias/fase-7/categorias-1440.png`
- `docs/design-system/evidencias/fase-7/categorias-390.png`

O repositorio possui outros arquivos alterados por sprints anteriores. Eles nao foram sobrescritos nesta fase.

## Decisoes tomadas

- A identidade visual usa azul de acao `#2563EB`, navy estrutural `#0C3049` e superficies claras.
- Tokens novos usam prefixo `mc-` e sao opt-in.
- Space Grotesk fica reservada para display, H1 e H2.
- Inter fica reservada para interface, formularios, tabelas, botoes e corpo de texto.
- A escala nativa do Tailwind permanece disponivel.
- Radius e sombras legados permanecem disponiveis.
- O comportamento de movimento reduzido e preparado por `prefers-reduced-motion`.
- A migracao visual nao pode alterar regras de negocio, contratos, rotas ou integrações.
- A pagina `/eventos/[id]` ja foi migrada e aprovada; as demais paginas ainda nao foram redesenhadas nesta etapa.
- `Dialog`, `Tabs` e `Dropdown` usam `'use client'` somente por precisarem de estado, eventos e foco no navegador.
- `DataTable` e `MobileRecord` permanecem Server Components por nao dependerem de interacao local.
- O `Dialog` usa Escape, focus trap, restauracao de foco, `aria-labelledby`, `aria-describedby` e `aria-modal`.
- `Tabs` usa `tablist`, `tab`, `tabpanel`, selecao controlada ou nao controlada e navegacao por setas, Home e End.
- `Dropdown` usa `aria-expanded`, `aria-controls`, `menu`, `menuitem`, Escape, fechamento externo e foco no primeiro item.
- `DataTable` fornece apenas estrutura semantica, colunas, linhas, estado vazio e renderizacao de celulas.
- `MobileRecord` fornece apenas composicao visual de registro, sem conhecer entidades do dominio.
- O backdrop visual do Dialog fecha somente quando o alvo do clique e o proprio backdrop; o conteudo permanece protegido.
- O foco inicial externo ao Dialog e rejeitado; nesse caso usa-se o primeiro foco interno ou o proprio Dialog.
- O handler de clique das Tabs chama primeiro o callback do consumidor e so seleciona a aba se o evento nao for impedido.
- A navegacao por teclado ignora elementos desabilitados nas Tabs e no Dropdown.
- Tab no Dropdown fecha o menu sem `preventDefault` e nao retorna foco ao trigger.
- A pagina de evento usa acao azul para inscricao, navy para estrutura e estados visuais consistentes com os tokens `mc-*`.
- A barra lateral de inscricao permanece contextual no desktop e vira bloco de fluxo no mobile.
- Data e local compartilham um unico bloco no mobile para reduzir altura e manter leitura imediata.
- As fases do cronograma usam divisores e espacamento, sem cards internos concorrendo com a entidade principal.
- O shell usa `lg` (1024px) como ponto de troca entre navegacao horizontal e menu compacto, eliminando a colisao observada em 768px.
- O Footer usa uma coluna no mobile, duas em `sm`, tres em `lg` e cinco em `xl`, sem criar conteudo institucional novo.
- O WhatsApp usa offset de safe area e alvo de toque de 48px no mobile, preservando a integracao existente.
- A marca oficial nao foi recriada: o asset legado permanece ate o recebimento do SVG aprovado.
- A Home prioriza proposta, acao principal e eventos publicados antes da explicacao complementar da plataforma.
- Cards da Home representam somente eventos; informacoes institucionais usam composicao, divisores e tipografia.
- O Login e a selecao de cadastro compartilham a mesma superficie responsiva, preservando toda a integracao de autenticacao existente.
- Modais de cadastro e evento sao carregados sob demanda para reduzir o JavaScript inicial sem alterar comportamento.
- A navegacao interna da Fase 6 usa uma barra horizontal compartilhada, com item ativo semantico e rolagem horizontal no mobile.
- Listas operacionais extensas usam tabela no desktop e composicao de registros no mobile, sem duplicar logica de dominio nos primitives.
- O layout de Eventos recebeu ajuste localizado para coexistir com o layout administrativo legado sem redesenhar as demais rotas de administracao.
- Na Fase 7, componentes de dominio continuaram especializados e apenas passaram a compor primitives existentes; nenhuma logica foi movida para `components/ui`.
- Situacoes de inscricao e elegibilidade usam texto e cor semantica; tabelas desktop sao recompostas como registros touch-friendly no mobile.
- A preparacao de categorias mostra somente versoes e ausencias sustentadas pelos dados reais, sem inventar etapas ou percentuais.

## Testes executados

- `npm run build`
- `npx tsc --noEmit`
- `npm run lint`
- `cd automacao && npm run test:unit`
- `cd automacao && npm run test:bdd`
- `git diff --check`
- Fase 5B: `npx tsc --noEmit`, `npm run build`, `npm run lint` e `git diff --check`.
- Fase 5B: revisao visual no navegador em 1440px e 390px para Home e Login, com verificacao de conteudo, overlay de erro e overflow horizontal.
- Fase 5B: unitarios e BDD completos omitidos por se tratar de migracao visual sem alteracao de regra de negocio; os fluxos de selecao de cadastro e abertura do modal de evento foram verificados no navegador.
- Fase 6: `npx tsc --noEmit`, `npm run build`, `npm run lint` e `git diff --check`.
- Fase 6: revisao visual autenticada em 1440px e 390px para Dashboard, Eventos e Atletas, incluindo verificacao de overflow horizontal e mensagens de console.
- Fase 6: unitarios e BDD completos omitidos por baixo risco, pois nenhuma logica funcional foi alterada.
- Fase 7: `npx tsc --noEmit`, `npm run build`, `npm run lint` e `git diff --check`.
- Fase 7: smoke visual autenticado em 1440px e 390px para inscricao, listagem de participantes e configuracao de categorias, sem submissao de formularios.
- Fase 7: testes automatizados e BDD omitidos, pois as mudancas foram exclusivamente visuais e nenhuma logica funcional foi alterada.
- Validacao de TypeScript apos cada correcao dos componentes interativos.
- Inspecao direta dos tokens, aliases legados e configuracao de fontes.
- BDD repetido com a configuracao existente, sem habilitar escrita ou cobrancas.

## Resultados

- Build: aprovado.
- TypeScript: aprovado.
- Lint: aprovado.
- Testes unitarios: 35/35 aprovados.
- Integridade do diff: aprovada.
- Tokens `mc-*`: presentes.
- Fontes via `next/font`: presentes.
- Aliases legados: preservados.
- Nenhuma regressao atribuivel a fundacao visual foi encontrada.
- Componentes interativos e estruturais incluidos no build sem alterar paginas existentes.
- Nenhum teste de componente foi adicionado porque nao existe runner de componentes e nenhuma dependencia nova foi autorizada.
- Fase 3.1 validada por TypeScript, build, lint, testes unitarios e diff check.
- Fase 4 validada visualmente em 1440px, 768px e 390px.
- BDD: 42 aprovados, 2 ignorados e 2 falhas preexistentes de webhook; resultado igual ao baseline aprovado.
- Fase 4.1 validada visualmente em 1440px, 768px e 390px.
- Na rodada completa da Fase 4.1, 41 cenarios passaram, 2 foram ignorados e 3 falharam: as 2 falhas preexistentes de webhook e uma falha transitoria de baixa manual em pagamentos.
- A baixa manual foi repetida isoladamente e passou; ela permanece registrada como instabilidade de estado do ambiente, fora do escopo desta pagina.
- Fase 5A validada em 1440px, 1024px, 768px e 390px; Navbar, Footer, WhatsApp e logo legado nao causaram conflito com o conteudo aprovado de `/eventos/[id]`.
- Acessibilidade do menu mobile validada com `aria-expanded`, `aria-controls`, abertura por botao real e fechamento por Escape.
- A BDD final da Fase 5A retornou 42 aprovados, 2 ignorados e as mesmas 2 falhas preexistentes de webhook.
- Fase 5B aprovada em TypeScript, build e lint; permanece somente o aviso preexistente de `<img>` em `components/EventDetails.tsx`.
- Home e Login aprovados visualmente em 1440px e 390px, sem overflow horizontal ou overlay de erro.
- Dashboard, Eventos e Atletas aprovados visualmente em 1440px e 390px, sem overflow horizontal; a navegacao interna inicia abaixo do Navbar em ambas as larguras.
- A configuracao de automacao permaneceu com `workers: 1` e `fullyParallel: false`.
- Fase 7 aprovada visualmente em 1440px e 390px, sem overflow horizontal, overlay de erro ou erros de console nas rotas verificadas.

## Problemas preexistentes

- Aviso de lint relacionado a `<img>` em `components/EventDetails.tsx`.
- Avisos de metadados de browsers desatualizados no build.
- Falhas de cenarios de webhook quando `E2E_ASAAS_WEBHOOK_TOKEN` nao esta disponivel no ambiente de automacao.
- O asset oficial da marca MEU CAMP (pata de pato abstrata) nao esta presente no repositorio; o logo legado continua temporariamente em uso.
- Os cenarios `criar versão de categorias` e `baixa manual auditada` apresentaram falhas intermitentes em execucoes completas anteriores, mas passaram quando repetidos isoladamente e tambem passaram na BDD final da Fase 5A.
- Working tree amplo com alteracoes de sprints anteriores.

## Pendencias

- Revisar e atualizar documentacao legada que ainda descreve etapas ja concluidas.
- Executar testes comportamentais especificos dos primitives quando a infraestrutura apropriada for aprovada, sem instalar dependencias nesta fase.
- Substituir o logo legado pelo asset oficial aprovado, quando disponibilizado.
- Revisao humana das evidencias da Fase 5B antes de iniciar o proximo lote.
- Revisao humana das evidencias da Fase 6 antes de definir o proximo lote; pagamentos, checkout, pesagem, check-in, tatame e resultados permanecem fora do escopo.
- Revisao humana das evidencias da Fase 7 e decisao de produto sobre uma futura tela real de inscritos por evento; o componente mockado existente nao deve ser promovido sem dados e requisitos.

## Proximos passos

1. Aguardar aprovacao humana da Fase 7 antes de definir o proximo lote; nao iniciar pagamentos, checkout, pesagem, check-in, tatame, resultados ou Fase 8.

## Limites desta entrega

Nao foram criados Drawer, Toast, OfflineStatus funcional, componentes de pesagem, check-in, tatame ou resultados.

Nao foram alterados pagamentos, checkout, autenticacao, Supabase, RLS, APIs, webhooks, Asaas, Server Actions, queries, mutations, contratos FormData, URLs ou parametros de rotas.

Nenhum segredo, token, credencial ou dado sensivel foi registrado nesta documentacao.

## Fase 8 — operacao pre-evento

- Fonte real dos inscritos: `registrations`, filtrada por `event_id`, com `athlete_snapshot` e `category_snapshot` imutaveis; o status de pagamento e somente informativo, lido pelas relacoes existentes `payment_registrations` e `payments`.
- Rotas/componentes alterados: `app/admin/eventos/[id]/checagem/page.tsx`, `app/admin/eventos/[id]/checagem/EventRegistrationsList.tsx` e ajuste localizado em `components/ModernFooter.tsx` para ocultar o WhatsApp nas rotas operacionais.
- A rota de checagem agora exige sessao e permissao de owner/organizer ou admin da plataforma, consulta inscritos reais e oferece busca e filtro locais. Desktop usa tabela densa; mobile usa `MobileRecord`.
- Check-in: bloqueado. O schema atual nao possui entidade/campos para presenca, horario ou operador; implementar exigiria decisao de dominio, migration e RLS.
- Pesagem: bloqueada. O peso do snapshot e exibido apenas como dado cadastral; nao existem persistencia, status, horario ou operador de pesagem no schema atual.
- Alteracao funcional realizada: nova consulta autenticada e somente leitura de inscricoes por evento. Nenhuma mutation, Server Action ou alteracao de estado financeiro foi adicionada.
- Regras preservadas: schema, migrations, RLS, autenticacao, categorias, checkout, pagamentos, Asaas e webhooks permaneceram intactos.
- Smoke direcionado autenticado: consulta real, busca cliente, layout de tabela/mobile, ausencia de overflow em 1440px e 390px e ausencia do WhatsApp sobre os controles operacionais.
- Evidencias: `docs/design-system/evidencias/fase-8/inscritos-1440.png` e `docs/design-system/evidencias/fase-8/inscritos-390.png`. Nao foram criadas evidencias de placeholders para check-in ou pesagem.
- Limitacoes: nao ha acao de check-in nem registro de peso aferido. A operacao depende de conexao; nao foi implementado `localStorage` nem offline-first falso.
- Preparacao para offline futuro: os dados enviados ao componente cliente sao serializaveis e a leitura permanece separada da apresentacao, sem criar contrato de sincronizacao prematuro.
- Proximo lote recomendado: definir e aprovar o modelo de dominio de check-in/pesagem, incluindo auditoria, migrations e politicas RLS, antes de construir a interface operacional mutavel.

## Fase 8.6 — pre-producao e consolidacao

- A rota publica `/eventos` existe com titulo, descricao, filtros, estado vazio e cards existentes; a consulta real da Home permanece em `lib/events/public-events.ts` e e reutilizada por `/` e `/eventos`.
- A Navbar publica aponta o item Eventos para `/eventos`. A listagem foi validada em 1440px e 390px: dados reais, filtros, estado vazio, navegacao para `/eventos/[id]`, sem overflow, 404, runtime error ou hydration visivel.
- TypeScript, build, lint e `git diff --check` foram aprovados. O lint manteve somente o aviso preexistente de `<img>` em `components/EventDetails.tsx`. BDD e unitarios completos foram omitidos por baixo risco nesta consolidacao.
- Preview conhecido: `https://jiu-lcnauyvdz-nunes-projects-e576e5bd.vercel.app`. Production alvo: `https://jiu-three.vercel.app`.
- Preview possui as variaveis Supabase e Asaas consumidas pela aplicacao, exceto `ASAAS_WEBHOOK_TOKEN`. Production possui as mesmas variaveis, incluindo `ASAAS_WEBHOOK_TOKEN`. `NEXT_PUBLIC_SITE_URL` existe em Production, mas nao e consumida pelo codigo atual.
- O commit consolidado desta entrega usa a mensagem `feat: consolidate Meu Camp design system and event operations`. SHA, push e deployment Production ficam no historico Git/Vercel.
- Foram ignorados artefatos locais de IDE, cache do CLI Supabase e `.playwright-mcp`. `.env.example` entra somente com placeholders. Check-in, pesagem, Fase 9 e cobrancas Asaas nao foram iniciados.
- A automacao permaneceu com `workers: 1` e `fullyParallel: false`.
