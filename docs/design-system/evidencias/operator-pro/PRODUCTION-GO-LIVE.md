# MEU CAMP LIVE — PRODUCTION GO-LIVE

Data: 2026-10-29 (America/Sao_Paulo)

## FINAL STATUS

**MEU CAMP LIVE PRODUCTION GO-LIVE: BLOCKED**

Motivo residual: deploy Vercel Production sem credencial válida (`vercel whoami` → token inválido; `VERCEL_TOKEN` unset).  
Banco (CASO B) e release/CI concluídos sem write destrutivo. Realtime não iniciado. homework não tocado.

---

## 1. RELEASE INVENTORY

| Grupo | Itens |
| --- | --- |
| LIVE DOMAIN | `supabase/migrations/202610250001_*`, hotfix `202610290001_*`, `match_live_domain_smoke.sql`, `lib/live/*`, `supabase/config.toml` |
| OPERATOR PRO | `app/.../operacao/*`, `components/live/*`, nav/shell/placar→operacao, staff assignable |
| CAROUSEL | `HomeHighlightsCarousel` autoplay 6s + reduced motion |
| TESTS | `live-domain.test.ts`, membership staff tests/smoke, acceptance/undo harness |
| DOCUMENTATION | `docs/.../operator-pro/*` |
| OUTROS | nenhum fora do escopo |

SHA-256:

| Artefato | SHA |
| --- | --- |
| main | `ee17f5f9a7ef69d8c4af59289570c849de349bf0709ca417e7ba77d84776f463` |
| hotfix | `f29aa726d156133b5111ac6bf2f6a96dee3f368c97493c5707069529ab311495` |
| smoke | `c4eae7f2b508a330a7c72e79bfdea2bdaeccb7b5fa3f68ab6761162b50f8182c` |

Migrations anteriores: **UNCHANGED**.

---

## 2. RELEASE COMMIT

| | |
| --- | --- |
| Branch | `feature/meu-camp-live` |
| Release | `df3d648` — `feat(live): ship Meu Camp Operator Pro and live match domain` |
| CI fix | `4e6355b` — `fix(live): remove waitForTimeout from Operator Pro acceptance harness` |
| HEAD | `4e6355b0cef0b76c8c1b65315262d1d117dd78e4` |
| Tree | **clean** |
| PR | https://github.com/nun3/ZychJiuEventos/pull/3 |

Gate local pré-commit: typecheck PASS · unit 179 PASS · LIVE+membership 14 PASS · lint PASS (warnings não-bloqueantes).

---

## 3. CI

| | |
| --- | --- |
| Run | `40975563433` |
| Job verify | **PASS** (2m16s) |
| Steps | lint · typecheck · test:unit · hardening:check · build |

---

## 4. PRODUCTION SUPABASE IDENTIFICATION

**CASO B — zigjiu é o banco da aplicação pública de produção.**

| Campo | Valor |
| --- | --- |
| PRODUCTION_SUPABASE_PROJECT | zigjiu |
| PRODUCTION_PROJECT_REF | `kfvypacjzlzwwblsbpwj` |
| PRODUCTION API host | `https://kfvypacjzlzwwblsbpwj.supabase.co` |
| App Production URL | `https://jiu-three.vercel.app` |
| homework | `qrasolgjxiocpltdlaez` — **não usado** |

Evidências:

1. Bundle Production (`/_next/static/chunks/3058-*.js`) embute host `kfvypacjzlzwwblsbpwj.supabase.co` (0 ocorrências de homework).
2. Único projeto MEU CAMP ativo linked na org = zigjiu.
3. `.env.example`, CSP/`images` e `go-live-assistido.md` operam neste ref.
4. Org MEU CAMP real criada neste projeto.

**PRODUCTION DATABASE DECISION:**  
`zigjiu / kfvypacjzlzwwblsbpwj` used as production database for MEU CAMP public app.

---

## 5. DATABASE PREFLIGHT

| Migration | Status |
| --- | --- |
| `202610250001_match_live_domain.sql` | **APPLIED** (objetos presentes) |
| `202610290001_match_live_undo_ambiguity_hotfix.sql` | **APPLIED** (`v_action_type` presente em `apply_match_live_action`) |

