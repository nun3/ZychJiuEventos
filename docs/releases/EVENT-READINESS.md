# MEU CAMP — Prontidão operacional para campeonato com mais de 150 atletas

**Branch candidata:** `integration/event-readiness-20261106`
**Worktree:** `/home/nune/Meus Projetos/jiu-event-readiness`
**HEAD nesta rodada:** `3ae0578`
**Referência de prioridade:** evento de 21/11/2026 — não é um limite para reduzir qualidade.
**Sem push, sem deploy, sem migration/escrita em `zigjiu`.**

Este documento é o relatório central do lote. Cada seção nova se soma às anteriores; não
reexecutar verificações já registradas aqui enquanto o código relevante não mudar.

---

## 1. Candidato integrado

| Merge | Commit | Conteúdo | Conflitos |
| --- | --- | --- | --- |
| 1 | `daa8f3e` | `qa/lots-2-3-4-integration` (dashboard, onboarding, perfis, autenticação, superfícies públicas) | nenhum |
| 2 | `00f46bc` | `feat/category-multi-select` (seleção múltipla de categorias, expansão U→M/F) | nenhum |

Base: `b0a32c7` (produção). `comm -12` confirmou conjunto de arquivos disjunto entre os dois
lotes antes de cada merge — nenhum merge trouxe resolução manual de conflito. As branches de
origem (`feat/category-multi-select`, `qa/lots-2-3-4-integration`, `feat/category-shared-mf`,
lotes 1–4 e 6) não foram alteradas; preservadas nos próprios worktrees.

Verificado após os dois merges, antes de qualquer correção nova:

| Checagem | Resultado |
| --- | --- |
| `tsc --noEmit` | PASS |
| `next lint` (projeto inteiro) | PASS — só o aviso pré-existente de `<img>` em `components/EventDetails.tsx` |
| `node --test automação/tests/*.test.ts` | 206/207 — 1 falha pré-existente não relacionada (ver §3) |
| `next build` | PASS |

---

## 2. Correções implementadas (criação de eventos)

Commit `a49d68f`. Reincorpora a correção local já preservada em backup (missão de 5 nov 2026,
`/home/nune/Meus Projetos/jiu-backups/post-backup-edits-20261105-234455/`), **sem** o rótulo
"Unissex (M/F)" que o Lote 5 já descartou — esse pedaço do backup foi propositalmente descartado,
não portado.

- **Gravação das fases:** se o insert de `event_phases` falha, o `delete` do evento agora verifica
  o próprio resultado. Se o delete também falhar, a mensagem diz que o rascunho pode ter
  permanecido, em vez de afirmar uma limpeza que não aconteceu.
- **Recuperação dos uploads:** `Promise.all` → `Promise.allSettled` no envio de
  banner/regulamento/tabela de peso. Antes, uma falha única em qualquer um dos três descartava os
  outros dois já enviados (o `catch` pulava a gravação das três URLs). Agora cada envio é
  independente; só o que falhou é reportado nominalmente, e o resto é preservado. Se a própria
  gravação das URLs falhar depois do upload (arquivo existe no Storage sem referência no evento),
  isso também é reportado como falha específica — não resolvido automaticamente.
- **Retry e duplicidade:** `createEvent` devolve `eventId` em qualquer falha pós-criação (fase
  perdida por delete falho, upload parcial), e `NewEventForm`/`configuracao/page.tsx` redirecionam
  para a configuração do rascunho com um aviso, em vez de deixar o organizador reenviar o
  formulário inteiro e arriscar um segundo evento.

**Não resolvido, por decisão explícita de escopo:** atomicidade de ponta a ponta (evento + fases +
arquivos numa transação só) exigiria uma função de banco com `SECURITY DEFINER` ou RPC — migration,
fora do autorizado nesta missão. Continua documentado como risco conhecido em `PRODUCT.md`.

---

## 3. Correção implementada (organização administrativa)

Commit `2f47bae`.

