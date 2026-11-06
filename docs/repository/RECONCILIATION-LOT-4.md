# MEU CAMP — Reconciliação Lote 4

**Veredito:** **RECONCILIATION LOT 4 — PASS**  
**Data:** 5 de novembro de 2026

Isolamento das superfícies públicas institucionais a partir do manifesto do Lote 1. A home cinematográfica publicada não foi redesenhada. Sem merge com os Lotes 2 e 3, sem autenticação, pagamento, LIVE ou migration.

## Branch e commits

| Item | Valor |
| --- | --- |
| Worktree | `/home/nune/Meus Projetos/jiu-lote4-public` |
| Branch | `ui/public-surfaces` |
| Pai | `9ef6baf` (`docs/production-manifest-20261105`) |
| Baseline de produção | `b0a32c7dcfe39769f7754d25b8180e2d80cb46ec` |
| Deploy de referência | `dpl_AMKofx7oNmQnQiPhr2xDTWSdUPaa` |
| HEAD (antes deste relatório) | `39f8d3e893d14dc137df693be6636234d297203b` |
| Push | não executado |

### Commits de produto

| Hash | Tree | Mensagem |
| --- | --- | --- |
| `5334a20dca1d5cfee21c82b4da8439115fd81f7a` | `3604c218bcf50bfe11383871255be400abaf8778` | `feat(ui): alinhar palco institucional e filtros públicos ao editorial` |
| `1b835be606997788fbb4538e97905b8196f7045f` | `2e5aec2eb728dedc8de5697846979c1150793be1` | `feat(ui): aplicar o palco cinematográfico em quem somos e sistema` |
| `848fa9f8c887705251becc626a7c2ed2a42b62e8` | `a1023e76608a8463e6cf46d03c55493b50da025a` | `feat(ui): aplicar o palco cinematográfico em academias e notícias` |
| `39f8d3e893d14dc137df693be6636234d297203b` | `b88275e6fd165f89702808dc137ea4a919e2ee58` | `test(ui): cobrir navegação das superfícies públicas isoladas` |

## Arquivos incorporados

### Commit 1 — compartilhados

- `components/InstitutionalPage.tsx` — palco fotográfico + painel branco, `titleLines`, `caption`, `aria-label` no `h1`.
- `components/EventFilters.tsx` — sincroniza `initialSearch`; superfície e placeholder da variante `toolbar` usada pelo calendário publicado.

### Commit 2 — institucionais

- `app/quem-somos/page.tsx`
- `app/sistema/page.tsx`

### Commit 3 — academias e notícias

- `app/academias/page.tsx`
- `app/noticias/page.tsx`

### Commit 4 — testes

- `automação/playwright.public.config.ts`
- `automação/tests/public-surfaces.spec.ts`

## Arquivos excluídos

| Arquivo local | Classificação | Motivo |
| --- | --- | --- |
| `components/HomeHighlightsCarousel.tsx` | experimento / morto | Não é importado. Home publicada usa `CinematicStory`. Versão local com blur contradiz `PADRAO-TELAS`. |
| `components/EditorialEventCard.tsx` | morto | Não é importado. `/eventos` usa `EventsCatalog` / `EventsFeaturedStage` (HEAD). |
| `components/ui/PageHeader.tsx` (`data-mc-line`) | risco de a11y | Só entra em dashboard/platform, onde a coreografia já é ignorada. `PADRAO-TELAS` evita esconder `h1`. |
| Login cinematográfico, `AuthSplitShell`, middleware | Lote 3 / fora | Autenticação intocada |
| Webhook, checkout, Asaas, settlement | financeiro | Restrição absoluta |
| `lib/categorization.ts` | Lote 5 | Bloqueado |
| Motor LIVE / `jiu-live` | fora | Intocado |
| `app/eventos/page.tsx`, `HomeClient.tsx` | já publicados | Diff vazio vs HEAD |

## Inventário vs produção

