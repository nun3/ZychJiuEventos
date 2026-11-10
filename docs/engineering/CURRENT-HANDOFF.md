# Handoff atual — Meu Camp

Atualizar após os commits finais de cada lote e antes de `/clear`.
Sem credenciais, tokens, dados pessoais ou identificadores de infraestrutura.

## Branch e HEAD

| Item | Valor |
| --- | --- |
| Worktree | `/home/nune/Meus Projetos/jiu-event-readiness` |
| Branch | `integration/event-readiness-20261106` |
| Candidato funcional validado | `a6dadbb` |
| HEAD desta atualização | `1ac1dcd` (código em `aca7c44`) |
| Release gate técnico | GO (6 nov 2026 — `EVENT-READINESS.md` §12) |
| **Publicado em produção** | **Sim, 6 nov 2026** — `dpl_BYTLoYjrNWxcWkxXc96wkvYr9dhX`, PASS WITH LIMITATIONS (`EVENT-READINESS.md` §13) |

O working tree original de `jiu` não foi modificado neste lote.

## Rodada de 10 nov 2026 (2) — Menus, rodapé Halftone e fim do /eventos (commitado, NÃO publicado)

Branch `feature/cinematic-auth-v2`, mesmo worktree. Três commits em cima de `471ec3c`, **sem push e sem deploy**.
**Produção continua no estado de `0f4da32`** (a Home "spatial" da rodada abaixo): nada destes três commits está no ar.
Sem migration, sem escrita em banco, sem mudança de pagamento.

| Commit | O que entrega |
| --- | --- |
| `b7e38f8` | Sistema de menus: menu cinematográfico nas telas públicas e StaggeredMenu nas internas |
| `69d88c2` | Rodapé Halftone (retícula) na Home, com paleta própria |
| `a17452f` | `/eventos` aposentada (redirect para a Home) e spec pública atualizada |
| `44de1ea` | Rodapé Halftone em todas as páginas (`ModernFooter` → `SiteFooter`; dashboard/platform ganharam rodapé), logo do painel interno → Home (`/`), avatar no botão do menu lateral |
| `860aff7` | Avatar como único disparo do menu interno, cartão de perfil no painel, visualizador/editor da foto (`AvatarPhotoEditor`, recorte circular), `WhatsAppFloat` também na Home |
| (este lote) | Menu interno: avatar vira X ao abrir; sem flash de "MENU +" e sem vazar a sombra do painel fechado. **Gerador de evento** (branch `feature/gerador-eventos`, derivada de `feature/cinematic-auth-v2`): `EventScheduleGenerator` no formulário de novo evento; motor puro em `lib/events/phase-generator.ts` + parâmetros em `lib/events/schedule-config.ts`. Entrada: mês, ano, período (09h/14h/18h) e prazo de inscrições (curto/equilibrado/longo, antecedência mínima 7/21/45 dias). Saída: primeiro sábado viável + as 4 fases oficiais (`event_phases`: inscricao, pagamento, checagem, chaves), em ordem e sem sobreposição, no fuso do evento. "Gerar outra sugestão" percorre sábados → horários alternativos → pagamento mais longo/curto, sem repetir; mês inviável oferece o mês seguinte por botão (nunca troca em silêncio); edição manual exige consentimento para sobrescrever; nada é gravado até salvar. Sem migration, sem mudança de banco/action. Não existe tela de edição das fases (só criação). Spec E2E `automação/tests/event-generator.spec.ts` NOT_RUN (exige `E2E_OWNER_*`); o componente foi exercitado em rota QA local (desktop e mobile, 27 checagens) |

Nota: o WhatsApp flutuante (`WhatsAppFloat`) está em todas as páginas, exceto nas telas operacionais do evento. Verificado: build, tsc, lint, spec pública 13/13, rodapé+logo em 9 páginas públicas (desktop/mobile) e na casca interna via rota QA temporária (removida). Telas reais `/dashboard`, `/admin`, `/platform` autenticadas não foram exercitadas.

**Regras novas (valem daqui em diante):**
- **Telas públicas** (Home, institucionais, login, recuperar/atualizar senha, `/eventos/[id]`): `ModernNavbar` abre o menu cinematográfico
  (`components/navigation/CinematicMenu.tsx`). Gatilhos: avatar (desktop, logado) e hambúrguer (celular). O drawer da conta e o painel
  mobile branco **não existem mais**; o GSAP saiu do nav (Home: 222 → 192 kB de First Load JS).
- **Telas internas** (`/dashboard`, `/admin`, `/platform`): `components/navigation/InternalNav.tsx` com o `StaggeredMenu` (React Bits,
  instalado em `components/react-bits/`, desvios e revisão de movimento no README da pasta). Painel pela direita; "Sair da conta" é botão.
- `/admin/autenticacao` (login do admin) mantém o nav público (`OperatorLayoutBoundary` ganhou `publicNavigation`).
  A mesa de operação (`/admin/eventos/[id]/operacao`) e o LIVE seguem com navegação própria.
- **Movimento do menu público**: ampliação por proximidade do Dock (`dock-magnify.ts`), **sem realce** de item e sem repique; a mola do
  Dock com os valores padrão é superamortecida. Desligada com `prefers-reduced-motion`; toque não amplia. O foco do teclado amplia a opção
  focada (com o mouse parado, o teclado manda).
- `/eventos` (só a URL exata) redireciona 307 para `/`, preservando `?q=`. `/eventos/[id]/*` permanece. 307 é temporário de propósito.
- Rodapé da Home: `HomeFooter` (Halftone). Paleta: fundo `#050a14`, tinta `#dfe7f5`, vermelho da marca `#DC2626` ao "esquentar" (o preset
  `night` destoava do azul da Home). Os links do rodapé são `<a>` comuns (recarregam a página; o componente não aceita `Link`).
  O botão flutuante do WhatsApp **não aparece na Home** (vinha do `ModernFooter`); o contato é link na coluna "Contato".
  As demais páginas continuam com o `ModernFooter`.

**Validação (contra build de produção local):** `tsc` e lint sem erros novos; spec pública 13/13; unit 256/257 (a falha em
`registration-correction.test.ts` é anterior: alias `@/` sob ts-node); menu cinematográfico 34/34 (navegador, 12 itens em 2 colunas e 7 em 1);
varredura de 9 telas públicas no celular OK; menu interno 39/39 e rodapé 11/11. Um ambiente de teste sem GPU deixa as animações lentas:
checagens de tempo/quadros oscilam ali sem indicar defeito (foram trocadas por verificações determinísticas quando possível).

**NÃO verificado — fazer antes de publicar:**
- `automação/tests/auth-experience.spec.ts` e `steps/authorization.steps.ts` (helpers de logout trocados para o botão único "Menu") exigem
  credenciais reais em `.env.e2e` e **não foram executados**.
- `/dashboard`, `/admin/eventos` e `/platform` **nunca foram vistos com sessão real**: o `InternalNav` foi validado em uma rota temporária
  (já removida) com a sessão simulada no navegador. Olhar essas telas no Preview, no desktop e no celular, antes do deploy.
- Aparelho de toque real (a ampliação do Dock ignora toque por desenho; não foi testada em celular de verdade).

**Decisões em aberto / limites conhecidos:**
- No desktop, o **visitante deslogado** não tem ícone de pessoa: só "Login" e "Criar evento". Por isso não abre o menu cinematográfico
  (Academias, O sistema, Notícias, Quem somos ficam só no rodapé). Um ícone neutro que abra o menu muda o desenho do nav.
- A barra das telas internas perdeu "Eventos" e "Criar evento" soltos: agora estão dentro do painel.
- Sem uso, **não removidos**: `EventsCatalog`, `EventsFeaturedStage`, `InteractiveChampionshipDemo`, `EventFilters` (só a lista `states` é
  reaproveitada) e os legados `components/Header.tsx`/`Footer.tsx`. Remoção é um commit à parte.
- Redirect 307 → 308 (`permanent: true`) se a decisão de aposentar `/eventos` for definitiva.
- A paginação do calendário em lotes continua só visual: `getPublicEvents` traz tudo de uma vez (ver a rodada abaixo).
- `docs/CODEBASE_MAP.md` está desatualizado (rodar `/cartographer`). Itens do dono sem commit e fora deste lote: `AGENTS.md`, `CLAUDE.md`,
  imagens removidas de `docs/`, `docs/CODEBASE_MAP.md`, `docs/efeitomenu.txt` (referência do Dock), `pageModel.txt/`, `skills-react/`,
  `supabase/config.toml`, `test-pages/`.
- Publicar exige autorização explícita (push, deploy). Ao publicar, conferir também o `.vercelignore` (`test-pages/` sobe no upload da CLI; é inerte).

## Rodada de 10 nov 2026 (1) — Nova Home "spatial" (publicada; código em `0f4da32`; parcialmente superada pela rodada acima)

