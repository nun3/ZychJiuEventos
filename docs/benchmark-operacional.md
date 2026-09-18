# Benchmark operacional de campeonatos

## Finalidade

Este documento é a referência live canônica para evidências de operação real e benchmarking do MEU CAMP. Ele sintetiza os arquivos fornecidos pelo cliente sem reproduzi-los integralmente.

As evidências aqui registradas não substituem automaticamente requisitos ou decisões já aprovadas. Antes de implementar um módulo operacional, classificar cada afirmação como:

- **REQUISITO MEU CAMP:** requisito explícito do PRD ou decisão aprovada.
- **EVIDÊNCIA DE BENCHMARK:** fato observado nos documentos reais.
- **DECISÃO DE PRODUTO:** escolha deliberada do MEU CAMP.
- **INFERÊNCIA:** conclusão técnica plausível ainda não comprovada.

## Hierarquia das fontes

1. Requisito explícito aprovado do MEU CAMP e PRD.
2. Decisões de produto já aprovadas e implementadas.
3. Documentos reais de campeonato/iLutas.
4. Benchmarking textual.
5. Documentação live atual do repositório.
6. Código atual.
7. Inferência e prática esportiva.

Em caso de conflito, registrar as duas fontes e manter a decisão MEU CAMP vigente até aprovação explícita de mudança.

## Fontes analisadas

- `PROJETO_GERENCIADOR_CAMPEONATOS_JIU_JITSU_1.pdf` — lido integralmente, 4 páginas. Documento textual de visão, atores, fases e requisitos iniciais.
- `BENCHMARKING_ILUTAS_1.pdf` — lido integralmente, 15 páginas. Benchmarking textual e visual do fluxo do iLutas.
- `CHAVES_AREAS.pdf` — lido integralmente, 96 páginas. Chaves reais do 3º Patojitsu Festcamp Kids, distribuídas em áreas.
- `FESTIVAL.pdf` — lido integralmente, 2 páginas. Programação operacional por luta, área, atleta, equipe e professor.
- `ZYCH_JIU_JITSU_CATEGORIA.pdf` — lido integralmente, 1 página. Projeção operacional filtrada para a equipe Zych Jiu Jitsu.

Não havia outro documento de benchmark ou evento anexado no mesmo conjunto.

## Evidências por domínio

### Inscrição

**EVIDÊNCIA DE BENCHMARK**

- Origem: `PROJETO_GERENCIADOR_CAMPEONATOS_JIU_JITSU_1.pdf`.
- Professor ou responsável inscreve atletas vinculados; atleta maior realiza a própria inscrição.
- A categorização usa nascimento, peso, faixa e gênero.
- A inscrição começa pendente de pagamento.
- Situação no MEU CAMP: fluxo, snapshot e categorização persistente já existem.

**EVIDÊNCIA DE BENCHMARK**

- Origem: `BENCHMARKING_ILUTAS_1.pdf`.
- Eventos aparecem ordenados por data; o usuário escolhe inscrição própria ou de vários atletas e confirma os dados antes de concluir.
- O cadastro de “Meus Atletas” é reutilizado entre eventos.
- PIX e boleto aparecem como meios de pagamento individual ou agrupado.
- Situação no MEU CAMP: núcleo de eventos, Meus Atletas, inscrições múltiplas, PIX/boleto e pagamento agrupado já existe; alguns critérios de aceite históricos ainda precisam de reconciliação documental.

### Checagem

**EVIDÊNCIA DE BENCHMARK**

- Origem: `PROJETO_GERENCIADOR_CAMPEONATOS_JIU_JITSU_1.pdf`.
- A lista de checagem contém somente pagamentos efetivados, identifica atleta sozinho, admite solicitação de mudança/correção e é travada antes das chaves.
- Situação no MEU CAMP: núcleo autenticado, realocação aprovada e travamento estão concluídos; lista pública continua pendente da decisão de identidade pública.

**EVIDÊNCIA DE BENCHMARK**

- Origem: `BENCHMARKING_ILUTAS_1.pdf`.
- Lista pública e alteração de inscrição reduzem trabalho manual do organizador.
- Situação no MEU CAMP: solicitações auditadas existem, mas alteração direta de inscrição não foi adotada.

