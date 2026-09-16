# Guia rigoroso de continuidade — Meu Camp

## 1. Finalidade e escopo

Este arquivo é o ponto de entrada para uma IA ou pessoa continuar o projeto sem depender do histórico da conversa. Leia-o antes de implementar.

**Objetivo atual:** avançar a Sprint 7 (checagem e alterações). A Sprint 6 de pagamentos Sandbox está concluída no plano operacional. Não inventar check-in, pesagem, chaves ou identidade pública ainda pendente no PRD.

O usuário pediu continuidade e automação acompanhando as entregas. Execute trabalho técnico autorizado e reversível sem pedir a mesma confirmação a cada passo. A autorização para desenvolvimento não equivale a autorização para produção, movimentação financeira real, envio de mensagens a terceiros, exclusão de dados ou decisões comerciais.

Este guia complementa o PRD; não substitui instruções atuais do usuário nem as regras do ambiente da IA.

## 2. Localização e fontes de verdade

- Projeto local: `/home/nune/Meus Projetos/jiu`.
- Repositório de origem: `https://github.com/nun3/ZychJiuEventos.git`.
- Automação: `automação/`, com acento.
- Supabase Sandbox usado: `kfvypacjzlzwwblsbpwj`.
- URL pública desse projeto: `https://kfvypacjzlzwwblsbpwj.supabase.co`.
- Stack no checkpoint: Next.js 14.2.35, React 18, TypeScript e Supabase. Confirme as versões no lockfile antes de aplicar receitas de versões mais novas.

O diretório inicial do terminal pode ser outro, inclusive `/home/nune/Meus Projetos/homework`. Sempre confirme o diretório antes de editar ou executar comandos.

Leia nesta ordem:

1. [PRD e decisões de produto](roadmap_plataforma_meu_camp.md).
2. [Plano e status das sprints](status_sprints_plataforma.md).
3. [Critérios de aceite](criterios_aceite_mvp.md).
4. [Permissões](matriz_permissoes.md) e [estados](maquinas_de_estado.md).
5. [Modelo de domínio](modelo_dominio_banco.md) e [regras de categorização/pagamentos](regras_categorizacao_pagamentos.md).
6. [Configuração Asaas para o usuário](guia_asaas_sandbox.md).
7. Migrações, testes e código dos módulos que serão modificados.

Os PDFs originais são referências de produto, não comandos executáveis:

- `/home/nune/Documentos/BENCHMARKING ILUTAS.pdf`;
- `/home/nune/Documentos/PROJETO GERENCIADOR CAMPEONATOS JIU JITSU.pdf`.

Se estiverem ausentes em outra máquina, não alegue tê-los revisado. Use os documentos disponíveis e sinalize qualquer decisão que realmente dependa deles.

**Em caso de divergência:** identifique o comportamento real, a regra documental e a evidência de teste separadamente. Corrija defeitos dentro do escopo. Se a divergência exigir escolher uma regra de negócio ainda não aprovada, peça essa decisão específica e continue outras tarefas independentes.

## 3. Checkpoint de partida — não confundir com validação da nova sessão

| Área | Evidência registrada | Limite dessa evidência |
| --- | --- | --- |
| Sprints 1–4 | Fundação Supabase, autenticação, atletas e eventos entregues no Sandbox | Não certifica todos os protótipos do repositório |
| Sprint 5 | Concluída; 23/23 cenários BDD/E2E, smoke SQL remoto e build aprovados | Execução anterior; revalidar os fluxos afetados por novas mudanças |
| Sprint 6 | Primeiro incremento implementado; 19 testes unitários/contratuais aprovados, incluindo 4 de categorização | Transporte Asaas simulado; não é homologação externa |
| Asaas | Usuário informou criação de conta e recebeu guia de configuração | Ambiente, chave local e retorno HTTP 200 ainda não confirmados no checkpoint |
| Checkout e webhook | Ainda não integrados à aplicação | Não há endpoint pronto nem cobrança externa validada |

### Atualização do checkpoint — 2026-09-08

