# Política de release

## Branch principal

A branch de produção é `master`. Esta política não renomeia a branch.

## Pull request

Mudança destinada à produção entra por pull request. Commit direto em `master` não é o caminho de release.

## Gates mínimos

Antes do merge:

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run hardening:check`
- `npm run build`
- CI verde em `.github/workflows/ci.yml`

`npm run verify` reúne esses gates locais. Suítes Playwright que escrevem no banco, chamam o Asaas ou exigem `E2E_ALLOW_WRITES=true` ficam de fora do CI genérico e só rodam de forma opt-in.

## Produção

O deploy sai apenas do código já aprovado na branch principal. Esta política não autoriza deploy a partir de árvore suja nem de branch de experimento.

## Rollback

Na Vercel, o retorno é promover o deployment anterior já publicado do mesmo projeto. Isso restaura o código daquele deployment. Não restaura o banco.

## Banco

Migrations ficam versionadas em `supabase/migrations`, entram por revisão e seguem adição compatível. Mudança destrutiva precisa de plano próprio, com janela e conferência do que será perdido, antes de ser aplicada.

## Dados

O plano atual do Supabase não tem backup agendado nem PITR habilitado. Não há restore garantido. Enquanto não existir uma cópia restaurável fora do repositório, recuperação de dados é um risco operacional aberto. Não apagar dados reais para “limpar” um ambiente sem um ponto de recuperação comprovado.