`supabase_migrations.schema_migrations` ausente neste projeto (histórico via SQL Editor / Management API — ver HOTFIX-APPLY.json).  
Regra: **não reaplicar**.

Baseline: tabelas `match_live_sessions`, `match_live_events`; 12 funções LIVE; Realtime LIVE = 0.

---

## 6. MIGRATION APPLY

| Migration | Status |
| --- | --- |
| main | SKIPPED — already applied |
| hotfix | SKIPPED — already applied |

Nenhum write de migration neste lote.

---

## 7. DATABASE GATE

| Check | Result |
| --- | --- |
| SECURITY DEFINER (RPCs core) | PASS |
| `search_path=""` | PASS |
| PUBLIC EXEC core | 0 — PASS |
| anon `apply`/`create` | 0 — PASS |
| authenticated `apply`/`get` | PASS |
| anon `get_public_event_live` | 1 — PASS (contrato público) |
| unique session | ≥1 — PASS |
| indexes LIVE | 9 — PASS |
| Realtime publication LIVE | **0 — DISABLED / UNCHANGED** |

**DATABASE PRODUCTION GATE: PASS**

---

## 8. CONTROLLED PROD SMOKE

| | |
| --- | --- |
| Mode | **FULL SMOKE** via `BEGIN`/`ROLLBACK` (`match_live_domain_smoke.sql`) |
| SHA | `c4eae7f2…` |
| Project | `kfvypacjzlzwwblsbpwj` |
| Result | PASS (sem erro; padrão idêntico ao SQL-SMOKE Sandbox) |
| Residue `@example.invalid` / LIVE Org / Evento LIVE | **0** |

---

## 9. DEPLOYMENT

| | |
| --- | --- |
| Commit alvo | `4e6355b` |
| Fluxo oficial | `vercel deploy --prod` + alias `jiu-three.vercel.app` |
| `vercel whoami` | **FAIL** — token inválido |
| `VERCEL_TOKEN` | unset |
| Deployment ID | — |
| Build/deploy Production | **BLOCKED** |

PR #3 **não mergeada** neste lote (aguarda publish coordenado com deploy).

---

## 10–12. POST-DEPLOY / CONCURRENCY / CLEANUP

| Fase | Status |
| --- | --- |
| Post-deploy (carousel + Operator Pro UI) | **BLOCKED** (sem deploy) |
| Concurrency UI | **BLOCKED** (sem deploy) |
| Cleanup smoke SQL | **PASS** (0 resíduos) |

---

## 13. FINAL MATRIX

| Gate | Status |
| --- | --- |
| Commit/CI | PASS |
| Production identification | PASS (CASO B) |
| Migration integrity | PASS |
| Main migration | PASS (already applied) |
| UNDO hotfix | PASS (already applied) |
| Structural check | PASS |
| Security | PASS |
| Authorization (SQL smoke) | PASS |
| Realtime disabled | PASS |
| Lifecycle / Score / Advantage / Penalty / UNDO | PASS (smoke) |
| Idempotency / Version conflict / Clock | PASS (smoke) |
| Smoke cleanup | PASS |
| Production build (CI) | PASS |
| Production deploy | **BLOCKED** |
| Carousel / Operator route / Area-queue / Full fight / Refresh / Polling | **BLOCKED** |
| Staff / Owner / Finance UI | **BLOCKED** |
| Concurrency UI | **BLOCKED** |
| Cleanup | PASS |

---

## 14. FINAL STATUS

**MEU CAMP LIVE PRODUCTION GO-LIVE: BLOCKED**

Desbloqueio único restante:

1. Autenticar Vercel (`vercel login` ou `VERCEL_TOKEN` válido no ambiente de release).
2. `vercel deploy --prod` do commit `4e6355b` (ou merge PR #3 + deploy).
3. Alias/confirm `https://jiu-three.vercel.app`.
4. Retomar fases 10–13 (post-deploy, concurrency, cleanup UI).

Não iniciar Lote Realtime.
