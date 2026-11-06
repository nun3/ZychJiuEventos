# MEU CAMP — Manifesto de produção

**Data:** 5 de novembro de 2026  
**Veredito:** produção rastreada no Git a partir deste documento.  
**Sem push. Sem deploy. Sem migrations.**

Este manifesto descreve o que **já está publicado**, não o working tree sujo.

---

## Identidade publicada

| Item | Valor |
| --- | --- |
| Commit | `b0a32c7dcfe39769f7754d25b8180e2d80cb46ec` |
| Short | `b0a32c7` |
| Tree | `021e819a2c0c530f86dd0273ec75f9737ee80c73` |
| Assunto | `fix(home): exportar matchesEventQuery para a faixa de abertura` |
| Data do commit | `2026-11-05T19:44:04-03:00` |
| Cadeia imediata | `d307a10` (home cinematográfica) + `b0a32c7` |
| RC visual anterior | `c574c1ce56bae736da14903e07952f2c549c218e` |
| Packaging de código | `7de09c4` |
| Projeto Vercel | `jiu` · `prj_OWAnDfWWQp3i0YJtJkhAmAjocJ3n` |
| Deployment | `dpl_AMKofx7oNmQnQiPhr2xDTWSdUPaa` |
| Estado | `READY` · `target=production` · origem CLI |
| Domínio oficial | https://jiu-three.vercel.app |
| Alias adicional | https://jiu-navy.vercel.app |
| URL do deployment | https://jiu-a2s9ycvv3-nunes-projects-e576e5bd.vercel.app |
| Rollback imediato | `dpl_8S5v1WnraoBefZwARg5fDn8EScfs` |
| Rollback anterior | `dpl_5bo3LahBCroVETNjbZ4fAExxn2YA` |
| Banco | `zigjiu` / `kfvypacjzlzwwblsbpwj` |
| Prova HEAD = deploy | SHA-1 de 682 arquivos rastreados idênticos ao pacote CLI; 61 arquivos sujos locais **não** estão no deploy |

A produção **não** está em `origin/master`. Este commit ainda não tem upstream.

---

## Componentes e módulos publicados

Incluídos no pacote `b0a32c7`:

- Home pública cinematográfica (`HomeClient`, faixa de abertura, `matchesEventQuery`).
- Calendário e interior de campeonato (RC `ea60487`).
- Navegação pública, interna e administrativa (`70f9d61`).
- Shell administrativo operacional e LIVE visual (`28a537d`).
- `StatusBadge` canônico (`c9f2947`).
- Layout fluido de dashboard já no RC (`0b95803`) — sem o delta local posterior.
- Autenticação publicada: páginas de login/recuperar/atualizar **da forma HEAD**, sem split cinematográfico local.
- Pagamentos publicados: webhook com `ASAAS_WEBHOOK_TOKEN` único; settlement com host de production (`cf1dd82`); checkout manual.
- Onboarding publicado: `EventGuidancePanel` HEAD (progresso + NextActionCard sem botão de transição no card).

Não publicados (existem só no working tree local):

- Login cinematográfico, `AuthSplitShell`, middleware de redirect admin.
- Webhook por conta Asaas / `readAsaasWebhookToken`.
- Avatares divertidos, `EventCover`, `EventGuidanceView`, `NextActionButton`.
- `staleTimes` em `next.config.js`.
- `genero=U` em `lib/categorization.ts`.
- `staff` em `OWNER_ASSIGNABLE_ROLES`.
- Artefato `.next-rc-build/` e evidências PNG.

---

## Fluxos validados na publicação

Do RC2 promovido e do hotfix home, já exercitados em produção no ciclo de 5 nov:

- Superfícies públicas: home, calendário, detalhe, participantes, chaves, lutas, horário, resultados, formulário de inscrição (sem finalizar).
- Superfícies autenticadas de leitura: login HEAD, hub, configuração, checagem, financeiro (leitura), chaves, programação, operação LIVE + saída, resultados, logout.
- Playwright do RC2: 49/49 PASS no domínio, sem nova bateria neste manifesto.

Não reexecutados aqui: homologação com escrita, cobranças Asaas, migrations.

---

## Limitações conhecidas

