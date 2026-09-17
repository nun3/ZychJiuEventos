# Regras Executaveis de Categorizacao e Pagamentos

## Categorizacao

Entrada obrigatoria: data de nascimento, genero, faixa, peso em kg e regras da categoria do evento.

1. Calcular idade na data oficial do evento usando a data completa de nascimento.
2. Buscar categorias do evento com `idade_min <= idade <= idade_max`.
3. Filtrar por genero compatível.
4. Filtrar por faixa dentro do intervalo permitido.
5. Filtrar por peso com `peso_min_kg <= peso_kg <= peso_max_kg`.
6. Se houver exatamente uma categoria, alocar automaticamente.
7. Se não houver categoria, bloquear a inscrição e informar o motivo.
8. Se houver mais de uma categoria, aplicar a ordem configurada pelo organizador; se persistir ambiguidade, exigir escolha/validação do organizador.

A categoria alocada deve ser congelada na inscrição. Mudanças posteriores não alteram o perfil do atleta e somente ocorrem por solicitação aprovada.
O calculo deve registrar a versao do conjunto de regras e os dados de entrada usados. Limites de peso sao inclusivos e comparados como decimal, nunca ponto flutuante.

`category_is_eligible_for_registration` governa somente esta alocação automática. Não é a regra de realocação da checagem.

### Atleta sozinho

Durante a checagem, agrupar inscrições efetivadas pela categoria vigente (`coalesce(current_category_id, category_id)`). Se o total for 1, e o evento estiver em checagem destravada, habilitar solicitação de **realocação operacional** para categorias adjacentes no mesmo rule set da inscrição original.

A elegibilidade de destino **não** revalida o snapshot contra peso ou idade da categoria-alvo.

Regra padrão da plataforma (ainda sem flags por evento/rule set):

- peso: subir exatamente 1 classe adjacente; não descer; não pular classe existente;
- idade: subir ou descer exatamente 1 classe adjacente; não pular classe existente;
- um destino altera peso **ou** idade, nunca os dois;
- gênero permanece o mesmo;
- intervalo de faixa (`faixa_min_ordem` / `faixa_max_ordem`) permanece exatamente igual;
- sobreposição ou duplicidade de intervalos no grupo relevante falha fechado: nenhum destino naquele eixo;
- buraco em kg sem categoria intermediária: a próxima existente é a adjacente.

Adjacência usa intervalos estruturais, não o nome nem `ordem`. Correção de faixa é outro fluxo.

A aprovação do organizador grava somente `current_category_id`. Snapshot e `category_id` original permanecem imutáveis. A próxima análise parte da categoria vigente após o override.

Dívida consciente: o PRD condiciona a permissão às regras do evento, mas ainda não há schema para habilitar/desabilitar eixos. A política acima é o default da plataforma até existir configuração em `category_rule_sets`.

## Pagamento

### Pagamento individual

1. Criar uma cobrança para uma inscrição pendente.
2. Gravar `payment` e `payment_registrations`.
3. Exibir QR Code/copia e cola ou boleto.
4. Aguardar Webhook do gateway.
5. Confirmar pagamento somente após validação do evento recebido.

### Pagamento unificado

1. Usuário seleciona uma ou mais inscrições pendentes do mesmo evento.
2. Validar que possui permissão sobre todas.
3. Criar uma cobrança com a soma dos valores.
4. Vincular todas em `payment_registrations`.
5. Confirmar ou expirar todas conforme o estado da cobrança.
6. Recusar seleção que misture eventos diferentes.

### Webhook

- Validar token/assinatura do gateway.
- Persistir o identificador do evento recebido.
- Ignorar eventos já processados.
- Atualizar pagamento e inscrições em uma transação.
- Aceitar eventos fora de ordem sem regredir um pagamento ja confirmado.
- Responder HTTP 200 após persistência válida.
- Registrar falhas e permitir reprocessamento seguro.

### Gateway inicial

Implementar primeiro um adaptador para Asaas Sandbox, mantendo o domínio independente do fornecedor. O adaptador deve cobrir cobrança PIX, boleto, consulta de status e Webhook. Mercado Pago pode ser adicionado como segundo adaptador.

Tarifas, prazo de recebimento, estorno e taxa da plataforma permanecem configuráveis e não devem ser codificados como valores fixos.
