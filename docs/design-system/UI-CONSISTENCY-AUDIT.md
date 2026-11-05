# MEU CAMP — Auditoria de consistência de UI

**Data:** 5 de novembro de 2026  
**Referência de produção:** `FUNCTIONAL-RELEASE` / `dpl_5bo3LahBCroVETNjbZ4fAExxn2YA`  
**Referência visual:** working tree local + `PADRAO-TELAS.md`  
**Deploy:** não executado.

## Matriz de rotas

| Rota | Layout | Componentes | Inconsistência restante | Prioridade | Risco |
| --- | --- | --- | --- | --- | --- |
| `/` | Home cinematográfica | `SiteScrollChoreography` | Própria por decisão. | Baixa | Alto se tocada |
| `/eventos` | Palco + catálogo | `EventsFeaturedStage`, `EventsCatalog` | Nenhuma neste lote. Companheiras distintas. | — | Médio (carrossel) |
| `/eventos/[id]` | Hero + subseções | `PublicEventHero`, `EventContentSidebar`, `PublicEventVenueMap` | “Sobre” só se `informacoes` existir. | — | Médio |
| `/eventos/[id]/participantes` | Frame | `PublicEventFrame` | Sem foto pública (projeção). | — | Baixo |
| `/eventos/[id]/chaves` | Frame + faixas | `PublicEventFrame` | Preenchido não conferido com chave publicada neste evento TESTE. | Alta (feita) | Médio |
| `/eventos/[id]/lutas` | Frame | `PublicEventFrame` | — | — | Baixo |
| `/eventos/[id]/programacao` | Frame + filtros | `PublicEventFrame` | — | — | Médio (filtros) |
| `/eventos/[id]/resultados` | Frame | `PublicEventFrame` | — | — | Baixo |
| `/eventos/[id]/checagem` | Frame | `PublicEventFrame`, `DataTable` | Tabela operacional no preenchido. | Média (feita no chrome) | Médio |
| `/eventos/[id]/inscricao/cadastrar-atleta` | Frame + form | `RegistrationForm` | Exige login. Chrome alinhado. | Alta (feita) | Alto (regras) |
| `/admin/eventos` | Hub | `EventsHub` | Cards de operação mantidos (especializado). | Média (nav/ações) | Médio |
| `/admin/eventos/[id]/*` | Hero + nav + miolo denso | `EventAdminHero`, `AdminEventNav`, `data-mc-admin-op` | Densidade operacional preservada; cantos retos e status quadrado. | — | Alto |
| `/admin/eventos/[id]/operacao` | LIVE | `OperatorBoard` | Chip de saída retangular. Painéis de pontuação permanecem especializados. | — | Crítico se lógica alterada |
| `/dashboard/*` | Interna | `InternalNavigation` | Formulários de perfil ainda com raio DS. | Baixa | Médio |
| Auth `/login` | Cinemática | GSAP | Fora deste lote. | — | Alto |

## Tokens

Tokens `mc-*` em `app/globals.css` / `tailwind.config.js` permanecem. Paleta não mudou.

Valores arbitrários aceitos neste lote: `text-[11px]`, `tracking-[0.14em]`, `w-9` (36px), `h-2 w-2` (status). São a gramática já aprovada no calendário.

## Acessibilidade

- IDs duplicados de duração: corrigidos (`fight-duration-{id}` vs `fight-duration-mobile-{id}`).
- Checagem pública saiu do `PageHeader` com `data-mc-line` (h1 visível sem scroll).
- Nav pública e admin: item atual visível, scroll interno, scrollbar oculta.
- Overflow da página: 0 em 320, 360, 390, 430, 768, 1440 nas rotas públicas conferidas.
- Login administrativo: `htmlFor` da senha aponta para o input, não para o wrapper do botão “Mostrar senha”.

## Não inventado

Premiação, formas de pagamento, declaração de saúde, direito de imagem, contato da organização, foto de participante.
