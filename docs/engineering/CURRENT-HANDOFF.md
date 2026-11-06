# Handoff atual — Meu Camp

Atualizar após os commits finais de cada lote e antes de `/clear`.
Sem credenciais, tokens, dados pessoais ou identificadores de infraestrutura.

## Branch e HEAD

| Item | Valor |
| --- | --- |
| Worktree | `/home/nune/Meus Projetos/jiu-event-readiness` |
| Branch | `integration/event-readiness-20261106` |
| Candidato funcional validado | `a6dadbb` |
| HEAD desta atualização | `227dc62` |

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

- Ambiente seguro para escrita, carga e jornada esportiva completa — **ainda bloqueado**, decisão
  de ambiente pendente do proprietário.
- ~~Confirmar se algum operador real tem filiação administrativa ambígua.~~ Confirmado em 6 nov
  2026: consulta agregada em produção (`zigjiu`, somente leitura) retornou **0** operadores com
  mais de uma filiação owner/organizer.
- Escolha da linhagem financeira A/B/C.
- Seleção da base Git dos próximos lotes (`b0a32c7` vs este candidato).
- ~~`createCategoryRuleSet` — troca de versão ativa sem atomicidade, sem proteção contra
  concorrência, sem restrição por estado.~~ Corrigido em 6 nov 2026 (ver rodada abaixo). **Migration
  autorizada e ainda não aplicada em `zigjiu`:**
  `supabase/migrations/202611060001_category_rule_set_atomic_activation.sql`. A correção só
  funciona de ponta a ponta depois da aplicação e da regeneração de
  `lib/supabase/database.types.ts`. Não foi aplicada nesta missão de configuração.
- **Residual, não corrigido nesta rodada (severidade baixa, documentado e aceito):** dependência
  de RLS para autorização em `editableEvent` (sem checagem redundante na aplicação); UI de
  `/admin/eventos/[id]/editar` acessível a `staff`/`finance` por SELECT RLS antes do gate de
  escrita (pré-existente, não é regressão desta rodada); reenvio duplo de criação de versão de
  categorias pode gerar uma versão extra inofensiva (sem idempotency key).

## Rodada de 6 nov 2026 — política MCP Supabase de produção

Missão de configuração. Sem SQL de escrita, sem `apply_migration`, sem deploy e sem push.

O proprietário autorizou o Claude Code a usar o MCP de produção `zigjiu` com `read_only=false`,
restrito a esse projeto. Consultas de migrations, schema e advisors passam a ser livres neste
escopo. SQL de escrita e aplicação de migration exigem o checklist de `CLAUDE.md` e aprovação
humana nas ferramentas `mcp__supabase__execute_sql` e `mcp__supabase__apply_migration`.

A migration `202611060001_category_rule_set_atomic_activation.sql` está autorizada para a
próxima missão e **não foi aplicada aqui**.

Arquivos deste lote: `CLAUDE.md`, `.claude/settings.json`,
`.claude/skills/validacao-por-risco/SKILL.md`, `docs/engineering/CURRENT-HANDOFF.md`.

## Rodada de 6 nov 2026 (missão P0 integrada) — categorias, organizações e preparação de RC

**Escopo:** resolver os bloqueios P0 conhecidos (ativação de categorias) e as lacunas restantes
da regra de organizações (listagem e edição), com revisão de subagentes e preparação (não
aplicação) de migration. Commits `9c6b743` e `c270279`, sobre a base `4d87f78`.

### A. Ativação de categorias (P0 do `domain-risk-reviewer`)

Migration preparada, **não aplicada**:
`supabase/migrations/202611060001_category_rule_set_atomic_activation.sql`.

- Índice único parcial `category_rule_sets_one_active_per_event` (no máximo uma versão ativa por
  evento) — precedido por um saneamento que desativa duplicatas pré-existentes (achado da
  revisão, ver abaixo), mantendo ativa a versão de maior `versao`.
- Função `activate_category_rule_set(uuid)`, `SECURITY INVOKER` (preserva a RLS existente),
  atômica: lock de linha + desativar as demais + ativar a nova numa transação só. Bloqueia com
  `P0001` se a checagem já foi travada, `P0003` se o evento está cancelado/concluído.
