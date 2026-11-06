# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Stage

O Meu Camp está em consolidação técnica, reconciliação de código e preparação para o primeiro campeonato real. Ainda não está operacionalmente liberado para esse campeonato.

Cinco situações abaixo não são equivalentes:

- **Implementada:** o comportamento existe no código publicado, no schema já aplicado em `zigjiu`, ou em código local identificado — working tree ou branch — ainda não publicado. Implementada não significa publicada.
- **Testada:** houve verificação automatizada ou smoke no escopo e no ambiente citados. Teste de branch ou de localhost não testa a produção.
- **Publicada:** está no deployment descrito em `docs/repository/PRODUCTION-MANIFEST.md`. Neste registro, isso é o commit `b0a32c7`, no domínio https://jiu-three.vercel.app. O working tree local, branches sem push e o `origin/master` não são essa publicação. O GitHub não é a fonte do que está no ar.
- **Homologada:** o fluxo foi exercitado de ponta a ponta, com escrita, no ambiente alvo, e o veredito ficou registrado. O ciclo de 5 de novembro de 2026 não reexecutou homologação com escrita, cobranças Asaas nem migrations.
- **Operacionalmente liberada:** a capacidade pode sustentar o campeonato real, com pagamento, reconciliação e riscos conhecidos aceitos. Isso não aconteceu.

Não há evidência técnica de operação offline. A frase de resiliência do `AGENTS.md` não é funcionalidade entregue.

## Users

Prioridade operacional: o organizador, principalmente no dia da competição, quando o trabalho é inscrição, checagem, chaves e fechamento.

Cada interface prioriza a tarefa de quem a utiliza. A tela do professor serve o professor; a do responsável, o responsável; a do atleta, o atleta; a pública, o visitante. A prioridade do organizador não apaga a tarefa dessas telas. Ela decide o conflito quando a operação do dia da competição e outra tarefa não cabem juntas.

Os papéis existentes no escopo funcional são administrador da plataforma, organizador, professor, responsável, atleta e público. Fonte dos papéis: `docs/escopo_funcional_plataforma.md`. Esse documento descreve o escopo; não prova sozinho o que está publicado ou liberado.

## Product Purpose

O Meu Camp organiza, gerencia e opera competições. A primeira modalidade é o Jiu-Jitsu. A plataforma deve poder abrigar outros esportes de combate depois. Sucesso nesta fase é chegar ao primeiro campeonato real com o que está publicado, testado e ainda não liberado separado com clareza.

## Positioning

Decisão em aberto. Não há diferencial de mercado confirmado. Trabalho futuro não inventa um.

## Operating Context

No dia do evento, o organizador precisa conferir inscrições, checagem, chaves e fechamento. Fora desse momento, o produto também prevê criação do evento, inscrição pelo professor, pelo responsável ou pelo próprio atleta maior, pagamento e consulta pública do evento publicado.

Esses contextos descrevem o uso pretendido. A seção de capacidades diz o que está implementado, publicado e ainda não liberado.

## Capabilities and Constraints

A inscrição não escolhe a categoria. Quem grava a categoria é a RPC `create_event_registrations`, por idade, sexo, faixa e peso. O formulário só mostra o encaixe.

Pagamento, autenticação, RLS e Server Actions seguem o fluxo publicado. Não se inventa estado, permissão, tabela ou regra de categoria que o domínio ainda não tenha. Não se promove o working tree como se fosse o deployment.