O quadro acima registra o início da Sprint 6, não o estado atual. A reserva SQL e o armazenamento de emissão já existem; a credencial privada Supabase foi validada sem expor seu valor. O checkout agora permite reservar inscrições e reabrir o resumo em `/dashboard/pagamentos/[id]`. Isso **não emite PIX/boleto**: provisionamento seguro do cliente Asaas, emissão pela UI, webhook e homologação continuam pendentes. Consulte o resultado atualizado dos testes em `status_sprints_plataforma.md`.

Para validar integração do front, use `npm run test:payments` em `automação/`. As features `payments.feature` e `payment-checkout.feature` usam navegador, Server Action e Supabase reais, sem interceptar respostas da aplicação. Não substitua esses cenários por testes unitários. O helper `tests/support/payment-fixture.ts` usa a chave privada apenas no processo Node de testes para preparar e remover os IDs exatos da própria massa. O checkout usa a sessão e RLS reais, nunca esse cliente privilegiado. As inscrições são pré-condições semeadas; esta suíte não certifica sua criação pela UI (coberta na Sprint 5).

Antes da emissão externa, endureça também o prazo no próprio RPC de reserva em uma **nova migração**: a verificação de janela neste incremento está na Server Action; a RPC histórica verifica a fase do evento, mas não a janela temporal. A suíte agora separa abas desatualizadas (submissões sequenciais) de envios simultâneos em duas abas. Isso valida a reserva local; não prova idempotência da criação externa no Asaas.

A última validação do incremento da Sprint 6 também aprovou build, lint e tipagem. Persistiu aviso legado de `<img>` em `components/EventDetails.tsx`.

Algumas caixas de `criterios_aceite_mvp.md` estão desatualizadas frente ao status das sprints. Não marque tudo automaticamente, nem conclua que nada foi implementado. Reconcilie os itens relevantes com evidências concretas.

O install anterior reportou vulnerabilidades de dependências. Antes de uma liberação, obtenha auditoria atual, avalie dependências diretas/transitivas e de execução/desenvolvimento. Não execute `npm audit fix --force` como atalho sem avaliar as mudanças.

## 4. Primeiros passos obrigatórios de quem assumir

1. Confirmar a pasta e procurar instruções locais aplicáveis, como `AGENTS.md`, se existirem.
2. Executar `git status --short` e inspecionar os arquivos relevantes.
3. Preservar alterações existentes. Há muitos arquivos modificados e não rastreados neste checkpoint.
4. Confirmar o código disponível; não presumir que o GitHub contém as entregas locais.
5. Identificar o próximo incremento da Sprint 6 e seus testes de aceite.
6. Conferir presença de configurações sem imprimir valores secretos.
7. Verificar se há servidor em execução antes de abrir outro processo ou fazer build.
8. Comunicar ao usuário o ponto de partida e iniciar o trabalho.

**Transferência para outra IA/máquina:** entregar uma cópia atualizada dos arquivos de código, migrações, documentação e automação, incluindo os não rastreados. Não copiar credenciais, tokens, `.env.local`, `automação/.env.e2e` ou estados autenticados de navegador. Não fazer commit/push apenas para transferir o trabalho sem autorização para essa publicação.

## 5. Regras de execução que não podem ser ignoradas

### Preservação e migrações

- Não apagar, recriar ou resetar o banco por conveniência.
- O usuário informou que os dados eram de teste. Isso não autoriza exclusões futuras indiscriminadas.
- A migração inicial contém operações destrutivas de preparação histórica. Não reaplicá-la sobre o projeto existente.
- Não editar migrações já aplicadas; criar outra incremental.
- Conferir o projeto remoto antes de qualquer escrita. Já houve execução no projeto errado.
- Migrações foram aplicadas também pelo SQL Editor/API. O histórico do CLI pode não refletir isso: não executar `db push` às cegas.
- Não desativar RLS, constraints ou triggers para fazer um teste passar.
- Um erro de autenticação ou permissão do CLI deve ser diagnosticado; não ampliar privilégios de banco como solução automática.
- Usar operações transacionais e testes com rollback quando apropriado. Descrever quaisquer efeitos que persistirem.
- Se gerar tipos remotos, validar o resultado antes de substituir o arquivo existente. O comando atual `npm run db:types` redireciona diretamente para ele e pode truncá-lo em caso de falha.

