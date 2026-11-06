# MEU CAMP — Reconciliação Lote 3

**Veredito:** **RECONCILIATION LOT 3 — PASS WITH LIMITATIONS**  
**Data:** 5 de novembro de 2026

Isolamento da experiência de autenticação a partir do manifesto do Lote 1. O login publicado em produção foi preservado. O redesign cinematográfico e o `AuthSplitShell` permaneceram fora deste lote.

## Branch e commits

| Item | Valor |
| --- | --- |
| Worktree | `/home/nune/Meus Projetos/jiu-lote3-auth` |
| Branch | `security/auth-experience` |
| Pai | `9ef6baf` (`docs/production-manifest-20261105`, manifesto documental) |
| Baseline de produção | `b0a32c7dcfe39769f7754d25b8180e2d80cb46ec` |
| HEAD (antes deste relatório) | `362501bcab2ecebba473c71cd4faaa46c69495ba` |
| Push | não executado |
| Merge com Lote 2 / `origin/master` | não executado nas branches originais |

### Commits de produto

| Hash | Tree | Mensagem |
| --- | --- | --- |
| `2c1eb02c279a2ebbd6e725cbc79c5b0aba391162` | `4a323c1898286e006c3b495415a9ec588bdf42da` | `fix(auth): preservar o login publicado e fechar o redirect administrativo` |
| `362501bcab2ecebba473c71cd4faaa46c69495ba` | `ddb0f7e14f7b419e879822780ca20f4e29b0aa25` | `test(auth): alinhar login e autorização à UI publicada` |

## Arquivos incorporados

### Commit 1 — correções funcionais

- `lib/supabase/middleware.ts` — sessão autenticada em `/admin/*` (incluindo `/admin/autenticacao`) passa pela checagem administrativa; destino validado por `resolveAdminPostLoginRedirect`.
- `app/login/page.tsx` — `try/catch`, bloqueio de reenvio e `resolvePostLoginRedirect`. Layout publicado preservado.
- `app/recuperar-senha/page.tsx` — `try/finally` para liberar carregamento; mensagem genérica inalterada; `aria-labelledby`.
- `app/atualizar-senha/page.tsx` — `try/catch` e `window.location.assign('/dashboard')` no lugar de `router.replace` + `router.refresh`.

### Commit 2 — testes

- `automação/tests/features/login.feature`
- `automação/tests/steps/login.steps.ts`
- `automação/tests/steps/authorization.steps.ts`
- `automação/playwright.auth.config.ts`
- `automação/tests/auth-experience.spec.ts`

## Arquivos excluídos (propositalmente)

| Arquivo local | Classificação | Motivo |
| --- | --- | --- |
| `app/login/page.tsx` cinematográfico (GSAP, +541/−) | experimento / redesign | Missão: preservar o login já funcional em produção |
| `components/auth/AuthSplitShell.tsx` | melhoria visual | Só envolvia recuperar/atualizar; sem mudança de regra |
| `app/recuperar-senha/page.tsx` e `app/atualizar-senha/page.tsx` visuais | melhoria visual | Comportamento de e-mail/token idêntico ao HEAD |
| Webhook, Asaas, settlement, `.env.example` | fora do lote | Restrição absoluta |
| Migrations / RLS / `zigjiu` | fora do lote | Nenhuma alteração de banco |
| Páginas do Lote 2 | dependência opcional | Sem merge automático |

## Inventário vs produção

| Superfície | Produção (`b0a32c7`) | Working tree original | Neste lote |
| --- | --- | --- | --- |
| `/login` | Card estrutural, `window.location.assign`, redirect interno fraco, sem `try/catch` | Shell cinematográfico GSAP + redirect seguro + `try/catch` | Produção + correções funcionais |
| `/admin/autenticacao` | Já usa `window.location` e helper de redirect | Igual ao HEAD | Sem mudança de página |
| Middleware em `/admin/autenticacao` com sessão | Formulário continua visível | Redirect + checagem de vínculo | Incluído (correção funcional) |
| `/recuperar-senha` | Card estrutural, mensagem genérica | `AuthSplitShell` | Produção + loading/`aria` |
| `/atualizar-senha` | `router.replace` + `refresh` | `AuthSplitShell`, mesma mutation | Produção + navegação completa |
| Navbar `Login` / logout `Sair da conta` | Já em HEAD | Igual | Só testes alinhados |
| Cookies / RLS | `getUser` + `setAll` SSR | Sem mudança de cookie | Preservado |

## Avaliação de segurança

