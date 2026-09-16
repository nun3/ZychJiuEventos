# Maquinas de Estado

## Estado do evento

```text
RASCUNHO -> PUBLICADO -> INSCRICAO -> PAGAMENTO -> CHECAGEM -> CHAVES -> EM_ANDAMENTO -> CONCLUIDO
    |            |            |            |            |           |              |
    +------------+------------+------------+------------+-----------+------------> CANCELADO
```

Transicoes:

- `rascunho -> publicado`: evento passa a ser publicamente consultavel, sem necessariamente aceitar inscricoes.
- `publicado -> inscricao`: fase de inscricao iniciou.
- `inscricao -> pagamento`: novas inscricoes sao bloqueadas e cobrancas pendentes ainda podem ser pagas.
- `pagamento -> checagem`: prazo de pagamento terminou e a lista de efetivados e publicada.
- `checagem -> chaves`: checagem encerrada e lista travada.
- `chaves -> em_andamento`: chaves publicadas e operacao esportiva iniciada.
- `em_andamento -> concluido`: resultados e fechamento financeiro consolidados.
- `qualquer estado anterior a concluido -> cancelado`: somente Admin ou Organizador autorizado.
- Reabertura ou regressao de fase e uma operacao excepcional, exige justificativa e auditoria.
- Datas de fase sao armazenadas em UTC e interpretadas no fuso IANA definido no evento.

## Estado da inscricao

```text
RASCUNHO -> PENDENTE_PAGAMENTO -> EFETIVADA -> CANCELADA
                    |               |
                 EXPIRADA        ESTORNADA
```

- A inscricao pode existir como `rascunho` durante o preenchimento e passa a `pendente_pagamento` ao ser confirmada.
- Pagamento confirmado ou baixa manual muda para `efetivada`.
- Prazo vencido sem pagamento muda para `expirada`; cancelamento e uma acao distinta e auditada.
- Cancelamento ou estorno não permite entrada na checagem.

## Estado do pagamento

```text
AGUARDANDO -> PAGO
     |          |
 EXPIRADO   ESTORNADO
     |
 CANCELADO
```

- Cada cobrança possui um identificador único no gateway.
- O retorno do gateway é assíncrono e deve ser processado de forma idempotente.
- Pagamento unificado pode conter várias inscrições, mas somente do mesmo evento.

## Estado da solicitação de categoria

```text
PENDENTE -> APROVADA
    |
 RECUSADA
```

- A categoria inicial é calculada automaticamente.
- Durante a checagem, usuário autorizado pode solicitar alteração.
- Somente Admin ou Organizador do evento aprova ou recusa.
- Aprovação gera histórico e atualiza a inscrição antes do travamento.
- Após o travamento da checagem, novas solicitações ficam bloqueadas.

## Estado da checagem e chaves

- `checagem_aberta`: lista consultável e solicitações permitidas.
- `checagem_travada`: somente leitura; fonte oficial para chaves.
- `chaves_draft`: geração ainda não publicada.
- `chaves_publicadas`: consulta pública liberada.
- Uma nova versão de chave deve preservar a anterior e registrar o motivo.