| Fluxo | O que está comprovado | O que não está |
| --- | --- | --- |
| Eventos | Criação, fases e publicação existem no código de `b0a32c7`. | A gravação publicada não é uma transação única. Homologação com escrita não foi reexecutada em 5 nov 2026. Não está operacionalmente liberada. |
| Inscrições | A criação por RPC e o catch-up `20261031031613` constam do histórico aplicado em `zigjiu`. O ciclo de 5 nov abriu o formulário público sem finalizá-lo. | Não houve homologação com escrita nesse ciclo. |
| Pagamentos | Produção está na linhagem A: webhook com `ASAAS_WEBHOOK_TOKEN` único, settlement com host de production (`cf1dd82`) e checkout sob `PAYMENTS_MANUAL_ONLY`. O catch-up `20261031033850` já estava aplicado. A auditoria de 5 nov leu o financeiro e não criou cobrança. | A escolha entre as linhagens A, B e C não foi feita. Cobrança real não foi homologada nessa auditoria. Não está operacionalmente liberada. |
| Categorias | Catálogo, conjunto ativo e alocação automática estão no contrato publicado. A alternativa A está aprovada: cada definição `U` usada gera duas categorias efetivas, `M` e `F`, sem mudar o catálogo oficial nem exigir migration. | Essa expansão ainda não foi implementada. O `categorize()` local que aceita `U` para `M` e `F` não está publicado. |
| Checagem | Catch-up `20261031041750` aplicado. A superfície autenticada entrou na leitura de produção de 5 nov. | Sem homologação com escrita nesse ciclo. |
| Programação | Catch-up `20261102022207` aplicado. A superfície entrou na leitura de produção de 5 nov. | Sem homologação com escrita nesse ciclo. |
| Chaves | Catch-up `20261102020714` aplicado. A superfície pública e a autenticada entraram na leitura de 5 nov. | Sem homologação com escrita nesse ciclo. |
| Operação LIVE | Catch-up `20261102023724` aplicado. O shell visual está em `b0a32c7`. O ciclo de 5 nov exercitou entrada e saída em leitura. | Isso não é um campeonato real conduzido no LIVE. |
| Resultados | A superfície pública e a autenticada entraram na leitura de 5 nov. | Sem homologação com escrita nesse ciclo. |
| Financeiro | Leitura da superfície e o settlement de HEAD estão publicados, no limite da linhagem A. | Fechamento de campeonato real não está liberado. O lote financeiro permanece bloqueado. |

## Categories

`U` é uma definição compartilhada de categoria: uma linha de catálogo guarda idade, faixa e peso que servem aos dois sexos. Não é gênero cadastral de atleta e não é permissão de chave mista.

A alternativa A de `docs/repository/RECONCILIATION-LOT-5-DIAGNOSIS.md` está aprovada como decisão técnica e ainda não foi implementada.

- Cada definição `U` utilizada gera duas categorias efetivas, uma `M` e uma `F`.
- As duas preservam os limites da definição e o `catalog_category_id` original.
- Masculino e feminino competem em chaves separadas, inclusive dos 4 aos 13 anos.
- Não se criam chaves mistas automaticamente. Categoria vazia ou com um atleta permanece na própria chave.
- O catálogo oficial não é modificado.
- Essa alternativa não exige migration, conforme o diagnóstico.
- Atleta `M` compete só em categoria masculina. Atleta `F` compete só em categoria feminina.
- Atleta `O` não é convertido em `M` ou `F`. Não há regra específica de elegibilidade para `O`.

O `categorize()` publicado em `b0a32c7` compara gênero por igualdade. O working tree local aceita categoria `U` para atleta `M` ou `F`. Esse diff não será publicado: é incompatível com a alternativa A. A SQL de inscrição continua exigindo igualdade de gênero. A implementação no cliente ainda não foi feita e não altera o algoritmo nem as RPCs.

## Reconciliation and Risks

A reconciliação técnica está em andamento. O plano de 5 de novembro de 2026 (`docs/repository/RECONCILIATION-PLAN.md`) registra a auditoria do repositório como PASS e o próximo marco como separar o working tree em lotes, sem misturar UI e finanças. Essa missão não fez push, deploy nem migration.