Branch `feature/cinematic-auth-v2`, mesmo worktree. Publicado em produção (https://jiu-three.vercel.app) a partir do working tree
e commitado depois em `0f4da32`. O deploy usou também alterações não commitadas de `AGENTS.md`/`CLAUDE.md` e arquivos de `docs/` (inertes para o app).
Sem migration, sem escrita em banco, sem push, sem mudança de pagamento.

**O que mudou (parte já superada: o rodapé da Home virou o Halftone e `/eventos` foi aposentada; ver a rodada acima):**
- `app/page.tsx` — nova Home: arte de fundo fixa (`public/images/home/home-bg.jpeg`, original sem recompressão), Cover Flow 3D de
  destaques, calendário em vidro e o `ModernFooter` existente (nenhum rodapé novo). `?q=` agora pré-preenche a busca do calendário
  (antes redirecionava para `/eventos`).
- Novos: `components/home-landing/HomeCoverFlow.tsx` (+ `.module.css`), `HomeCatalog.tsx`, `components/ui/GlassSelect.tsx` (combobox ARIA),
  `components/motion/RouteProgress.tsx`, `lib/home/cover-flow.ts`, `lib/home/catalog-groups.ts`.
- Removidos: `app/HomeClient.tsx`, `components/home-landing/{HomeLanding,ParticleTitle,PixelCard}.tsx` (o histórico git os preserva).
- `ModernNavbar.tsx`: logo e "Eventos" levam a `/` (com View Transition); "Eventos" fica ativo em `/`; prop `scrolledTone="glass"` (usada só na Home).
  `ModernFooter.tsx`: link "Eventos" → `/`. `EventFilters.tsx`: apenas `export` da lista `states`.
  `globals.css`: utilitários `.mc-glass*`, barra de progresso de rota, View Transition mais curta (240 ms). `layout.tsx`: `<RouteProgress />`.
- `/eventos` e todas as rotas `/eventos/[id]/*` **permanecem** como estavam.
- Enquanto não há eventos suficientes, o carrossel usa 5 frases de estratégia de luta (texto próprio, sem atribuição); cada evento real passa a ocupar o lugar de uma frase.

**Validação:** build, `tsc` e lint OK (um aviso antigo em `EventDetails.tsx`); unit 249/250 (a falha em `registration-correction.test.ts`
é anterior: alias `@/` sob ts-node); spec pública 11/11 (3 novos); validação de navegador desktop+mobile e teste com 300 eventos gerados
(lotes de 8, filtros, combobox por teclado) OK; Preview e produção verificados por HTTP, HTML e navegador; zero erros de runtime.

**Pendências / limites conhecidos:**
- Sem push: `0f4da32` existe só localmente.
- Alinhamento visual das demais áreas (admin, dashboard, login, institucionais, `/eventos`) NÃO foi feito além do nav, do rodapé e dos utilitários de vidro.
- A paginação em lotes é só visual: `getPublicEvents` ainda traz todos os eventos de uma vez (sem `.limit`). Acima de ~100 eventos, paginar no servidor.
- `docs/CODEBASE_MAP.md` não foi atualizado (rodar `/cartographer`).
- A pasta não rastreada `test-pages/` (página de teste da referência) subiu junto no upload da CLI; é inerte para o app.

## Rodada de 7 nov 2026 — Flow Motion Navigation (local, sem commit)

Missão de refinamento da navegação global (`ModernNavbar.tsx`). Mesma branch
`feature/cinematic-auth-v2`, mesmo worktree, sem commit, sem push, sem deploy.

**O que mudou:**
- `components/ModernNavbar.tsx` — o prop `overlayAtTop` era um no-op literal (`void overlayAtTop`,
  nunca lido) passado por `app/page.tsx` e `components/InstitutionalPage.tsx` sem efeito algum.
  Agora tem comportamento real: com `overlayAtTop`, o header nasce transparente/gradiente
  navy com logo e texto brancos sobre o hero escuro, e transita para branco sólido/texto escuro
  após 72px de scroll (listener `scroll` com throttle via `requestAnimationFrame`, cancelado
  corretamente no cleanup). Páginas que não passam `overlayAtTop` (admin, dashboard, eventos,
  recuperar-senha, atualizar-senha, PublicEventFrame — a maioria do app) mantêm o header idêntico
  ao anterior (branco, sem transição), confirmado por revisão independente.
- Menu hambúrguer mobile — reconstruído de um dropdown simples (sem animação) para um painel
  full-height deslizando da direita, no mesmo padrão já usado pelo drawer da conta (`translate-x-full`
  → `translate-x-0`, scrim, `inert`, bloqueio de scroll do body, focus trap, Escape). Cascata dos
  itens via GSAP (`useGSAP` + `gsap.matchMedia('(prefers-reduced-motion: no-preference)')` +
  `mm.revert()` no cleanup — mesmo idioma já usado em `CinematicStory.tsx`/`SiteScrollChoreography.tsx`;
  este arquivo não tinha GSAP antes).
- Avatar/conta: espaçamento do cluster direito do header unificado via `gap-3` (antes misturava
  margin no avatar com padding nos links, causando o desalinhamento relatado); borda/fundo do avatar
  ganham variante clara sobre o header transparente.
- `app/login/page.tsx` — uma linha: `<ModernNavbar />` → `<ModernNavbar overlayAtTop />`. O Login
  tinha o mesmo choque header-branco-sobre-fundo-escuro que a Home; agora compartilha a mesma
  identidade visual, mantendo a transição Home↔Login já existente intacta.
- Correção incidental: o header subiu de `z-50` para `z-[65]`, acima dos overlays do drawer/menu
  (`z-[60]`) — isso também corrige, em toda página do app (não só nas com overlay), um bug
  pré-existente onde o header ficava coberto pelo scrim do drawer da conta quando ele abria.
- `components/HomePlatformSection.tsx` ("A competição conecta todo mundo.") — investigado conforme
  pedido; espaçamento e conexão com o footer já estavam corretos visualmente, sem TODO documentado
  em nenhum doc. Não alterado, para não expandir escopo sem problema real identificado.

**Achados da revisão independente (`domain-risk-reviewer`) e correções aplicadas:**
- Médio: `mobileOpen` sobrevivia a um resize para desktop com o menu aberto, travando o scroll do
  body e o focus trap num painel invisível (`md:hidden`). Corrigido com um listener
  `matchMedia('(min-width: 768px)')` que fecha o menu mobile ao cruzar o breakpoint, e o clique no
  avatar agora fecha o menu mobile defensivamente antes de abrir o drawer. Confirmado via teste:
  `body.style.overflow` volta a `""` corretamente após o resize.
- Baixo: o `requestAnimationFrame` do listener de scroll não era cancelado no cleanup — corrigido
  guardando o id do frame.
- Observação → corrigida durante a validação visual: dois elementos com o mesmo
  `aria-label="Fechar menu"` ficavam simultaneamente focáveis quando o menu mobile abria (o próprio
  hambúrguer, agora clicável acima do overlay, e o scrim). Renomeado o scrim para
  "Fechar menu de navegação"; verificado com Playwright que a ambiguidade de seletor desapareceu.
- Observação: foco perdido ao restaurar para o avatar quando o drawer é aberto pelo caminho mobile
  ("Minha conta") — corrigido com um helper (`focusAccountTrigger`) que cai para o próprio botão do
  hambúrguer quando o avatar não está visível.
- Observações de acessibilidade aplicadas: `role="dialog"`/`aria-modal` no painel mobile, anel de
  foco visível em todos os itens do menu mobile e no logotipo (adaptado à cor do estado transparente).
- Ajuste visual pós-fix de z-index: os painéis (drawer e menu mobile) agora começam em `top-16`
  (abaixo do header) em vez de `inset-y-0`, evitando sobreposição visual entre o cabeçalho e a
  linha de título do próprio painel.

**Testes (local, `next dev`, depois revertido):**
- TypeScript (`tsc --noEmit`): PASS
- Lint (`next lint`, arquivos alterados): PASS, sem warnings novos
- Build (`next build`): PASS
- `automação/tests/auth-experience.spec.ts`: 13/13 PASS (inclui o fluxo de logout pelo drawer)
- `automação/tests/features/login.feature`: 5/5 PASS
- `automação/tests/features/authorization.feature`: 5/5 PASS (inclui `encerra a sessão pelo menu da
  conta`, que exercita tanto o caminho desktop quanto hambúrguer→"Minha conta"→drawer→"Sair da conta")
- Visual: screenshots Playwright em 1440/768/390px — Home no topo (overlay) e rolada (sólido),
  Login no topo e rolado, Institucional (`/quem-somos`, outro consumidor de `overlayAtTop`) no topo,
  menu mobile fechado/abrindo/aberto/fechado-de-novo, verificação específica de resize
  mobile→desktop com o menu aberto.

**Decisão:** GO WITH LIMITATIONS para avaliação visual do proprietário. Não autoriza commit, push,
merge ou deploy. Limitação conhecida: o reviewer não tinha acesso a `git diff` e validou o arquivo
atual contra a descrição fornecida, não contra o HEAD; recomendo que o proprietário rode
`git diff -- components/ModernNavbar.tsx` antes de aceitar o lote. Estado autenticado do avatar
(drawer aberto, avatar com usuário real) foi validado via os testes Playwright existentes
(que usam credenciais de `.env.e2e` através do mecanismo já aprovado do próprio projeto), mas não
capturado em screenshot isolado nesta rodada — o acesso a `.env.e2e` para scripts ad-hoc novos foi
bloqueado pelo classificador de permissões do Claude Code, conforme a regra do `CLAUDE.md`.

## Rodada de 7 nov 2026 — Login cinematográfico v2 (local, sem commit)

Missão de redesign visual de `/login`. Worktree `jiu-event-readiness`, branch dedicada
`feature/cinematic-auth-v2` (criada a partir de `32addc0`, que é a mesma base da branch
`integration/event-readiness-20261106` descrita acima). **Implementação local apenas: sem
commit, sem push, sem deploy, sem migration, sem alteração de dados.** O working tree original
de `jiu` (login cinematográfico local, ~118 arquivos sujos) não foi tocado — usado só como
referência de leitura (`components/auth/AuthSplitShell.tsx`, `app/login/page.tsx` de lá).

**O que mudou:**
- `app/login/page.tsx` — reestruturação visual completa: fundo fotográfico (`public/images/cinematic/mc-hero.jpg` / `mc-hero-mobile.jpg`, antes não usados em nenhuma página), painel único em glassmorphism (`.glass-effect`, já existente em `globals.css`) com dois blocos internos separados por divisor. Painel esquerdo: texto institucional + lista de perfis (Atleta/Professor/Organizador/Responsável) que, no modo Entrar, atuam como atalho para Criar conta com o perfil já selecionado (`openRegistration` passou a chamar `setMode('register')`, antes só setava o perfil). Painel direito: abas Entrar/Criar conta/Recuperar senha e formulários existentes, recolorido para o tema escuro via seletores Tailwind descendentes (`darkPanelTheme`), sem editar `Input`/`FormField`/`Alert`/`Button` compartilhados. `data-login-stage` no `<section>` (hook já reservado em `SiteScrollChoreography.tsx`) e `data-no-scroll-choreography` ao redor do `<ModernFooter />` desta página, para a página não herdar a animação genérica de scroll (ambos são opt-outs já previstos nos seletores daquele arquivo — nenhuma alteração nele).
- `components/ModernNavbar.tsx` — link "Login" (desktop e mobile) e o logo ganharam `onClick` que envolve a navegação em `document.startViewTransition()` quando suportado e `prefers-reduced-motion: no-preference`; guard completo para modificadores/clique do meio, sem navegação SPA quebrada quando a API não existe. Nenhuma mudança visual ou de layout do header (já era branco, compacto, Eventos/Login/Criar evento — nada a ajustar ali).
- `app/globals.css` — keyframe `mc-auth-enter` (entrada discreta, respeita `prefers-reduced-motion: reduce`) e `::view-transition-*` para a transição Home↔Login.
- Google OAuth: não implementado (fora de escopo desta missão).
- `AuthSplitShell` não existe neste worktree e não foi criado como componente compartilhado — o shell novo é local a `app/login/page.tsx` (menor impacto, nada mais consome essa composição ainda).

**Contratos preservados (confirmado por revisão independente, ver abaixo):** `signInWithPassword`, `registerPublicAccount`, `SignupAccountForm`, `resolvePostLoginRedirect`/`isSafePostLoginPath`, gate de maioridade, `redirectTo`/`mode` na query string, ids/labels/roles usados pelos testes (`#login-email`, `#login-password`, "Entrar na conta", "Entre na sua conta").

**Testes (local, `next dev` em `localhost:3000`, depois revertido):**
- TypeScript (`tsc --noEmit`): PASS
- Lint (`next lint`, arquivos alterados): PASS — sem warnings novos (1 warning pré-existente não relacionado em `components/EventDetails.tsx`)
- Build (`next build`): PASS
- `automação/tests/auth-experience.spec.ts`: 13/13 PASS
- `automação/tests/features/login.feature` (BDD): 5/5 PASS
- `automação/tests/post-login-redirect.test.ts`: 2/2 PASS
- Visual: screenshots Playwright em 1440/768/390px, estados Entrar/Criar conta/Recuperar senha/erro — revisadas manualmente, sem overflow horizontal, campos legíveis, foco visível.

**Revisão independente (`domain-risk-reviewer`, somente leitura):** PASS, sem achados críticos/altos/médios. Observações menores (UX, não segurança): `Alert` de sucesso/erro usa a mesma cor de texto em qualquer variante — já é o comportamento do componente compartilhado em todo o app, não uma regressão desta missão.

**Decisão:** GO WITH LIMITATIONS para avaliação visual do proprietário. GO significa apto para avaliação de uma futura release — não autoriza commit, push, merge ou deploy. Limitação conhecida: a composição exata do fundo fotográfico (enquadramento dos praticantes atrás do painel) não foi comparada pixel a pixel com a imagem de referência anexada pelo proprietário — apenas validada visualmente como atendendo à composição descrita na missão (fundo fotográfico + painel translúcido + praticantes visíveis à direita/margens).

## Rodada de 6 nov 2026 — Cartographer (plugin + mapa)

Missão de configuração de agentes. Sem commit, sem push, sem deploy, sem SQL de escrita, sem alteração funcional.

- Plugin Claude Code: `cartographer@cartographer-marketplace` **1.4.0**, escopo user, enabled. Marketplace oficial `kingbootoshi/cartographer` (nome do marketplace: `cartographer-marketplace`, não `kingbootoshi-cartographer`).
- Skill `/cartographer` reconhecida (1 skill, 0 hooks, 0 MCP). Conflito: nenhum com `vercel-plugin@vercel`.
- Mapa: `docs/CODEBASE_MAP.md`, verificado contra este worktree (`32addc0` / código `aca7c44`).
- Graph-First: `AGENTS.md` §21.1; ponteiro em `CLAUDE.md`. Políticas de segurança preservadas.
- CLI v2 **não** habilitada: exige Bun, ausente (o plugin Vercel já registra a mesma lacuna). Etapa separada.
- Working tree original de `jiu` (login cinematográfico local) **não** foi alterado. Investigação somente leitura registrada no mapa e no relatório da missão.

## Estado técnico do candidato

Candidato integrado dos lotes 2–6 e da correção de criação de evento / organização administrativa / categorias em escala real. Testado estaticamente e com Playwright de leitura. **Não publicado. Não homologado com escrita. Não operacionalmente liberado.**

Relatório central: `docs/releases/EVENT-READINESS.md` (o HEAD interno desse arquivo ainda cita `36abc9d`; o tip `a6dadbb` registra a revisão de leiturabilidade das telas públicas).

## Decisões definitivas

- Pata geométrica e Patojitsu descartados. Não reintroduzir.
- Homologação por segundo projeto Supabase cancelada em 6 nov 2026.
- Produção permanece na linhagem financeira A até escolha A/B/C.
- Alternativa A de categorias aprovada; expansão U→M/F está nesta branch, não em `b0a32c7`.
- Diff local de `categorize()` que mistura `U` não entra.
- Cada lote parte de `b0a32c7` até o proprietário decidir o contrário.

## Testes e evidências

Registrados em `docs/releases/EVENT-READINESS.md`:

- TypeScript, lint e build: PASS
- Unitários: 221/222 (1 falha pré-existente de alias no `automação`)
- Playwright categorias 2/2, integração 7/8 (1 skip de staff), auth 13/13
- Carga, concorrência, BDD `@write`/`@full-event`/`@homologation`: NOT_RUN — BLOCKED BY ENVIRONMENT

Este lote de ambiente não reexecutou essas suítes.

## Bloqueios

- ~~Ambiente seguro para escrita, carga e jornada esportiva completa.~~ Carga/concorrência
  confirmadas em rodada anterior (Docker). **Jornada esportiva completa com escrita real
  confirmada em 6 nov 2026** (ver rodada "Correção do 404 de schema drift..."): `full-event.feature`
  passou de ponta a ponta (inscrição → pagamento → checagem → chaves → programação → LIVE →
  resultados → conclusão), 3 execuções consecutivas sem flake, no stack Supabase local. Isso
  resolve o bloqueador "ambiente" para fins de correção de código; a decisão sobre homologar
  também contra um ambiente diferente do local (e sobre a cadência/local definitivo de
  homologação) continua do proprietário.
- ~~"Novo, crítico": o mesmo bug de schema drift existiria em produção agora.~~ **Falso alarme,
  verificado e descartado em 6 nov 2026** por GET HTTP real + leitura direta do schema — ver rodada
  "Verificação P0: produção NÃO está indisponível — correção do falso alarme" abaixo. A suspeita
  original foi inferida só pela ausência de entrada em `list_migrations`, sem verificar o schema
  real nem fazer a requisição HTTP; as colunas `local_*` já existem em `zigjiu` (aplicadas fora do
  histórico de migrations rastreado) e a página pública do único evento publicado responde 200.
- ~~Confirmar se algum operador real tem filiação administrativa ambígua.~~ Confirmado em 6 nov
  2026: consulta agregada em produção (`zigjiu`, somente leitura) retornou **0** operadores com
  mais de uma filiação owner/organizer.
- Escolha da linhagem financeira A/B/C.
- Seleção da base Git dos próximos lotes (`b0a32c7` vs este candidato).
- ~~`createCategoryRuleSet` — troca de versão ativa sem atomicidade, sem proteção contra
  concorrência, sem restrição por estado.~~ Corrigido em 6 nov 2026 (ver rodada abaixo). **Migration
  autorizada e ainda não aplicada em `zigjiu`:**
  `supabase/migrations/202611060001_category_rule_set_atomic_activation.sql`. A correção só
  funciona de ponta a ponta depois da aplicação e da regeneração de
  `lib/supabase/database.types.ts`. Não foi aplicada nesta missão de configuração.
- **Residual, não corrigido nesta rodada (severidade baixa, documentado e aceito):** dependência
  de RLS para autorização em `editableEvent` (sem checagem redundante na aplicação); UI de
  `/admin/eventos/[id]/editar` acessível a `staff`/`finance` por SELECT RLS antes do gate de
  escrita (pré-existente, não é regressão desta rodada); reenvio duplo de criação de versão de
  categorias pode gerar uma versão extra inofensiva (sem idempotency key).

## Rodada de 6 nov 2026 — política MCP Supabase de produção

Missão de configuração. Sem SQL de escrita, sem `apply_migration`, sem deploy e sem push.

O proprietário autorizou o Claude Code a usar o MCP de produção `zigjiu` com `read_only=false`,
restrito a esse projeto. Consultas de migrations, schema e advisors passam a ser livres neste
escopo. SQL de escrita e aplicação de migration exigem o checklist de `CLAUDE.md` e aprovação
humana nas ferramentas `mcp__supabase__execute_sql` e `mcp__supabase__apply_migration`.

A migration `202611060001_category_rule_set_atomic_activation.sql` está autorizada para a
próxima missão e **não foi aplicada aqui**.

Arquivos deste lote: `CLAUDE.md`, `.claude/settings.json`,
`.claude/skills/validacao-por-risco/SKILL.md`, `docs/engineering/CURRENT-HANDOFF.md`.

## Rodada de 6 nov 2026 (missão P0 integrada) — categorias, organizações e preparação de RC

**Escopo:** resolver os bloqueios P0 conhecidos (ativação de categorias) e as lacunas restantes
da regra de organizações (listagem e edição), com revisão de subagentes e preparação (não
aplicação) de migration. Commits `9c6b743` e `c270279`, sobre a base `4d87f78`.

### A. Ativação de categorias (P0 do `domain-risk-reviewer`)

Migration preparada, **não aplicada**:
`supabase/migrations/202611060001_category_rule_set_atomic_activation.sql`.

- Índice único parcial `category_rule_sets_one_active_per_event` (no máximo uma versão ativa por
  evento) — precedido por um saneamento que desativa duplicatas pré-existentes (achado da
  revisão, ver abaixo), mantendo ativa a versão de maior `versao`.
- Função `activate_category_rule_set(uuid)`, `SECURITY INVOKER` (preserva a RLS existente),
  atômica: lock de linha + desativar as demais + ativar a nova numa transação só. Bloqueia com
  `P0001` se a checagem já foi travada, `P0003` se o evento está cancelado/concluído.
- `persistNewCategoryVersion` (`app/admin/eventos/actions.ts`) chama a RPC em vez de duas
  atualizações sequenciais sem transação; em falha, desfaz a versão criada
  (`event_categories` antes de `category_rule_sets`, por `ON DELETE RESTRICT`) e escolhe a
  mensagem certa pelo código de erro (`categoryActivationCompensation`, testado).
- `createCategoryRuleSet`/`createCategoryRuleSetFromCatalog` bloqueiam a criação de nova versão
  via `assertCategoryVersionEditable` (testado) quando `checagem_travada_em` já foi definido ou o
  evento está `cancelado`/`concluido`.
- `lib/supabase/database.types.ts` ganhou a assinatura da RPC manualmente — **regenerar com
  `supabase gen types` depois que a migration for aplicada**, para substituir a entrada escrita
  à mão pela gerada de fato.

Verificado por leitura real do schema (MCP Supabase, somente leitura): FKs de
`registrations`/`category_brackets` para `event_categories` são `ON DELETE RESTRICT` — inscrições
e chaves existentes não são apagadas ao ativar uma nova versão. Validação de identificadores
(UUID) já existia. RLS de escrita (`category_rule_sets_staff_write`, `events_organizer_write`)
confirmada corretamente restrita a owner/organizer.

**Revisão `domain-risk-reviewer` (Opus):** achados médios, todos corrigidos no commit `c270279`
antes de declarar pronto — (1) índice único podia falhar ao criar sobre duplicatas pré-existentes;
(2) ativação falha deixava versão órfã sem compensação, mensagem convidava a reenviar mesmo
quando a causa não mudaria no reenvio; (3) gate de estado não cobria `cancelado`/`concluido`.
Atomicidade e ordem de locks confirmadas corretas (sem deadlock). Residuais aceitos: RLS como
única autorização (sem checagem redundante na app); página de edição acessível a staff/finance
por SELECT RLS antes do gate de escrita (pré-existente).

**Verificação `lot-verifier` (Sonnet):** nenhum FAIL; teste novo (`category-rule-set-lifecycle.test.ts`)
cobre fielmente os dois ramos da função; apontou que nenhum teste automatizado cobre a RPC SQL em
si nem o seletor de organização (UI) — ambos **NOT_RUN — BLOCKED BY ENVIRONMENT**, esperado sem
banco isolado/Playwright nesta rodada.

Bug encontrado durante a implementação (não pela revisão): a função SQL tinha `v_status text`,
mas `events.status` é o enum `event_status` sem cast registrado para `text` em `pg_cast` — a
atribuição teria falhado em runtime. Corrigido para `public.event_status` antes do commit.

### B. Organizações — listagem e edição

A correção de criação de evento (commit `4d87f78`, rodada anterior) ficava restrita a
`/admin/eventos/novo`. Corrigido nesta rodada:

- `/admin/eventos` (listagem): ambíguo agora mostra um seletor explícito de organização (link
  para `?org=<id>`), revalidado no servidor contra as filiações reais antes de listar os eventos
  daquela organização.
- `/admin/eventos/[id]/editar`: não exige mais uma organização ativa resolvida — o evento já é
  fixado por `params.id`, e `allowsPublicOrganization` + RLS decidem o acesso; bloquear por
  ambiguidade aqui impedia um operador multi-organização de editar rascunhos de qualquer uma das
  suas organizações sem motivo real.

### C. Criação e recuperação de eventos — revisado, sem lacuna nova encontrada

Lido `createEvent`, `uploadAsset` e a página `configuracao` (aviso de retomada). Upload com
`Promise.allSettled`, retry via `eventId` devolvido em falha parcial, e o aviso
`?aviso=arquivo` na página de configuração — todos intactos e coerentes com o que
`docs/releases/EVENT-READINESS.md` §2 já documentava. Nenhuma correção nova necessária; não
refeito por já estar correto.

### D. Jornada esportiva — build completo PASS, verificação funcional NOT_RUN

`next build` completo (60+ rotas, incluindo categorias, inscrição, checagem, chaves,
programação, operação, resultados) **PASS** — confirma que a integração entre páginas não quebrou
com as mudanças de A e B. Verificação funcional ponta a ponta (inscrição → checagem → chaves →
resultados) com escrita real **NOT_RUN — BLOCKED BY ENVIRONMENT**, mesmo motivo já registrado:
sem ambiente seguro para escrita.

### Testes desta rodada

- `tsc --noEmit`: PASS.
- `next lint` (arquivos alterados): PASS.
- `next build` (projeto completo): PASS.
- Suíte unitária `automação`: 229/230 — a 1 falha é a pré-existente de alias em
  `registration-correction.test.ts` (resolve módulo contra o `jiu` original, não este worktree),
  não relacionada a esta rodada.
- Consulta agregada em produção (somente leitura): reconfirmada 0 operadores com filiação
  ambígua (ver Bloqueios).
- Playwright/BDD de jornada com escrita, carga (250/400 atletas) e concorrência real:
  **NOT_RUN — BLOCKED BY ENVIRONMENT**.

### Preparação de release candidate

1. **Comparação com a produção publicada:** base publicada é `b0a32c7` (ver
   `docs/repository/PRODUCTION-MANIFEST.md`). Diff `b0a32c7`→`c270279`: 112 arquivos, a única
   migration nova no diff inteiro é a desta rodada
   (`202611060001_category_rule_set_atomic_activation.sql`) — nenhum outro lote integrado nesta
   branch depende de migration não aplicada.
2. **Dependência de migration/RPC:** a correção de categorias (§A) só funciona em produção depois
   que essa migration for aplicada e os tipos regenerados. Até lá, `persistNewCategoryVersion`
   chamaria uma RPC inexistente em produção — **bloqueador direto de publicação** enquanto a
   migration não for aplicada.
3. **Autorização/RLS:** nenhuma política nova criada; a função SQL nova é `SECURITY INVOKER` e
   passa pelas políticas existentes, confirmadas corretas por leitura real do catálogo
   (`pg_policy`).
4. **Regressão:** cobertura unitária e de build descrita acima; regressão de escrita/Playwright
   continua bloqueada por ambiente.
5. **Commit exato do RC:** `c270279`.
6. **Rollback:** sem deploy nesta rodada, não há o que reverter em produção. Se a migration for
   aplicada antes do código: a função fica criada mas sem chamador (inofensiva). Se o código for
   publicado antes da migration: toda ativação de categoria falha com RPC inexistente — por isso
   a ordem correta é migration primeiro, deploy depois, nunca o inverso.
7. **Smoke test seguro pós-deploy (quando autorizado):** criar uma versão de categorias num
   evento de teste sintético, confirmar que só ela fica `ativo = true`, e que tentar ativar outra
   versão enquanto a checagem está travada devolve erro em vez de sucesso silencioso.

**Recomendação GO/NO-GO: NO-GO para publicação.** Correção de categorias correta e revisada, mas
inútil em produção sem a migration aplicada; jornada esportiva com escrita, carga e concorrência
seguem NOT_RUN por falta de ambiente; linhagem financeira A/B/C e escolha da base Git dos próximos
lotes continuam pendentes do proprietário. Nenhum bloqueador de **correção** restante nos itens
revisados nesta rodada — o bloqueio é de **processo de publicação** (migration, homologação,
decisão de ambiente), não de código.

## Rodada de 6 nov 2026 — organizações, criação de evento (concluída, rodada anterior)

Commit `4d87f78`. Regra de produto aplicada à criação de evento (`/admin/eventos/novo`):

1. Uma filiação administrativa (owner/organizer): seleção automática — já estava correto.
2. Mais de uma: **escolha explícita** do operador num `<select>` no formulário — **gap corrigido
   nesta rodada**; antes, mais de uma filiação apenas bloqueava a criação (falha fechada) sem
   oferecer alternativa.
3. Nenhuma: impede a criação — já estava correto.
4. Revalidação no servidor: a escolha do formulário é sempre conferida contra as filiações reais
   do usuário (`organization_members`, papel owner/organizer) a cada chamada de `createEvent`;
   nunca aceita apenas pelo valor recebido do cliente.

Lacuna adicional encontrada e corrigida: `getAdministrativeOrganizationContext` descartava o
`reason` (e agora `options`) em todo caso não resolvido. Isso tornava o tratamento de
`reason === 'ambiguous'` já existente em `createEvent` código morto — nunca era alcançado, mesmo
antes desta rodada.

Arquivos alterados: `lib/auth/organization-context.ts`, `lib/auth/organization-context-server.ts`,
`app/admin/eventos/actions.ts`, `app/admin/eventos/novo/page.tsx`,
`app/admin/eventos/novo/NewEventForm.tsx`, `automação/tests/organization-context.test.ts`.

Fora do escopo desta rodada, propositalmente: `/admin/eventos` (listagem) e
`/admin/eventos/[id]/editar` continuam com o comportamento antigo (falha fechada) quando
ambíguo — não é o fluxo de criação que a missão pediu para corrigir.

Testes: `tsc --noEmit` PASS; `next lint` (arquivos alterados) PASS; suíte unitária
`automação` 224/225 — a 1 falha é a pré-existente de alias em
`registration-correction.test.ts` (resolve módulo contra o `jiu` original, não este worktree),
não relacionada a esta mudança.

## Auditoria de release gate (sessão de publicação, 6 nov 2026)

Executada sob autorização condicional do proprietário para publicar na Vercel **somente se** o
release gate resultasse GO. HEAD auditado: `931e5d4` (idêntico a `c270279` em código; a única
diferença é o próprio commit de documentação). Working tree limpo, branch e HEAD conferem.

**Resultado: NO-GO. Nenhuma publicação realizada.**

- Código e qualidade: PASS (evidência reutilizada da rodada anterior — `tsc`, lint, build,
  unitários 229/230 com a falha pré-existente de alias, Playwright categorias/integração/auth).
- Persistência e Supabase: **FAIL** — reconfirmado por leitura real (`mcp__supabase__list_migrations`)
  que `202611060001_category_rule_set_atomic_activation.sql` continua ausente em `zigjiu`; última
  migration remota ainda é `20261102034621`. A correção de ativação de categorias chamaria uma RPC
  inexistente em produção.
- Jornada esportiva: build completo PASS; escrita/carga/concorrência continuam NOT_RUN — BLOCKED
  BY ENVIRONMENT (sem mudança desde a rodada anterior).
- Segurança financeira: PASS — nenhum diff nesta sessão; modo manual, ausência de webhook/split
  automático reconfirmados pela leitura do manifesto, sem necessidade de reexecutar testes.
- Deployment Vercel: reconfirmado via `mcp__vercel__list_deployments` — produção ainda é
  `dpl_AMKofx7oNmQnQiPhr2xDTWSdUPaa` (`b0a32c7`), candidato de rollback ainda
  `dpl_8S5v1WnraoBefZwARg5fDn8EScfs`. Nenhum deployment novo desde o manifesto de 5 nov.

Nenhum achado novo. Decisão idêntica à já registrada na rodada de `c270279`, apenas reverificada
com leitura real do estado atual de banco e Vercel antes de considerar a publicação autorizada.

## Rodada de 6 nov 2026 — aplicação da migration autorizada e auditoria de publicação condicional

Missão sob autorização explícita do proprietário: aplicar exclusivamente
`supabase/migrations/202611060001_category_rule_set_atomic_activation.sql`, auditar o release
gate e publicar na Vercel automaticamente **somente se GO integral**. Resumo executivo abaixo;
detalhe completo em `docs/releases/EVENT-READINESS.md` §10.

**Migration: aplicada em `zigjiu` e validada.** Registrada como `20261106205820`. Pré-checagem
confirmou `category_rule_sets` vazia em produção (saneamento de duplicatas foi no-op seguro),
schema compatível (incluindo o enum `event_status` usado pela função), RLS
`category_rule_sets_staff_write` correta. Pós-checagem confirmou a função `SECURITY INVOKER` com
`search_path` fixo, o índice único parcial criado, e advisors de segurança idênticos antes/depois
(nenhum achado novo). Bloqueador anterior de banco ("RPC inexistente em produção") está resolvido.

**Release gate: NO-GO. Nenhuma publicação na Vercel foi realizada.** Código sem diff desde
`c270279`/`931e5d4` (só documentação mudou) — `tsc`, lint e `next build` completo PASS; unitários
229/230 (mesma falha pré-existente de alias); Playwright reaproveitado da rodada anterior sem
mudança que o invalidasse. O motivo do NO-GO é o mesmo das duas rodadas anteriores e **não mudou
nesta sessão**: a jornada esportiva completa (inscrição → checagem → pesagem → chaves →
resultados) com escrita, carga (250/400 atletas) e concorrência reais continua **NOT_RUN —
BLOCKED BY ENVIRONMENT**, indispensável para comprovar a segurança de um evento real e sem
decisão de ambiente do proprietário. Vercel reconfirmada sem mudança
(`dpl_AMKofx7oNmQnQiPhr2xDTWSdUPaa` em produção, `dpl_8S5v1WnraoBefZwARg5fDn8EScfs` como rollback).

**Residual:** privilégio `EXECUTE` da nova função ficou aberto a `PUBLIC`/`anon` por padrão do
Postgres (a migration não revogou de `PUBLIC`); confere com o padrão já usado por outras funções
`SECURITY INVOKER` deste schema, onde a RLS é a fronteira real de autorização — não é regressão,
não corrigido por não ter sido pedido. Backup automático do Pro continua sem confirmação direta
por ferramenta (mesma limitação de rodadas anteriores), risco mitigado por a migration ter
afetado 0 linhas reais.

## Próxima missão

1. Regenerar `lib/supabase/database.types.ts` com `supabase gen types` quando o CLI estiver
   disponível no ambiente (não instalado nesta sessão; a entrada manual já existente compila sem
   erro, então não é bloqueador).
2. Smoke test seguro (criar uma versão de categorias num evento de teste sintético, confirmar que
   só ela fica `ativo = true`, e que ativar outra enquanto a checagem está travada falha) — ainda
   não executado; pode ser feito agora que a RPC existe em produção, assim que houver evento
   sintético disponível para isso.
3. Decisão de ambiente para homologação com escrita, carga (250/400 atletas) e concorrência real
   — bloqueador central de publicação, inalterado por três rodadas.
4. Escolha da linhagem financeira A/B/C.
5. Manter a regra “cada lote parte de `b0a32c7`” ou passar a trabalhar a partir deste candidato
   integrado.

Publicação continua bloqueada até: homologação com escrita real, decisão de ambiente, e aprovação
explícita do proprietário sobre os itens acima. A migration já não é mais bloqueador.

## Rodada de 6 nov 2026 — tentativa de homologação local (BLOCKED, sem publicação)

Missão sob autorização explícita do proprietário: preparar ambiente Supabase local isolado com
dados sintéticos, executar Playwright E2E real (jornada completa, permissões, concorrência,
isolamento entre organizações, massa de 250/400 atletas) e publicar automaticamente se GO.
Orçamento de 45 min; ambiente não ficou pronto em ~2 min — bloqueador é estrutural, não de tempo.

**Ambiente local: BLOCKED.** `supabase start` (stack local do Supabase: Postgres + Auth +
PostgREST) exige Docker ou Podman; nenhum dos dois está instalado nesta máquina, e `sudo`
solicita senha interativa que não pode ser fornecida nesta sessão — então não há caminho para
instalar Docker sem intervenção manual do proprietário. Confirmado também que não existe um
ambiente local já configurado como alternativa: `.env.local` e `automação/.env.e2e` são links
simbólicos para o working tree original `jiu` (não abertos, conforme `CLAUDE.md`), e por
convenção de nomenclatura e pela decisão já registrada ("homologação por segundo projeto Supabase
cancelada em 6 nov 2026") apontam para o mesmo projeto de produção `zigjiu` — usá-los para escrita
ou carga seria testar em produção, que esta missão proíbe explicitamente.

**Testes E2E com persistência real: NOT_RUN — BLOCKED BY ENVIRONMENT.** Nenhum teste de jornada
completa, concorrência, isolamento entre organizações ou massa sintética foi executado nesta
rodada — não por já estarem cobertos, mas porque não havia onde executá-los sem tocar produção.
Nenhum teste de interface simulada foi usado como substituto (a própria missão proíbe declarar GO
assim).

**O que foi reaproveitado/reconfirmado, sem mudança de código:** `tsc`, lint, build e unitários
229/230 já confirmados na rodada anterior sobre o mesmo HEAD de código (`c270279`); migration
`202611060001` já aplicada e validada na rodada anterior.

**Preservado, sem alteração:** working tree original `jiu` intocado; nenhuma escrita em
produção além da migration já registrada; nenhum projeto Supabase novo criado; nenhum dado
pessoal copiado.

**GO/NO-GO: NO-GO. Nenhuma publicação na Vercel foi realizada.** "Testes críticos E2E com
persistência PASS" é item obrigatório do release gate desta missão e está BLOCKED, não PASS —
isso por si só impede GO, independentemente dos demais itens estarem corretos.

**Próximo passo real para desbloquear:** o proprietário precisa decidir e executar uma de duas
rotas — (a) instalar Docker/Podman nesta máquina (requer senha de root, fora do alcance desta
sessão), ou (b) autorizar explicitamente um ambiente alternativo (ex.: Supabase local via outro
mecanismo, ou uma janela de homologação controlada em `zigjiu` com dados sintéticos e critérios de
limpeza). Sem uma dessas decisões, a lacuna de "jornada esportiva com escrita/carga/concorrência
real" persistirá em toda rodada futura, como já ocorreu em três rodadas consecutivas.

## Rodada de 6 nov 2026 — Docker disponível: homologação local real, em andamento (checkpoint)

Missão sob autorização explícita do proprietário, continuação da rodada anterior (BLOCKED por
falta de Docker). **Docker passou a estar disponível nesta sessão.** Stack Supabase local
(`supabase start`, projeto `jiu-event-readiness`) confirmado isolado de produção: banco vazio no
início da sessão, `linked_project: null`, todas as 43 migrations locais aplicadas (incluindo
`202611060001`). `.env.local`/`automação/.env.e2e` (symlinks para o `jiu` original, apontando para
`zigjiu`) não foram abertos; app e testes foram apontados para o stack local via variáveis de
ambiente exportadas no processo, nunca via esses arquivos. Checkpoint intermediário solicitado pelo
proprietário — a investigação do achado do item 2 abaixo **não foi concluída**, propositalmente,
para registrar evidência antes de continuar.

### 1. Resultado das tentativas do E2E completo

Não foram "quatro tentativas": foram ~13 execuções incrementais de
`tests/features/full-event.feature` (jornada completa, nunca antes executada contra um app real —
historicamente sempre `NOT_RUN — BLOCKED BY ENVIRONMENT`). Cada execução avançou um passo e revelou
o próximo ponto de drift entre o roteiro de teste e a UI atual (o roteiro nunca tinha sido validado
contra código real). Progresso acumulado, nesta ordem: login do organizador → criação do evento →
**publicação** (descoberta: publicar não é mais parte do mesmo formulário; vive no menu "..." da
listagem) → criação de versão de categorias na aba customizada → edição de duração por categoria →
cadastro de 2 equipes → cadastro de 1 atleta via UI → abertura da fase de inscrição. Bloqueado no
passo seguinte (inscrever o atleta no evento), descrito no item 2.

### 2. Primeira falha reproduzível atual e causa provável

`GET /eventos/{id}` (página pública do evento) devolve **404 para todo e qualquer evento**,
independente de autenticação — reproduzido via `curl` direto, fora do Playwright. Causa raiz
confirmada por leitura direta do schema local: `lib/events/public-access.ts`
(`publicEventColumns`/`findPublicReleaseEvent`) seleciona colunas estruturadas de endereço
(`local_nome`, `local_cep`, `local_logradouro`, `local_numero`, `local_complemento`,
`local_bairro`, `local_cidade`, `local_uf`, `local_latitude`, `local_longitude`) que **não existem**
na tabela `events` — confirmado com `\d public.events`: só existe a coluna livre `local text`. O
erro do Postgres é descartado silenciosamente (`const { data } = await query.maybeSingle()` ignora
`error`), então a função devolve `null` exatamente como "não encontrado", mascarando um erro de
schema como 404. **Isso não é específico deste teste: toda página pública de evento publicado
quebra assim, no ambiente local.** Mesmo padrão de colunas aparece em
`app/admin/eventos/[id]/editar/EditEventForm.tsx`, `components/events/VenueFields.tsx` e
`lib/supabase/database.types.ts` — parece uma feature de endereço estruturado (CEP, geocoding; ver
`automação/tests/venue-location.test.ts`, que passa porque testa só a lógica de formatação,
mockada, nunca o schema real) implementada em código e tipos mas cuja migration nunca foi escrita
ou aplicada. **Não investigado ainda se produção (`zigjiu`) tem o mesmo gap** — não verificado
nesta sessão por instrução explícita de não continuar a investigação antes deste checkpoint.

### 3. Arquivos alterados e correções efetivamente validadas

- `app/admin/eventos/[id]/(operacao)/configuracao/CategoryManager.tsx` — **bug de produto real,
  corrigido**: `clearForm()` chamava `setMessage(null)` imediatamente depois do sucesso, apagando a
  confirmação "Versão N criada com sucesso." antes de qualquer renderização a mostrar — afeta todo
  organizador criando uma versão de categorias, catálogo ou customizada, não só este teste. Corrigido
  separando `clearForm()` (só limpa campos) de `clearFormAndMessage()` (usado exclusivamente pelo
  botão "Limpar"). Validado: `tsc`, lint, unitários, e reexecução da jornada passando por este passo
  repetidas vezes após a correção.
- `automação/tests/support/e2e-cleanup.ts` — estendido para aceitar o stack local
  (127.0.0.1/localhost) além do Sandbox `zigjiu` existente (`assertSandboxUrl`), e o nome do cookie
  de sessão SSR passou a ser derivado da URL real (`sb-<ref>-auth-token`) em vez de fixo no ref do
  zigjiu. `loadCleanupEnv()` agora pula a leitura de `.env.local`/`automação/.env.e2e` quando
  `NEXT_PUBLIC_SUPABASE_URL` já aponta para o stack local. Validado: specs `auth-experience` (13/13),
  `category-version-ui` (2/2) e `integration-lots` (8/8) — todos agora com **escrita real** no stack
  local (antes rodavam só em modo leitura, por risco de tocar produção).
- `automação/tests/support/fixtures.ts` — timeout da fixture `fullEvent` (antes fixo em 480s) agora
  aceita override por `MC_FULL_EVENT_TIMEOUT_MS` (padrão inalterado), só para acelerar iteração.
- `automação/tests/support/full-event-journey.ts` — ~12 correções de locator/fluxo para realinhar o
  roteiro com a UI atual (nunca antes executado com escrita real). Inclui: heading de criação de
  evento, expansão da seção "Datas e fases" (recolhida por padrão), fluxo de publicação via menu da
  listagem (não mais um botão no mesmo formulário), seleção da aba "Categoria customizada", label de
  duração, correção de FK em `cleanupMass()` (apagava `category_rule_sets` antes de
  `event_categories`, violando a FK, ao limpar execuções anteriores interrompidas), e escopo do botão
  "Cadastrar atleta" (duplicado: um para abrir o formulário, outro para enviá-lo, mesmo nome
  acessível). Adicionado `MC_FULL_EVENT_SKIP_CLEANUP=true` (padrão desligado, sem mudança de
  comportamento) como válvula de depuração para preservar dados após falha.
- Novos arquivos, testados isoladamente: `automação/tests/support/local-homologation-guard.ts` +
  `automação/tests/local-homologation-guard.test.ts` (8/8) — guarda local equivalente ao
  `independent-homologation-guard.ts`, recusa qualquer host `*.supabase.co`.
  `automação/scripts/local-homologation-fixtures.ts` — adaptado de
  `independent-homologation-fixtures.ts` para o stack local; executado com sucesso a 10, 250
  (concorrência 10 e 25), 400 (concorrência 50 e 100) atletas — ver evidências abaixo.
  `automação/scripts/local-e2e-accounts.ts` — cria as 3 contas E2E (owner/staff/unauthorized) e um
  evento publicado de apoio, de forma idempotente.

### 4. Estado dos serviços locais e dados sintéticos

Docker + Supabase local ativos (`supabase start`, projeto `jiu-event-readiness`), 43 migrations
aplicadas. `next dev` em `:3000`, apontado para o stack local via variáveis de ambiente explícitas
no processo (nunca `.env.local`). Dados sintéticos residuais ao fim deste checkpoint: as 3 contas
E2E + 1 evento de apoio (`E2E Local Evento Rascunho`, usado pelos specs de categorias/integração —
não remover) e os atletas/inscrições dos testes de carga (eventos `MC-LOCAL ...`, inofensivos,
locais). Todos os resíduos de `MC-SIM Full Event*` (das 13 execuções da jornada) foram limpos nesta
rodada.

### 5. Testes executados

**PASS:** `tsc --noEmit`; `next lint` (1 warning pré-existente); unitários 237/238 (mesma falha
pré-existente de alias em `registration-correction.test.ts`, +8 testes novos do guard local, todos
passando); Playwright `auth-experience` 13/13, `category-version-ui` 2/2, `integration-lots` 8/8 —
agora com escrita real no stack local. Carga/concorrência: 400 atletas com concorrência 50 e 100,
**0 falhas**; concorrência extrema de 250 simultâneas de um único processo Node teve 4/250 falhas
client-side (`TypeError: fetch failed`, não chegaram ao Kong/PostgREST — artefato do driver de
teste, não do app) — evidências em `docs/releases/evidencias/local-homologation-*.json`.
**NOT_RUN:** jornada completa via UI segue bloqueada no achado do item 2 antes de chegar a pesagem,
chaves, programação, placar e resultados — nenhuma dessas superfícies foi exercitada com escrita
real nesta rodada. `next build` não foi reexecutado após as correções desta rodada (rodá-lo agora
corromperia o cache do `next dev` ativo, como já ocorreu uma vez nesta sessão — rodar só depois de
parar o dev server).

**Próximo passo técnico específico:** investigar se existe uma migration de endereço estruturado
(`local_nome`/`local_cep`/`local_logradouro`/...) nunca escrita ou nunca aplicada — comparar
`lib/supabase/database.types.ts` com o histórico de migrations e com `PRODUCT.md`/changelog para
decidir entre (a) escrever e aplicar a migration faltante localmente, ou (b) reverter
`public-access.ts`/`EditEventForm.tsx`/`VenueFields.tsx` para usar só a coluna `local` existente —
e então corrigir `findPublicReleaseEvent` para nunca descartar `error` de `maybeSingle()` em
silêncio (esse descarte é o que transformou um erro de schema em 404 indistinguível de "evento não
existe"). Decisão sobre qual caminho tomar deliberadamente não foi executada nesta rodada.

## Rodada de 6 nov 2026 — correção do 404 de schema drift e homologação E2E local completa

Continuação direta do checkpoint acima ("Docker disponível"). Missão: resolver o 404 de schema
drift da página pública e retomar o E2E a partir do ponto bloqueado. Commits `8dec5ba` e `aca7c44`,
sobre o HEAD `3f2e3f7`.

### A. Causa raiz e decisão: endereço estruturado é recurso intencional, não abandonado

Investigado pelo histórico git (não só pelo estado atual): a migration
`202610300001_event_venue_fields.sql` existia e foi aplicada em commit `3b41f53` (`feat(events): CEP
venue, map preview and automatic phase dates`, 30 out 2026), que entregou a feature de ponta a
ponta — migration, `venuePayload()` em `app/admin/eventos/actions.ts` (grava os campos estruturados
no create/update), `VenueFields.tsx`, API routes de CEP/geocoding, testes. Esse commit vive em
`feature/meu-camp-live` e **não é ancestral** desta branch nem de `b0a32c7`.

O refactor `28a537d` (`refactor(admin): padronizar superfícies operacionais e shell LIVE`, 5 nov
2026, ancestral de `b0a32c7` — **está em produção**) trouxe `VenueFields.tsx`, `EditEventForm.tsx` e
as colunas `local_*` em `database.types.ts` para esta linhagem, mas **sem a migration e sem o
`venuePayload()`** — ou seja, a integração trouxe metade de uma feature completa e testada,
deixando a outra metade (schema + gravação) para trás. Não é um recurso abandonado por decisão de
produto: é uma lacuna de integração. Daí a escolha pela migration incremental, não pelo reverter.

Decisão (conforme a missão pedia): **migration incremental**, aditiva, nullable, preserva `local` e
eventos antigos — reaplica o conteúdo original de `202610300001` como
`supabase/migrations/202611060002_event_venue_fields.sql`. Aplicada **somente no Supabase local**
(`supabase_db_jiu-event-readiness`, `psql` direto no container — `supabase` CLI não está no PATH
desta sessão — e registrada manualmente em `supabase_migrations.schema_migrations`). **Não aplicada
em `zigjiu`.**

Também restaurado `venuePayload()` em `app/admin/eventos/actions.ts` (`createEvent`/`updateEvent`):
sem isso, a migration criaria colunas que `EditEventForm`/`VenueFields` já enviam na edição de
rascunho, mas que o servidor sempre descartava — a migration sozinha teria resolvido o 404 mas
deixado o formulário de edição gravando em um buraco negro. `NewEventForm.tsx` (criação) continua
sem `<VenueFields>` — fora do escopo desta correção, nenhum comportamento quebrado por isso (campos
estruturados ficam `null` em eventos criados por lá, como já era o caso antes desta rodada).

`findPublicReleaseEvent` (`lib/events/public-access.ts`) corrigido: antes descartava `error` de
`.maybeSingle()` em silêncio, devolvendo `null` — indistinguível de "evento não existe" para as 7
páginas públicas que chamam essa função. Agora loga `error.code`/`error.message` (sem dados do
evento) e lança, distinguindo erro de banco de 404 real.

### B. Verificação local

Schema confirmado por `\d public.events` no container: as 10 colunas `local_*` agora existem.
GET público reproduzido e corrigido: as 7 rotas públicas de evento (`/eventos/[id]`, `/chaves`,
`/checagem`, `/lutas`, `/resultados`, `/participantes`, `/programacao`) voltaram a HTTP 200 contra
um evento publicado real no stack local (antes, 404 em todas).

`tsc --noEmit`: PASS. `next lint` (arquivos alterados): PASS. `next build` **não executado** —
`next dev` de uma sessão anterior continuava ativo nesta sessão (reaproveitado para os testes
abaixo); parar o processo foi negado pelo classificador de permissões desta sessão. Mesma cautela
do checkpoint anterior: rodar `next build` com `next dev` ativo arrisca corromper o cache.
Unitários: 237/238, mesma falha pré-existente de alias (`registration-correction.test.ts`); uma
reexecução isolada mostrou `organization-context.test.ts` falhando junto, mas duas reexecuções
completas subsequentes voltaram a 237/238 — flake de execução concorrente dos arquivos de teste,
não regressão desta rodada (passa isoladamente).

### C. E2E completo: `full-event.feature` passou pela primeira vez

Com o 404 corrigido, o roteiro (nunca antes executado com escrita real até o fim, por não existir
ambiente até a rodada anterior) avançou e revelou oito pontos de drift entre o roteiro de teste e a
UI/produto atuais — nenhum regressão desta sessão, todos de texto/estrutura de locator desatualizado
em `automação/tests/support/full-event-journey.ts`:

1. Link de inscrição é "Fazer inscrição", não "Inscrever atletas".
2. Heading "Lista oficial" aparece duas vezes na página de checagem (precisa `exact: true`).
3. Rótulo visível do slot de chave é "01 Slot" (badge numérico antes do texto), não "Slot 01".
4. Heading público da programação é "Horário — {evento}", não "Programação — {evento}".
5. "Evento concluído" aparece duas vezes (heading + parágrafo) na tela de resultados — precisa
   `.first()`.
6. Asserção `getByText('Evento: concluido')` nunca correspondeu a texto real da UI atual (grep
   confirma zero ocorrências em `app/`/`components/`) — removida; a asserção seguinte, mais
   específica, mais a checagem direta no banco (`finished.data?.status`), já cobrem o estado.
   O mesmo texto obsoleto também existe em `automação/tests/steps/event-status-transitions.steps.ts`
   (teste diferente, não executado nesta rodada, fora do escopo) — provavelmente quebrado também,
   não corrigido por não fazer parte desta jornada.
7. Status público final é "Evento finalizado", não "concluido".
8. CTA que deve sumir ao encerrar o evento é "Fazer inscrição", não "Inscrever atletas" (mesmo
   texto do item 1).

Também corrigido, fora do roteiro de teste: `app/dashboard/inscricoes/PaymentCheckout.tsx` tinha
`aria-labelledby` num `<Card>` (renderiza `<div>`) sem `role` — sem role explícito, uma `<div>` não
vira landmark ARIA "region" mesmo com `aria-labelledby`. Adicionado `role="region"`, uma correção de
acessibilidade real (não só para destravar o locator do teste): o painel "Reservar pagamento" passa
a ser navegável como região por leitores de tela.

**Resultado: `full-event.feature` (`@P0 @positive`) passou de ponta a ponta — inscrição → pagamento
→ checagem → travar checagem → chaves (gerar, ajustar rascunho, publicar) → programação (áreas,
subchaves, reordenar, publicar) → pesagem → operação LIVE (resultado normal, WO) → premiação →
resultados → conclusão — 3 execuções consecutivas sem flake.** Também reconfirmados sem regressão:
`auth-experience.spec.ts` (13), `category-version-ui.spec.ts` (2), `integration-lots.spec.ts` (8) —
23/23. Dados sintéticos de cada execução (`MC-SIM Full Event*`) limpos automaticamente pela própria
suíte ao final; confirmado por consulta direta ao banco local (0 resíduos).

### D. Achado crítico fora do escopo original da missão: o mesmo 404 está em produção agora — **RETRATADO, ver rodada seguinte**

**Esta seção registrava uma suspeita que se provou falsa.** Mantida como registro do raciocínio
original (inferência só por `list_migrations`, sem verificar o schema real nem fazer a requisição
HTTP) — a correção e a evidência real estão na rodada "Verificação P0" logo abaixo. Resumo da
retratação: as colunas `local_*` **já existem em `zigjiu`** (aplicadas fora do histórico de
migrations rastreado) e a página pública do evento publicado responde HTTP 200 normalmente.

Ao investigar se a feature de endereço estruturado era intencional, foi necessário confirmar a
linhagem de commits de produção. Isso revelou, por leitura **somente leitura** do MCP Supabase em
`zigjiu` (`list_migrations`, livre neste escopo por `CLAUDE.md`) e por análise de `git merge-base`:

- `28a537d` (que traz `VenueFields.tsx`/`EditEventForm.tsx`/as colunas `local_*` em
  `database.types.ts` para a linhagem, sem a migration) **é ancestral de `b0a32c7`**, o commit
  publicado em produção desde 5 nov 2026 19:44 (`docs/repository/PRODUCTION-MANIFEST.md`).
- `zigjiu` não tem nenhuma migration de endereço estruturado (`list_migrations` confirma a lista
  completa; nenhuma entrada corresponde).
- Existe exatamente **1 evento com `status = 'publicado'`** em produção agora (consulta agregada,
  somente leitura, `execute_sql`: `select status, count(*) from events group by status`).

**Conclusão: a página pública desse evento publicado está, com alta probabilidade, devolvendo 404
para todo visitante em produção, desde o deploy de `b0a32c7`** — pelo mesmo mecanismo exato
diagnosticado e corrigido nesta rodada no ambiente local (colunas `local_*` ausentes em `events`,
erro do Postgres descartado em silêncio por `findPublicReleaseEvent`). Não confirmado por uma
requisição HTTP real contra a URL de produção nesta rodada (fora do escopo e das permissões desta
sessão sem autorização adicional) — a conclusão é por leitura de schema e de linhagem de commit, não
por reprodução direta do sintoma em produção.

**Nenhuma ação corretiva foi tomada em `zigjiu`.** Migration de produção, `execute_sql` e
`apply_migration` exigem autorização explícita do proprietário e aprovação humana por ferramenta,
conforme `CLAUDE.md` — fora do que esta missão (escopo: ambiente local) autorizava. A migration já
testada e aplicada localmente (`supabase/migrations/202611060002_event_venue_fields.sql`) está
pronta para revisão e, se autorizada, aplicação em produção seguindo o checklist de `CLAUDE.md`
(confirmar projeto, revisar SQL, verificar dependências/backup, aplicar, validar, registrar
evidência).

## Rodada de 6 nov 2026 — Verificação P0: produção NÃO está indisponível (correção do falso alarme)

Missão do proprietário, em resposta direta ao achado da seção D: confirmar por evidência real (HTTP
+ schema), não reaplicar a migration sem autorização explícita, nenhum deploy, nenhuma cobrança
real.

### 1. Evento publicado identificado (somente leitura, `zigjiu`)

`select id, nome, slug, status, organization_id from events where status = 'publicado'` → exatamente
1 linha: evento "TESTE" (`id 52bb0f67-dba2-478c-9551-6c3c4e902feb`, slug `teste-mvvs2eq2`).

### 2. GET HTTP real contra produção

`GET https://jiu-three.vercel.app/eventos/52bb0f67-dba2-478c-9551-6c3c4e902feb` →
**`HTTP/2 200`**, ~5.2s, `x-vercel-cache: MISS` (resposta não veio de cache — é o handler atual,
não um artefato antigo), `x-matched-path: /eventos/[id]`. Corpo confirmado como o conteúdo real do
evento, não uma página de erro genérica: heading "TESTE", "Campeonato publicado", data "Sábado, 28
de novembro de 2026", e o texto de local completo. **A página pública está no ar e funcional.** A
suspeita da seção D estava errada.

### 3. Causa da divergência: colunas já existem em produção, fora do histórico rastreado

`select column_name, data_type, is_nullable from information_schema.columns where table_name =
'events' and column_name like 'local%'` contra `zigjiu` (schema real, não a lista de migrations)
devolve as 10 colunas `local_*`, todas presentes, nullable, tipos batendo exatamente com a migration
local. **As colunas já existem em produção** — só não aparecem em `list_migrations` porque foram
aplicadas por fora do histórico rastreado (não há `supabase/patches/` neste worktree para confirmar
o mecanismo exato; não investigado além disso, por não ser necessário para a decisão).

Confirmado também que o evento "TESTE" tem os campos estruturados **populados com dados reais**
(`local_nome`, `local_cep`, `local_logradouro`, `local_numero`, `local_cidade`, `local_uf`
preenchidos; `local_latitude`/`local_longitude` nulos). Como o código publicado em produção
(`b0a32c7`) confirmadamente **não** tem `venuePayload`/gravação de `local_nome` em
`app/admin/eventos/actions.ts` (conferido lendo `git show b0a32c7:app/admin/eventos/actions.ts` —
zero ocorrências), esses dados não vieram do formulário da aplicação. Foram inseridos por outro
caminho (SQL direto, Table Editor do Supabase Studio, ou script) — consistente com o nome "TESTE" do
evento. Mecanismo exato não identificado; não é necessário para fechar esta verificação.

**Erro de raciocínio da seção D, para registro:** inferir "não está em `list_migrations`" ⇒ "coluna
não existe" é inválido quando o schema pode ter sido alterado fora da ferramenta de migrations. A
verificação correta é o schema real (`information_schema`) ou a reprodução direta do sintoma (HTTP),
não a metadata de rastreamento de migrations. As duas verificações pedidas pelo proprietário nesta
rodada são exatamente as que faltavam antes de alarmar.

### 4. Confirmação do item 4 da missão

**A ausência das colunas `local_*` NÃO é causa de problema em produção, porque elas não estão
ausentes em produção.** O 404 original era exclusivo do ambiente **local** desta sessão (schema
local atrasado em relação tanto ao código quanto à produção).

### 5. Revisão de segurança da migration `202611060002_event_venue_fields.sql`

- **Compatibilidade com eventos existentes:** todas as 10 colunas são `add column if not exists`,
  nullable, sem `default`. Linhas existentes recebem `NULL` automaticamente. Para este caso
  específico, a migration seria um no-op em produção (colunas já existem) — `if not exists` garante
  isso com segurança, sem erro.
- **Preservação de `local`:** a migration não toca em `local` (não altera tipo, não altera
  nullability, não copia nem apaga dado). Confirmado também que a coluna `local` de "TESTE" continua
  com o texto humano completo, intacta.
- **Sem reescrita destrutiva:** nenhum `drop`, `update`, `delete` ou `alter column ... using`. Só
  `add column` (10x) e `comment on column` (4x, metadata pura).
- **Índices/constraints/defaults/locks:** nenhum índice, constraint (check/unique/FK) ou default
  adicionado. `ADD COLUMN` nullable sem default é alteração só de metadata no Postgres (≥ 11) — não
  reescreve a tabela, lock `ACCESS EXCLUSIVE` breve (bloqueia todo acesso a `events` por uma fração
  de segundo, não pelo tamanho da tabela). Risco de lock prolongado só existiria se outra transação
  já estivesse segurando lock conflitante em `events` no momento da execução.
- **Reversibilidade:** schema trivialmente reversível (`drop column if exists` nas 10 colunas). Mas
  **não é reversível sem perda de dado** neste caso específico — o evento "TESTE" já tem endereço
  estruturado real; um rollback apagaria esses valores. Irrelevante para a decisão desta rodada, já
  que não há nada para aplicar ou reverter em produção.

### 6. Backup

Não verificado por ferramenta nesta rodada — mesma limitação já registrada em rodadas anteriores:
não há tool MCP disponível nesta sessão para confirmar o estado do backup automático do plano
Supabase em uso. Como nenhuma escrita é recomendada (ver item 7), isso não bloqueia a decisão desta
vez, mas continua sendo uma lacuna de verificação para quando uma escrita real for necessária.

### 7. Diagnóstico final e GO/NO-GO

**Diagnóstico:** produção não está e não esteve indisponível por este motivo. O achado da rodada
anterior (seção D) foi um falso alarme, causado por uma inferência incompleta (ausência em
`list_migrations`, sem checar o schema real nem fazer a requisição HTTP). O schema de produção já
tem as colunas de endereço estruturado, aplicadas por um caminho não rastreado pelas migrations
deste repositório, com dado real em pelo menos um evento.

**SQL final:** nenhum. Não há necessidade de aplicar
`202611060002_event_venue_fields.sql` (ou qualquer variante) em `zigjiu` — o resultado que ela
produziria já existe lá.

**GO/NO-GO: NO-GO para aplicar a migration em produção — não por ser insegura, mas por ser
desnecessária.** Nenhuma ação de escrita em produção é recomendada neste momento.

**Pendência de process (não urgente, para quando o proprietário quiser tratar):** reconciliar o
histórico de migrations rastreado com o schema real de `zigjiu` (registrar formalmente a entrada
correspondente em `supabase_migrations.schema_migrations` lá, como bookkeeping, já que o efeito já
existe) e entender como essas colunas/dado de teste entraram fora do fluxo de migrations — para
evitar que a próxima pessoa (humana ou agente) tire a mesma conclusão errada que esta sessão tirou
antes de verificar.

## Rodada de 6 nov 2026 — conclusão do release gate técnico: GO

Missão: concluir o release gate técnico do candidato atual, sem push/deploy/migration/escrita em
`zigjiu`. Detalhe completo em `docs/releases/EVENT-READINESS.md` §12; resumo executivo abaixo.

Encerrado com segurança um `next dev` órfão deste worktree (confirmado por `cwd` antes de agir; um
`next-server` de outro diretório, `/tmp/jiu-ui-rc-verify`, foi identificado e preservado intocado).
`next build` completo **PASS** (uma primeira tentativa falhou por instabilidade transitória de rede
no `next/font/google`, não por código — confirmado por `curl`/`fetch` direto funcionando normalmente
e pela segunda tentativa compilando sem nenhuma mudança). `tsc` e `next lint` **PASS**. Unitários
237/238 **PASS** (mesma falha pré-existente de alias). Evidência Playwright reaproveitada sem
mudança de código (`auth-experience` 13/13, `category-version-ui` 2/2, `integration-lots` 8/8,
`full-event.feature` 3× consecutivas sem flake com escrita real).

Reconfirmado por leitura direta e independente (não só pelo handoff): migration
`20261106205820`/`activate_category_rule_set` aplicada em `zigjiu` com `SECURITY INVOKER`; as 10
colunas `local_*` já existem em produção (migration de endereço estruturado continua desnecessária).
**Nenhuma migration pendente bloqueia este candidato.**

Revisão de segurança do diff completo desde `b0a32c7`: a parte de categorias/organizações já tinha
revisão de rodadas anteriores; o `domain-risk-reviewer` cobriu nesta rodada o restante
(`middleware.ts`, upload de avatar, membros de organização, dashboard/onboarding, login/recuperação/
atualização de senha) — **PASS em tudo, nenhum achado crítico/alto/médio**. Confirmado sem open
redirect no fluxo de login/admin, RLS por `auth.uid()` protegendo upload de avatar, autorização
server-side (nunca por input do formulário) na gestão de membros. Sem diff financeiro nesta branch.
Advisors de segurança (`zigjiu`): 7 achados, todos pré-existentes, nenhum novo. Vercel: produção e
candidato de rollback inalterados.

**GO/NO-GO: GO para publicação deste candidato (HEAD de código `aca7c44`).** Primeira rodada desta
série em que nenhum gate obrigatório permanece `NOT_RUN`/`BLOCKED` — a migration, a jornada esportiva
completa com escrita/carga/concorrência real, e a revisão de segurança do diff completo (que faltava
cobrir integralmente) fecharam nesta rodada. **Nenhuma publicação foi realizada** — fora do escopo
autorizado desta missão.

**Pendente, mas não bloqueador deste candidato:** linhagem financeira A/B/C; base Git dos próximos
lotes; smoke test pós-deploy; regeneração cosmética de `database.types.ts`; confirmação de backup
automático por ferramenta (sem tool disponível, mitigado por não haver escrita destrutiva planejada).

## Rodada de 6 nov 2026 — deploy controlado e smoke tests: PASS WITH LIMITATIONS

Missão sob autorização explícita e detalhada do proprietário: publicar `aca7c44` (decisão GO da
rodada anterior) na Vercel e validar com smoke tests pós-deploy. Sem migration, sem alteração de
variáveis de ambiente/financeiras, sem cobrança real. Detalhe completo em
`docs/releases/EVENT-READINESS.md` §13.

Pré-deploy: HEAD/branch confirmados, zero diff de código desde `aca7c44`, working tree limpo (3
artefatos locais não rastreados movidos para fora antes do deploy e restaurados depois, porque a
CLI da Vercel não respeita `.gitignore`). Projeto de destino confirmado (`jiu` /
`prj_OWAnDfWWQp3i0YJtJkhAmAjocJ3n`); deployment anterior (`dpl_AMKofx7oNmQnQiPhr2xDTWSdUPaa`,
`b0a32c7`) registrado como rollback. Worktree original de `jiu` não foi tocado nem promovido.

**Deploy:** `vercel --prod --yes` deste worktree, sucesso na primeira tentativa. Nova deployment
`dpl_BYTLoYjrNWxcWkxXc96wkvYr9dhX`, `READY`, `target=production`. Os três domínios de produção
(`jiu-three.vercel.app`, `jiu-navy.vercel.app`, alias padrão) confirmados apontando para ela via
`vercel alias ls`.

**Smoke tests:** todas as superfícies públicas (home, eventos, chaves, checagem, lutas,
participantes, programação, resultados, academias, institucional) **PASS** — 200 em todas.
Confirmado que o endereço estruturado do evento "TESTE" renderiza corretamente em produção
("CEP 85506-522" visível no HTML), validando de ponta a ponta a correção de schema drift desta
branch. Gates de autenticação (`/admin/eventos`, `/dashboard`, `/platform/*`) redirecionam
corretamente para login — confirma que a revisão do `middleware.ts` (§12.5) funciona em produção.
Webhook de pagamento responde 405 a GET (rota intacta, nenhuma ação real). Duas divergências
encontradas, **ambas pré-existentes** (confirmadas idênticas comparando a URL direta da deployment
antiga com a nova): `/cadastro` devolve 307 sem `Location`; `/login` bail-out para renderização
client-side. Nenhuma das duas é regressão deste deploy — não corrigidas, fora do escopo autorizado.
Logs: 0 erros em 30 min pós-deploy.

**Não verificado, por limitação explícita de credencial, não por falha:** login real, interior do
dashboard administrativo, formulário de criação de evento, configuração de versão de categorias —
sem credencial de produção disponível nesta sessão e proibido abrir `.env*`. Os gates de rota
correspondentes foram confirmados corretos como proxy, mas isso não substitui exercitar o conteúdo
autenticado.

**Status final: PASS WITH LIMITATIONS.** Nenhum erro crítico, nenhum rollback necessário. Pendência
para o proprietário: fornecer credencial de teste de produção (ou autorizar criação de uma) para um
smoke test autenticado dedicado num lote futuro; investigar as duas divergências pré-existentes de
`/cadastro` e `/login` (não bloqueiam nada, mas já existiam antes desta missão).

## Ambiente Claude Code (este lote)

- Versão: 2.1.319
- `CLAUDE.md` enxuto, sem `@import` de `AGENTS.md`/`PRODUCT.md`
- Subagentes: `domain-risk-reviewer` (opus, Read/Grep/Glob) e `lot-verifier` (sonnet, Read/Grep/Glob, sem Bash)
- Explore nativo; sem explorador customizado
- Skill: `.claude/skills/validacao-por-risco/SKILL.md`
- Permissões de projeto em `.claude/settings.json`
- Plugin Cartographer 1.4.0 (`cartographer@cartographer-marketplace`), skill `/cartographer`
- Mapa: `docs/CODEBASE_MAP.md` (Graph-First em `AGENTS.md` §21.1)
- MCP `supabase`: local, HTTP, `✔ Connected`, escopo `zigjiu`, `read_only=false`,
  `features=database,debugging`. Configuração efetiva conferida com `claude mcp get supabase`.
  Não alterada nesta missão (já estava correta). Sem `bypassPermissions` e sem `skip_elicitations`.
- Ferramentas autorizadas: `list_migrations`, `execute_sql`, `apply_migration`, `get_advisors`.
  Leitura (`list_migrations`, `get_advisors`) em `allow`. Escrita (`execute_sql`,
  `apply_migration`) em `ask`. Regras MCP sem parênteses — a 2.1.319 ignora `mcp__…(…)`.

## Proposta de atualização do roteiro de economia de tokens

O roteiro vive fora deste worktree e não foi copiado.

Ajustes a registrar lá, quando o proprietário autorizar a edição:

- Explore nativo substitui o explorador customizado.
- `lot-verifier` substitui `qa-runner`.
- `domain-risk-reviewer` continua.
- Verificador começa sem Bash.
- Handoff antes de `/clear`.
- Seleção da base Git permanece decisão pendente do proprietário.

## Relatórios

- `docs/CODEBASE_MAP.md`
- `docs/releases/EVENT-READINESS.md`
- `docs/repository/PRODUCTION-MANIFEST.md`
- `docs/repository/RECONCILIATION-LOT-2.md`
- `docs/repository/RECONCILIATION-LOT-3.md`
- `docs/repository/RECONCILIATION-LOT-4.md`
- `docs/repository/RECONCILIATION-LOT-5-IMPLEMENTATION.md`
- `docs/repository/RECONCILIATION-LOT-6.md`
- `PRODUCT.md`
- `AGENTS.md`

## Rodada de 8 nov 2026 — Nova abertura da Home (publicada)

- Commit `2d3180d` (branch `feature/cinematic-auth-v2`). Hero da Home substituído: título MEU CAMP em
  partículas com repulsão do ponteiro (`components/home-landing/ParticleTitle.tsx`), carrossel de cards
  PixelCard com eventos reais (`HomeLanding.tsx`, `PixelCard.tsx`). `OpeningEventStrip.tsx` removido; a busca
  do hero saiu (a busca fica em `/eventos`). Inclui a navegação Flow Motion da rodada de 7 nov.
- Validação: `tsc` PASS; lint PASS; `next build` PASS; `public-surfaces.spec.ts` 9/9; `auth-experience.spec.ts` 13/13
  (local); preview HTTP 200 em /, /eventos, /login, /quem-somos, /sistema.
- Publicado: `dpl_Hv6wxhdABFQgUtY3RvYxMMpr8hzh` (production, CLI). Sem push, sem migration, sem escrita no banco.
- Limitação: o preview é protegido; homologação em navegador foi local, não no preview. O step
  `home-cache.steps.ts` (heading/tab "Mostrar …") já estava desatualizado em relação ao hero anterior.

**Atualização (8 nov, local, ainda não publicada):** removida toda a narrativa cinematográfica abaixo do hero
(`CinematicStory.tsx` apagado; `HomeClient` renderiza só o hero). A Home agora é hero + `HomePlatformSection` + footer.
Corrigido `catch` ausente em `document.fonts.load` no `ParticleTitle` (gerava `pageerror` "A network error occurred").
Validação: tsc PASS; lint PASS; build PASS; `public-surfaces.spec.ts` 9/9 em 3 execuções contra `next start`.
O deploy `dpl_Hv6wxhdABFQgUtY3RvYxMMpr8hzh` ainda contém a narrativa e o erro de fontes.
