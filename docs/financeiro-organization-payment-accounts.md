# Identidade financeira por organização (Lote 2)

Fundação multi-tenant para configuração financeira futura (BaaS), sem integração Asaas neste lote.

Código:

- migration: `supabase/migrations/202610100001_organization_payment_accounts.sql`
- domínio: `lib/finance/organization-payment-account.ts`
- server: `lib/finance/organization-payment-account-server.ts`
- smoke: `supabase/tests/organization_payment_accounts_smoke.sql`
- unit: `automação/tests/organization-payment-account.test.ts`

---

## O que a tabela representa

`organization_payment_accounts` liga:

```text
organização → configuração/identidade financeira → provedor futuro → readiness
```

Uma linha por `(organization_id, provider)`.

## O que NÃO representa

- conta bancária do organizador
- saldo, ledger, carteira interna
- recebíveis, extrato, payout real
- KYC concluído ou wallet válida no PSP

---

## Matriz de acesso

| Perfil | Ler própria org | Inicializar (RPC) | Update sensível (RPC) | Outra org |
|---|---|---|---|---|
| owner / organizer | sim | sim | não | não |
| finance | sim | não | não | não |
| staff | não | não | não | não |
| platform_admin | sim | sim | sim | sim |

Mutação direta (INSERT/UPDATE/DELETE) pelo cliente autenticado: **bloqueada** (sem policies de escrita).

RPCs:

- `create_organization_payment_account_pending` → grava `status=not_started`, externos nulos
- `admin_update_organization_payment_account` → somente platform admin; **rejeita `ready`** neste lote

Helpers reutilizados: `is_platform_admin()`, `has_organization_role()`.

---

## Readiness

Neste lote:

- `isFinanciallyReady(...)` → sempre `false`
- `getOrganizationFinancialReadiness` nunca retorna `ready: true` nem reason `READY`

Motivos possíveis: `NO_ACCOUNT`, `ACCOUNT_PENDING`, `KYC_PENDING`, `PAYOUT_PENDING`, `RESTRICTED`.

Futuro gate (ainda **não** ligado ao fluxo operacional):

```text
PIX automático somente se financial readiness = READY
```

`PAYMENTS_MANUAL_ONLY=true` permanece obrigatório. Reserva, baixa manual, webhook e taxa fixa (`event_platform_fees`) não mudam neste lote.

---

## Fronteiras

| Área | Neste lote |
|---|---|
| Commercial fee (Lote 1) | não alterado; não ligado |
| Asaas HTTP / BaaS | não |
| Hub público | não |
| Taxa fixa operacional | permanece vigente |

Próximo gate: Lote 3 — onboarding BaaS Sandbox, somente após isolamento multi-tenant validado.