### Categorias

**EVIDÊNCIA DE BENCHMARK**

- Origem: `BENCHMARKING_ILUTAS_1.pdf`.
- O organizador escolhe tabela de peso, citando CBJJ ou CBJJE, e configura agrupamentos.
- O texto de benchmarking menciona método de cálculo de idade configurável.
- Situação no MEU CAMP: conjuntos de regras versionados existem; idade por data completa na data oficial do evento é decisão MEU CAMP e prevalece.

**EVIDÊNCIA DE BENCHMARK**

- Origem: `CHAVES_AREAS.pdf`.
- A categoria operacional combina idade, faixa, peso, gênero e, quando necessário, subdivisão por letra.
- A duração aparece por chave/categoria com exemplos de 2, 2,50, 3, 3,50 e 4 minutos.
- Situação no MEU CAMP: eixos e subdivisão por subchaves existem; duração de luta ainda não está modelada.

**EVIDÊNCIA DE BENCHMARK**

- Origem: `FESTIVAL.pdf`.
- Algumas linhas do mesmo número de luta apresentam descrições de categoria diferentes entre os dois atletas.
- Situação no MEU CAMP: isso não prova uma regra de cruzamento entre categorias; o sistema mantém confrontos dentro da categoria/subchave aprovada.

### Chaves

**EVIDÊNCIA DE BENCHMARK**

- Origem: `CHAVES_AREAS.pdf`.
- Cada folha possui código técnico da chave, número operacional da chave, categoria, duração, número de atletas, atletas, equipes, área e campos de resultado.
- O conjunto contém chaves reais de 2, 3 e 4 atletas.
- As áreas se repetem em várias chaves e são apresentadas como `ÁREA 1 - VERDE`, `ÁREA 2 - AZUL` e `ÁREA 3 - AMARELA`.
- Situação no MEU CAMP: Sprint 8 implementou e validou `final_2`, `copo_3`, `semi_4`, agrupamento, versionamento, publicação e consulta pública. O código externo e o número impresso da chave não fazem parte do contrato atual.

**REQUISITO MEU CAMP**

- Origem: PRD e decisões aprovadas da Sprint 8.
- Chaves derivam da checagem travada, preservam versões e tentam evitar primeira luta entre atletas da mesma equipe.
- Situação: concluído e congelado.

### Resultados

**EVIDÊNCIA DE BENCHMARK**

- Origem: `CHAVES_AREAS.pdf`.
- A folha prevê resultado final com 1º, 2º e dois campos de 3º, além do controle “Resultado Registrado?”.
- Situação no MEU CAMP: resultado normal, WO, avanço e colocações por topologia foram implementados digitalmente na Sprint 8.

**EVIDÊNCIA DE BENCHMARK**

- Origem: `ZYCH_JIU_JITSU_CATEGORIA.pdf`.
- A projeção por equipe possui coluna de resultado e identifica se o atleta está na 1ª ou 2ª luta da chave.
- Situação no MEU CAMP: dados necessários existem, mas essa projeção específica ainda não foi implementada.

### Áreas/tatames

**EVIDÊNCIA DE BENCHMARK**

- Origem: `CHAVES_AREAS.pdf`.
- A área aparece na visão da chave inteira, com número e cor. As chaves estão distribuídas entre três áreas.
- A folha também possui campo manual de número da área.
- Situação no MEU CAMP: não existe entidade persistente de área.

**EVIDÊNCIA DE BENCHMARK**

- Origem: `FESTIVAL.pdf`.
- Cada luta global está ligada a uma área numérica.
- A área varia ao longo da sequência global; filtrar os números globais por área produz a fila daquela área.
- Situação no MEU CAMP: `bracket_matches` identifica a luta, mas não possui alocação de área.

**EVIDÊNCIA DE BENCHMARK**

- Origem: `ZYCH_JIU_JITSU_CATEGORIA.pdf`.
- A área de luta é exibida na visão derivada por equipe e chave.
- Situação no MEU CAMP: projeção futura.

### Programação

