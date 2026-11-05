# MEU CAMP — UI Consolidation Release Candidate

**Status:** pacote autossuficiente após hotfix de empacotamento. Sem deploy. Sem push.  
**Data:** 5 de novembro de 2026  
**Veredito:** **UI RELEASE CANDIDATE — READY** (sujeito a smoke G5 do lote de packaging)

Referência de produção (rollback funcional): `FUNCTIONAL-RELEASE` / `dpl_5bo3LahBCroVETNjbZ4fAExxn2YA` / `5b465409ac594945aad9bb8e81f9061e1612167e`.  
Branch de packaging: `hotfix/ui-rc-packaging` · base anterior: `f7e78b0`.

## Causa raiz (bloqueio de produção)

O RC `f7e78b0` importava módulos e exports presentes apenas no working tree sujo:

1. Home cinematográfica experimental (`InteractiveChampionshipDemo`, `cinematic-preview-events`) — **excluída**.
2. `DateTimeField` — UI estável usada por `EditEventForm` — **incluída**.
3. Hub de organizador (`loadOrganizerEventHub`, tipos, `adminEventContinuePath`, `guidanceStepsForPhase`) — **incluídos**.
4. `EventProgress` compact + `Coachmark` sem `userId` obrigatório — APIs já consumidas pelo hub/shell RC — **incluídos**.
5. Colunas `local_*` em `database.types` — tipos alinhados ao select público já commitado — **incluídos**.

O READY anterior ao hotfix foi invalidado porque os testes rodaram sobre árvore dirty, não sobre o commit isolado.

## Grafo de dependências

```
app/eventos/page.tsx
  ├─ EventsFeaturedStage / EventsCatalog (estável, RC)
  └─ ✗ home-cinematic / cinematic-preview  → REMOVIDO

app/eventos/[id]/page.tsx
  ├─ findPublicReleaseEvent + local_* (estável)
  └─ ✗ getDevelopmentPreviewEvent → REMOVIDO (preview-* → notFound)

EditEventForm
  └─ DateTimeField → INCLUÍDO (estável)

EventsHub / admin/eventos/page
  ├─ loadOrganizerEventHub + tipos → INCLUÍDO
  ├─ adminEventContinuePath / guidanceStepsForPhase → INCLUÍDO
  └─ EventProgress(variant=compact) → INCLUÍDO

EventAdminShell
  └─ Coachmark({ id }) → INCLUÍDO (API alinhada ao shell)

public-access select local_*
  └─ database.types events.local_* → INCLUÍDO
```

## Commits do RC

| Lote | Hash | Mensagem |
| --- | --- | --- |
| 1–5 + docs | `c9f2947`…`f7e78b0` | consolidação visual |
| 6 Packaging | *(preenchido após commit)* | hotfix de empacotamento |

## Excluído (permanece fora do pacote)

- `components/home-cinematic/**`
- `lib/home/cinematic-preview-events.ts`
- home cinematográfica / docs HOME-*
- alterações de webhook/Asaas/pagamentos
- demais dirty tree (~100+ arquivos)

## Testes no checkout de packaging (pré-smoke)

| Verificação | Resultado |
| --- | --- |
| TypeScript | PASS |
| Lint (escopo RC) | PASS |
| Unitários relevantes (33) | PASS |
| `next build` | PASS |
| Smoke público / autenticado | *(G5 em checkout limpo do novo HEAD)* |
| Deploy / push | NOT_RUN |