1. Publicação via CLI, sem SHA Git no meta da Vercel. A correspondência é por hash de arquivo.
2. Sem push: o GitHub não é a fonte do que está no ar.
3. Build Vercel pode falhar em `next/font` (Google Fonts); o ciclo RC usou retry/`--force`.
4. `PAYMENTS_MANUAL_ONLY` permanece o modo do checkout do atleta.
5. Histórico SQL de `zigjiu` não contém os 37 timestamps locais posteriores a `202609040002`; o schema foi reconciliado por catch-ups.
6. SQL de inscrição ainda exige igualdade de gênero; categorias `U` no catálogo não são elegíveis pela RPC.
7. Working tree local continua sujo e **não** deve ser promovido inteiro.

---

## Patches e migrations já aplicados em `zigjiu`

Última leitura: 5 nov 2026, projeto `zigjiu` / `kfvypacjzlzwwblsbpwj`.

| Version remota | Nome |
| --- | --- |
| `202608270001` | `initial_domain` |
| `202609030002` | `backfill_auth_profiles` |
| `202609030003` | `athlete_update_audit` |
| `202609040001` | `event_status_transitions` |
| `202609040002` | `event_storage` |
| `20261031031613` | `production_catchup_registration_creation` |
| `20261031032428` | `production_catchup_registration_corrections_allocation` |
| `20261031033850` | `production_catchup_payments` |
| `20261031041750` | `production_catchup_checkin_shared_dependencies` |
| `20261102020714` | `production_catchup_brackets` |
| `20261102022207` | `production_catchup_schedule` |
| `20261102023724` | `production_catchup_live` |
| `20261102034621` | `production_catchup_auth_registration_fix` |

Nenhuma migration nova desde `20261102034621`. Não reaplicar os patches em `supabase/patches/`.

---

## Alterações locais excluídas deste manifesto

O working tree em `wip/local-pre-reconcile-20261019` no momento da auditoria: **61** rastreados + **1267** não rastreados (depois +5 em `docs/repository/` da auditoria). Nenhum desses caminhos faz parte do deployment.

Exclusões explícitas para lotes futuros:

- Financeiro (webhook, settlement-config, `.env.example`, PaymentCheckout CSS, testes Asaas).
- Autenticação local (login, recuperar/atualizar senha, middleware, AuthSplitShell).
- Superfícies públicas posteriores (institucional, carousel local, filtros).
- `lib/categorization.ts` (`genero=U`) — bloqueado até decisão SQL.
- Migration histórica `202609290001_home_event_highlights.sql` editada.
- `.next-rc-build/`, `next.config.js.tmp-rc`, `tools/`, evidências PNG.

---

## Divergência com GitHub

Merge-base: `dd692602b289b5a363799d1c59cf8e77a6c932d4`.  
`origin/master`: `204f0233bf67ab3f482f0fdf967c6a405085178b`.

**21 commits em HEAD e não no remoto** (produção local / Vercel):

`cf1dd82`, `62b9f52`, `e1ce8fd`, `9aaa8f0`, `34c1788`, `0b95803`, `c9f2947`, `70f9d61`, `ea60487`, `28a537d`, `7d78556`…`c574c1c`, `d307a10`, `b0a32c7`.

**11 commits no remoto e não em HEAD:**

`bcb5339`, `0eaeeff`, `7e05bc5`, `bc74d6d`, `5a8c804`, `f41d9f2`, `2e54257`, `6769dbd`, `2d563ac`, `dc3ef06`, `204f023`.

O remoto contém a PR `feat/asaas-production-account` e hardening de CI, **ausentes da Vercel**. Várias mensagens de UI existem nos dois lados com **hashes diferentes**. Não mesclar automaticamente.

---

## Próximos lotes planejados

| Lote | Branch | Estado |
| --- | --- | --- |
| 1 — este manifesto | `docs/production-manifest-20261105` | em execução |
| 2 — dashboard, onboarding, perfis | `ui/dashboard-onboarding-profiles` | seguinte, sem webhook/auth/migration |
| 3 — páginas de autenticação | `ui/auth-pages` | não nesta missão |
| 4 — superfícies públicas | `ui/public-surfaces` | não nesta missão |
| 5 — `genero=U` | — | **BLOCKED** (SQL) |
| 6 — QA amplo | `qa/homologation-alignment` | depois dos lotes de produto |
| 7 — `staleTimes` | — | isolado |
| 8 — evidências | `docs/db-catchup-evidence` | opcional |
| 9 — artefatos RC | — | não versionar; remoção futura |
| 10 — financeiro | — | **BLOCKED** (linhagens A/B/C) |
| 11 — rastreabilidade GitHub | — | sem push nesta missão |

Backup recuperável: `/home/nune/Meus Projetos/jiu-backups/worktree-reconcile-20261105-201911`.
