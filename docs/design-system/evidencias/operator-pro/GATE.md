# MEU CAMP LIVE — Operator Pro Gate

Rota: `/admin/eventos/[id]/operacao` (fora do shell das 6 superfícies).
Sync: refetch após mutação + poll ~2s em `running`/`paused`. Sem Realtime neste lote.

## Matriz

| Critério | Evidência | Status |
| --- | --- | --- |
| Usability (one-screen área + luta + controles + fila) | `OperatorBoard` + `MatchQueue` + `AreaPicker` | PASS |
| Touch (≥44px / min-h-11–12 nos controles) | botões scoring/lifecycle/finish/confirm | PASS |
| Readability (placar/relógio grandes, fila secundária) | `OperatorClock`, `Scoreboard`, fila lateral | PASS |
| Conflict (versão stale → lock UX, refetch, highlight, sem retry auto) | `handleConflict` + `mapLiveError` | PASS |
| Recovery (poll + refreshSession + badge sync/offline/error) | `SyncBadge` + poll 2s | PASS |
| Error (SQL → PT-BR) | `lib/live/errors.ts` + unit | PASS |
| Keyboard (1/2/3 A, 8/9/0 B; FINISH só via diálogo) | `OperatorBoard` keydown | PASS |
| A11y (labels, aria-live sync, focus rings, status textual) | SyncBadge + controles com aria-label | PASS |
| Tablet (layout principal + fila) | grid `lg:grid-cols-[1fr_16rem]` | PASS |
| Mobile (área/picker, controles empilhados) | grids responsivos + AreaPicker | PASS |
| Multi-aba / duas contas sem Realtime | conflito de versão + poll | PASS (parcial) |
| Multi-aba push Instantâneo (Realtime) | publication não inventada neste lote | BLOCKED |

## Unit

- `automação/tests/live-domain.test.ts` — clock, lifecycle, idempotency, winner hint, error map.

## Manual checklist (operador)

1. Abrir Operação sem `areaId` → picker.
2. Abrir luta → lifecycle válido por status.
3. Double-tap +2 → uma aplicação (mesma idempotency key).
4. Em `running`/`paused`, refresh/poll mantém placar.
5. Stale version → mensagem de conflito, placar flash, comando não reenviado sozinho.
6. Finish exige winner + resultType (default points); hint de placar é sugestão.
7. Staff vê “aguardando confirmação”; owner/organizer confirma.
8. Atalhos só scoring; Encerrar nunca por tecla.

## Status final

```
MEU CAMP LIVE OPERATOR PRO: PASS
```

Nota: Realtime permanece BLOCKED por decisão de lote; o critério multi-aba é coberto por version conflict + poll, não por push.
