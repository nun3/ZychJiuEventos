# MEU CAMP — Lote 5, seleção múltipla do catálogo (montagem da tabela)

**Veredito:** **PASS WITH LIMITATIONS**
**Data:** 6 de novembro de 2026

Implementação isolada, a partir de `feat/category-shared-mf`, da montagem da tabela de
categorias por seleção múltipla de definições oficiais do catálogo — o bloqueio identificado
na preparação técnica de 5 de novembro de 2026 para o primeiro campeonato real. Sem push, sem
deploy, sem migration e sem escrita em `zigjiu`.

## Branch e worktree

| Item | Valor |
| --- | --- |
| Worktree | `/home/nune/Meus Projetos/jiu-category-multi` |
| Branch | `feat/category-multi-select` |
| Base | `feat/category-shared-mf` @ `8073090` (Lote 5 original, preservado sem alteração) |
| Commits novos | `550732a` (implementação), `e20685f` (testes) |
| HEAD | `e20685f` |
| Push | não executado |

## Decisão de produto aplicada

Decisão aprovada em 6 de novembro de 2026 (mensagem "MEU CAMP — DECISÕES E PRÓXIMA MISSÃO"):

- seleção múltipla de definições oficiais, com "Selecionar todas";
- uma única versão armazena todas as categorias efetivas selecionadas;
- `U` expande para `M` e `F`, sem mistura automática de sexo (decisão já vigente em `PRODUCT.md`
  e no diagnóstico do Lote 5);
- catálogo, idade, faixa, peso e duração preservados — nada reescrito por digitação manual;
- sem geração automática da quantidade teórica máxima (144): "Selecionar todas" é ação explícita
  do organizador, não comportamento padrão.

## O que entrou

Implementação (`550732a`):

- `lib/events/catalog-category-sync.ts` — `expandCatalogSelectionToCategoryRows`,
  `definitionNeedsOverride`, `CatalogSelectionOverride(s)`; `effectiveCategoryName` exportada
  (reaproveitada, não duplicada).
- `app/admin/eventos/actions.ts` — nova action `createCategoryRuleSetFromCatalog`;
  `persistNewCategoryVersion` extraída de `createCategoryRuleSet` para que as duas actions
  compartilhem a mesma criação de versão, inserção em lote, compensação e ativação.
- `CategoryManager.tsx` — duas abas: **Selecionar do catálogo** (nova, padrão quando há
  catálogo oficial) e **Categoria customizada** (fluxo existente do Lote 5, DOM e comportamento
  inalterados, só realocado para dentro da aba).

Testes (`e20685f`):

- `automação/tests/catalog-category-sync.test.ts` — 7 testes novos.
- `automação/tests/category-version-ui.spec.ts` — spec existente migrada para a aba
  "Categoria customizada" (preservada) + spec nova de seleção múltipla.

Fora deste lote: catálogo oficial, migrations, RPCs, `lib/categorization.ts`, pagamentos,
autenticação. `git diff feat/category-shared-mf` nesses caminhos permanece vazio.

## Achado corrigido: `ordem` fixo quebraria o desempate de `categorize()`

`event_categories.ordem` não é decorativo: `categorize()` (`lib/categorization.ts:19`) e
`classifyFromCatalog` (`lib/events/category-resolver.ts:245`) usam
`matches[1]?.ordem === matches[0].ordem` para recusar como "ambígua" uma categorização em que
duas categorias da mesma versão, do mesmo gênero, se sobrepõem — e usam o menor `ordem` para
escolher entre elas quando não há empate. `buildCategoryVersionRows` (fluxo customizado, Lote 5
original) sempre gravava `ordem: 1`, o que nunca importava porque cada versão carregava no
máximo uma definição (1 ou 2 linhas, nunca do mesmo gênero).

Com seleção múltipla, uma versão passa a ter dezenas de categorias. Se todas saíssem com
`ordem: 1`, qualquer sobreposição acidental de faixas (mesmo não existindo hoje no catálogo
publicado — a semente usa `peso_min = peso_max anterior + 0,1`, sem sobreposição) se tornaria
uma falsa ambiguidade em vez de ser resolvida corretamente. `expandCatalogSelectionToCategoryRows`
propaga o `ordem` do próprio catálogo (`sport_category_definitions.ordem`, não nulo e único por
definição) para cada linha gerada, preservando o contrato de desempate tal como já funciona para
`classifyFromCatalog`. O fluxo customizado (`buildCategoryVersionRows`) não foi alterado.

## Verificações

Checkout limpo deste commit (`e20685f`), com `node_modules` e `.env.local` symlinkados do
working tree principal, como nos demais worktrees de reconciliação.

| Checagem | Resultado |
| --- | --- |
| `tsc --noEmit` | PASS |
| `next lint` em `app/admin/eventos`, `lib/events`, `components/events/public-event` | PASS, sem avisos |
| `node --test` em `automação/tests/*.test.ts` (201 testes) | **200 passed, 1 failed** — falha pré-existente e não relacionada (`registration-correction.test.ts`, alias `@/lib/supabase/database.types` não resolvido pelo `ts-node` isolado do `automação`; reproduzida de forma idêntica no worktree original do Lote 5 sem nenhuma mudança deste lote) |
| `next build` | PASS — rota `/admin/eventos/[id]/configuracao` em 9,01 kB |
| Playwright `playwright.categories.config.ts`, `next start -p 3046`, 2 specs | **2/2 PASS** |

Cobertura dos 7 testes unitários novos: seleção vazia recusada; seleção parcial de duas
definições compartilhadas (4 categorias efetivas, `ordem` do catálogo propagado, mesmo
`catalog_category_id` por par M/F); definições M e F não se misturam; "selecionar todas" com
divisão sem teto exige idade máxima e peso máximo informados; teto abaixo do mínimo do catálogo
recusado; nomes duplicados recusados antes do insert; `definitionNeedsOverride` correto para as
três formas de definição (com teto, sem idade máxima, sem nenhum teto).

