# MEU CAMP — Relatório de migração visual

**Data:** 5 de novembro de 2026  
**Tipo:** consolidação. Não é redesign. Sem deploy. Sem migration. Sem alteração de regras de auth/Asaas/LIVE.

## O que mudou neste lote

### Público

- Chaves preenchidas: saíram `Card`/`StatusBadge` arredondados. Entraram faixas, número, quadrado + texto. Textos oficiais preservados.
- Inscrição pública: chrome `PublicEventFrame`; lista em faixas; resumo retangular. `registerAthletes`, checkboxes, professor operacional e termos intactos.
- Checagem pública: chrome `PublicEventFrame`, h1 `Checagem — {nome}` visível, filtros e DataTable/MobileRecord preservados.
- `PublicEventFrame` aceita `informacoes`, `checagem` e `chaves`.

### Administração

- `AdminEventNav`: sem ícones, maiúsculas, traço 36px, labels iguais (Programação, Operação LIVE).
- `EventAdminHero`: cantos retos, meta com `·`, status `onDark`.
- `EventsHub`: ações retangulares, métricas sem raio, tabs com traço 36px. Cards de evento permanecem como lista operacional.
- Miolo operacional (`configuracao`, `checagem`, `financeiro`, `chaves`, `programacao`, `resultados`): `data-mc-admin-op` força cantos retos; ícones decorativos de cabeçalho removidos; `StatusBadge` virou quadrado 8px + texto. Regras, actions e tabelas intactas.
- Login administrativo: `label` da senha aponta para o input; botão de submit com `scroll-mt-20`.

### Acessibilidade

- `CategoryDurationEditor` diferencia desktop e mobile no `id`.

### Palco `/eventos`

- Companheira nunca repete o arquivo do carrossel (já no working tree; conferido: `bjj-2.jpg` × `dojo-wide.jpg`).

## O que foi preservado

- Seis itens da nav pública e rótulo Horário.
- Filtros e duração da programação pública.
- Motor de chaves, WO, copo, sem confronto.
- Home cinematográfica.
- LIVE (cronômetro, pontuação, UNDO, concorrência). Chip “Sair da operação” retangular; painéis de pontuação inalterados.
- Pagamento, RLS, autenticação.

## Arquivos principais deste lote

- `app/eventos/[id]/chaves/page.tsx`
- `app/eventos/[id]/checagem/page.tsx`
- `app/eventos/[id]/inscricao/cadastrar-atleta/page.tsx`
- `app/eventos/[id]/inscricao/cadastrar-atleta/RegistrationForm.tsx`
- `components/events/public-event/PublicEventFrame.tsx`
- `components/AdminEventNav.tsx`
- `components/events/admin/EventAdminHero.tsx`
- `app/admin/eventos/EventsHub.tsx`
- `app/admin/eventos/[id]/(operacao)/configuracao/CategoryDurationEditor.tsx`
- `app/admin/eventos/[id]/(operacao)/configuracao/page.tsx`

## Lotes recomendados para um futuro RC (não executados)

1. Tokens e fundamentos (já estáveis).
2. Componentes compartilhados (`StatusBadge` público vs admin).
3. Páginas públicas (este lote).
4. Inscrição (este lote, chrome).
5. Administração miolo (este lote).
6. LIVE visual mínimo (chip de saída).
7. Testes E2E autenticados (ainda bloqueados no harness) + documentação.

Não misturar estes lotes num único commit. Manifesto: `docs/releases/UI-CONSOLIDATION-RC.md`.
