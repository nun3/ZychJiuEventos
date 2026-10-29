# MEU CAMP LIVE — UNDO Ambiguity Hotfix Gate

## 1. ROOT CAUSE

Em `public.apply_match_live_action`, o parâmetro PL/pgSQL `target_event_id` colidia com a coluna `public.match_live_events.target_event_id` no SQL embutido do UNDO:

```sql
where id = target_event_id  -- ambíguo
```

Erro observado: `column reference "target_event_id" is ambiguous`.

Colisões latentes endurecidas no INSERT: `competitor_side`, `value`/`action_value`, `type`/`action_type`, `idempotency_key`.

## 2. HOTFIX

- Nova migration: `supabase/migrations/202610290001_match_live_undo_ambiguity_hotfix.sql`
- SHA-256: `f29aa726d156133b5111ac6bf2f6a96dee3f368c97493c5707069529ab311495`
- Estratégia: `CREATE OR REPLACE` **mesma assinatura**; locais `v_*` + alias `mle` no SELECT do UNDO
- Original `202610250001_match_live_domain.sql`: **UNCHANGED** (`ee17f5f9…476f463`)

## 3. DIFF SAFETY

| Item | Status |
| --- | --- |
| Migration original | UNCHANGED |
| Schema alterado | somente `public.apply_match_live_action` |
| Domain behavior | UNCHANGED |
| Authorization | UNCHANGED |
| Lifecycle | UNCHANGED |
| Idempotency | UNCHANGED |
| Versioning | UNCHANGED |
| Public data contract | UNCHANGED |
| Realtime | UNCHANGED |
| Frontend | UNCHANGED |

## 4. SANDBOX APPLY

| Campo | Valor |
| --- | --- |
| Project | zigjiu / `kfvypacjzlzwwblsbpwj` |
| Homework | não utilizado |
| HTTP | 201 |
| Início | 2026-10-29T23:12:08.213Z |
| Fim | 2026-10-29T23:12:09.217Z |
| Warnings/erros | nenhum |

## 5. UNDO TARGETED TEST

PASS — score / advantage / penalty; inválidos (start/pause/finish); duplicate; falha controlada cross-session/finished.

## 6. SQL SMOKE

PASS — `match_live_domain_smoke.sql` (fixture `published_by`/`published_at` corrigida; SHA `c4eae7f2…50f8182c`).

## 7. OPERATOR ACCEPTANCE

```
MEU CAMP LIVE OPERATOR ACCEPTANCE: PASS
```

Poll convergence: p50≈750ms · pior≈750ms · UI poll=2000ms  
Realtime: BLOCKED por desenho

## 8. REGRESSION MATRIX

| Critério | Status |
| --- | --- |
| Migration hotfix | PASS |
| Original migration unchanged | PASS |
| Security | PASS |
| Authorization | PASS |
| Lifecycle | PASS |
| Idempotency | PASS |
| Version conflict | PASS |
| UNDO score | PASS |
| UNDO advantage | PASS |
| UNDO penalty | PASS |
| UNDO invalid lifecycle actions | PASS |
| UNDO duplicate | PASS |
| Cross-session isolation | PASS |
| SQL smoke | PASS |
| Full fight | PASS |
| Refresh running | PASS |
| Refresh paused | PASS |
| Two operators | PASS |
| Double tap | PASS |
| Lost response retry | PASS |
| Network/reconnect | PASS |
| Background recovery | PASS |
| Finish concurrency | PASS |
| Staff restriction | PASS |
| Owner confirmation | PASS |
| Finance isolation | PASS |
| Queue progression | PASS |
| Keyboard safety | PASS |
| Audit trail | PASS |

## 9. FINAL STATUS

```
MEU CAMP LIVE OPERATOR ACCEPTANCE: PASS
```

Sem Realtime. Sem deploy.
