# Financeiro — Lote 4: fechamento do evento com cobrança PIX e split

Fonte de verdade do Lote 4. Convive com o Lote 3 (PIX direto ao organizador) e com o motor percentual do Lote 1, que não foi removido.

## Política comercial v1 (congelada)

- `FIXED_PER_PAID_REGISTRATION`: R$ 8,00 (800 centavos) por inscrição `efetivada` com pagamento `pago`.
- O valor oficial vive na RPC `create_event_financial_settlement`; o organizador não informa nem altera taxa, wallet ou percentual.
- Cada fechamento grava `commercial_policy_snapshot` (`policy`, `version`, `valueCents`, `currency`, `basis`).
- `event_platform_fees` e o snapshot `payment_registrations.platform_fee_cents` continuam como estavam: o fechamento não depende deles.

## Fechamento

| Tabela | Conteúdo | Leitura (RLS) |
| --- | --- | --- |
| `event_financial_settlements` | fechamento numerado por evento, totais congelados, cobrança Asaas, split e distribuição | owner, organizer, finance e admin da plataforma |
| `event_financial_settlement_items` | inscrição, pagamento, bruto e taxa de cada linha (`registration_id` único em toda a tabela) | mesmos papéis, via fechamento visível |
| `organization_billing_customers` | cliente Asaas da organização (um por organização) | somente servidor |

- Emissão: owner/organizer da organização ou admin da plataforma. Bloqueada enquanto houver comprovante `em_analise` no evento.
- Uma inscrição paga entra em no máximo um fechamento. Novas inscrições pagas depois da emissão geram o fechamento seguinte (`sequence_number` + 1).
- Imutabilidade por trigger, inclusive para a credencial privada: totais, taxa, snapshot, referência, cobrança e `split_id` não mudam depois de gravados; fechamento `pago`/`cancelado` não muda de estado; itens não aceitam `UPDATE`.
- Estados: `pendente_emissao` → `emitindo` → `aguardando_pagamento` → `pago`; `reconciliacao` quando o resultado no Asaas fica incerto. Distribuição: `pendente` → `concluido` (`falhou` reservado).
- Sem escrita direta pelo cliente. RPCs `SECURITY DEFINER` com `search_path = ''`; só `create_event_financial_settlement` é executável por `authenticated`; as demais são exclusivas de `service_role`. `anon` não executa nenhuma.

## Cobrança PIX com split

- Reaproveita `issueReservedPayment` (claim persistido antes do POST, busca por `externalReference`, recusa 4xx libera o claim, resultado incerto vai para conciliação) e `provisionPaymentCustomer`.
- Referência: `meucamp:settlement:<id>`. Cliente: `meucamp:org:<id>`, nome da organização. Organização não tem CPF/CNPJ no schema: o primeiro emissor (owner/organizer) fornece o CPF do próprio perfil, exigido só enquanto não existe cliente pronto.
- `split: [{ walletId: ASAAS_SPLIT_RECIPIENT_WALLET_ID, percentualValue: 50 }]`. Somente a conta recebedora entra no array; a emissora fica com o restante. O Asaas aplica o percentual sobre o líquido (`netValue`).
- Split devolvido pelo Asaas que não bata com a configuração impede a persistência e leva à conciliação.
- A resposta da criação nunca marca o fechamento como pago.
- Habilitação independente do atleta: `PLATFORM_SETTLEMENT_ASAAS_ENABLED=true`, `ASAAS_ENVIRONMENT=sandbox`, `ASAAS_SANDBOX_API_KEY`, `ASAAS_SPLIT_RECIPIENT_WALLET_ID`, `ASAAS_SPLIT_RECIPIENT_PERCENT=50`. `PAYMENTS_MANUAL_ONLY=true` continua desligando Asaas/boleto no checkout do atleta e não bloqueia o fechamento.

## Webhook

- `/api/payments/webhook` autentica pelo header `asaas-access-token` e despacha por `event` antes de exigir `payment`.
- Referência `meucamp:settlement:` → `process_settlement_webhook`:
  - `PAYMENT_RECEIVED`: exige mesma cobrança, referência, valor, `PIX` e `RECEIVED`; marca `pago`, grava `paid_at` e o `netValue` real (sem estimar taxa).
  - `PAYMENT_SPLIT_DONE`: exige `additionalInfo.splitId` compatível; grava `split_id`, evento do provedor e `distribution_done_at`; conclui uma única vez.
  - Demais eventos do fechamento: `ignorado`.