| Tema | Resultado |
| --- | --- |
| Cookies e persistência | Sem alteração do cliente SSR; recarga autenticada passou no Playwright |
| Open redirect | `resolvePostLoginRedirect` bloqueia `https://`, `//` e loops `/login` e `/admin/autenticacao` |
| `/admin/autenticacao` autenticado | Middleware deixa de servir o formulário; owner vai a `/admin/eventos`; conta sem vínculo sai de `/admin` |
| Proteção anônima | `/dashboard` e `/admin/eventos` continuam exigindo login com `redirectTo` |
| Recuperação | Mensagem genérica preservada (não enumera cadastro). Link `otp_expired` segue para `/recuperar-senha?erro=link_expirado` |
| Autorização no servidor | `is_platform_admin` / `organization_members` no middleware; `getAdministrativeOrganizationContext` no hub admin (HEAD) |
| RLS / secrets | Não alterados. Evidências sem senha, token, cookie ou link de recovery |
| Enfraquecimento | Nenhum. A mudança de middleware **aperta** `/admin/autenticacao` |

Residual de produto (pré-existente no HEAD, não introduzido aqui): conta sem vínculo e com cadastro esportivo incompleto, ao ser recusada em `/admin`, cai em `/dashboard/completar-cadastro-esportivo` e o query `erro=sem_permissao` pode ser consumido por esse redirect. O acesso administrativo continua negado.

## Resultados dos testes

Ambiente isolado: `npx next start -p 3020` neste worktree. Contas E2E de teste. Sem e-mail a terceiros. Sem alteração de senha.

| Checagem | Resultado |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `next lint` nos arquivos do lote | PASS (0 warnings) |
| `npx next build` | PASS |
| Unitário `post-login-redirect.test.ts` | **2/2 PASS** |
| Playwright `auth-experience.spec.ts` | **13/13 PASS** (serial, Chromium local) |
| BDD `login.feature` (smoke + P1) | **5/5 PASS** |
| BDD `authorization.feature` | **5/5 PASS** |

### Cobertura G5

| # | Cenário | Resultado |
| --- | --- | --- |
| 1 | Login válido | PASS |
| 2 | Credenciais inválidas | PASS |
| 3 | Redirect pós-login (interno e bloqueio externo) | PASS |
| 4 | Persistência após reload | PASS |
| 5 | Acesso direto a rota protegida | PASS |
| 6 | Logout | PASS |
| 7 | Envio de recuperação com caixa de e-mail de teste | **NOT_RUN** — sem Mailhog/Inbucket; não foi disparado reset para conta real |
| 8 | Redefinição e reuso/expiração de token de recovery | **NOT_RUN** para reuso real; expiração via `error_code=otp_expired` **PASS**; senha de conta não alterada |
| 9 | Teclado | PASS |
| 10 | 320 / 390 / 1440px | PASS |

## Dependências dos Lotes 1 e 2

| Destino | Fonte | Estado |
| --- | --- | --- |
| Manifesto documental | Lote 1 `9ef6baf` | pai desta branch |
| Relatório do Lote 1 `03abc63` | docs only | não incorporado (desnecessário para o código) |
| Dashboard / perfis / onboarding | Lote 2 `ui/dashboard-onboarding-profiles` @ `bb282b2` | **não mesclado** nesta branch |
| Helper `lib/auth/post-login-redirect.ts` | já em HEAD/produção | reutilizado, não reescrito |
| Navbar `prefetch={false}` e logout via `location.assign` | já em HEAD | sem mudança |

### Composição descartável Lote 2 + Lote 3

Worktree temporário `tmp/lote3-lote2-compose` a partir de `362501b`, `git merge --no-commit --no-ff ui/dashboard-onboarding-profiles`:

- conflitos: **0**
- `npx tsc --noEmit`: **PASS**
- merge abortado; worktree e branch temporários removidos
- `security/auth-experience` e `ui/dashboard-onboarding-profiles` intactas

Navegação pós-login do Lote 2 (dashboard/onboarding) não é requisito deste lote. A composição tipa. Smoke autenticado da composição não foi repetido para não alterar as branches.

## Riscos e limitações

1. **NOT_RUN** de envio e reuso de token de recovery — falta caixa de e-mail de teste isolada.
2. Query `erro=sem_permissao` pode desaparecer quando o dashboard HEAD redireciona para completar cadastro esportivo.
3. Login cinematográfico e `AuthSplitShell` continuam só no working tree original — lote futuro de UI, não de sessão.
4. `app/auth/callback/route.ts` ainda usa `safeRedirectPath` local (permite `/login` como destino). Fora do diff local; residual documentado, não alterado para não inventar escopo.
5. Branch sem push; GitHub permanece divergente.
6. Playwright em paralelo com outra suíte no mesmo `next start` gerou um falso negativo de middleware; a suíte serial passou 13/13.

## Estado do working tree original

`/home/nune/Meus Projetos/jiu` permanece em `wip/local-pre-reconcile-20261019` @ `b0a32c7`. **61** arquivos modificados rastreados preservados. Backup `/home/nune/Meus Projetos/jiu-backups/worktree-reconcile-20261105-201911` não foi usado para restaurar nem descartar arquivos.

Este lote **não** copiou o login cinematográfico de volta para o working tree original.

## Não executado

Deploy, push, merge permanente, rebase, migrations, `db push`, alteração em `zigjiu`, `homework`, `jiu-live`, webhooks, Asaas, contas reais.

---

*Nenhuma senha, token, cookie ou link de recuperação foi registrado neste documento.*