`getAuthenticatedOrganizationContext` buscava a filiação administrativa (owner/organizer) do
usuário com `.limit(1)` **sem `ORDER BY`**: com mais de uma filiação, a organização escolhida
dependia da ordem não garantida do PostgREST — não determinística, podia mudar entre chamadas.
Um usuário nessa situação podia criar um evento, categoria ou qualquer gravação administrativa na
organização errada sem perceber.

- A função agora busca **todas** as filiações administrativas e delega a escolha a
  `resolveAuthenticatedOrganizationContext` — a função pura já coberta por
  `organization-context.test.ts`, que até esta correção não era chamada pelo wrapper de servidor
  (a regra estava duplicada: uma versão testada e não usada, outra usada e sem teste).
- Sem `PUBLIC_ORGANIZATION_ID`, mais de uma filiação agora **falha fechado**
  (`status: 'unavailable', reason: 'ambiguous'`) em vez de escolher a primeira.
  `resolveOwnedOrganizationContext` já tinha essa regra; só ganhou o `reason` para o chamador
  distinguir "nenhuma filiação" de "ambígua".
- `createEvent` devolve uma mensagem específica quando a causa é ambiguidade, orientando a vincular
  a conta a uma organização só ou definir `PUBLIC_ORGANIZATION_ID`.

**Mudança de comportamento, registrada deliberadamente:** um teste existente
(`organization-context.test.ts`) chamava esse comportamento de "comportamento multi-organização
existente" e o travava como correto. Essa trava foi removida porque a missão pediu explicitamente
"não escolher organização arbitrariamente" — não é uma correção silenciosa de um teste que
discordasse sem motivo declarado.

**Verificação empírica, não só por leitura de código:** rodei os specs Playwright que autenticam
como o owner E2E e alcançam `/admin` depois desta mudança —
`category-version-ui.spec.ts` (2/2), `integration-lots.spec.ts` (7/8, 1 skip já conhecido) e
`auth-experience.spec.ts` (13/13) — todos PASS. Isso confirma que a conta de teste usada nesses
specs **não** tem filiação administrativa ambígua; não prova o mesmo para toda conta real. Uma
consulta agregada (`organization_members` agrupada por `user_id`, contando filiações
owner/organizer) teria confirmado isso com mais força, mas foi bloqueada pelo classificador de
permissão desta sessão para `execute_sql` contra `zigjiu`. **Pendência:** antes de confiar nesta
mudança em produção, confirmar por essa consulta (ou pelo painel) se algum operador real tem mais
de uma filiação administrativa sem `PUBLIC_ORGANIZATION_ID` — se tiver, essa pessoa deixa de
conseguir criar evento até a conta ser corrigida.

Testes atualizados para refletir o novo contrato (a trava antiga documentava a ambiguidade, não a
decisão correta): `automação/tests/organization-context.test.ts`,
`automação/tests/organization-membership.test.ts`.

---

## 4. Consolidação de categorias (herdado do lote anterior, revalidado e ampliado aqui)

`feat/category-multi-select` entrou por merge sem mudança de código nesta rodada; o que mudou
agora é a profundidade da validação — escala real (144 categorias), não só os 2-4 dos testes
anteriores:

