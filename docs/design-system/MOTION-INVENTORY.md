# Inventário preliminar de movimento

Data: 8 nov 2026
Base auditada: worktree `/home/nune/Meus Projetos/jiu-event-readiness`, branch `feature/cinematic-auth-v2`, HEAD `32addc0`.
Modo: somente leitura. Nenhum componente funcional foi alterado.
Ferramenta: `.agents/skills/zero-jank-scroll/scripts/audit-scroll-source.mjs --json` em `app/` (132 arquivos) e `components/` (90 arquivos).
Evidência bruta: `evidencias/motion-source-audit-20261108.json`.

A integração cinematográfica publicada (`jiu-motion-integration` @ `5ce3369`) não foi auditada neste checkout. Cover Flow, overlay fullscreen e Halftone não aparecem aqui.

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

| Superfície | Nível | Observação |
| --- | --- | --- |
| `/admin/*`, `/dashboard/*`, `/platform/*`, LIVE/placar | 0 | `SiteScrollChoreography` já recusa esses pathnames |
| `/eventos`, detalhe, inscrição | 1 | Revelações opt-in; catálogo prevalece |
| Home, institucionais | 2 | `CinematicStory` + data-attributes |
| Cover Flow / overlay / Halftone | 3 | Fora desta base; não portar nesta missão |

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
