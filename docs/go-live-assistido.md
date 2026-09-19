# Go-live assistido — proteção do Supabase atual

Projeto: `kfvypacjzlzwwblsbpwj` (`zigjiu`).
Recorte: operação assistida. Cobrança do primeiro evento = baixa manual.
Não reutilizar `Organização Teste Ricardo`. MC-SIM r1/r2 permanecem intactos.
Não limpar resíduos E2E neste lote.

## 1. Automações

`automação/.env.e2e` deve ter `E2E_ALLOW_WRITES=false`.

Com a flag diferente de `true`, Full Event, MC-SIM, fixtures Playwright `@write` e smokes de escrita falham ou são ignorados **antes** de inserir. `cleanup:e2e --execute` também recusa. Dry-run de cleanup continua somente leitura.

Não executar essas suítes durante o evento real.

## 2. Asaas Sandbox

Variável de servidor: `PAYMENTS_MANUAL_ONLY=true`.

Efeito:

- `issuePayment` recusa sem chamar o gateway;
- `createPaymentGateway` recusa no mesmo modo;
- a UI não mostra **Emitir cobrança**;
- reserva PIX/boleto continua só no banco (não chama Asaas);
- baixa manual em `/admin/eventos/[id]/financeiro` permanece.

Código Asaas permanece no repositório. Para a Vercel, gravar `PAYMENTS_MANUAL_ONLY=true` no ambiente de Production **antes** do deploy futuro. Este lote não faz deploy.

## 3. Criar a organização real (não executar sem nome)

Não criar agora: faltam nome oficial da organização, slug e e-mail do owner.

Quando o cliente fornecer esses três dados, no SQL Editor do **mesmo** projeto, como papel com bypass de RLS (postgres / service role), nesta ordem:

1. Confirmar que o owner já existe em `auth.users` e `profiles` (cadastro no MEU CAMP).
2. Inserir a organização **nova** (não usar `Organização Teste Ricardo`):

```sql
insert into public.organizations (nome, slug, created_by)
values ('<NOME_OFICIAL>', '<slug-unico>', '<user_id_do_owner>')
returning id, nome, slug;
```

3. Vincular o owner:

```sql
insert into public.organization_members (organization_id, user_id, role)
values ('<organization_id>', '<user_id_do_owner>', 'owner');
```

4. Conferir: a org nova aparece só para esse usuário; MC-SIM r1/r2 e a org Ricardo permanecem inalterados.

A policy `organizations_admin_insert` exige `is_platform_admin()`. Sem linha em `platform_user_roles`, a criação pela UI do app **não** funciona. O procedimento acima é SQL assistido, coerente com o recorte.

Não alterar atletas, eventos ou checagem MC-SIM.

## 4. Backup e restore

Nenhum backup foi executado neste lote. Plano do projeto (PITR/retenção) = não comprovado aqui.

### Backup (aguardar autorização; não altera dados)

1. Abrir [Database → Backups](https://supabase.com/dashboard/project/kfvypacjzlzwwblsbpwj/database/backups).
2. Registrar data, hora e tipo (automático diário ou dump pontual).
3. Se o plano permitir download/export, guardar o arquivo fora do repositório.
4. Anotar o identificador do backup neste documento quando existir.

### Restore (não executar agora)

1. Restaurar pelo mesmo painel o backup identificado.
2. Conferir tabelas críticas: `organizations`, `organization_members`, `profiles`, `events`, `registrations`, `payments`, `payment_registrations`, `webhook_events`, `event_audit_logs`, eventos `MC-SIM%`.
3. Não reaplicar migrations do HEAD sobre um restore do mesmo projeto, salvo o painel indicar schema incompleto.

### Antes de qualquer limpeza E2E futura

Backup primeiro. Só então apagar orgs/eventos E2E. Não apagar MC-SIM nem profiles/Auth desconhecidos sem confirmação.

## 5. Migrations

- 32 arquivos em `supabase/migrations/`.
- Schema sondado compatível com o HEAD congelado.
- Histórico remoto em `schema_migrations` = não comprovado (CLI sem permissão de login role).
- Isso **não** bloqueia este lote. Não contornar a CLI.

## 6. Fora deste recorte

Onboarding self-service, convite de membros, atleta independente, console admin, Asaas Live, exportação, benchmark de tatame (placar, cronômetro, chamada, horário automático, pesagem individual).
