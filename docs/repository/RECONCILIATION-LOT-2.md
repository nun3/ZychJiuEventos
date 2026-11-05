# MEU CAMP — Reconciliação Lote 2

**Veredito:** **RECONCILIATION LOT 2 — PASS**  
**Data:** 5 de novembro de 2026

Isolamento de dashboard, onboarding, perfis, atletas e organização a partir do manifesto do Lote 1. Sem webhook, checkout, Asaas, migrations, auth pages ou `genero=U`.

## Branch

| Item | Valor |
| --- | --- |
| Worktree | `/home/nune/Meus Projetos/jiu-lote2-dashboard` |
| Branch | `ui/dashboard-onboarding-profiles` |
| Pai | `9ef6baf` (`docs/production-manifest-20261105`) |
| HEAD | `c898dd2ff134ef30c96267131ff1a1bda6fe3b90` |
| Tree | `3aa6ebaccc1550ba199a309a06ecf2b764e27011` |
| Push | não executado |

## Commits

| Hash | Tree | Mensagem |
| --- | --- | --- |
| `92aaa4b4900397bae25addbd75ee7c7b71dc9bd6` | `3af35181e15e8f3bae7f544020e4f0d92ecfd560` | `feat(ui): extrair capa, orientação e avatares do painel` |
| `6b3a6ecc59b316a7354de175ed83ed3654fd2e97` | `d2546e925bccbce459bb9ee934e1a0459ade615b` | `refactor(dashboard): alinhar painel, inscrições e shells ao layout fluido` |
| `9cb75e73130420932fbd697e63af2ed25ac4e005` | `5a1a76906c07a22608d1e952ebe5fb1f6d4840e6` | `feat(profile): organizar perfil, atletas e papéis da organização` |
| `c898dd2ff134ef30c96267131ff1a1bda6fe3b90` | `3aa6ebaccc1550ba199a309a06ecf2b764e27011` | `test(ui): alinhar unitários de orientação e papéis da organização` |

## Arquivos incluídos

### Commit 1 — componentes compartilhados

`EventCover`, `DashboardPageHero`, `EventGuidanceView`, `NextActionButton`, `EventGuidancePanel`, `NextActionCard`, `event-guidance.ts`, `dashboard-facts.ts`, `fun-avatar-presets.ts`, 5 PNGs em `public/images/avatars/`.

### Commit 2 — dashboard e onboarding de superfície

`app/dashboard/page.tsx`, `layout.tsx`, `app/platform/layout.tsx`, `app/dashboard/inscricoes/page.tsx` (layout; `PaymentCheckout.tsx` permanece HEAD).

### Commit 3 — perfis, atletas, organização

`meu-perfil/**` (5), `meus-atletas/**` (2), `organizacao/**` (3), `OrganizationMembersList.tsx`, `lib/organizations/membership.ts` (`staff` no cliente, alinhado à RPC já aplicada).

### Commit 4 — testes

`automação/tests/onboarding-guidance.test.ts`, `organization-membership.test.ts`.

## Dependências

| Destino | Fonte | Estado |
| --- | --- | --- |
| Dashboard | `EventCover`, `PanelColumns` (HEAD), `DashboardPageHero` | resolvido no lote |
| Onboarding | `EventGuidanceView`, `NextActionButton` → `transitionEvent` **HEAD** (não alterada) | resolvido; não muda o motor LIVE |
| Perfil avatares | presets + PNGs + `setMyAvatarUrl` | resolvido |
| Staff no formulário | `OWNER_ASSIGNABLE_ROLES` + SQL `20261102034621` já em `zigjiu` | UI apenas |
| `PageContainer fluid` / `InternalNavigation fluid` | já em HEAD | sem alterar os componentes |
| Inscrições | ainda importa `PaymentCheckout` HEAD | CSS do checkout **excluído** |

Consultas: `dashboard-facts` e `event-guidance-server` (HEAD) continuam SELECT em events/registrations. Sem migration, sem RLS novo.

## Arquivos excluídos (propositalmente)

Webhook, settlement-config, `.env.example`, `PaymentCheckout.tsx`, login/recuperar/atualizar, middleware, AuthSplitShell, `lib/categorization.ts`, `next.config.js`, `tsconfig.json`, migration highlights, `.next-rc-build`, evidências, `tools/`, `onboarding-visual-journey.ts` (jornada com escrita).

## Qualidade (checkout limpo deste worktree)

| Checagem | Resultado |
| --- | --- |
| `npm ci` (lockfile) | PASS |
| `npx tsc --noEmit` | PASS |
| `next lint` nos dirs do lote | PASS (0 warnings) |
| Unitários `onboarding-guidance` + `organization-membership` | **22/22 PASS** |
| `npx next build` | PASS |
| Playwright local `127.0.0.1:3015` (não produção) | **30/30 PASS** |
| Viewports | 1440 e 390 |
| A11y básica | `main` + `h1` em dashboard, perfil, atletas, organização, inscrições |
| Console | sem erros nas duas larguras |
| Anônimo | as cinco rotas redirecionam para `/login?redirectTo=…` |

`npm run test:unit` da pasta `automação` também carrega testes fora do lote; `registration-correction.test.ts` falha por alias `@/` no ts-node — **pré-existente**, fora do escopo. Os dois arquivos do lote passam isolados.

Playwright autenticado fez login de leitura nas páginas do painel. **Não** submeteu checkout, webhook, add-member nem transitions de evento. Servidor local encerrado após o smoke.

## Riscos residuais

1. `NextActionButton` chama `transitionEvent` existente; um clique real no admin avançaria fase. Este lote não altera a action; o smoke **não** clicou o CTA.
2. `staff` no select depende da RPC já aplicada; se o ambiente SQL divergir, a UI mostra a opção e o banco recusa.
3. Avatares são estáticos em `/public`; não passam pelo bucket de identity-assets.
4. Branch sem push; GitHub continua divergente.
5. Working tree original permanece sujo e **não** recebeu estes commits.

## Working tree original

`/home/nune/Meus Projetos/jiu` em `wip/local-pre-reconcile-20261019` @ `b0a32c7`, 61 modificados preservados, backup intacto.