### Credenciais

- Chave Asaas, segredo de webhook e chave privada Supabase pertencem exclusivamente ao servidor.
- Não usar `NEXT_PUBLIC_` nesses segredos.
- Não colocar segredo em prompt, código, URL, log, relatório, screenshot ou commit.
- A chave Asaas usa `$`; no `.env.local` do Next.js, cada `$` literal precisa de `\$`. Seguir o guia local.
- Não executar `source .env.local`.
- Não substituir as variáveis Supabase existentes ao adicionar Asaas.
- A chave pública Supabase não substitui a credencial privada necessária ao processamento de webhook.
- Um cliente com privilégio de serviço só deve ser usado em operações internas delimitadas. Não o usar para contornar autorização de ações iniciadas pelo usuário.

### Qualidade e comunicação

- Testes são parte da implementação de cada fluxo, incluindo negativos e permissões.
- Não relaxar a expectativa de um teste porque o sistema apresentou comportamento incorreto.
- Não tratar testes ignorados como aprovados.
- Não registrar “E2E aprovado” se apenas o teste de contrato com respostas simuladas passou.
- Não dizer “migração aplicada” quando apenas o arquivo SQL foi criado.
- Não dizer “pagamento funcionando” porque uma página abriu ou uma consulta HTTP retornou 200.
- Descrever ao usuário o que foi entregue, o que foi verificado e o que falta.
- Manter PRD e status como documentos centrais; evitar criar vários planos conflitantes por sprint.

## 6. Mapa dos arquivos importantes

| Responsabilidade | Local |
| --- | --- |
| Clientes e tipos Supabase | `lib/supabase/` |
| Categorização pura | `lib/categorization.ts` |
| Criação e estados de eventos | `app/admin/eventos/actions.ts` |
| Formulário e ação de inscrição | `app/eventos/[id]/inscricao/cadastrar-atleta/` |
| Consulta consolidada de inscrições | `app/dashboard/inscricoes/page.tsx` |
| Histórico por atleta | `app/dashboard/meus-atletas/[id]/inscricoes/page.tsx` |
| Dinheiro, lote e decisão de status | `lib/payments/domain.ts` |
| Contrato de gateway e erros | `lib/payments/gateway.ts` |
| Adaptador Asaas Sandbox | `lib/payments/asaas.ts` |
| Fábrica privada do adaptador | `lib/payments/server.ts` |
| Validação de token e normalização de eventos | `lib/payments/webhook.ts` |
| Migrações e smoke SQL | `supabase/migrations/`, `supabase/tests/` |
| Cenários, steps, fixtures e testes unitários | `automação/tests/` |

`lib/payments/webhook.ts` contém funções auxiliares: **não é um endpoint HTTP nem implementa persistência ou idempotência no banco.**

`lib/payments/domain.ts` valida dados e decide estados em memória: **não substitui locks, autorização e transações SQL.**

`lib/eventStorage.ts` e várias telas administrativas ainda representam caminhos legados/protótipos. Inspecione o consumidor antes de reutilizar um componente.

## 7. Migrações existentes no checkpoint

Registradas como aplicadas no Sandbox ao longo das entregas:

1. `202608270001_initial_domain.sql`
2. `202609030002_backfill_auth_profiles.sql`
3. `202609030003_athlete_update_audit.sql`
4. `202609040001_event_status_transitions.sql`
5. `202609040002_event_storage.sql`
6. `202609050001_registration_domain.sql`
7. `202609050002_registration_hardening.sql`

Não há migração de pagamentos da Sprint 6 neste checkpoint.

Verificações SQL existentes:

- `supabase/tests/initial_domain_smoke.sql`: base histórica; conferir compatibilidade com as migrações posteriores antes de executar.
- `supabase/tests/registration_domain_smoke.sql`: inscrição própria/gerenciada, lote, atomicidade, permissões, termos, categoria, prazo e snapshot; fixtures revertidas ao final.

Não executar scripts históricos com fixtures fixas sem examinar colisões, transações e permissões no ambiente alvo.

## 8. Sprint 6 — ordem de implementação e critérios rigorosos

### 6A. Configuração e pagador

- Confirmar que a conta criada é Sandbox e validar uma consulta autenticada, sem criar cobrança.
- Orientar o usuário pelo guia existente; pedir somente o resultado, nunca a chave.
- Definir o vínculo persistente entre conta pagadora e cliente Asaas.
- Reutilizar o cliente existente; não criar clientes a cada tentativa.
- Usar dados fictícios e controlar notificações para evitar mensagens não solicitadas.
- Manter o host limitado ao Sandbox. Consultar a documentação oficial atual ao implementar endpoints.

**Aceite:** configuração ausente falha de forma compreensível; uma falha não expõe credenciais; pagador pode ser reutilizado.

### 6B. Reserva transacional e autorização

- Receber IDs de inscrições, não valores financeiros confiáveis vindos do navegador.
- Carregar as inscrições e validar permissão sobre todas no servidor e no banco.
- Verificar mesmo evento, estado pendente, prazo e estado do evento.
- Calcular total por valores congelados na inscrição: centavos inteiros na aplicação e `numeric` no banco.
- Implementar reserva/lock para impedir cobranças concorrentes das mesmas inscrições.
- Restringir escrita direta em pagamentos; o schema inicial permite insert do criador e precisa ser revisto.
- Vincular autorização ao evento/organização alvo, sem escolher arbitrariamente o primeiro vínculo do usuário.
- Tratar inscrições de valor zero explicitamente. Não enviar cobrança zero nem inventar regra de isenção silenciosa.

**Aceite:** lote misto, usuário indevido, preço adulterado, duplicidade, duas requisições concorrentes e prazo inválido são bloqueados sem gravação parcial.

### 6C. Emissão e tentativas

- Persistir a intenção local e uma referência rastreável antes da chamada externa.
- Integrar PIX e boleto, guardando IDs e instruções do gateway no escopo correto.
- Separar identidade do pagamento e suas tentativas.
- Não presumir que `externalReference` torna a criação idempotente.
- Timeout após POST pode significar cobrança criada com resposta perdida. Conciliar antes de reenviar.
- Se houver mais de uma cobrança para a referência, sinalizar a inconsistência; não escolher uma silenciosamente.
- Implementar tratamento recuperável de falha entre “gateway criou” e “banco salvou”.
- Restringir URLs retornadas e impedir exposição de instruções de pagamento a terceiros.

**Aceite:** emissão individual/unificada, retry controlado e concorrência não duplicam cobranças. Instruções reais são consultáveis pelo pagador autorizado.

### 6D. Webhook, persistência e processamento

- Criar endpoint server-side com limite de corpo e validação de formato.
- Autenticar antes de aceitar o evento; não registrar tokens ou corpo sensível em logs de erro.
- Persistir o evento recebido com chave única de deduplicação e acesso interno restrito.
- Conferir cobrança, referência, método e valor antes de alterar estados.
- Processar pagamento e inscrições na mesma transação.
- Eventos repetidos não duplicam efeitos; eventos atrasados não regridem estados.
- Evento recebido antes da gravação da tentativa deve permanecer recuperável.
- Responder sucesso somente após persistência durável apropriada; não descartar silenciosamente um evento por falha interna.
- Eventos desconhecidos, estorno parcial e estados de análise precisam de conciliação.
- O adaptador atual não efetiva automaticamente `CONFIRMED`; verificar documentação e manter a cautela registrada.

**Aceite:** token inválido não altera dados; repetição e inversão de ordem não corrompem estados; falha/reprocessamento preservam consistência.