- `persistNewCategoryVersion` (`app/admin/eventos/actions.ts`) chama a RPC em vez de duas
  atualizações sequenciais sem transação; em falha, desfaz a versão criada
  (`event_categories` antes de `category_rule_sets`, por `ON DELETE RESTRICT`) e escolhe a
  mensagem certa pelo código de erro (`categoryActivationCompensation`, testado).
- `createCategoryRuleSet`/`createCategoryRuleSetFromCatalog` bloqueiam a criação de nova versão
  via `assertCategoryVersionEditable` (testado) quando `checagem_travada_em` já foi definido ou o
  evento está `cancelado`/`concluido`.
- `lib/supabase/database.types.ts` ganhou a assinatura da RPC manualmente — **regenerar com
  `supabase gen types` depois que a migration for aplicada**, para substituir a entrada escrita
  à mão pela gerada de fato.

Verificado por leitura real do schema (MCP Supabase, somente leitura): FKs de
`registrations`/`category_brackets` para `event_categories` são `ON DELETE RESTRICT` — inscrições
e chaves existentes não são apagadas ao ativar uma nova versão. Validação de identificadores
(UUID) já existia. RLS de escrita (`category_rule_sets_staff_write`, `events_organizer_write`)
confirmada corretamente restrita a owner/organizer.

**Revisão `domain-risk-reviewer` (Opus):** achados médios, todos corrigidos no commit `c270279`
antes de declarar pronto — (1) índice único podia falhar ao criar sobre duplicatas pré-existentes;
(2) ativação falha deixava versão órfã sem compensação, mensagem convidava a reenviar mesmo
quando a causa não mudaria no reenvio; (3) gate de estado não cobria `cancelado`/`concluido`.
Atomicidade e ordem de locks confirmadas corretas (sem deadlock). Residuais aceitos: RLS como
única autorização (sem checagem redundante na app); página de edição acessível a staff/finance
por SELECT RLS antes do gate de escrita (pré-existente).

**Verificação `lot-verifier` (Sonnet):** nenhum FAIL; teste novo (`category-rule-set-lifecycle.test.ts`)
cobre fielmente os dois ramos da função; apontou que nenhum teste automatizado cobre a RPC SQL em
si nem o seletor de organização (UI) — ambos **NOT_RUN — BLOCKED BY ENVIRONMENT**, esperado sem
banco isolado/Playwright nesta rodada.

Bug encontrado durante a implementação (não pela revisão): a função SQL tinha `v_status text`,
mas `events.status` é o enum `event_status` sem cast registrado para `text` em `pg_cast` — a
atribuição teria falhado em runtime. Corrigido para `public.event_status` antes do commit.

### B. Organizações — listagem e edição

A correção de criação de evento (commit `4d87f78`, rodada anterior) ficava restrita a
`/admin/eventos/novo`. Corrigido nesta rodada:

- `/admin/eventos` (listagem): ambíguo agora mostra um seletor explícito de organização (link
  para `?org=<id>`), revalidado no servidor contra as filiações reais antes de listar os eventos
  daquela organização.
- `/admin/eventos/[id]/editar`: não exige mais uma organização ativa resolvida — o evento já é
  fixado por `params.id`, e `allowsPublicOrganization` + RLS decidem o acesso; bloquear por
  ambiguidade aqui impedia um operador multi-organização de editar rascunhos de qualquer uma das
  suas organizações sem motivo real.

### C. Criação e recuperação de eventos — revisado, sem lacuna nova encontrada

Lido `createEvent`, `uploadAsset` e a página `configuracao` (aviso de retomada). Upload com
`Promise.allSettled`, retry via `eventId` devolvido em falha parcial, e o aviso
`?aviso=arquivo` na página de configuração — todos intactos e coerentes com o que
`docs/releases/EVENT-READINESS.md` §2 já documentava. Nenhuma correção nova necessária; não
refeito por já estar correto.

### D. Jornada esportiva — build completo PASS, verificação funcional NOT_RUN

`next build` completo (60+ rotas, incluindo categorias, inscrição, checagem, chaves,
programação, operação, resultados) **PASS** — confirma que a integração entre páginas não quebrou
com as mudanças de A e B. Verificação funcional ponta a ponta (inscrição → checagem → chaves →
resultados) com escrita real **NOT_RUN — BLOCKED BY ENVIRONMENT**, mesmo motivo já registrado:
sem ambiente seguro para escrita.