- Outras referências seguem para `process_payment_webhook` (fluxo do atleta inalterado).
- Eventos sem cobrança, splits sem fechamento e payloads fora do contrato são gravados como `ignorado` e respondidos com 200. Só envelope sem `id`/`event` recebe 400; falha de persistência recebe 503.
- Deduplicação por `webhook_events (gateway, external_event_id)`. Auditoria em `event_audit_logs`: `event_financial_settlement_created`, `_issued`, `_paid`, `_split_done`.

## Telas

- Financeiro do evento: card "Fechamento financeiro" com confirmadas fora de fechamento, `N × R$ 8,00`, total, emissão com confirmação, fechamentos emitidos, status, QR Code, copia e cola, validade e "Pagar via PIX"/"Exibir PIX novamente".
- Admin da plataforma: bloco "Auditoria da plataforma" com fechamento, cobrança, bruto, líquido, split 50%, status do split, wallet e split mascarados e datas.

## Homologação no Asaas Sandbox (2026-10-15)

- Deploy `jiu-three.vercel.app` (projeto Vercel `jiu`, sem integração Git: `vercel deploy --prod` + `vercel alias set`). Production recebeu `ASAAS_ENVIRONMENT`, `ASAAS_SANDBOX_API_KEY`, `ASAAS_WEBHOOK_TOKEN` (token exclusivo de Production, diferente do local), `ASAAS_SPLIT_RECIPIENT_WALLET_ID`, `ASAAS_SPLIT_RECIPIENT_PERCENT` e `PLATFORM_SETTLEMENT_ASAAS_ENABLED`, todas sensíveis.
- Webhook "Meu Camp Sandbox" da Conta A: mesmo token de Production, envio `SEQUENTIALLY`, eventos `PAYMENT_RECEIVED`, `PAYMENT_REFUNDED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED` e `PAYMENT_SPLIT_DONE` (habilitado só depois de confirmar o handler publicado).
- Smoke real `settlement-smoke-20261015-195227`: 2 inscrições pagas → R$ 16,00; PIX com split 50% para a Conta B; reexibição reutilizou a cobrança; confirmação pelo endpoint do Sandbox; webhooks reais `PAYMENT_SPLIT_DONE` e `PAYMENT_RECEIVED` processados em segundos; fechamento `pago` com líquido R$ 15,01; distribuição `concluido`; split `DONE` de R$ 7,50 no Asaas; reentrega do evento real respondida como duplicata; limpeza por IDs exatos.
- O Asaas entregou `PAYMENT_SPLIT_DONE` antes de `PAYMENT_RECEIVED`; o handler aceita as duas ordens.
- Fila sequencial: um evento recusado bloqueia os seguintes até o reenvio dar certo. Na primeira tentativa, um `PAYMENT_DELETED` antigo recusado com 401 (Production ainda sem token) atrasou a entrega e os eventos chegaram depois da limpeza; ficaram em `webhook_events` como `falhou` ("Fechamento ou cobranca divergente"), respondidos com 200, sem interromper a fila.

## Limites

- Fora do escopo: subconta, BaaS, split do atleta, cartão/boleto do atleta, payouts, bloqueio de inadimplente. A seleção da conta Asaas de produção está descrita abaixo e não liga o checkout do atleta.
- Cancelamento e estorno de fechamento não têm transição automática (eventos ficam registrados para conciliação).
- Na Vercel, a emissão só liga com as variáveis de habilitação da conta ativa; sem elas o card informa que o pagamento está desligado. O webhook autentica pelo token dessa conta e não emite cobrança.

## Asaas Sandbox

`ASAAS_ENVIRONMENT=sandbox` usa somente:

- `https://api-sandbox.asaas.com/v3`
- `ASAAS_SANDBOX_API_KEY`
- `ASAAS_WEBHOOK_TOKEN`
- `ASAAS_SPLIT_RECIPIENT_WALLET_ID`

O percentual continua `ASAAS_SPLIT_RECIPIENT_PERCENT=50`.

## Asaas Production

`ASAAS_ENVIRONMENT=production` usa somente:

- `https://api.asaas.com/v3`
- `ASAAS_PRODUCTION_API_KEY`
- `ASAAS_PRODUCTION_WEBHOOK_TOKEN`
- `ASAAS_PRODUCTION_SPLIT_RECIPIENT_WALLET_ID`

Produção só fica completa quando as três variáveis de produção estão presentes. Não há fallback para chave, token ou carteira de Sandbox. Uma variável ausente falha como configuração.

`PAYMENTS_MANUAL_ONLY=true` continua mantendo o checkout do atleta fora do Asaas. `PLATFORM_SETTLEMENT_ASAAS_ENABLED` continua decidindo se o fechamento da plataforma pode emitir.