**EVIDÊNCIA DE BENCHMARK**

- Origem: `FESTIVAL.pdf`.
- A coluna `LUTA` percorre a sequência global do evento de 1 a 44 enquanto a coluna `ÁREA` varia entre 1, 2 e 3.
- Cada luta normalmente ocupa duas linhas, uma por atleta.
- O valor `39 e 44` para uma atleta evidencia participação em duas lutas globais da mesma programação.
- Isso comprova número de luta global no evento; não há número local de luta por área.
- Situação no MEU CAMP: número global e programação ainda não existem.

**EVIDÊNCIA DE BENCHMARK**

- Origem: `CHAVES_AREAS.pdf`.
- Há campo de horário da chave e horários de entrega/devolução da folha, todos para preenchimento manual.
- Situação no MEU CAMP: não há horário previsto. Os documentos não demonstram cálculo automático de horários.

**INFERÊNCIA**

- A ordem da fila de uma área pode ser derivada ordenando por número global somente as lutas daquela área.
- Esta é uma derivação técnica coerente com `FESTIVAL.pdf`, mas a política de inserção, remoção e renumeração precisa ser decisão MEU CAMP.

### Equipe/professor

**EVIDÊNCIA DE BENCHMARK**

- Origem: `FESTIVAL.pdf`.
- A programação apresenta, para cada atleta da luta, nome do atleta, equipe e professor.
- Situação no MEU CAMP: atleta e equipe podem ser derivados dos participantes congelados; o “professor da luta” não possui contrato aprovado.

**EVIDÊNCIA DE BENCHMARK**

- Origem: `ZYCH_JIU_JITSU_CATEGORIA.pdf`.
- Uma visão filtrada por equipe reúne chave, 1ª/2ª luta, categoria, duração, resultado, atleta, equipe e área.
- Situação no MEU CAMP: estrutura relacional de equipe e gestores existe; projeção operacional ainda pendente.

**INFERÊNCIA**

- O professor exibido em `FESTIVAL.pdf` pode ser treinador operacional, gestor cadastral ou responsável pela equipe. Os documentos não definem essa identidade nem sua cardinalidade.

### Pesagem

**EVIDÊNCIA DE BENCHMARK**

- Origem: `CHAVES_AREAS.pdf`.
- A folha da chave possui controle “Pesagem Realizada?”.
- Situação no MEU CAMP: não implementado; fora do lote atual de áreas/programação.

### Premiação

**EVIDÊNCIA DE BENCHMARK**

- Origem: `CHAVES_AREAS.pdf`.
- A folha da chave possui controle “Premiação Realizada?”.
- Situação no MEU CAMP: não implementado; fora do lote atual.

### Encerramento

**EVIDÊNCIA DE BENCHMARK**

- Origem: `PROJETO_GERENCIADOR_CAMPEONATOS_JIU_JITSU_1.pdf`.
- O encerramento prevê evento realizado e relatório financeiro sintético e analítico.
- Situação no MEU CAMP: histórico público de resultados está parcialmente disponível; fechamento financeiro completo permanece pendente.

**EVIDÊNCIA DE BENCHMARK**

- Origem: `CHAVES_AREAS.pdf`.
- A devolução da chave, pesagem, premiação e registro do resultado funcionam como checklist operacional de fechamento da chave.
- Situação no MEU CAMP: apenas resultados estão implementados.

## O que não está provado

- Algoritmo de distribuição automática de lutas entre áreas.
- Existência de número local de luta por área.
- Se números globais podem ser alterados, reutilizados ou deixados com lacunas.
- Política de reordenação antes ou durante o evento.
- Estado operacional “chamada”, “no tatame” ou “em luta”.
- Tratamento da fila e da numeração quando há WO.
- Horário previsto calculado automaticamente.
- Duração de intervalo, descanso mínimo ou buffer entre lutas.
- Se lutas de uma mesma chave devem obrigatoriamente permanecer na mesma área.
- Se cores das áreas são obrigatórias, exclusivas ou escolhidas de uma paleta fixa.
- Regras de conflito simultâneo para atleta, equipe ou professor.
- Identidade exata do professor exibido na programação.
- Processo digital de entrega/devolução da chave ao coordenador.
- Significado normativo das categorias diferentes entre atletas de algumas linhas do `FESTIVAL.pdf`.
- Programação de eventos com mais de um dia ou mais de uma sessão.
- Regras de pesagem, premiação e placar.