### Testes desta rodada

- `tsc --noEmit`: PASS.
- `next lint` (arquivos alterados): PASS.
- `next build` (projeto completo): PASS.
- Suíte unitária `automação`: 229/230 — a 1 falha é a pré-existente de alias em
  `registration-correction.test.ts` (resolve módulo contra o `jiu` original, não este worktree),
  não relacionada a esta rodada.
- Consulta agregada em produção (somente leitura): reconfirmada 0 operadores com filiação
  ambígua (ver Bloqueios).
- Playwright/BDD de jornada com escrita, carga (250/400 atletas) e concorrência real:
  **NOT_RUN — BLOCKED BY ENVIRONMENT**.

### Preparação de release candidate

1. **Comparação com a produção publicada:** base publicada é `b0a32c7` (ver
   `docs/repository/PRODUCTION-MANIFEST.md`). Diff `b0a32c7`→`c270279`: 112 arquivos, a única
   migration nova no diff inteiro é a desta rodada
   (`202611060001_category_rule_set_atomic_activation.sql`) — nenhum outro lote integrado nesta
   branch depende de migration não aplicada.
2. **Dependência de migration/RPC:** a correção de categorias (§A) só funciona em produção depois
   que essa migration for aplicada e os tipos regenerados. Até lá, `persistNewCategoryVersion`
   chamaria uma RPC inexistente em produção — **bloqueador direto de publicação** enquanto a
   migration não for aplicada.
3. **Autorização/RLS:** nenhuma política nova criada; a função SQL nova é `SECURITY INVOKER` e
   passa pelas políticas existentes, confirmadas corretas por leitura real do catálogo
   (`pg_policy`).
4. **Regressão:** cobertura unitária e de build descrita acima; regressão de escrita/Playwright
   continua bloqueada por ambiente.
5. **Commit exato do RC:** `c270279`.
6. **Rollback:** sem deploy nesta rodada, não há o que reverter em produção. Se a migration for
   aplicada antes do código: a função fica criada mas sem chamador (inofensiva). Se o código for
   publicado antes da migration: toda ativação de categoria falha com RPC inexistente — por isso
   a ordem correta é migration primeiro, deploy depois, nunca o inverso.
7. **Smoke test seguro pós-deploy (quando autorizado):** criar uma versão de categorias num
   evento de teste sintético, confirmar que só ela fica `ativo = true`, e que tentar ativar outra
   versão enquanto a checagem está travada devolve erro em vez de sucesso silencioso.

**Recomendação GO/NO-GO: NO-GO para publicação.** Correção de categorias correta e revisada, mas
inútil em produção sem a migration aplicada; jornada esportiva com escrita, carga e concorrência
seguem NOT_RUN por falta de ambiente; linhagem financeira A/B/C e escolha da base Git dos próximos
lotes continuam pendentes do proprietário. Nenhum bloqueador de **correção** restante nos itens
revisados nesta rodada — o bloqueio é de **processo de publicação** (migration, homologação,
decisão de ambiente), não de código.

## Rodada de 6 nov 2026 — organizações, criação de evento (concluída, rodada anterior)

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

## Auditoria de release gate (sessão de publicação, 6 nov 2026)

Executada sob autorização condicional do proprietário para publicar na Vercel **somente se** o
release gate resultasse GO. HEAD auditado: `931e5d4` (idêntico a `c270279` em código; a única
diferença é o próprio commit de documentação). Working tree limpo, branch e HEAD conferem.

**Resultado: NO-GO. Nenhuma publicação realizada.**

- Código e qualidade: PASS (evidência reutilizada da rodada anterior — `tsc`, lint, build,
  unitários 229/230 com a falha pré-existente de alias, Playwright categorias/integração/auth).
- Persistência e Supabase: **FAIL** — reconfirmado por leitura real (`mcp__supabase__list_migrations`)
  que `202611060001_category_rule_set_atomic_activation.sql` continua ausente em `zigjiu`; última
  migration remota ainda é `20261102034621`. A correção de ativação de categorias chamaria uma RPC
  inexistente em produção.
- Jornada esportiva: build completo PASS; escrita/carga/concorrência continuam NOT_RUN — BLOCKED
  BY ENVIRONMENT (sem mudança desde a rodada anterior).
