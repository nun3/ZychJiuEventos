# Modelo comercial MEU CAMP (Lote 1)

Domínio puro do motor de taxa percentual e distribuição societária.

- Código: `lib/finance/commercial-fee.ts`
- Testes: `automação/tests/commercial-fee.test.ts`

Este motor **não** é a integração Asaas. Não emite cobrança, não cria split no PSP e não altera settle/webhook.

---

## Regra comercial congelada

- Taxa padrão MEU CAMP: **10% do valor bruto** (`DEFAULT_PLATFORM_RATE_BPS = 1000`).
- Promoção inicial configurável: **8%** (`PROMOTIONAL_PLATFORM_RATE_BPS = 800`) por **5 meses** a partir da **primeira inscrição paga** da organização (`firstPaidAt`), não da criação da conta.
- A receita MEU CAMP é dividida **50% / 50%** entre os parceiros Junior e Ricardo.
- Os percentuais individuais (ex.: 5% + 5%) são **consequência** da divisão 50/50 sobre a taxa da plataforma — não taxas fixas independentes sobre o bruto.
- O custo real do PSP/Asaas é suportado pela **organização** e não reduz a receita de Junior/Ricardo.

Identidade contábil:

```text
gross = providerFee + organizerNet + juniorAmount + ricardoAmount
```

---

## Arredondamento

- Toda matemática usa **centavos inteiros** e **basis points** (sem float).
- Taxa da plataforma: `floor(grossCents * rateBps / 10000)`.
- Distribuição entre parceiros: `floor` por parceiro; o **centavo residual** vai para o **último parceiro** na ordem estável (Junior, depois Ricardo).

Exemplo: taxa de 801 centavos → Junior 400, Ricardo 401.

---

## Fronteira com a operação atual

Enquanto os lotes de snapshot/wire não entrarem:

- A operação vigente continua com **taxa fixa por inscrição** em `event_platform_fees.fee_cents`.
- O snapshot na efetivação continua em `payment_registrations.platform_fee_cents`.
- A UI em `PlatformFeeCard` e o fechamento em `lib/finance/event-closing.ts` **não** foram alterados neste lote.

O motor percentual fica pronto para ser consumido nos lotes seguintes (contas financeiras, BaaS, split, snapshot).

---

## Precedência da taxa efetiva

1. Override explícito (`platformRateBps` no input).
2. Política `PROMOTIONAL` ativa (`now` dentro de `[startsAt, startsAt + durationMonths)`).
3. Política `STANDARD`.
4. Fallback `DEFAULT_PLATFORM_RATE_BPS`.

Datas da promoção não ficam hardcoded no cálculo do split; entram via `resolvePlatformRateBps`.

---

## Fora deste lote

- Subcontas Asaas / onboarding BaaS
- Split no PSP
- `payment_financial_snapshot`
- Migrations financeiras
- Mudanças em webhook, issuance ou `PAYMENTS_MANUAL_ONLY`