## Decisões MEU CAMP divergentes ou complementares

- **DECISÃO DE PRODUTO:** idade é calculada pela data completa de nascimento na data oficial do evento. A possibilidade de método configurável citada no benchmarking não altera essa regra.
- **DECISÃO DE PRODUTO:** snapshots de inscrição são imutáveis; realocação usa solicitação aprovada e `current_category_id`. O benchmark menciona alteração de inscrição pelo organizador, mas isso não autoriza edição direta.
- **DECISÃO DE PRODUTO:** Asaas Sandbox é o primeiro adaptador. Referências a Safe2Pay ou outros gateways são benchmark, não troca automática de fornecedor.
- **DECISÃO DE PRODUTO:** eventos concluídos preservam histórico público. O projeto inicial menciona desabilitar a consulta detalhada e manter apenas o banner; o PRD aprovado do MEU CAMP prevalece.
- **DECISÃO DE PRODUTO:** chaves, resultados, WO, copo, agrupamento e casamento manual aprovados na Sprint 8 não são reabertos por diferenças de apresentação dos PDFs.
- **DECISÃO DE PRODUTO:** autorização, RLS e auditoria são obrigatórias mesmo quando a operação de referência usa folhas e controles manuais.
- **DECISÃO DE PRODUTO:** mobile não replica tabelas largas; programação deve usar registros e filtros adequados ao viewport.

## Contrato confirmado para áreas e programação

As fontes sustentam o seguinte núcleo para a Sprint 9:

- área/tatame é entidade do evento, identificada ao menos por número e nome/cor descritiva;
- cada luta programada recebe um número global único no evento;
- cada luta programada recebe uma área;
- a fila operacional de cada área é derivada pela ordem crescente dos números globais alocados nela;
- categoria, atletas e equipes são projeções do domínio existente, não cópias editáveis da programação;
- duração pertence à regra/categoria da luta e deve aparecer nas projeções operacionais;
- horário automático não faz parte do primeiro contrato, pois não está demonstrado;
- visão por equipe/professor deve ser derivada posteriormente da mesma programação;
- `sem_confronto` não gera luta programável;
- resultado ou WO não deve apagar o número e a área historicamente atribuídos.

## Decisões MEU CAMP para a Sprint 9

- **DECISÃO DE PRODUTO:** a área pertence à subchave/grupo. Todas as lutas do mesmo grupo permanecem na mesma área no MVP; somente o grupo inteiro pode ser movido.
- **DECISÃO DE PRODUTO:** `fight_number` é global no evento.
- **DECISÃO DE PRODUTO:** enquanto a programação estiver em DRAFT, grupos podem ser movidos e a numeração global pode ser recalculada.
- **DECISÃO DE PRODUTO:** após a publicação ou início da operação, a numeração fica congelada.
- **DECISÃO DE PRODUTO:** WO, resultado, cancelamento ou ausência não renumeram; lacunas históricas são preservadas.
- **DECISÃO DE PRODUTO:** a futura identidade do professor operacional continua pendente e não bloqueia o primeiro lote.

## Gaps conhecidos após o fechamento da Sprint 9

O recorte aprovado cobre área, numeração global, freeze, programação pública e visão por equipe derivadas da mesma persistência. A consulta pública segue `LUTA → ÁREA → CATEGORIA → EQUIPE` de `FESTIVAL.pdf` e a visão por equipe de `ZYCH_JIU_JITSU_CATEGORIA.pdf`, sem duplicar a programação.

Permanecem fora deste fechamento, com evidência no benchmark e sem implementação:

- duração da categoria, observada em `ZYCH_JIU_JITSU_CATEGORIA.pdf` e ainda sem campo no domínio;
- professor operacional;
- pesagem;
- premiação;
- placar;
- horário automático, não demonstrado nas fontes;
- chamada ao vivo.