- Segurança financeira: PASS — nenhum diff nesta sessão; modo manual, ausência de webhook/split
  automático reconfirmados pela leitura do manifesto, sem necessidade de reexecutar testes.
- Deployment Vercel: reconfirmado via `mcp__vercel__list_deployments` — produção ainda é
  `dpl_AMKofx7oNmQnQiPhr2xDTWSdUPaa` (`b0a32c7`), candidato de rollback ainda
  `dpl_8S5v1WnraoBefZwARg5fDn8EScfs`. Nenhum deployment novo desde o manifesto de 5 nov.

Nenhum achado novo. Decisão idêntica à já registrada na rodada de `c270279`, apenas reverificada
com leitura real do estado atual de banco e Vercel antes de considerar a publicação autorizada.

## Rodada de 6 nov 2026 — aplicação da migration autorizada e auditoria de publicação condicional

Missão sob autorização explícita do proprietário: aplicar exclusivamente
`supabase/migrations/202611060001_category_rule_set_atomic_activation.sql`, auditar o release
gate e publicar na Vercel automaticamente **somente se GO integral**. Resumo executivo abaixo;
detalhe completo em `docs/releases/EVENT-READINESS.md` §10.

**Migration: aplicada em `zigjiu` e validada.** Registrada como `20261106205820`. Pré-checagem
confirmou `category_rule_sets` vazia em produção (saneamento de duplicatas foi no-op seguro),
schema compatível (incluindo o enum `event_status` usado pela função), RLS
`category_rule_sets_staff_write` correta. Pós-checagem confirmou a função `SECURITY INVOKER` com
`search_path` fixo, o índice único parcial criado, e advisors de segurança idênticos antes/depois
(nenhum achado novo). Bloqueador anterior de banco ("RPC inexistente em produção") está resolvido.

**Release gate: NO-GO. Nenhuma publicação na Vercel foi realizada.** Código sem diff desde
`c270279`/`931e5d4` (só documentação mudou) — `tsc`, lint e `next build` completo PASS; unitários
229/230 (mesma falha pré-existente de alias); Playwright reaproveitado da rodada anterior sem
mudança que o invalidasse. O motivo do NO-GO é o mesmo das duas rodadas anteriores e **não mudou
nesta sessão**: a jornada esportiva completa (inscrição → checagem → pesagem → chaves →
resultados) com escrita, carga (250/400 atletas) e concorrência reais continua **NOT_RUN —
BLOCKED BY ENVIRONMENT**, indispensável para comprovar a segurança de um evento real e sem
decisão de ambiente do proprietário. Vercel reconfirmada sem mudança
(`dpl_AMKofx7oNmQnQiPhr2xDTWSdUPaa` em produção, `dpl_8S5v1WnraoBefZwARg5fDn8EScfs` como rollback).

**Residual:** privilégio `EXECUTE` da nova função ficou aberto a `PUBLIC`/`anon` por padrão do
Postgres (a migration não revogou de `PUBLIC`); confere com o padrão já usado por outras funções
`SECURITY INVOKER` deste schema, onde a RLS é a fronteira real de autorização — não é regressão,
não corrigido por não ter sido pedido. Backup automático do Pro continua sem confirmação direta
por ferramenta (mesma limitação de rodadas anteriores), risco mitigado por a migration ter
afetado 0 linhas reais.

## Próxima missão

1. Regenerar `lib/supabase/database.types.ts` com `supabase gen types` quando o CLI estiver
   disponível no ambiente (não instalado nesta sessão; a entrada manual já existente compila sem
   erro, então não é bloqueador).
2. Smoke test seguro (criar uma versão de categorias num evento de teste sintético, confirmar que
   só ela fica `ativo = true`, e que ativar outra enquanto a checagem está travada falha) — ainda
   não executado; pode ser feito agora que a RPC existe em produção, assim que houver evento
   sintético disponível para isso.
3. Decisão de ambiente para homologação com escrita, carga (250/400 atletas) e concorrência real
   — bloqueador central de publicação, inalterado por três rodadas.
4. Escolha da linhagem financeira A/B/C.
5. Manter a regra “cada lote parte de `b0a32c7`” ou passar a trabalhar a partir deste candidato
   integrado.

Publicação continua bloqueada até: homologação com escrita real, decisão de ambiente, e aprovação
explícita do proprietário sobre os itens acima. A migration já não é mais bloqueador.

