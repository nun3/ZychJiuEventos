# MEU CAMP — Reconciliação Lote 6

**Veredito:** **RECONCILIATION LOT 6 — PASS WITH LIMITATIONS**  
**Data:** 5 de novembro de 2026

Composição temporária e rastreável dos Lotes 2, 3 e 4 sobre o manifesto `9ef6baf`. Sem conflitos. Sem publicação. Sem migrations. Branches de origem e working tree original intactos.

## Branch e worktree

| Item | Valor |
| --- | --- |
| Worktree | `/home/nune/Meus Projetos/jiu-lote6-qa` |
| Branch | `qa/lots-2-3-4-integration` |
| Base | `9ef6baf1c2922c048b36c16b1da9ae5cd3179bae` |
| Produção | `b0a32c7` / `dpl_AMKofx7oNmQnQiPhr2xDTWSdUPaa` |
| HEAD da composição (merges) | `7d893df6807a3771966d313e32682dea5db2ad5d` |
| Tree da composição | `ab89ab5876273e4e39c9e3a4856ff3e49895c1f4` |
| Commit de testes da composição | `951e9c09e6eab436e0dd66a4bc40d6830da6a753` |
| Push | não executado |

## Origens confirmadas

| Lote | Branch | HEAD | Tree |
| --- | --- | --- | --- |
| 2 | `ui/dashboard-onboarding-profiles` | `bb282b2fb4e190db6c242d41d68a1bd8bc58d900` | `f6b117acf2a7a422836146a5eacd19f2088f9991` |
| 3 | `security/auth-experience` | `f146fd055fec9535eca94f942fc88ba68a44be3b` | `1f55f03dd307f84169298d4b3eb0eb4403729c4e` |
| 4 | `ui/public-surfaces` | `97974648fcea408abcea81d58ed21923fad9a971` | `3f5791f77aa57fae42cbbaa0c880651cc6a6a832` |

Merge-base dos três com o manifesto: `9ef6baf`. Sobreposição de arquivos 2∩3, 2∩4 e 3∩4: **vazia**.

Backup `/home/nune/Meus Projetos/jiu-backups/worktree-reconcile-20261105-201911/archives/SHA256SUMS`: **PASS**.

## Histórico da composição

Merges `--no-ff` nesta ordem, sem `ours`/`theirs`:

| Merge | Hash | Tree | Conflitos |
| --- | --- | --- | --- |
| Lote 2 | `335153bf49c74f1e041d73ab2ceec3193ccc994f` | `f6b117ac` (igual ao tree do Lote 2) | 0 |
| Lote 3 | `3bce85e05bf66ecbba893481147efb85f4a8d7bf` | `8c1d1f08` | 0 |
| Lote 4 | `7d893df6807a3771966d313e32682dea5db2ad5d` | `ab89ab58` | 0 |
| Testes da composição | `951e9c09e6eab436e0dd66a4bc40d6830da6a753` | `23c29828` | — |

Nenhuma dependência de código excluído. `AuthSplitShell` ausente. Login sem GSAP. `lib/categorization.ts`, webhook, `PaymentCheckout` e settlement permanecem nos commits de produção, não nos diffs dos lotes.

## Conflitos e resoluções

Nenhum arquivo conflitante. Nada foi sobrescrito.

## Testes

Checkout limpo deste worktree. Servidor `npx next start -p 3030`. Contas E2E de teste. Sem escrita financeira, sem add-member, sem transition de evento, sem alteração de senha.

| Checagem | Resultado |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `next lint` nos dirs compostos | PASS |
| Unitários Lotes 2–4 | **28/28 PASS** |
| `npx next build` | PASS — home 14.6 kB, login 6.48 kB |
| Playwright público | **9/9 PASS** |
| Playwright auth | **13/13 PASS** |
| Playwright integração (painel + 320/768) | **7/7 PASS**, 1 skip |
| BDD login + autorização | **10/10 PASS** |

Total Playwright/BDD executado nesta composição: **39 passed**, **1 skipped**.

### Cobertura G4