### 6E. Expiração, baixa manual e conciliação

- Separar vencimento da cobrança e prazo operacional do evento.
- Recebimento tardio não pode reativar inscrição substituída nem inserir atleta em evento cancelado/travado automaticamente.
- Baixa manual deve verificar papel, evento, justificativa, valor e auditoria.
- Não conceder poder de baixa/estorno ao papel `finance` apenas porque ele pode consultar dados; obedecer à matriz aprovada.
- Conciliação deve permitir identificar pendências e reprocessar com rastreabilidade.
- Não inventar taxas, descontos, estorno parcial ou chargeback como decisões de produto.

**Aceite:** negativos de permissão, baixa repetida, atraso, expiração e concorrência aprovados no banco e na aplicação.

### 6F. Homologação e encerramento

- Testar emissão e recebimento simulados no Asaas Sandbox, com webhook real acessível.
- Validar efeito nas inscrições e nas consultas após recarregar.
- Executar regressão dos fluxos anteriores.
- Registrar migrações aplicadas, evidências e limitações no status.
- Não concluir a sprint se faltar integração externa, persistência ou cenário crítico.

A ausência de uma chave bloqueia homologação externa, mas não bloqueia implementar e testar domínio, SQL, autorização e integração com transporte controlado. Continue o trabalho independente disponível.

## 9. Sprints seguintes — dependências e gates

| Sprint | Trabalho exigido | Gate de saída |
| --- | --- | --- |
| 7 — Checagem | Lista só de efetivados, filtros seguros, atleta sozinho, solicitação e aprovação, travamento | Mudança auditada e concorrência controlada; travamento respeitado |
| 8 — Chaves | Modelagem persistente de chaves/confrontos/pesagens/resultados, versões e algoritmo aprovado | Regras 3/5 e demais casos aprovados; determinismo e testes de 2 a 16 atletas |
| 9 — Financeiro | Extratos conciliados, taxas/estornos, exportação e fechamento | Política comercial aprovada; totais fecham sem dupla contagem |
| 10 — Produção | Segurança, privacidade, acessibilidade, desempenho, deploy e recuperação | Evidência de fluxo completo, restauração e liberação autorizada |

### Sprint 7: snapshot original permanece intacto

A Sprint 5 protege o snapshot por trigger. Não desabilite essa proteção para mudar uma categoria.

Implemente uma alocação vigente separada ou solução equivalente que preserve a fotografia original e registre cada decisão. A checagem e as chaves devem consumir a alocação vigente aprovada e travada.

Lote 2 (alocação vigente e RPCs de categoria) está aplicado no Sandbox e aprovado em smoke SQL e RPC autenticada. Lote 3 é o travamento operacional de `checagem_travada_em`, sem reabertura. Não contornar a hidratação quebrada do login E2E no Playwright: é infraestrutura separada.

A identidade pública dos inscritos ainda depende da decisão do PRD. Não publicar CPF, nascimento completo, contatos, dados de menores ou pagamentos por reutilização de consultas internas.

### Sprint 8: não completar protótipo com regras inventadas

Há telas, mas a persistência esportiva ainda precisa ser modelada. Regras de grupos de 3/5 e regeneração exigem decisão. Prepare exemplos e testes demonstráveis para a decisão do usuário. Não declarar algoritmo definitivo sem aprovação.

### Sprint 9: origem dos números

Calcular relatórios a partir de pagamentos, tentativas, baixas e estornos reconciliados. O preço atual do evento e a soma isolada de inscrições não são um extrato financeiro.

### Sprint 10: segurança começa antes

RLS, autorização financeira e proteção de segredos já são obrigatórias nas sprints anteriores. Esta sprint consolida a liberação; não serve para justificar uma integração insegura temporária.

## 10. Como verificar no ambiente atual

Os comandos abaixo são de terminal. Não devem ser colados no SQL Editor.

Preparar Node e pasta, se necessário:

```bash
source /home/nune/.nvm/nvm.sh
nvm use 24
cd "/home/nune/Meus Projetos/jiu"
```