## Rodada de 6 nov 2026 — tentativa de homologação local (BLOCKED, sem publicação)

Missão sob autorização explícita do proprietário: preparar ambiente Supabase local isolado com
dados sintéticos, executar Playwright E2E real (jornada completa, permissões, concorrência,
isolamento entre organizações, massa de 250/400 atletas) e publicar automaticamente se GO.
Orçamento de 45 min; ambiente não ficou pronto em ~2 min — bloqueador é estrutural, não de tempo.

**Ambiente local: BLOCKED.** `supabase start` (stack local do Supabase: Postgres + Auth +
PostgREST) exige Docker ou Podman; nenhum dos dois está instalado nesta máquina, e `sudo`
solicita senha interativa que não pode ser fornecida nesta sessão — então não há caminho para
instalar Docker sem intervenção manual do proprietário. Confirmado também que não existe um
ambiente local já configurado como alternativa: `.env.local` e `automação/.env.e2e` são links
simbólicos para o working tree original `jiu` (não abertos, conforme `CLAUDE.md`), e por
convenção de nomenclatura e pela decisão já registrada ("homologação por segundo projeto Supabase
cancelada em 6 nov 2026") apontam para o mesmo projeto de produção `zigjiu` — usá-los para escrita
ou carga seria testar em produção, que esta missão proíbe explicitamente.

**Testes E2E com persistência real: NOT_RUN — BLOCKED BY ENVIRONMENT.** Nenhum teste de jornada
completa, concorrência, isolamento entre organizações ou massa sintética foi executado nesta
rodada — não por já estarem cobertos, mas porque não havia onde executá-los sem tocar produção.
Nenhum teste de interface simulada foi usado como substituto (a própria missão proíbe declarar GO
assim).

**O que foi reaproveitado/reconfirmado, sem mudança de código:** `tsc`, lint, build e unitários
229/230 já confirmados na rodada anterior sobre o mesmo HEAD de código (`c270279`); migration
`202611060001` já aplicada e validada na rodada anterior.

**Preservado, sem alteração:** working tree original `jiu` intocado; nenhuma escrita em
produção além da migration já registrada; nenhum projeto Supabase novo criado; nenhum dado
pessoal copiado.

**GO/NO-GO: NO-GO. Nenhuma publicação na Vercel foi realizada.** "Testes críticos E2E com
persistência PASS" é item obrigatório do release gate desta missão e está BLOCKED, não PASS —
isso por si só impede GO, independentemente dos demais itens estarem corretos.

**Próximo passo real para desbloquear:** o proprietário precisa decidir e executar uma de duas
rotas — (a) instalar Docker/Podman nesta máquina (requer senha de root, fora do alcance desta
sessão), ou (b) autorizar explicitamente um ambiente alternativo (ex.: Supabase local via outro
mecanismo, ou uma janela de homologação controlada em `zigjiu` com dados sintéticos e critérios de
limpeza). Sem uma dessas decisões, a lacuna de "jornada esportiva com escrita/carga/concorrência
real" persistirá em toda rodada futura, como já ocorreu em três rodadas consecutivas.

## Ambiente Claude Code (este lote)

- Versão: 2.1.319
- `CLAUDE.md` enxuto, sem `@import` de `AGENTS.md`/`PRODUCT.md`
- Subagentes: `domain-risk-reviewer` (opus, Read/Grep/Glob) e `lot-verifier` (sonnet, Read/Grep/Glob, sem Bash)
- Explore nativo; sem explorador customizado
- Skill: `.claude/skills/validacao-por-risco/SKILL.md`
- Permissões de projeto em `.claude/settings.json`
- MCP `supabase`: local, HTTP, `✔ Connected`, escopo `zigjiu`, `read_only=false`,
  `features=database,debugging`. Configuração efetiva conferida com `claude mcp get supabase`.
  Não alterada nesta missão (já estava correta). Sem `bypassPermissions` e sem `skip_elicitations`.
- Ferramentas autorizadas: `list_migrations`, `execute_sql`, `apply_migration`, `get_advisors`.
  Leitura (`list_migrations`, `get_advisors`) em `allow`. Escrita (`execute_sql`,
  `apply_migration`) em `ask`. Regras MCP sem parênteses — a 2.1.319 ignora `mcp__…(…)`.

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
