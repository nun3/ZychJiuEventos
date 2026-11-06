# RECONCILIATION LOT 5 — IMPLEMENTAÇÃO

Data: 6 nov 2026

Branch: `feat/category-shared-mf`
Worktree: `/home/nune/Meus Projetos/jiu-category-mf`
Base: `3de52c0bb9db5b38418137f783fc2a18842ff865` (`b0a32c7` + `PRODUCT.md`)

Veredito: **LOT 5 — PASS WITH LIMITATIONS**

A expansão da definição compartilhada está implementada e testada no contrato do cliente. A gravação continua em passos separados. Não houve escrita em `zigjiu`.

## Hashes

| Commit | Hash | Tree |
| --- | --- | --- |
| Implementação | `249c2686a06ea82f2586cd53033a37bce695c6aa` | `673497285d2c8aae206dee872a2ab1bf27c9c77d` |
| Testes | `06c2d5b879dd196e54e8a64bb95755debbfeac91` | `0b4b619bdd59863fdb5964712b890f9b8c9284e7` |
| Relatório | `e0a631e098b24f5623ee9b0ed96af1aa74253e13` | `020f1834987fac3ed6a1053bf1f2ce7d6876aada` |

O hash do commit que acrescenta esta linha não entra na tabela: ele apontaria para si mesmo. A validação de TypeScript e dos 29 testes foi repetida no checkout limpo de `e0a631e`.

## O que entrou

Implementação (`249c268`):

- `lib/events/catalog-category-sync.ts`
- `app/admin/eventos/actions.ts`
- `app/admin/eventos/[id]/(operacao)/configuracao/CategoryManager.tsx`
- `app/admin/eventos/[id]/(operacao)/configuracao/page.tsx`
- `components/events/public-event/EventCategoriesPreview.tsx`

Testes (`06c2d5b`):

- `automação/tests/catalog-category-sync.test.ts`
- `automação/tests/categorization.test.ts`
- `automação/playwright.categories.config.ts`
- `automação/tests/category-version-ui.spec.ts`

Fora deste lote: catálogo oficial, migrations, RPCs, `lib/categorization.ts`, pagamentos, autenticação e o diff local que faz `categorize()` aceitar categoria `U` para atleta `M` ou `F`. `git diff b0a32c7` nesses caminhos permaneceu vazio.

## Persistência

`createCategoryRuleSet` continua em chamadas independentes:

1. insere `category_rule_sets` inativo;
2. insere as categorias efetivas;
3. desativa as outras versões do evento;
4. ativa a versão nova.

O passo 2 envia as linhas num único `.insert(array)`. No PostgREST isso é uma sentença SQL: as duas linhas entram juntas ou nenhuma entra. Não é uma transação que cubra os quatro passos. Este lote não declara atomicidade de ponta a ponta.

Definição `U`:

- a validação mantém idade, faixa e peso do catálogo;
- o resultado é um lote `M` e `F`, com o mesmo `catalog_category_id`, a mesma duração e nomes distintos (`… Masculino` e `… Feminino`);
- o gênero `U` não é gravado como categoria efetiva.

Definição `M` gera só `M`. Definição `F` gera só `F`.

Se o insert das categorias falha, o código apaga a versão vazia. Se esse delete também falha, a mensagem é: `Não foi possível cadastrar as categorias. A versão vazia pode ter permanecido inativa.` Não existe criação parcial de um sexo só dentro dessa sentença.

O retry chama de novo a criação da versão. O lote reconstruído traz `M` e `F`. Não completa um sexo faltante. Não há chave de idempotência: dois envios concorrentes podem criar duas versões. O `submitLock` do formulário só impede o segundo clique na mesma aba, e só depois que a validação passa.

Se a desativação ou a ativação falha, a resposta continua `A versão foi criada, mas não pôde ser ativada.` As categorias já gravadas não são apagadas. Apagá-las depois de desativar a versão anterior poderia deixar o evento sem versão ativa. Esse comportamento já existia e não foi transformado em rollback.

A duração usa `set_event_category_duration` com o id de uma categoria. A RPC não foi alterada. Editar uma categoria não escreve na outra.

`categorize()` publicado compara gênero por igualdade. Uma categoria gravada como `U` não recebe atleta `M` nem `F`. As categorias efetivas `M` e `F` separam meninos e meninas, inclusive dos 4 aos 13 anos. Atleta `O` continua sem categoria. A RPC de inscrição não foi executada.

## Evidência

Checkout do commit de testes, com `PRODUCT.md` ainda sujo e sem efeito no compilador:

- `tsc --noEmit`: exit 0
- `next lint` em `app/admin/eventos`, `lib/events` e `components/events/public-event`: sem avisos
- `node --test` de `catalog-category-sync`, `categorization` e `category-resolver`: 29 passed, 0 failed
- `next build`: exit 0, Next.js 14.2.35. A rota `ƒ /admin/eventos/[id]/configuracao` ficou em 6,54 kB. O aviso pré-existente de `<img>` em `components/EventDetails.tsx` permanece. O build usado no browser carregou `.env.local`; um build anterior, sem essas variáveis, não hidratava o login e foi descartado.

Playwright `playwright.categories.config.ts`, `next start` em `http://127.0.0.1:3045`, 1 passed em 13,8 s:

- login do owner de leitura;
- abertura de uma configuração existente;
- ausência da opção `Unissex (M/F)`;
- seleção de `Parâmetros compartilhados` e texto das duas categorias efetivas;
- botão `Criar versão` visível e não acionado;
- sem overflow horizontal em 1440×900 e 390×844.

O servidor em 3045 foi encerrado. Não houve `db push`, migration, deploy, push nem escrita em `zigjiu`.

## Limitações

- A falha do insert, a compensação e o retry foram provados no contrato das funções e na leitura da action. Não houve banco descartável executando o insert e o delete.
- A ativação continua fora da sentença das categorias.
- O duplo envio entre abas ou clientes não é idempotente.
- A edição de duração e a inscrição nas categorias efetivas não foram reexecutadas contra o banco. A classificação foi coberta por `categorize()` em memória.
- A tela foi verificada sem gravar versão.

## Estado

A alternativa A está nesta branch e não está no deployment `b0a32c7`. O working tree original `wip/local-pre-reconcile-20261019` não recebeu estes commits. O diagnóstico `docs/repository/RECONCILIATION-LOT-5-DIAGNOSIS.md` continua só nesse working tree.
