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

## 3. Organização real

Criada em 2026-09-19 01:35 America/Sao_Paulo (−03) no projeto `kfvypacjzlzwwblsbpwj`.

| Campo | Valor |
| --- | --- |
| Nome | MEU CAMP |
| Slug | `meu-camp` |
| Organização | `8c13e5c0…d4db` |
| Owner | usuário já existente no Auth/profile; `4e5465eb…328e`; `role = owner` |
| Eventos / equipes / atletas / inscrições / pagamentos desta org | 0 |

Não foi criado evento, equipe, atleta, inscrição nem pagamento. Não foi chamado Asaas. MC-SIM r1/r2 e as 5 organizações anteriores (incluindo `Organização Teste Ricardo` e resíduos E2E) permaneceram inalterados. Contagem de organizações: 5 → 6.

A policy `organizations_admin_insert` continua exigindo `is_platform_admin()`. Esta criação foi assistida com service role. Não foi inserida linha em `platform_user_roles`.

## 4. Backup e restore

Verificado em 2026-09-19 01:25 America/Sao_Paulo (−03). Restore **não** foi executado. Nenhum dump/export foi gerado. Nenhum backup pontual foi criado.

### Evidência comprovada

| Item | Fato |
| --- | --- |
| Projeto | `kfvypacjzlzwwblsbpwj` (`zigjiu`), região `us-west-2`, compute `t4g.nano` |
| Plano | Free Plan (texto do painel) |
| Home do projeto | **Last backup: No backups** |
| Scheduled backups | [Database → Backups → Scheduled](https://supabase.com/dashboard/project/kfvypacjzlzwwblsbpwj/database/backups/scheduled): “Free Plan does not include project backups.” Sem lista, sem data, sem identificador. |
| PITR | [Database → Backups → Point in time](https://supabase.com/dashboard/project/kfvypacjzlzwwblsbpwj/database/backups/pitr): “Point in Time Recovery is a Pro Plan add-on.” CLI: `pitr_enabled: false`. |
| API Management | `GET /v1/projects/kfvypacjzlzwwblsbpwj/database/backups` em 2026-09-19 01:22:11 −03: `backups: null`, `physical_backup_data: {}`, `pitr_enabled: false`, `walg_enabled: true`. |
| Backup automático existente | **Não encontrado.** |
| Backup pontual criado neste lote | **Não.** O plano atual não oferece criação de backup agendado nem PITR. Não foi contornado. |

`walg_enabled: true` **não** é backup existente: o painel e a lista da API não mostram cópia, data nem identificador restaurável.

Dump/export lógico (`supabase db dump`) é recomendação documental do Free Plan. **Não executado** neste lote: não substitui backup da plataforma e exigiria credencial de banco + arquivo com dados reais fora do repositório.

### Restore (não executar)

Capacidade atual: **não comprovada** — não há backup listado para restaurar. A UI de Scheduled / PITR existe, mas o Free Plan não inclui backups de projeto e o PITR não está habilitado.

Quando existir backup restaurável (upgrade Pro com cópia diária, ou add-on PITR):

1. Restaurar pelo painel o backup identificado.
2. Conferir: `organizations`, `organization_members`, `profiles`, `events`, `registrations`, `payments`, `payment_registrations`, `webhook_events`, `event_audit_logs`, eventos `MC-SIM%`.
3. Não reaplicar migrations do HEAD sobre um restore do mesmo projeto, salvo o painel indicar schema incompleto.

### Antes de qualquer limpeza E2E futura

É necessário um ponto de recuperação **real** (backup Pro/PITR ou export lógico autorizado e guardado fora do repo). Hoje esse ponto **não existe**. Não apagar MC-SIM nem profiles/Auth desconhecidos sem confirmação.

## 5. Migrations

- 32 arquivos em `supabase/migrations/`.
- Schema sondado compatível com o HEAD congelado.
- Histórico remoto em `schema_migrations` = não comprovado (CLI sem permissão de login role).
- Isso **não** bloqueia este lote. Não contornar a CLI.

## 6. Pré-publicação do HEAD (navegação)

Em 2026-09-19 a operação admin deixou de usar `/gerenciar` como hub. Prototipos `regulamento`, `pesagem`, `placar`, `secretaria`, `filiacao` e `tarefas` redirecionam; não foram promovidos a feature.

Jornada real: `/admin/eventos` → configurar / checagem / financeiro / chaves / programação / resultados.

### Envs necessárias na Vercel (não gravadas neste lote)

Obrigatórias no Production, sem commitar valores:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (URL pública do deploy)
- `SUPABASE_SECRET_KEY`
- `PAYMENTS_MANUAL_ONLY=true`

Asaas Sandbox (`ASAAS_ENVIRONMENT`, `ASAAS_SANDBOX_API_KEY`, `ASAAS_WEBHOOK_TOKEN`) não deve ser usado no go-live. A emissão fica recusada enquanto `PAYMENTS_MANUAL_ONLY=true`.

## 7. Fora deste recorte

Onboarding self-service, convite de membros, atleta independente, console admin, Asaas Live, exportação, benchmark de tatame (placar, cronômetro, chamada, horário automático, pesagem individual).