- Lote 1: PASS, só documentação. Worktree `/home/nune/Meus Projetos/jiu-lote1-manifest`, branch `docs/production-manifest-20261105`, tip `03abc63`. O relatório aponta o manifesto em `9ef6baf`. Sem push. Não muda o app publicado.
- Lote 2: PASS num worktree separado, `/home/nune/Meus Projetos/jiu-lote2-dashboard`, branch `ui/dashboard-onboarding-profiles`, tip `bb282b2` (produto até `c898dd2`). TypeScript, lint, build, 22 testes unitários e Playwright 30/30 em localhost. Sem webhook, checkout, Asaas, páginas de auth ou `genero=U`. Sem push. O working tree original não recebeu esses commits. Não é produção.
- Lote 3: PASS WITH LIMITATIONS. Worktree `/home/nune/Meus Projetos/jiu-lote3-auth`, branch `security/auth-experience`, tip `f146fd0`, relatório `docs/repository/RECONCILIATION-LOT-3.md` nesse commit. Login publicado preservado; redirect administrativo e testes de auth no worktree (Playwright 13/13, BDD login 5/5, autorização 5/5, em `next start` local). Sem push, sem merge e sem deploy. Não é produção e não é homologação operacional. Recovery real permanece NOT_RUN.
- Lote 4: PASS. Worktree `/home/nune/Meus Projetos/jiu-lote4-public`, branch `ui/public-surfaces`, tip `9797464`, relatório `docs/repository/RECONCILIATION-LOT-4.md` nesse commit. Superfícies institucionais no worktree; home cinematográfica publicada não foi redesenhada. Playwright 9/9 em localhost. Sem push, sem merge com os lotes 2 e 3, sem deploy. Não é produção e não é homologação operacional.
- Lote 5: diagnóstico com veredito IMPLEMENTATION READY. A alternativa A está aprovada e a implementação no cliente não foi feita. Sem SQL, sem migration e sem deploy. O `categorize()` local incompatível não entra em publicação.
- Lote 6: PASS WITH LIMITATIONS. Worktree `/home/nune/Meus Projetos/jiu-lote6-qa`, branch `qa/lots-2-3-4-integration`, tip `0cd8345`, relatório `docs/repository/RECONCILIATION-LOT-6.md` nesse commit. Composição local dos lotes 2, 3 e 4, sem conflitos, Playwright/BDD 39 passed e 1 skipped em localhost. Sem push e sem deploy. Não é produção e não é homologação operacional completa. O plano ainda cita `qa/homologation-alignment` para um QA amplo; essa branch não é o lote verificado.

Bloqueios que esses lotes não fecham:

- Recovery real: envio e reuso de token de recuperação seguem NOT_RUN. Só a expiração via `otp_expired` passou.
- Staff dedicado: sem conta `E2E_STAFF`. A autorização de escrita desse papel segue NOT_RUN.
- `genero=U`: fora dos lotes 2, 3, 4 e 6. A alternativa A está aprovada e ainda não implementada. O diff local de `categorize()` não será publicado.
- Integridade da criação de eventos: os lotes não corrigem a gravação em passos separados publicada em `b0a32c7`. O smoke do lote 6 não clicou `transitionEvent`.
- Financeiro: webhook, Asaas e settlement continuam na linhagem de produção. A escolha A, B ou C não foi feita.

Riscos conhecidos da criação de evento no código publicado (`b0a32c7`), não corrigidos por esta reconciliação:

- `createEvent` grava o evento, as fases e os arquivos em chamadas separadas. Se as fases falham, o `delete` do rascunho não tem o erro verificado. Se o upload falha, a action devolve erro e o rascunho permanece; um novo envio pode criar outro evento. Há edição local não commitada em `app/admin/eventos/actions.ts` e `app/admin/eventos/novo/NewEventForm.tsx`. Ela não está publicada e não conta como correção entregue.
- Sem `PUBLIC_ORGANIZATION_ID`, o contexto administrativo usa uma filiação com `limit(1)` e sem ordenação. O mesmo usuário pode pertencer a mais de uma organização. Não há regra de desempate no código publicado.
- A migration `202609040002`, listada como aplicada em `zigjiu`, cria o bucket `event-assets` público. Arquivo de rascunho pode ser lido por URL. Isso é risco conhecido do contrato, não um incidente medido nesta correção.

Limitações de pagamento, pela auditoria de 5 de novembro (`docs/repository/FINANCIAL-AUDIT.md`):

- Produção permanece na linhagem A. A linhagem B está no GitHub e ausente da Vercel. A linhagem C está só no working tree e troca a origem do token, com fallback para o token legado.
- Nenhuma das três foi escolhida. Publicar C sobre A, ou misturar as três, é risco em aberto.
- `PAYMENTS_MANUAL_ONLY` continua sendo o modo do checkout do atleta.
- A auditoria não criou nem consultou cobrança Asaas.

## Brand Commitments

O nome do produto é MEU CAMP.

