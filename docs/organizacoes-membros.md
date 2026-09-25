# Organizações e membros

Lote estrutural mínimo. Sem onboarding self-service, sem convite e sem transferência de ownership.

## Papéis reais no schema

`organization_role`: `owner`, `organizer`, `staff`, `finance`.

- `owner`: cria/gerencia membros da própria organização e opera o que o contrato atual já permite.
- `organizer`: opera eventos conforme permissões já existentes. Não gerencia membros.
- `finance`: visão/operação financeira conforme regras já existentes. Não gerencia membros.
- `staff`: permanece no enum porque a operação (programação, pesagem, chaves) já o consulta. O owner **não** atribui `staff` neste lote.

Somente `platform_admin` cria organização e associa o owner inicial. Owner só atribui `organizer` e `finance`.

## Superfícies

- `/platform/organizacoes`: console do platform admin.
- `/dashboard/organizacao`: gestão de membros pelo owner.
- Meu Perfil mostra organização e papel; não vira console.

## Segurança

RPCs `SECURITY DEFINER`:

- `create_organization_with_owner`
- `add_organization_member`
- `remove_organization_member`
- `list_organization_members`

A policy de escrita direta em `organization_members` foi removida. Inserts de membership no client autenticado passam a falhar; fixtures de teste continuam no service role.

`PUBLIC_ORGANIZATION_ID` permanece o contexto da release para catálogo e eventos. A console de platform admin é exceção global. A página de membros do owner usa a organização da release quando o usuário é owner dela; se ele for owner de exatamente uma outra organização, administra essa.

## Limitações conscientes

- `organization_members` tem `created_at` e não tem `created_by`.
- Auditoria global de membership não foi inventada. `event_audit_logs` é por evento e não serve neste lote.
- Remover membership não apaga Auth, profile, atleta nem histórico.
- Equipes técnicas do professor (`create_managed_team`) continuam sem `organization_role`.
