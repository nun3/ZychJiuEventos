# MEU CAMP — Inventário de componentes

**Data:** 5 de novembro de 2026  
**Escopo:** working tree local. Sem deploy.  
**Fonte visual:** `PADRAO-TELAS.md` + implementação de `/eventos` e `/eventos/[id]`.

Classificação:

- **CANÔNICO:** padrão aprovado, reutilizar.
- **ESPECIALIZADO:** comportamento próprio, identidade comum.
- **LEGADO:** gramática antiga, migrar quando a tela entrar no lote.
- **EXPERIMENTAL:** não contaminar o padrão oficial.
- **DEPRECATED:** candidato a remoção depois da migração completa.

## Estrutura pública

| Componente | Classe | Uso |
| --- | --- | --- |
| `PublicEventHero` | CANÔNICO | Palco do detalhe. |
| `PublicEventFrame` | CANÔNICO | Chrome das seções do campeonato. |
| `EventsFeaturedStage` | CANÔNICO | Palco/carrossel de `/eventos`. |
| `EventsCatalog` | CANÔNICO | Lista real do calendário. |
| `EventPublicNavigation` | CANÔNICO | Seis itens, traço 36px. |
| `PublicEventVenueMap` | CANÔNICO | Endereço + OSM. |
| `EventContentSidebar` | CANÔNICO | Subseções de Informações. |
| `SiteScrollChoreography` | EXPERIMENTAL | Só home/login. Não usar no h1 do detalhe. |

## Navegação

| Componente | Classe | Uso |
| --- | --- | --- |
| `ModernNavbar` | CANÔNICO | Barra global `h-16`. |
| `InternalNavigation` | CANÔNICO | Área autenticada, traço 36px. |
| `AdminEventNav` | CANÔNICO (lote 2026-11-05) | Operação do evento. Labels operacionais intactos, inclusive Programação. |
| `EventAdminHero` | ESPECIALIZADO | Contexto do evento no admin. Meta com `·` e status `onDark`. |
| `EventAdminShell` | CANÔNICO (lote 2026-11-05) | Envolve as superfícies com `data-mc-admin-op`. |

## UI base (`components/ui`)

| Componente | Classe | Nota |
| --- | --- | --- |
| `Button` / `Input` / `Select` / `FormField` | CANÔNICO | Formulários. |
| `DataTable` / `MobileRecord` | ESPECIALIZADO | Densidade operacional. Desktop + mobile com IDs distintos. |
| `Alert` | CANÔNICO | Feedback. |
| `StatusBadge` | CANÔNICO (lote 2026-11-05) | Quadrado 8px + texto. Prop `onDark` no palco navy. Sem pílula. |
| `Card` | LEGADO nas telas públicas migradas | Raio `mc-medium`. Não usar no interior público já migrado. |
| `EmptyState` | LEGADO nas telas públicas migradas | Ícone + card. Faixa `border-y` substitui. |
| `PageHeader` | LEGADO no público | Usa `data-mc-line` e esconde o h1 até o scroll. Não usar no detalhe. |
| `Dialog` / `Dropdown` / `Tabs` | CANÔNICO | Interações. |

## Especializados

| Componente | Classe | Restrição |
| --- | --- | --- |
| `CategoryManager` / `CategoryDurationEditor` | ESPECIALIZADO | Não alterar regras de categoria. IDs desktop/mobile únicos. |
| Bracket admin / Schedule admin | ESPECIALIZADO | Motor esportivo intacto. |
| `OperatorBoard` / placar LIVE | ESPECIALIZADO | Não aplicar layout editorial. |
| `RegistrationForm` | CANÔNICO (lote 2026-11-05) | Campos e `registerAthletes` intactos. |
| `EventsHub` | ESPECIALIZADO | Hub do organizador; identidade alinhada, cards de operação mantidos. |
| Home cinematográfica | EXPERIMENTAL | Não redesenhar nesta missão. |

## Duplicados resolvidos neste lote

- Palco de `/eventos`: companheira não repete o arquivo do carrossel.
- Duração de categoria: `fight-duration-{id}` (desktop) e `fight-duration-mobile-{id}` (mobile).