A direção editorial já existente, e publicada na home de `b0a32c7`, é esportiva e contemporânea: navy estrutural, tipografia expressiva em Space Grotesk, fotografia e narrativa. A gramática das telas públicas usa palco, foto e tipo display (`docs/design-system/README.md`, `docs/design-system/PADRAO-TELAS.md`, `docs/repository/PRODUCTION-MANIFEST.md`). `docs/design-system/HOME-CREATIVE-DIRECTION.md` ainda diz que a home cinematográfica estaria só local; o manifesto de produção de 5 de novembro a inclui no deployment. O manifesto prevalece para o que está no ar. O status daquele guia ficou desatualizado.

As telas operacionais preservam clareza, densidade e leitura rápida. O lote 2 exercitou um dashboard mais novo apenas na branch, não no deployment.

Experiências de apresentação começam comp-first. Interfaces operacionais seguem code-first. O padrão registrado em `.impeccable/config.json` é `"buildPath": "comp"`, e esse valor não transforma tela operacional em composição por imagem.

A identidade visual permanece esportiva, editorial e cinematográfica nas superfícies de apresentação. Nas telas administrativas, a prioridade é a clareza operacional.

A pata geométrica e o Patojitsu estão descartados da identidade do Meu Camp. A decisão é definitiva. Não são pendências. Não entram em logotipo, mascote, personagem, interface, material de divulgação nem em componente novo.

`AGENTS.md`, `docs/design-system/README.md` e `docs/design-system/sprint-6.5.md` ainda citam a pata ou o mascote. Esses trechos são registro histórico. Não autorizam reutilização.

## Evidence on Hand

Vigentes para o estado de 5 de novembro de 2026:

- `docs/repository/PRODUCTION-MANIFEST.md`
- `docs/releases/UI-CONSOLIDATION-PRODUCTION.md`
- `docs/repository/RECONCILIATION-PLAN.md`
- `docs/repository/RECONCILIATION-LOT-1.md`
- `docs/repository/RECONCILIATION-LOT-2.md`
- `docs/repository/RECONCILIATION-LOT-3.md` no commit `f146fd0` (worktree `jiu-lote3-auth`); ausente no checkout atual
- `docs/repository/RECONCILIATION-LOT-4.md` no commit `9797464` (worktree `jiu-lote4-public`); ausente no checkout atual
- `docs/repository/RECONCILIATION-LOT-5-DIAGNOSIS.md`
- `docs/repository/RECONCILIATION-LOT-6.md` no commit `0cd8345` (worktree `jiu-lote6-qa`); ausente no checkout atual
- `docs/repository/FINANCIAL-AUDIT.md`
- `docs/design-system/README.md`
- `docs/design-system/PADRAO-TELAS.md`
- `docs/design-system/HOME-CREATIVE-DIRECTION.md`
- `docs/design-system/sprint-6.5.md`
- `AGENTS.md`

Escopo funcional, não comprovação de publicação:

- `docs/escopo_funcional_plataforma.md`
- `docs/criterios_aceite_mvp.md` (reconciliação documental de 19 de setembro de 2026)
- `docs/matriz_permissoes.md`

Ausências que não devem ser preenchidas:

- Não há depoimento, caso de cliente, benchmark comercial nem prova de mercado. Não fabricar.
- Relatos de catch-up anteriores a 5 de novembro de 2026, em `docs/design-system/evidencias/db-catchup/`, não substituem o manifesto de produção.

## Product Principles

1. Cada interface serve a tarefa de quem a usa. No dia da competição, a operação do organizador prevalece quando há conflito.
2. Implementada, testada, publicada, homologada e operacionalmente liberada são fatos diferentes.
3. O produto existe para operar o campeonato, com o Jiu-Jitsu como primeira modalidade. O que o domínio não definiu permanece em aberto.
4. O working tree e uma branch sem push não são o produto publicado.
5. Não se inventa diferencial, cliente, depoimento, número ou funcionalidade offline.

## Accessibility & Inclusion

O projeto já exige rótulo, nome acessível, foco visível, teclado, estado desabilitado, contraste, alvo de toque adequado e status comunicado por texto ou ícone além da cor. Fonte: `AGENTS.md`, seção 10. Essa exigência é regra de construção. Ela não afirma que todas as telas publicadas já foram reauditadas em 5 de novembro de 2026.