| Item | Estado |
| --- | --- |
| Seleção múltipla e "selecionar todas" | PASS (Playwright, modo leitura) |
| Expansão U→M/F, mesmo `catalog_category_id` no par | PASS (unitário, inclusive com as 99 definições reais — `catalog-full-scale.test.ts`) |
| `ordem` do catálogo propagado (não mais fixo em 1) | PASS (unitário) — necessário para `categorize()`/`classifyFromCatalog` desempatarem corretamente com dezenas de categorias por versão; confirmado nas 144 categorias efetivas reais, não só em pares isolados |
| Sobreposição / fronteira entre classes de peso adjacentes | PASS (unitário, `catalog-full-scale.test.ts`) — peso exatamente no teto de uma classe cai nela, não na vizinha, em todo o catálogo real |
| Separação M/F absoluta | PASS (unitário, `catalog-full-scale.test.ts`) — testado nas 144 categorias reais, não só num par isolado |
| Uma única versão com todas as categorias selecionadas | PASS (unitário + leitura do código da action) |
| Compatibilidade com inscrição (`categorize()`, `resolvePublicCategory`, RPC) | Ambos os caminhos que leem `ordem` para desempatar — `categorize()` (evento) e `resolvePublicCategory`/`classifyFromCatalog` (pré-visualização pública) — validados por unitário na escala real (99 definições, 144 categorias efetivas); **a RPC `create_event_registrations` em si não foi exercitada contra banco** |
| Compatibilidade com checagem (`checagem/page.tsx`) | Validado por leitura: `categoryNames` é um `Map` chaveado por `event_categories.id` (não por `nome` nem por `catalog_category_id`), sem `.limit()` nem suposição de poucas categorias — não há risco de colisão ou truncamento com 144 linhas. Não coberto por teste automatizado direto (ver limitação abaixo) |
| Compatibilidade com chaves (`chaves/data.ts`) | Validado por leitura: `loadBracketPageData` só consulta categorias que já têm inscrição efetivada ou chave gerada (`athleteCountByCategory` + `bracket.category_id`), não todas as `event_categories` da versão ativa — o tamanho da versão (144) não entra na query. `buildBracketView` filtra tudo por `bracket.id`, sem suposição de quantidade. Não coberto por teste automatizado direto (ver limitação abaixo) |

**Limitação encontrada, não corrigida:** tentei exportar `buildBracketView` e testá-la
diretamente por unitário (incluindo um teste de volume com 150 brackets simultâneos, para
confirmar isolamento de dados entre categorias). O arquivo `chaves/data.ts` usa alias `@/*` e
`import 'server-only'`; `automação/tsconfig.json` não resolve esses alias em tempo de execução —
a mesma lacuna que já fazia `registration-correction.test.ts` falhar antes desta missão (não
introduzida aqui). Resolver exigiria adicionar `tsconfig-paths` como dependência de
desenvolvimento do `automação` — mudança de infraestrutura de teste, fora deste lote. A tentativa
foi revertida sem deixar diff; a validação de checagem/chaves ficou por leitura de código, não por
teste automatizado novo.

---

## 5. Testes executados nesta rodada

| Suíte | Comando | Resultado |
| --- | --- | --- |
| TypeScript | `tsc --noEmit` | PASS |
| Lint | `next lint` (projeto inteiro) | PASS (1 aviso pré-existente) |
| Unitários | `node --test automação/tests/*.test.ts` | **221/222** — 1 falha pré-existente (`registration-correction.test.ts`, alias `@/lib/supabase/database.types` não resolvido pelo `ts-node` isolado do `automação`; reproduzida de forma idêntica em todos os worktrees desta reconciliação, não introduzida por este lote; mesma causa-raiz documentada em §4 para `chaves/data.ts`) |
| Build | `next build` | PASS |
| Playwright — categorias | `playwright.categories.config.ts` | 2/2 PASS |
| Playwright — integração lotes 2/3/4 | `playwright.integration.config.ts` | 7/8 PASS, 1 skip (staff dedicado — `E2E_STAFF` ainda não configurado, limitação já conhecida) |
| Playwright — autenticação | `playwright.auth.config.ts` | 13/13 PASS |
| Responsividade | incluída nos specs acima | 1440/768/390/320 sem overflow horizontal |
| Permissões | incluída no spec de integração | visitante recusado em rotas privadas; sem vínculo não permanece em `/admin` |

**NOT_RUN — BLOCKED BY ENVIRONMENT** (não impossível em definitivo; reabre com nova decisão de
ambiente, não com mais esforço de código):

- `@write`/`@full-event`/`@homologation` (BDD, Playwright): não executados. `.env.local` desta
  sessão aponta para `zigjiu`, e essas suítes escrevem de verdade quando `E2E_ALLOW_WRITES=true` —
  rodá-las aqui arriscaria escrita em produção. A estratégia de projeto independente que serviria
  de alvo seguro foi cancelada em 6 de novembro de 2026 (ver §6).
- Carga sintética de 250 e 400 atletas: o gerador existe (`independent-homologation-fixtures.ts`,
  §6, preservado mas não vigente) — não há ambiente seguro para executá-lo.
