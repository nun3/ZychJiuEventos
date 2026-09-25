# Homologação ponta a ponta — Sandbox MEU CAMP

Cenário destrutível de homologação do ciclo completo no Sandbox `kfvypacjzlzwwblsbpwj` (`zigjiu`).

O contrato canônico `automação/tests/features/full-event.feature` permanece congelado. Este cenário vive em arquivo separado.

## Arquivo

`automação/tests/features/full-event-homologation.feature`

Tags: `@homologation` `@full-event-sandbox` `@writes`

## Proteção

Default permanente: `E2E_ALLOW_WRITES=false`.

A homologação só grava quando o processo é iniciado com `E2E_ALLOW_WRITES=true`. Antes da primeira mutation ela confirma:

- host Supabase = `kfvypacjzlzwwblsbpwj.supabase.co`;
- ambiente não é Production/Vercel;
- organização ativa = MEU CAMP (`PUBLIC_ORGANIZATION_ID`);
- `PAYMENTS_MANUAL_ONLY=true`.

Qualquer desvio falha rápido, sem criar dados.

Os scripts `test:bdd`, `test:write` e `bdd:full-event` ignoram `@homologation`.

## Execução

Com a aplicação local apontando ao Sandbox:

```bash
cd automação
E2E_ALLOW_WRITES=true npm run bdd:homologation
```

Não alterar o valor salvo em `.env.e2e`. Não usar Vercel. Sem push e sem deploy.

## Run ID

Toda entidade criada carrega um identificador `MC-E2E-YYYYMMDD-HHMMSS` (America/Sao_Paulo).

O cleanup remove somente IDs capturados pela execução ou nomes com esse run id. Não remove owner, organização MEU CAMP, MC-SIM, Organização Teste Ricardo nem massa fora do recorte.

## Evidências

O cenário anexa PNGs `fullPage` ao `testInfo` (`01` a `20`) e o JSON de identidade. Abrir com:

```bash
npx playwright show-report
```

`trace` e `video` ficam em `retain-on-failure`. Screenshot automático de falha permanece.
