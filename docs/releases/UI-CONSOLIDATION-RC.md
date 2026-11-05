# MEU CAMP — UI Consolidation Release Candidate

**Status:** pacote autossuficiente. Sem deploy. Sem push.  
**Data:** 5 de novembro de 2026  
**Veredito:** **UI RELEASE CANDIDATE — READY**

Referência de produção (rollback funcional): `FUNCTIONAL-RELEASE` / `dpl_5bo3LahBCroVETNjbZ4fAExxn2YA`.  
Branch: `wip/local-pre-reconcile-20261019` / `hotfix/ui-rc-packaging` · **HEAD:** `7ed6bf7` · packaging: `7de09c4` · tree packaging: `cf4287b` · base anterior: `f7e78b0`.

## Causa raiz

O RC `f7e78b0` não era autossuficiente: rotas públicas e admin commitadas importavam módulos/exports só presentes no working tree sujo. O READY anterior foi invalidado no gate de publicação isolada.

## Grafo (diretas → classificação → ação)

| Dependência | Consumidor | Classe | Ação |
| --- | --- | --- | --- |
| `InteractiveChampionshipDemo` | `app/eventos/page.tsx` | experimental | removido o import; calendário RC preservado |
| `getCinematicPreviewEvents` | `app/eventos/page.tsx` | experimental | removido; usa só `getPublicEvents` |
| `getDevelopmentPreviewEvent` | `app/eventos/[id]/page.tsx` | experimental | removido; `preview-*` → `notFound()` |
| `DateTimeField` | `EditEventForm` | estável/necessária | incluído |
| `loadOrganizerEventHub` + tipos | hub admin | necessária | incluído em `dashboard-facts` |
| `adminEventContinuePath` / `guidanceStepsForPhase` | hub | necessária | incluído em `event-guidance` |
| `EventProgress` compact | `EventsHub` | necessária | incluído |
| `Coachmark({ id })` | `EventAdminShell` | necessária | incluído (API alinhada ao shell) |
| `events.local_*` em types | `public-access` / detalhe | necessária | incluído em `database.types` |
| webhook / Asaas / home cinematic files | — | não relacionada / experimental | excluídos |

## Commits do RC

| Lote | Hash | Mensagem |
| --- | --- | --- |
| 1 Fundamentos | `c9f2947` | StatusBadge canônico |
| 2 Navegação | `70f9d61` | barras pública/interna/admin |
| 3 Telas públicas | `ea60487` | calendário e interior |
| 4 Admin + LIVE | `28a537d` | superfícies operacionais |
| 5 Docs/testes | `7d78556`…`f7e78b0` | manifesto RC |
| 6 Packaging | `7de09c4` | `fix(ui): tornar o RC de consolidação autossuficiente` |

## Incluído neste hotfix

- `components/ui/DateTimeField.tsx`
- exports do hub em `lib/onboarding/dashboard-facts.ts`
- `adminEventContinuePath` + `guidanceStepsForPhase` + estado `blocked` em `event-guidance.ts`
- `components/onboarding/EventProgress.tsx` / `Coachmark.tsx` (API do RC)
- colunas `local_*` em `lib/supabase/database.types.ts`
- desacoplamento público de cinematic
- ajuste de `automação/tests/catalog-presentation.test.ts`

## Excluído

- `components/home-cinematic/**`
- `lib/home/cinematic-preview-events.ts`
- home cinematográfica / docs HOME-*
- webhook/Asaas/pagamentos e demais dirty tree

## Evidências — checkout limpo `7de09c4` (`/tmp/jiu-ui-rc-verify`)

| Verificação | Resultado |
| --- | --- |
| Dirty no checkout | 0 |
| Cinematic no pacote | ausente |
| `npx tsc --noEmit` | PASS |
| Lint (escopo RC) | PASS |
| Unitários relevantes | PASS (33) |
| `next build` | PASS |
| Smoke público 1440/390 | PASS (`public_failed` 0) |
| Smoke autenticado | PASS (login, hub→LIVE, live-exit, logout/relogin, console) |
| Deploy / push | NOT_RUN |

## Riscos residuais

- Working tree original continua sujo com experimentais; não misturar no promote.
- Harness `tools/e2e-isolated/ui-rc-smoke.mjs` permanece fora do git.
- Domínio oficial ainda em `dpl_5bo3LahBCroVETNjbZ4fAExxn2YA` até novo ciclo de publicação.
