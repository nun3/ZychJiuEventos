# MEU CAMP — Resultados de regressão visual

**Data:** 5 de novembro de 2026  
**Alvo:** `http://localhost:3000`  
**Evento:** TESTE `52bb0f67-dba2-478c-9551-6c3c4e902feb`  
**Deploy:** não executado.

## Executado

| Verificação | Resultado |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `next lint` nos arquivos admin/UI/LIVE deste lote | PASS |
| `next build` | PASS (warning pré-existente em `components/EventDetails.tsx`) |
| Unitários apresentação + venue + LIVE domain | 27/27 PASS |
| Playwright público: 4 rotas × 6 viewports | PASS (24/24, HTTP 200, overflow false) |
| Carrossel / nav pública / h1 oficiais | PASS (lote anterior, código preservado) |

## Capturas

Pasta: `docs/design-system/evidencias/ui-consolidation-2026/`

Públicas: `eventos-390-rc.png`, `eventos-1440-rc.png`, `informacoes-390-rc.png`, `informacoes-1440-rc.png`, `chaves-390-rc.png`, `chaves-1440-rc.png`.

Login administrativo (página, sem sessão): `admin/autenticacao-1440.png`.

## Console

404 de `favicon.ico` (pré-existente). Após `next build` no mesmo processo de `next dev`, os chunks `/_next/static/chunks/main-app.js` passaram a 404; o dev server foi reiniciado. Sem isso a hidratação do login falha.

## Não executado / bloqueado

| Fluxo | Resultado | Motivo |
| --- | --- | --- |
| Login organizador → hub → superfícies | BLOCKED | Harness Playwright não dispara o `onSubmit` React do login administrativo; sessão não persiste. Sem escrita. |
| Financeiro autenticado | NOT_RUN | Dependente do login. |
| Checagem / chaves / programação / LIVE autenticados | NOT_RUN | Dependente do login. |
| Logout | NOT_RUN | Dependente do login. |
| Suíte BDD completa | NOT_RUN | Fora do critério desta missão. |
| `npm run test:unit` completo | NOT_RUN | Falha pré-existente de path `@/` em `registration-correction.test.ts`; não pertence a este lote visual. |
| Produção `jiu-three.vercel.app` | NOT_RUN | Proibido. |

## Riscos residuais

- Chaves preenchidas e LIVE pontuado não foram vistos com dados reais neste evento TESTE.
- Navbar fixa intercepta clique Playwright no submit do login quando o botão é rolado para `top: 0`.
- Working tree amplo (home cinematográfica, pagamentos, evidências antigas) permanece fora do manifesto de RC.

## Veredito

Identidade recente preservada nas rotas públicas. Miolo administrativo padronizado no código. E2E autenticado bloqueado. Sem deploy.
