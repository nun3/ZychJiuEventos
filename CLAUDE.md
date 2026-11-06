# MEU CAMP

Agente principal: Claude Code neste repositório.

## Fontes de verdade

Consultar por caminho. Não importar arquivos inteiros de antemão.

1. `PRODUCT.md` — estágio do produto, identidade e o que está publicado. Prevalece sobre `AGENTS.md` nesses pontos.
2. `docs/repository/PRODUCTION-MANIFEST.md` — o que está no ar.
3. `AGENTS.md` — regras permanentes de engenharia, arquitetura, QA e segurança.
4. Código, tipos, migrations e testes do checkout atual — implementação vigente.
5. `docs/design-system/README.md` e `docs/design-system/sprint-6.5.md` — gramática visual permanente.

Implementada, testada, publicada, homologada e operacionalmente liberada são estados diferentes.

A pata geométrica e o Patojitsu estão descartados. Trechos históricos em `AGENTS.md` e no design system não autorizam reutilização.

## Produção

Exigem autorização explícita: push, deploy, migration, `db push`, escrita no banco de produção, cobrança Asaas.

Não abrir `.env*` nem `automação/.env.e2e`.
Não reaplicar `supabase/patches/`.
Não promover o working tree original de `jiu`.
Não mexer em `jiu-live`, no stash nem em `homework`.

Permissões em `.claude/settings.json` restringem o Claude Code; não são isolamento absoluto.
Não habilitar `bypassPermissions` nem `skip_elicitations`.

## MCP Supabase (`zigjiu`)

O Claude Code pode usar o MCP de produção `zigjiu` com `read_only=false`.
A conexão permanece restrita a esse projeto. Sem outros projetos ou organizações.

Ferramentas autorizadas: `list_migrations`, `execute_sql`, `apply_migration`, `get_advisors`.

Consultas de migrations, schema e advisors são livres dentro deste escopo.

Para SQL de escrita ou `apply_migration`:

1. Confirmar o projeto de destino (`zigjiu`).
2. Revisar integralmente o SQL.
3. Verificar dependências e impactos.
4. Conferir o estado de backup.
5. Executar somente alterações autorizadas pelo proprietário.
6. Validar o resultado.
7. Registrar evidências e riscos.

Não executar migrations indiscriminadamente nem operações destrutivas não autorizadas.

Escrita administrativa (`execute_sql`, `apply_migration`) exige aprovação humana em `.claude/settings.json`.

## Worktrees

Cada lote parte de `b0a32c7`, no próprio worktree e na própria branch.

Proposta pendente, não vigente: usar o candidato integrado `integration/event-readiness-20261106` como base dos próximos lotes. A regra acima permanece até o proprietário decidir.

## Validação

Testar pelo risco. Skill: `.claude/skills/validacao-por-risco/SKILL.md`.
Reutilizar evidência válida. Registrar comando, ambiente e resultado.
TypeScript, lint, build e testes permanecem com o agente principal.
Explore nativo para buscas simples. Não criar explorador redundante.

Subagentes: `.claude/agents/domain-risk-reviewer.md` e `.claude/agents/lot-verifier.md`.

## Handoff

Antes de `/clear` e ao final de cada lote, após os commits finais, atualizar `docs/engineering/CURRENT-HANDOFF.md`.