| Superfície | Produção | Neste lote | Necessário? |
| --- | --- | --- | --- |
| Home `/` | Cinematográfica (`CinematicStory`) | Sem mudança | Preservar |
| `/eventos` palco e catálogo | `EventsFeaturedStage` + `EventsCatalog` | Sem mudança de página; filtros toolbar mais claros | Sim, contrato do calendário |
| `/academias`, `/noticias`, `/quem-somos`, `/sistema` | Faixa navy + título em bloco | Palco fotográfico + painel, mesmo texto e links | Sim — alinhamento editorial |
| Conteúdo institucional | Cartões, vazio de notícias, jornada | Preservado | Sim |
| Inscrição / pagamento / admin | HEAD | Sem toque | Sim |

## Dependências

| Destino | Fonte | Estado |
| --- | --- | --- |
| Fotos do palco | `public/images/cinematic/*` já em HEAD | resolvido |
| Navbar / footer | HEAD | `overlayAtTop` continua ignorado no navbar (pré-existente) |
| Coreografia | `SiteScrollChoreography` já no `app/layout.tsx` | `data-mc-line` / `data-mc-stagger` nas institucionais; `prefers-reduced-motion` respeitado |
| Calendário | `EventsCatalog` HEAD chama `EventFilters variant="toolbar"` | contrato de filtros preservado |
| Lotes 2 e 3 | dashboard / auth | **não mesclados** |

Nenhuma dependência de login cinematográfico, webhook, Asaas ou LIVE. Nenhuma implementação fictícia.

## Avaliação visual

Evidências em `docs/repository/evidencias/lote-4/`:

| Arquivo | O que mostra |
| --- | --- |
| `home-1440.png` | Home cinematográfica intacta |
| `academias-1440.png` / `academias-390.png` | Palco + painel; botões e texto originais |
| `noticias-1440.png` | Estado vazio sem publicação inventada |
| `quem-somos-1440.png` / `sistema-1440.png` | Mesma gramática editorial |
| `eventos-1440.png` / `eventos-390.png` | Palco do calendário publicado, sem redesign |

Diferença intencional com a produção: as quatro institucionais deixam a faixa navy simples e passam ao split fotográfico já usado na home. Não é regressão da home nem de `/eventos`.

## Testes

Ambiente isolado: `npx next start -p 3024` neste worktree. Sem escrita em produção.

| Checagem | Resultado |
| --- | --- |
| Backup `archives/SHA256SUMS` | PASS |
| `npx tsc --noEmit` | PASS |
| `next lint` nos arquivos do lote | PASS |
| `npx next build` | PASS — `/` 14.6 kB (igual ao lote 3 / HEAD) |
| Unitário `catalog-presentation.test.ts` | **4/4 PASS** |
| Playwright `public-surfaces.spec.ts` | **9/9 PASS** |

### Cobertura G5

| # | Superfície | Resultado |
| --- | --- | --- |
| 1 | Home | PASS |
| 2 | Academias | PASS |
| 3 | Notícias (vazio) | PASS |
| 4 | Quem somos | PASS |
| 5 | Sistema | PASS |
| 6 | Calendário `/eventos` + filtro | PASS |
| 7 | Detalhe público ou 404 | PASS |
| 8 | Navegação (CTAs + rodapé) | PASS |
| 9 | Estado vazio de notícias | PASS |
| 10 | 390px e 1440px, sem overflow horizontal | PASS |

Console da home sem `pageerror`. Requisições 4xx de estáticos do Next foram ignoradas no critério.

## Riscos residuais

1. `ModernNavbar` ainda ignora `overlayAtTop`; a barra branca sobre o navy é a mesma da home/eventos HEAD.
2. Títulos institucionais usam `data-mc-line` (animação de máscara). Em `prefers-reduced-motion` a coreografia não corre. O `h1` tem `aria-label` com o título completo.
3. `HomeHighlightsCarousel` e `EditorialEventCard` continuam no working tree original, sem uso.
4. Branch sem push; GitHub permanece divergente.

## Working tree original

`/home/nune/Meus Projetos/jiu` permanece em `wip/local-pre-reconcile-20261019` @ `b0a32c7`. **61** rastreados modificados preservados. Backup `/home/nune/Meus Projetos/jiu-backups/worktree-reconcile-20261105-201911` revalidado (`archives/SHA256SUMS` PASS). Nenhum arquivo original foi descartado.

## Não executado

Deploy, push, merge com Lotes 2/3 ou `origin/master`, migrations, `zigjiu`, `homework`, `jiu-live`, autenticação, pagamentos, motor LIVE.