Cobertura dos 2 specs Playwright, autenticados como owner de leitura, sem submeter o
formulário — não grava em `category_rule_sets` nem em `event_categories`:

1. Aba "Categoria customizada": mesmas asserções do Lote 5 original (sem opção "Unissex (M/F)",
   definição compartilhada mostra o aviso de duas categorias efetivas), sem overflow horizontal
   em 1440×900 e 390×844.
2. Aba "Selecionar do catálogo" (padrão): "Nenhuma categoria selecionada" inicialmente; seleção
   parcial atualiza o resumo; "Selecionar todas" marca as 99 definições e, por existir classe
   sem teto no catálogo, mostra o aviso de idade/peso pendente em vez de inventar um valor;
   desmarcar volta ao estado vazio; marcar uma classe sem teto de peso revela o campo "Peso
   máximo" exigido; sem overflow horizontal em 1440×900 e 390×844.

## Persistência — **NOT_RUN**

Sem Docker, Supabase CLI nem `psql` disponíveis nesta sessão (`command -v supabase docker psql`
não encontrou nenhum). Por decisão already aprovada, não usar `zigjiu` nem produção para este
teste. Portanto, os seguintes contratos foram verificados apenas no código (tipos, validação e
leitura das definições de `category_rule_sets`/`event_categories`/triggers), não contra um banco
real:

- inserção em lote de até 144 linhas numa sentença só (`event_categories` sem `UNIQUE` em
  `catalog_category_id`; trigger `enforce_event_category_catalog_mapping` só confere o catálogo
  da definição, não o `genero`);
- unicidade de nome por `UNIQUE (rule_set_id, nome)` — a recusa antecipada no cliente/action
  evita a maioria dos casos, mas o 23505 do Postgres continua como última linha de defesa, não
  testada aqui;
- compensação de insert parcial (reaproveita `categoryInsertCompensation`, já coberta por teste
  de unidade, não por um insert real que falhe);
- ativação/desativação da versão nova (mesmo caminho do Lote 5 original, não re-executado contra
  banco);
- requisições concorrentes: sem chave de idempotência, como no Lote 5 original — dois envios
  simultâneos continuam podendo criar duas versões; `submitLock` só impede o duplo clique na
  mesma aba. Limitação conhecida, não corrigida neste lote (fora do pedido de implementação).
- preservação de inscrições e chaves de versões anteriores: por construção, já que
  `persistNewCategoryVersion` só marca `ativo=false` na versão antiga — não apaga
  `category_rule_sets` nem `event_categories` — e `registrations.current_category_id` referencia
  `event_categories` com `on delete restrict`. Esse comportamento é idêntico ao já existente em
  `createCategoryRuleSet`; não há caminho novo de exclusão neste lote.

## Limitações conhecidas

1. Persistência contra banco real: **NOT_RUN** (sem ambiente isolado disponível nesta sessão).
2. Sem chave de idempotência entre requisições concorrentes (limitação herdada, não deste lote).
3. A tabela "Versões cadastradas" e a pré-visualização pública de categorias
   (`EventCategoriesPreview.tsx`) não foram redesenhadas para até 144 linhas — fora do pedido
   desta missão, que era montar a versão, não redesenhar as telas de leitura.
4. O teto operacional (idade máxima / peso máximo) para divisões sem limite no catálogo é
   informado por definição, não por "selecionar todas" de uma vez — intencional, para não
   inventar um valor único que sirva para idades e pesos muito diferentes dentro da mesma
   seleção.
5. O `categorize()` publicado (`b0a32c7`) e o fluxo de inscrição (RPC `create_event_registrations`)
   não foram alterados nem reexecutados contra banco.

## Plano de homologação isolada

Antes de qualquer escrita real:

1. Provisionar um projeto Supabase descartável (ou Supabase local via Docker, quando disponível
   neste ambiente) com o schema de `zigjiu` aplicado até `20261102034621`, sem dados reais.
2. Rodar `createCategoryRuleSetFromCatalog` com: uma definição só; "selecionar todas" (99
   definições, 144 categorias efetivas); uma seleção com definições de divisões sem teto,
   confirmando a recusa sem override e o sucesso com override.
3. Confirmar no banco: `UNIQUE (rule_set_id, nome)` nunca estourado pela seleção legítima;
   `event_categories.ordem` igual ao `sport_category_definitions.ordem` de origem; exatamente
   uma versão `ativo=true` por evento ao final.
4. Exercitar falha parcial forçando um erro no insert (por exemplo, revogando `insert` por um
   instante) e confirmar a compensação e a mensagem.
5. Disparar dois envios concorrentes da mesma versão e registrar o comportamento observado
   (duas versões, como já documentado) — sem tentar corrigir aqui, só confirmar que o risco
   conhecido se mantém como descrito.
6. Só então, com evidência de escrita no ambiente isolado, considerar este lote elegível para
   publicação — sujeito à mesma sequência de reconciliação (branch → integração com os Lotes
   2/3/4/6 → decisão de push) já registrada em `docs/repository/RECONCILIATION-PLAN.md`.

## Preservação

- `feat/category-shared-mf` @ `8073090`: inalterada.
- Working tree original `wip/local-pre-reconcile-20261019`: não recebeu estes commits.
- As três edições locais de `createEvent`/`NewEventForm`/`configuracao/page.tsx` identificadas
  na preparação técnica de 5 de novembro permanecem fora deste lote (G1 as preservou em backup
  separado, sem tocar no working tree original).
- Sem push, sem deploy, sem `zigjiu`, sem `jiu-live`, sem `homework`.