- Concorrência progressiva: o mesmo gerador aceita `--concurrency=N`, mas nenhuma execução real
  aconteceu nem vai acontecer sem um ambiente aprovado. Nenhum número de desempenho deste lote é
  real; não inventar nenhum.
- Jornada esportiva completa (inscrição → checagem → pesagem → chave → resultado) com escrita e
  com o catálogo de 144 categorias: não exercitada contra banco nesta rodada, pelo mesmo bloqueio.

---

## 6. Homologação independente — CANCELADA em 6 de novembro de 2026

**A decisão abaixo foi revogada pela diretriz "MEU CAMP — CORREÇÃO IMEDIATA DE DIRETRIZ" (6 de
novembro de 2026, mesmo dia).** Não haverá um segundo projeto Supabase nesta etapa. O único
projeto é `zigjiu` / `kfvypacjzlzwwblsbpwj`, Plano Pro, com a estratégia de manter backups e
seguir o desenvolvimento sem ambiente remoto adicional.

Nenhum recurso remoto chegou a ser criado: o guard (`independent-homologation-guard.ts`) só
permite escrita com variáveis `HOMOLOG_*` que nunca foram preenchidas, e a única execução do
gerador (`independent-homologation-fixtures.ts`) rodou sem `--execute` e sem credenciais — parou
na guarda de ambiente antes de qualquer chamada de rede. Nenhum segundo MCP do Supabase foi
configurado.

**Backup automático no Pro — verificação tentada, sem resultado novo.** O MCP do Supabase desta
sessão continua escopado a um único projeto, sem as 10 ferramentas de conta/billing que listam
backups (`list_projects`, `get_project`, `get_cost` etc. — nenhuma delas está no meu conjunto de
13 ferramentas, como já relatado antes desta missão). Não há como confirmar por aqui, em leitura,
se um backup automático já foi concluído desde a atualização para o Pro. Continua exigindo o
painel: **Database → Backups → Scheduled** no projeto `kfvypacjzlzwwblsbpwj`.

Os arquivos abaixo (commit `5a536a7`) são preservados como registro técnico e permanecem no
repositório, mas **não devem ser usados** até uma decisão em contrário:

- `automação/tests/support/independent-homologation-guard.ts`
- `automação/tests/independent-homologation-guard.test.ts`
- `automação/scripts/independent-homologation-fixtures.ts`
- `automação/.env.homologation.example`

A seção original, mantida abaixo só como histórico do que foi preparado:

### 6.0 (histórico, não vigente) Homologação independente — scripts preparados

**Objetivo:** permitir testar RPCs, inscrições, falhas parciais e concorrência sem tocar `zigjiu`.
Nada aqui foi executado contra um banco real nesta sessão — só preparado.

### 6.1 O que já existia (e por que não serve para isto)

`automação/tests/support/homologation-guard.ts` e o par `full-event-journey.ts` /
`homologation-journey.ts` já existem, mas `assertHomologationEnvironment` **exige** que o host
seja exatamente `kfvypacjzlzwwblsbpwj.supabase.co` — ou seja, esse arsenal homologa escrevendo no
próprio `zigjiu` (que hoje é sandbox e produção ao mesmo tempo, risco já registrado na preparação
técnica de 5 de novembro). Não foi reaproveitado para isolamento porque faz exatamente o oposto do
pedido aqui.

### 6.2 Novo: guarda para projeto independente

`automação/tests/support/independent-homologation-guard.ts` — espelha o guard existente, mas com a
checagem invertida: **recusa** se o host apontado for o de `zigjiu`. Lê variáveis com nomes
próprios (`HOMOLOG_SUPABASE_URL`, `HOMOLOG_SUPABASE_SERVICE_ROLE_KEY`, `HOMOLOG_ALLOW_WRITES`),
nunca `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SECRET_KEY`. Coberto por
`automação/tests/independent-homologation-guard.test.ts` (6/6 PASS, unitário puro).

### 6.3 Sequência de schema para o projeto independente

