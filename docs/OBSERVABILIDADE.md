# Observabilidade

O logger de servidor fica em `lib/observability/logger.ts`. Ele escreve uma linha JSON por evento, com `level`, `event` e `ts`, mais o contexto informado pelo chamador.

Uso:

```ts
logger.info('event.published', { operation: 'transition', eventId, result: 'publicado' })
logger.warn('payment.webhook.rejected', { operation: 'webhook', result: 'unauthorized' })
logger.error('settlement.issue.failed', { operation: 'issue', eventId, result: 'request' })
```

Campos úteis: `operation`, `result`, `organizationId`, `eventId`, `paymentId`, `durationMs`.

Nunca entram no log: senha, token, JWT, service role, API key, cookie, sessão, CPF, valor financeiro, payload de webhook e conteúdo de comprovante. Chaves cujo nome indica segredo são descartadas.

Scripts de linha de comando continuam usando stdout quando a saída é o produto do comando.

Hoje os eventos vão para stdout/stderr do processo. Na Vercel isso aparece em Vercel Logs sem cliente extra. Sentry e OpenTelemetry podem consumir a mesma linha JSON depois, se houver projeto e credencial. Esta fase não adiciona nenhum dos dois.