| Área | Resultado |
| --- | --- |
| Home cinematográfica | PASS |
| Calendário, detalhe/404, institucionais, rodapé | PASS |
| Login válido/inválido, sessão, logout, rota privada | PASS |
| Bloqueio de redirect externo | PASS |
| `/admin` sem vínculo (servidor) | PASS |
| Recovery: UI + `otp_expired` | PASS |
| Envio real de e-mail / reuso de token | **NOT_RUN** |
| Dashboard, perfil, atletas, organização, inscrições (leitura) | PASS |
| Owner vs visitante vs sem vínculo | PASS |
| Staff dedicado (`E2E_STAFF_*`) | **NOT_RUN** — identidade ausente |
| 1440 / 768 / 390 / 320 | PASS, sem overflow horizontal |

## Comparação visual

Evidências em `docs/repository/evidencias/lote-6/`.

| Página | Antes (produção pública) | Depois (composição 3030) | Leitura |
| --- | --- | --- | --- |
| Home | `before-home-1440.png` | `after-home-1440.png` | Mesma gramática cinematográfica. Sem calendário legado. |
| Login | `before-login-1440.png` (captura em branco; hidratação) | `after-login-1440.png` | Card publicado. Sem `AuthSplitShell`. |
| Academias | `before-academias-1440.png` faixa navy | `after-academias-1440.png` palco Lote 4 | Alteração **intencional** |
| Eventos / Quem somos | — | `after-eventos-1440.png`, `after-quem-somos-1440.png` | Palco publicado + institucional Lote 4 |
| Dashboard | — | `after-dashboard-1440.png` | Painel Lote 2. Sem checkout. |

Recorte de perfil autenticado **não** foi versionado — continha dado de conta.

## Permissões

| Verificação | Onde | Resultado |
| --- | --- | --- |
| Anônimo em `/dashboard/*` | middleware | 307 para `/login?redirectTo=` |
| Owner em `/admin/eventos` | middleware + `getAdministrativeOrganizationContext` | permanece no admin |
| Sem vínculo em `/admin` | middleware | sai de `/admin` |
| Staff no select | UI Lote 2; RPC já aplicada | opção existe; autorização de escrita **não** retestada com conta staff |

RLS e policies do banco não foram alterados.

## Limitações conhecidas (reavaliadas)

1. **`erro=sem_permissao`:** conta incompleta recusada em `/admin` ainda cai em `/dashboard/completar-cadastro-esportivo` e o query some. Acesso admin continua negado. Sem correção neste lote — exigiria mudar o dashboard HEAD.
2. **`staff` no cliente:** o select mostra o papel alinhado à RPC já existente. Sem conta `E2E_STAFF`, a autorização no servidor para esse papel permanece **NOT_RUN**.
3. **Recovery:** sem caixa de e-mail isolada. Envio e reuso de token **NOT_RUN**. Expiração via `otp_expired` passou.

Nenhuma correção de integração foi necessária. Nenhuma funcionalidade nova.

## Riscos residuais

1. `NextActionButton` ainda chama `transitionEvent` do HEAD; o smoke não clicou.
2. Lote 5 (`genero=U`) continua fora.
3. Financeiro (webhook, Asaas, settlement) continua na linhagem de produção, não na dos lotes.
4. Branch sem push. GitHub permanece divergente.
5. Captura de login em produção saiu em branco; a evidência válida do login composto é a local.

## Recomendação para o próximo release

Esta árvore (`ab89ab58`) é candidata técnica a um release futuro dos Lotes 2–4: reproduzível, sem conflito e coberta pelos testes pertinentes.

Antes de promover:

1. Decidir o Lote 5 (`genero=U`) ou mantê-lo explicitamente fora do pacote.
2. Não incluir financeiro até a escolha A/B/C.
3. Homologar recovery com caixa de e-mail de teste, se o pacote incluir “recuperar senha” como promessa.
4. Definir conta `E2E_STAFF` se o pacote afirmar papéis além de owner.
5. Só então empacotar a partir desta branch — sem merge automático de `origin/master`.

## Preservação

- Lote 2 `bb282b2`, Lote 3 `f146fd0`, Lote 4 `9797464`: inalterados.
- Working tree original: `wip/local-pre-reconcile-20261019` @ `b0a32c7`, 61 modificados.
- Sem deploy, push, `zigjiu`, `homework` ou `jiu-live`.
