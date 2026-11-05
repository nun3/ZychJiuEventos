# MEU CAMP — UI Consolidation Release Candidate

**Status:** manifesto com commits locais. Sem deploy. Sem push.  
**Data:** 5 de novembro de 2026  
**Veredito:** **UI RELEASE CANDIDATE — BLOCKED**

Referência de produção (rollback funcional): `FUNCTIONAL-RELEASE` / `dpl_5bo3LahBCroVETNjbZ4fAExxn2YA` / `5b465409ac594945aad9bb8e81f9061e1612167e`.  
Branch: `wip/local-pre-reconcile-20261019`.

## Causa do bloqueio

O E2E autenticado falha por **configuração de ambiente**, não por regressão do fluxo de login do produto.

Evidência (Playwright local, sem imprimir segredos):

1. CSS/JS hidratados (`body` com fundo `mc-background`).
2. Submit via Enter dispara `POST /auth/v1/token` no projeto `zigjiu`.
3. Resposta **HTTP 400**.
4. UI exibe **“E-mail ou senha inválidos”** (`#admin-auth-error`).
5. Nenhum cookie de sessão é gravado.

Correção necessária: atualizar `E2E_OWNER_PASSWORD` (e validar o e-mail) em `automação/.env.e2e` contra a conta autorizada no Sandbox. **Não** alterar autenticação do produto para contornar o 400.

Ajustes de produto feitos neste gate (acessibilidade, sem mudar regra de auth):

- `label` da senha aponta para o input.
- Erro recebe foco (`#admin-auth-error`).
- Submit com `scroll-mt-24` e `id="admin-login-submit"`.

Sobreposição da navbar no clique Playwright: falha de harness quando o botão é rolado sob o `header` fixo; Enter e `#admin-login-submit` evitam o problema.

## Commits do RC (locais, sem push)

| Lote | Hash | Mensagem |
| --- | --- | --- |
| 1 Fundamentos | `c9f2947` | `refactor(ui): tornar StatusBadge canônico com marca quadrada` |
| 2 Navegação | `70f9d61` | `refactor(nav): alinhar barras pública, interna e administrativa` |
| 3 Telas públicas | `ea60487` | `refactor(public): consolidar calendário e interior do campeonato` |
| 4 Admin + LIVE | `28a537d` | `refactor(admin): padronizar superfícies operacionais e shell LIVE` |
| 5 Docs/testes | `7d78556` | `docs(ui): registrar consolidação visual e resultados do RC` |
| 5b Manifesto | `6a259d0` | `docs(ui): preencher hash do lote de documentação no manifesto RC` |
| 5c Tabela | `b6aaadd` | `docs(ui): corrigir tabela de hashes do manifesto RC` |

HEAD do RC: ver `git rev-parse --short HEAD` nesta branch após os commits acima (série `c9f2947`…docs). Base anterior: `0b95803`.

## O que entrou

- Gramática pública de `/eventos` e interior do campeonato.
- Nav de 6 itens (Horário público / Programação admin).
- `StatusBadge` canônico (quadrado + texto).
- Hub e miolo administrativo sob `(operacao)`.
- Shell LIVE especializado (necessário ao layout admin; regras esportivas preservadas).
- Docs de design system e manifesto.

## O que ficou de fora (working tree residual)

- Home cinematográfica (`app/HomeClient.tsx`, `components/home-cinematic/**`, `docs/design-system/HOME-*`).
- Pagamentos/webhook (`app/api/payments/webhook`, settlement smokes, dashboard checkout).
- Evidências históricas amplas e `tools/` (harness local).
- Demais alterações de dashboard/perfil/onboarding não listadas nos commits acima.

## Testes

| Verificação | Resultado |
| --- | --- |
| TypeScript | PASS |
| Playwright público 320–1440 (lote anterior + pós-restart) | PASS |
| Login autenticado E2E | **BLOCKED** (Auth 400 / credenciais E2E) |
| Hub → LIVE autenticado | NOT_RUN |
| `next build` | PASS (lote anterior; reiniciar `next dev` depois) |
| Full BDD | NOT_RUN |
| Deploy | NOT_RUN (proibido) |

## Plano de rollback

1. Nada foi publicado: não há promote a reverter.
2. Para desfazer só o RC local: `git revert` dos hashes `c9f2947..` (ou reset misto **somente** com autorização explícita — não executar reset destrutivo sem pedido).
3. Produção permanece em `FUNCTIONAL-RELEASE`.

## Riscos residuais

- Credenciais E2E desatualizadas bloqueiam o gate autenticado.
- Working tree ainda sujo fora do RC.
- `next build` e `next dev` compartilhando `.next` invalidam chunks; isolar processos.
- Lote 4 inclui o shell LIVE completo (novo no working tree), não apenas o chip cosmético — dependência de `AdminLayout`/`Operação LIVE`.

## Pronto para publicação?

**Não.** Atualize as credenciais E2E, rode o smoke autenticado (`tools/e2e-isolated/ui-rc-smoke.mjs`) até PASS, confirme build limpo, e só então considere promote.