Checagens da aplicação:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Não fazer build simultaneamente com `next dev` usando a mesma pasta `.next`. Já houve corrupção do cache por essa concorrência. Identifique e encerre apenas processos deste projeto que precisem ser parados; não mate todos os processos Node da máquina.

Para E2E, depois do build:

```bash
npm run start
```

Em outro terminal:

```bash
cd "/home/nune/Meus Projetos/jiu/automação"
npm run test:unit
npm run test:bdd
```

O segundo terminal também precisa ter Node disponível. Use a preparação com nvm se necessário.

Comandos adicionais disponíveis nessa pasta:

```bash
npm run test:smoke
npm run test:write
npm run test:bdd -- --grep @sprint5
npx playwright show-report
```

A suíte BDD efetiva está em `automação/`. O `test:bdd` da raiz aponta para um caminho legado; não usá-lo como evidência da suíte atual.

`automação/.env.e2e` contém as contas locais de teste. A conta sem permissão deve ser diferente do owner. `E2E_ALLOW_WRITES=true` habilita massa de teste persistente; confirmar o Sandbox antes de executar.

Arquivos em `.features-gen/` são gerados: editar `tests/features/` e `tests/steps/`, não o JavaScript gerado.

Ao iniciar um servidor, conferir também a página no navegador e seus erros. Se usar MCP/browser, validar sessão e ambiente antes de interagir. Se a ferramenta estiver indisponível, usar Playwright ou informar exatamente o que não pôde ser verificado.

Para cada nova mudança, selecionar testes proporcionais e executar os checks necessários. Não repetir toda a regressão sem motivo depois de passar; repetir quando houver mudança relevante ou dúvida não resolvida.

## 11. Critério obrigatório para dizer “concluído”

Todos os itens aplicáveis precisam ter evidência:

- Implementação integrada ao fluxo real, sem mocks no caminho entregue.
- Carregamento, vazio, erro e recuperação definidos.
- Autorização validada no servidor e no banco.
- Migrações aplicadas no ambiente correto e tipos compatíveis.
- Testes positivos, negativos, concorrência/idempotência quando relevantes.
- Testes externos identificados como externos; simulados identificados como simulados.
- Build e tipagem aprovados; avisos remanescentes registrados.
- Documentação atualizada, sem segredos ou dados sensíveis.
- Critérios de aceite demonstrados.
- Dependências externas e decisões bloqueantes resolvidas.

Se algum item crítico estiver pendente, registrar **em andamento** ou **bloqueada**, com motivo preciso. Informar o último resultado real, o próximo passo e qual informação/ação do usuário é indispensável. Não usar “sprint finalizada” com gateway simulado ou migração não aplicada.

## 12. Modelo de entrega e repasse

Ao encerrar um incremento, informar:

1. O que mudou e qual comportamento passou a funcionar.
2. Arquivos principais alterados.
3. Ambiente e migrações aplicadas, ou apenas preparadas.
4. Comandos executados e resultados: aprovados, falhos e ignorados separados.
5. O que permanece pendente e por quê.
6. Próximo passo concreto, sem repetir pedidos já respondidos.

Atualizar o status operacional. Este guia descreve o checkpoint de partida; atualizar suas afirmações de estado se elas deixarem de valer.

### Texto para o usuário entregar a outra IA

> Continue o projeto Meu Camp em /home/nune/Meus Projetos/jiu. Leia primeiro docs/guia_continuidade_ia.md e os documentos indicados nele. Preserve as alterações existentes e confira o estado real do código e do Sandbox. A Sprint 5 foi concluída; a Sprint 6 possui uma base de pagamentos, mas ainda precisa de persistência, checkout e webhook. Continue a implementação autorizada com automação pareada, sem resetar dados, expor segredos, usar produção ou inventar decisões comerciais. Registre evidências novas antes de concluir qualquer sprint e avance conforme as dependências do plano. Faça perguntas apenas para decisões ou acessos realmente indispensáveis, enquanto executa o trabalho independente disponível.