Reconstituída a partir do próprio repositório — sem acessar `zigjiu` para isto, só os arquivos já
commitados:

1. As 5 migrations iniciais, na ordem do nome do arquivo:
   `202608270001_initial_domain.sql`, `202609030002_backfill_auth_profiles.sql`,
   `202609030003_athlete_update_audit.sql`, `202609040001_event_status_transitions.sql`,
   `202609040002_event_storage.sql`.
2. Os 8 catch-ups, na ordem em que suas versões foram aplicadas em `zigjiu` (confirmado via
   `list_migrations` do MCP do Supabase nesta sessão):
   `2026-10-31_registration_creation_catchup.sql`,
   `2026-10-31_registration_allocation_catchup.sql`,
   `2026-10-31_payments_catchup.sql`,
   `2026-10-31_checkin_shared_dependencies.sql`,
   `2026-11-01_brackets_catchup.sql`,
   `2026-11-01_schedule_catchup.sql`,
   `2026-11-01_live_catchup.sql`,
   `2026-11-02_auth_registration_fix.sql`.
3. **Achado, não documentado antes:** `supabase/migrations/202610100002_sport_category_catalogs.sql`
   (cria `sport_category_catalogs`/`sport_category_definitions` e semeia as 99 definições) **não
   aparece nos 13 itens de `list_migrations`**, mas as tabelas e os dados existem em `zigjiu`
   (confirmado por leitura nesta sessão e pelo diagnóstico do Lote 5). Ou foi aplicado fora do
   fluxo de migration rastreado pelo Supabase CLI (por exemplo, direto no SQL Editor), ou há uma
   lacuna na minha reconstituição. Tratar como um 14º passo obrigatório, aplicado por último.
   **Não confiar cegamente nesta sequência:** ela não foi comparada byte a byte com o schema real
   de `zigjiu` (exigiria `pg_dump --schema-only` de ambos os lados, não disponível nesta sessão).
   Antes de homologar de verdade, rodar essa comparação.
4. `supabase/patches/2026-10-31_schema_inventory.sql` é só leitura (diagnóstico) — não é um passo
   de schema, não aplicar.

Nenhum desses 14 passos foi aplicado a nenhum projeto nesta sessão.

### 6.4 Novo: gerador de fixtures sintéticas

`automação/scripts/independent-homologation-fixtures.ts`. Resumo:

- Nunca escreve sem `HOMOLOG_ALLOW_WRITES=true` e sem que o host seja explicitamente diferente de
  `zigjiu` (via o guard de §6.2). Modo padrão é leitura (`--execute` para escrever de verdade).
- `--athletes=N` (1–2000) distribui atletas sintéticos por **todas** as definições do catálogo
  publicado no alvo, com idade/faixa/peso plausíveis dentro dos limites de cada definição — exerce
  o caso "selecionar todas" (até 144 categorias efetivas) do G2.
- Cria organização, evento, fases e a versão de categorias completa pelo mesmo caminho de dados
  que a action de produção (`expandCatalogSelectionToCategoryRows`, importado diretamente — não
  reimplementado).
- Inscreve os atletas via `create_event_registrations`, a mesma RPC de produção, em lotes de
  `--concurrency=N` concorrentes, registrando sucesso/falha e duração de cada chamada num relatório
  JSON (`docs/releases/evidencias/homologation-<runId>.json`) — sem simular nem estimar números.
- Nomes, e-mails e organização claramente sintéticos (`MC-HOMOLOG …`, e-mail `@example.invalid`).
  Nenhum dado real é copiado — não há caminho no script que leia de `zigjiu`.

Testado nesta sessão: só o smoke de compilação e o bloqueio correto sem credenciais (`ts-node`
rodou o arquivo inteiro e parou na guarda, como esperado). **Execução real: NOT_RUN**, sem projeto
provisionado.

### 6.5 Próximo passo concreto, quando houver autorização

