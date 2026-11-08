# Inventário preliminar de movimento

Data: 8 nov 2026
Base auditada: worktree `/home/nune/Meus Projetos/jiu-event-readiness`, branch `feature/cinematic-auth-v2`, HEAD de código `32addc0` (a gramática v1.2 não reexecuta a auditoria).
Modo: somente leitura. Nenhum componente funcional foi alterado.
Ferramenta: `.agents/skills/zero-jank-scroll/scripts/audit-scroll-source.mjs --json` em `app/` (132 arquivos) e `components/` (90 arquivos).
Evidência bruta: `evidencias/motion-source-audit-20261108.json`.
Gramática vigente: `MOTION-AND-SCROLLYTELLING.md` v1.2 (casca versus conteúdo; Nível 0 não é ausência de animação).

A integração cinematográfica (`jiu-motion-integration`, HEAD commit `5ce3369` em 8 nov 2026, working tree sujo) **não** foi auditada neste checkout. Cover Flow, overlay fullscreen e Halftone não aparecem nesta base; na integração eles são casca/palco Nível 3 e devem ser preservados. Reauditoria zero-jank só depois da incorporação documental, nessa outra base.

## Motores já existentes

| Motor | Onde | Nível sugerido | Nota |
| --- | --- | --- | --- |
| Tokens `--mc-motion-*` | `app/globals.css`, `tailwind.config.js` | todos | 150 / 200 / 250ms; reduced-motion zera os tokens |
| GSAP + ScrollTrigger | `SiteScrollChoreography`, `CinematicStory` | 2 | Motor único de scrollytelling institucional |
| GSAP matchMedia | `ModernNavbar` (menu mobile) | 0–1 | Cascata de itens, não scroll-driven |
| Framer Motion | `ModernEventCard`, `StatsSection`, `NewAthleteModal` | 1 | Hover/presença pontual |
| CSS keyframes / view-transition | `app/globals.css`, login | 1–2 | Entrada de auth; reduced-motion presente |

`IntersectionObserver` detectado em `components/`. `prefers-reduced-motion` detectado em `app/` e `components/`.

## Superfícies por intensidade (mapa, não redesign)

O nível abaixo descreve o **conteúdo**. A casca cinematográfica aprovada (navbar/overlay/Halftone) é Nível 3 na integração e não reclassifica o miolo.

| Superfície | Conteúdo | Casca (integração) | Observação |
| --- | --- | --- | --- |
| `/admin/*`, `/dashboard/*`, `/platform/*`, LIVE/placar | 0 | 3 | `SiteScrollChoreography` já recusa esses pathnames. Motion de miolo: hover, foco, dialog, underline — imediato. |
| Catálogo `/eventos`, detalhe, inscrição | 1 | 3 | Em `/eventos` o palco Cover Flow é Nível 3; o catálogo é Nível 1. |
| Home, institucionais | 2 | 3 | `CinematicStory` + data-attributes. Scrollytelling opt-in, não global. |
| Cover Flow / overlay / Halftone | 3 | 3 | Fora desta base; preservar na integração; não portar neste checkout. |

## Achados da auditoria de fonte

Heurística. Não prova jank em runtime. 21 ocorrências: 16 `review`, 5 `warning`. Zero `error`. Nada foi corrigido nesta rodada.

### Warning (5)

| Arquivo | Regra | Leitura |
| --- | --- | --- |
| `app/globals.css:153,323,329` | `transition-all` | Nomear propriedades na próxima passagem visual; não refatorar em massa agora |
| `components/ModernNavbar.tsx:307` | transição de propriedade de layout | Preferir transform/opacity se a barra for retocada |
| `components/ModernNavbar.tsx:130` | `react-scroll-state` | Listener de scroll chama `setState` (overlayAtTop). Já há throttle via rAF no working tree local; runtime não foi medido aqui |

### Review (16)

- `backdrop-filter` em `globals.css` (glass). Custo de compositing, sobretudo sob header fixo.
- Listener global de scroll em `ModernNavbar.tsx`.
- `getBoundingClientRect` em navegação interna, navbar, card, onboarding e `SiteScrollChoreography` (este último só na montagem da coreografia, para filtrar candidatos abaixo da dobra).
- `scroll-behavior: smooth` em `globals.css:143`. Reduced-motion já existe no mesmo arquivo (tokens zerados); confirmar override explícito para `auto` numa passagem futura.

Nenhum `300vh` de trilha, nenhum `will-change: all`, nenhum segundo smooth-scroll library.

## Fora de escopo desta preparação

- Instalar componentes React Bits.
- Alterar `SiteScrollChoreography`, `CinematicStory`, navbar, login ou catálogo.
- Medição de FPS / runtime evidence (a skill exige isso antes de afirmar suavidade).
- Publicar, fazer merge ou deploy.
