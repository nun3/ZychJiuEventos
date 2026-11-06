# Handoff atual — Meu Camp

Atualizar após os commits finais de cada lote e antes de `/clear`.
Sem credenciais, tokens, dados pessoais ou identificadores de infraestrutura.

## Branch e HEAD

| Item | Valor |
| --- | --- |
| Worktree | `/home/nune/Meus Projetos/jiu-event-readiness` |
| Branch | `integration/event-readiness-20261106` |
| Candidato funcional validado | `a6dadbb` |
| HEAD desta atualização | `c6e7d84` |

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
- Confirmar se algum operador real tem filiação administrativa ambígua.
- Escolha da linhagem financeira A/B/C.
- Seleção da base Git dos próximos lotes (`b0a32c7` vs este candidato).

## Próxima missão

Decisão do proprietário: manter a regra “cada lote parte de `b0a32c7`” ou passar a trabalhar a partir deste candidato integrado.

Enquanto isso, o próximo trabalho de produto permanece o da prontidão operacional descrita em `docs/releases/EVENT-READINESS.md`, sem push, deploy ou migration.

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
