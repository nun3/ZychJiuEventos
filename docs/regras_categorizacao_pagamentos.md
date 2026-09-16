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

### Atleta sozinho

Durante a checagem, agrupar inscrições efetivadas por categoria. Se o total for 1, habilitar solicitação de mudança apenas para categorias elegíveis segundo idade, faixa, gênero, peso e regras do evento. A aprovação é do organizador.

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
