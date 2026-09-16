# Automação E2E — Meu Camp

Suíte de regressão em Playwright + Playwright-BDD. Cobre autenticação, autorização, equipes, atletas, eventos, arquivos e inscrições até a Sprint 5.

## Preparação

Com a aplicação disponível em `http://localhost:3000`, instale as dependências da automação:

```bash
npm install
```

Para habilitar os cenários autenticados, copie `.env.e2e.example` para `.env.e2e` e preencha contas exclusivas do ambiente de testes. O arquivo real não é versionado.

- `E2E_OWNER_*`: usuário com vínculo `owner` em uma organização.
- `E2E_UNAUTHORIZED_*`: uma segunda conta, diferente do `owner`, autenticada e sem nenhum registro em `organization_members`.
- `E2E_ALLOW_WRITES=true`: libera o cenário que cria duas equipes, cria um atleta fictício e audita sua troca de equipe. Mantenha `false` para execução somente leitura.

## Execução

```bash
npm run test:smoke
npm run test:bdd
npm run test:write
npm run test:unit
npm run test:bdd -- --grep @sprint5
```

`test:smoke` valida rapidamente os fluxos públicos e as barreiras de autenticação. `test:bdd` executa toda a regressão disponível e ignora, com motivo explícito, cenários cujas credenciais não foram configuradas. `test:write` executa somente a massa mutável e exige a autorização pela variável de ambiente.

O relatório HTML é gravado em `playwright-report/` e os artefatos de falha em `test-results/`.

## Sprint 5

- `test:unit`: cálculo da idade (incluindo aniversário e ano bissexto), limites inclusivos de peso/faixa/idade, gênero, ordem, ausência e ambiguidade.
- `@sprint5`: inscrição pendente com preço e termos, bloqueio de duplicidade após recarregar, histórico individual e consolidado, ausência de categoria e prazo indisponível.
- Os cenários de escrita criam equipes, atletas e eventos únicos no Sandbox; não dependem de uma massa fixa e não removem registros existentes.
- Aplicar as migrações `202609050001_registration_domain.sql` e `202609050002_registration_hardening.sql` antes de testar.
- Executar `../supabase/tests/registration_domain_smoke.sql` no SQL Editor do Sandbox para validar permissões reais, inscrição própria e em lote, rollback atômico, termos, prazo, fase, categoria e imutabilidade. A massa desse script é revertida ao final.
- Os cenários completos de inscrição têm até 90 segundos por envolver cadastro de massa e múltiplas gravações remotas. Login aguarda o botão habilitado após hidratação.
- Node 24 é usado nos testes unitários. Pagamentos e efetivação são escopo da Sprint 6.