1. Criar o projeto Supabase descartável (exige autorização — "criação de projetos pagos").
2. Aplicar a sequência de 14 passos do §6.3, depois comparar schema com `zigjiu` antes de confiar.
3. Copiar `automação/.env.homologation.example` para `automação/.env.homologation`, preencher.
4. `HOMOLOG_ALLOW_WRITES=true npx ts-node scripts/independent-homologation-fixtures.ts --execute --athletes=250`,
   depois `--athletes=400`, depois com `--concurrency` crescente, registrando os relatórios JSON
   gerados.

**(Fim do histórico não vigente — ver §6 acima.) Esses quatro passos não devem ser seguidos.**

---

## 7. Estado de prontidão para um campeonato de mais de 150 atletas

| Dimensão | Estado |
| --- | --- |
| Criação de evento | Mais resiliente (fases, uploads, retry) nesta branch candidata; **não publicada, não homologada com escrita** |
| Categorias | Tabela completa possível numa só versão; classificação (`categorize()`), ordem, sobreposições e separação M/F validados na escala real (144 categorias) por unitário; **RPC, checagem e chaves com 144 categorias ainda não exercitadas contra banco** |
| Organização administrativa | Deixa de escolher arbitrariamente; **não confirmado se algum operador real é afetado** |
| Dashboard, autenticação, superfícies públicas | Mesma cobertura já validada nos Lotes 2/3/4/6, revalidada aqui |
| Carga (250/400 atletas, concorrência) | **NOT_RUN — BLOCKED BY ENVIRONMENT** — a estratégia de projeto independente foi cancelada em 6 de novembro; sem um segundo ambiente, não há onde rodar carga ou concorrência sem risco à produção. Não é impossível em definitivo: uma nova decisão de ambiente reabre o caminho |
| Jornada esportiva ponta a ponta com escrita | **NOT_RUN — BLOCKED BY ENVIRONMENT**, pelo mesmo motivo |
| Financeiro | Fora de escopo deste lote — linhagem A provisória, conforme decisão já registrada |

**Backup como estratégia vigente:** a diretriz de 6 de novembro define manter backups no Pro do
`zigjiu` em vez de um ambiente separado. A existência de um backup **não** torna `zigjiu` seguro
para testes destrutivos — restaurar um backup é recuperação, não isolamento. Nenhum teste de
escrita, RPC ou concorrência passa a ser seguro só por o Pro existir.

**Isto não é homologação operacional.** É o estado do candidato de código, testado estaticamente e
com os specs Playwright de leitura que já existiam. A frase do `AGENTS.md` sobre não confundir
implementação com homologação se aplica integralmente aqui.

---

## 8. Próxima atividade que pode ser executada automaticamente

**Concluído nesta rodada:** `categorize()` e `resolvePublicCategory`/`classifyFromCatalog`
validados na escala real das 99 definições / 144 categorias efetivas (§4), incluindo fronteiras
de peso e separação M/F. A tentativa de testar `chaves/data.ts` por unitário esbarrou numa lacuna
de infraestrutura de teste já existente antes desta missão (§4) — não corrigida, por ser maior que
este lote.

**Sem depender de autorização nova, ainda não feito:** revisar `EventCategoriesPreview.tsx` e a
listagem pública de categorias em `app/eventos/[id]/page.tsx` quanto à leitura com até 144 linhas
— o Lote 5 já registrou como limitação conhecida que essas telas "não foram redesenhadas para até
144 linhas". Isso é sobre leiturabilidade/UX da tela, não correção; dá para avaliar por leitura de
código e, se necessário, com teste de snapshot/Playwright sem escrita.

**Bloqueado por decisão/autorização que só você pode dar:**

1. ~~Autorizar a criação do projeto Supabase descartável~~ — **cancelado em 6 de novembro de
   2026.** Carga, concorrência e jornada esportiva com escrita permanecem
   **NOT_RUN — BLOCKED BY ENVIRONMENT**: não impossíveis em definitivo, mas sem um ambiente seguro
   aprovado para executá-las. Reabrir exige uma nova decisão sua sobre ambiente, não mais código.
2. Confirmar se algum operador real tem filiação administrativa ambígua (§3) antes de levar a
   correção adiante — ou autorizar a consulta `execute_sql` bloqueada pelo classificador desta
   sessão.
