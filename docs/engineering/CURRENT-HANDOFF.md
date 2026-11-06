# Handoff atual — Meu Camp

Atualizar após os commits finais de cada lote e antes de `/clear`.
Sem credenciais, tokens, dados pessoais ou identificadores de infraestrutura.

## Branch e HEAD

| Item | Valor |
| --- | --- |
| Worktree | `/home/nune/Meus Projetos/jiu-event-readiness` |
| Branch | `integration/event-readiness-20261106` |
| Candidato funcional validado | `a6dadbb` |
| HEAD desta atualização | `4d87f78` |

O working tree original de `jiu` não foi modificado neste lote.

## Estado técnico do candidato

Candidato integrado dos lotes 2–6 e da correção de criação de evento / organização administrativa / categorias em escala real. Testado estaticamente e com Playwright de leitura. **Não publicado. Não homologado com escrita. Não operacionalmente liberado.**

Relatório central: `docs/releases/EVENT-READINESS.md` (o HEAD interno desse arquivo ainda cita `36abc9d`; o tip `a6dadbb` registra a revisão de leiturabilidade das telas públicas).

## Decisões definitivas

- Pata geométrica e Patojitsu descartados. Não reintroduzir.
- Homologação por segundo projeto Supabase cancelada em 6 nov 2026.
- Produção permanece na linhagem financeira A até escolha A/B/C.
- Alternativa A de categorias aprovada; expansão U→M/F está nesta branch, não em `b0a32c7`.
- Diff local de `categorize()` que mistura `U` não entra.
- Cada lote parte de `b0a32c7` até o proprietário decidir o contrário.

## Testes e evidências

Registrados em `docs/releases/EVENT-READINESS.md`:

- TypeScript, lint e build: PASS
- Unitários: 221/222 (1 falha pré-existente de alias no `automação`)
- Playwright categorias 2/2, integração 7/8 (1 skip de staff), auth 13/13
- Carga, concorrência, BDD `@write`/`@full-event`/`@homologation`: NOT_RUN — BLOCKED BY ENVIRONMENT

Este lote de ambiente não reexecutou essas suítes.

## Bloqueios

- Ambiente seguro para escrita, carga e jornada esportiva completa.
- ~~Confirmar se algum operador real tem filiação administrativa ambígua.~~ Confirmado nesta
  rodada (6 nov 2026): consulta agregada em produção (`zigjiu`, somente leitura) retornou **0**
  operadores com mais de uma filiação owner/organizer. Pendência do lote anterior encerrada.
- Escolha da linhagem financeira A/B/C.
- Seleção da base Git dos próximos lotes (`b0a32c7` vs este candidato).
- **Novo P0 registrado, não iniciado:** `createCategoryRuleSet` — troca de versão ativa sem
  atomicidade comprovada, possível ausência de proteção contra versões ativas concorrentes,
  falta de restrição explícita por estado do campeonato, risco de reenvio/idempotência,
  dependência de RLS para autorização. Diagnóstico do `domain-risk-reviewer` (Opus) de rodada
  anterior; ainda não reexecutado contra o código atual.

## Rodada de 6 nov 2026 — organizações (concluída)

Commit `4d87f78`. Regra de produto aplicada à criação de evento (`/admin/eventos/novo`):

1. Uma filiação administrativa (owner/organizer): seleção automática — já estava correto.
2. Mais de uma: **escolha explícita** do operador num `<select>` no formulário — **gap corrigido
   nesta rodada**; antes, mais de uma filiação apenas bloqueava a criação (falha fechada) sem
   oferecer alternativa.
3. Nenhuma: impede a criação — já estava correto.
4. Revalidação no servidor: a escolha do formulário é sempre conferida contra as filiações reais
   do usuário (`organization_members`, papel owner/organizer) a cada chamada de `createEvent`;
   nunca aceita apenas pelo valor recebido do cliente.

Lacuna adicional encontrada e corrigida: `getAdministrativeOrganizationContext` descartava o
`reason` (e agora `options`) em todo caso não resolvido. Isso tornava o tratamento de
`reason === 'ambiguous'` já existente em `createEvent` código morto — nunca era alcançado, mesmo
antes desta rodada.

Arquivos alterados: `lib/auth/organization-context.ts`, `lib/auth/organization-context-server.ts`,
`app/admin/eventos/actions.ts`, `app/admin/eventos/novo/page.tsx`,
`app/admin/eventos/novo/NewEventForm.tsx`, `automação/tests/organization-context.test.ts`.

Fora do escopo desta rodada, propositalmente: `/admin/eventos` (listagem) e
`/admin/eventos/[id]/editar` continuam com o comportamento antigo (falha fechada) quando
ambíguo — não é o fluxo de criação que a missão pediu para corrigir.

Testes: `tsc --noEmit` PASS; `next lint` (arquivos alterados) PASS; suíte unitária
`automação` 224/225 — a 1 falha é a pré-existente de alias em
`registration-correction.test.ts` (resolve módulo contra o `jiu` original, não este worktree),
não relacionada a esta mudança.

## Próxima missão

P0 de categorias (`createCategoryRuleSet`, ver Bloqueios acima) — aguardando autorização do
proprietário para iniciar. Quando autorizada: implementar correções locais, preparar eventuais
migrations sem aplicar, e solicitar revisão final ao `domain-risk-reviewer` com Opus antes de
declarar pronto.

Decisão do proprietário, ainda pendente: manter a regra “cada lote parte de `b0a32c7`” ou passar
a trabalhar a partir deste candidato integrado.

Publicação continua bloqueada até: bloqueios P0 corrigidos (categorias ainda não iniciado),
revisão de alterações de banco, testes de regressão, revisão da integração Vercel, comparação
com a versão publicada, release candidate com rollback preparado, e aprovação explícita do
proprietário. Nenhuma dessas etapas foi executada nesta rodada.

## Ambiente Claude Code (este lote)

- Versão: 2.1.319
- `CLAUDE.md` enxuto, sem `@import` de `AGENTS.md`/`PRODUCT.md`
- Subagentes: `domain-risk-reviewer` (opus, Read/Grep/Glob) e `lot-verifier` (sonnet, Read/Grep/Glob, sem Bash)
- Explore nativo; sem explorador customizado
- Skill: `.claude/skills/validacao-por-risco/SKILL.md`
- Permissões de projeto em `.claude/settings.json`

## Proposta de atualização do roteiro de economia de tokens

O roteiro vive fora deste worktree e não foi copiado.

Ajustes a registrar lá, quando o proprietário autorizar a edição:

- Explore nativo substitui o explorador customizado.
- `lot-verifier` substitui `qa-runner`.
- `domain-risk-reviewer` continua.
- Verificador começa sem Bash.
- Handoff antes de `/clear`.
- Seleção da base Git permanece decisão pendente do proprietário.

## Relatórios

- `docs/releases/EVENT-READINESS.md`
- `docs/repository/PRODUCTION-MANIFEST.md`
- `docs/repository/RECONCILIATION-LOT-2.md`
- `docs/repository/RECONCILIATION-LOT-3.md`
- `docs/repository/RECONCILIATION-LOT-4.md`
- `docs/repository/RECONCILIATION-LOT-5-IMPLEMENTATION.md`
- `docs/repository/RECONCILIATION-LOT-6.md`
- `PRODUCT.md`
- `AGENTS.md`
