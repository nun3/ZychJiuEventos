# Movimento e scrollytelling — MEU CAMP

Versão: 1.1
Data: 8 nov 2026
Status: gramática permanente de movimento. Não é autorização para redesenhar páginas.

O arquivo-fonte externo `MOTION-AND-SCROLLYTELLING.md` v1.1 não estava neste repositório, no lab nem em busca pública. Esta versão 1.1 reconcilia, sem inventar token nem redesenhar tela:

- tokens de movimento de `docs/design-system/README.md` e `sprint-6.5.md`
- regras de motion de `AGENTS.md` (§11)
- skill `zero-jank-scroll` 0.2.0 (auditoria e arquitetura de scroll)
- skill `scroll-craft` (gramática narrativa, só onde a página já é narrativa)

Implementação cinematográfica já aprovada (Cover Flow, overlay fullscreen, Halftone) vive na integração `integration/motion-lab-eventos-20261107`. Esta missão não a altera.

## Objetivo

O movimento do MEU CAMP deve parecer o mesmo produto em qualquer superfície: suave, curto, funcional. A intensidade muda com a finalidade da página. Operação não herda o pico emocional da Home. A Home não herda a densidade da secretaria.

> Clareza antes de decoração. Competição antes de SaaS. Confiança antes de espetáculo.

## Tokens oficiais (não criar outros)

| Papel | Token CSS | Alias Tailwind | Duração |
| --- | --- | --- | --- |
| Rápido | `--mc-motion-fast` | `duration-mc-fast` | 150ms |
| Normal | `--mc-motion-normal` | `duration-mc-normal` | 200ms |
| Lento | `--mc-motion-slow` | `duration-mc-slow` | 250ms |

`prefers-reduced-motion: reduce` zera os três tokens em `app/globals.css`. Qualquer coreografia GSAP/Framer deve ficar atrás de `gsap.matchMedia('(prefers-reduced-motion: no-preference)')` ou equivalente. Conteúdo e ação permanecem compreensíveis sem animação.

Propriedades preferidas: `transform` e `opacity`. Evitar `transition: all`, animar width/height/top/left, `will-change` amplo e estado React a cada frame de scroll.

## Intensidade por finalidade

O agente escolhe **um** nível antes de propor movimento. Não misturar níveis na mesma tela.

### Nível 0 — Operação

Rotas: `/admin/*`, `/dashboard/*`, `/platform/*`, placar, pesagem, checagem operacional, chaves de operação, LIVE.

- Scroll nativo. Sem scrollytelling, parallax, pin ou scrub.
- Motion só em feedback de UI (hover, foco, abrir/fechar, loading).
- Duração máxima: `duration-mc-fast` ou `duration-mc-normal`.
- Sem GSAP ScrollTrigger, sem React Bits, sem pico emocional.

A internet pode parar. As lutas não. A secretaria não é landing.

### Nível 1 — Superfície pública de tarefa

Rotas: `/eventos` (catálogo), detalhe público, inscrição, login utilitário.

- Revelações curtas e opt-in (`data-mc-fade`, `data-mc-line`) quando a página já as usa.
- Sem pin de seção, sem trilha `300vh`, sem segundo motor de scroll.
- Catalogo e formulário prevalecem sobre espetáculo.
- React Bits só com autorização explícita, isolado em `components/react-bits/`, nunca em `components/ui`.

### Nível 2 — Narrativa institucional

Rotas: Home cinematográfica, `/quem-somos`, `/sistema`, `/academias`, `/noticias`.

- `SiteScrollChoreography` já no `app/layout.tsx` é o motor único de scroll institucional.
- Home usa `CinematicStory` (GSAP + ScrollTrigger). Não criar um segundo scrollytelling paralelo.
- Um pico emocional por jornada, não por seção.
- Respeitar opt-out já existente: `[data-hero]`, `[data-login-stage]`, `[data-portal]`, `[data-finale]`, `[data-chapter]`, `[data-traditions]`, `[data-no-scroll-choreography]`.
- `scroll-craft` informa variedade e contenção; não autoriza template de landing genérico, diorama, glow ou “01 / 06”.

### Nível 3 — Cinematográfico aprovado (não mexer nesta missão)

Cover Flow 3D, overlay de conta em tela cheia, rodapé Halftone. Fonte de verdade: worktree `jiu-motion-integration`, não este checkout. Qualquer porto para esta branch é lote separado, com autorização.

## Arquitetura de scroll (zero-jank)

Antes de editar, classificar a interação:

1. **Ativação discreta** — capítulos, item ativo, sticky de painel. Padrão: elementos reais + `position: sticky` + um `IntersectionObserver`. Sem matemática contínua de progresso.
2. **Mapeamento contínuo** — barra de progresso, parallax proporcional, scrub simples. Padrão: native scroll + `transform`/`opacity`, sem `setState` por frame.

Regras não negociáveis da skill, vigentes no MEU CAMP:

1. Preservar scroll nativo.
2. Escolher a arquitetura mais simples que expressa a interação.
3. Distância de scroll vem de conteúdo real, não de `300vh` arbitrário.
4. Não esconder acoplamento de layout atrás de percentuais inventados.
5. Não dirigir estado de framework a cada frame.
6. Não ler e escrever layout no mesmo caminho de scroll.
7. Animar `transform` e `opacity` por padrão.
8. Oferecer experiência em fluxo normal ou reduced-motion.
9. Não afirmar suavidade sem evidência de runtime.
10. Conteúdo permanece compreensível se a animação falhar.

Motor já existente: GSAP + ScrollTrigger + `@gsap/react` (`SiteScrollChoreography`, `CinematicStory`). Framer Motion aparece em cards/modais pontuais. Não adicionar Lenis, Locomotive, nova lib de smooth-scroll nem segundo ScrollTrigger root.

Auditoria de fonte (somente leitura): `.agents/skills/zero-jank-scroll/scripts/audit-scroll-source.mjs`. Inventário desta rodada: `MOTION-INVENTORY.md`.

## React Bits

Registry configurado em `components.json`:

```
"registries": {
  "@react-bits": "https://reactbits.dev/r/{name}.json"
}
```

Validado em 8 nov 2026: `GET https://reactbits.dev/r/BlurText-JS-CSS.json` → HTTP 200, `type: registry:component`.

Política:

- O alias `ui` do `components.json` aponta para `components/react-bits`, para não colidir com o Design System em `components/ui`.
- `npx shadcn add @react-bits/…` não faz parte desta missão e não deve rodar sem autorização.
- Bits de fundo (Aurora, Dark Veil, glitch, neon, metal) são incompatíveis com a identidade MEU CAMP, salvo prova em contrário no lote que os pedir.
- Preferir ausência a um bit que dispute atenção com a competição.

## Skills de agente

Instalação local, modo copy, lock em `skills-lock.json`:

| Skill | Fonte | Agentes |
| --- | --- | --- |
| `scroll-craft` | `nateherkai/scroll-craft` | Codex (`.agents/skills`), Claude Code (`.claude/skills`), GitHub Copilot (lê `.agents/skills`) |
| `zero-jank-scroll` | `harshavarma02/zero-jank-scroll-agent-skill` | Idem |

`validacao-por-risco` permanece intacta em `.claude/skills/validacao-por-risco`.

Usar `scroll-craft` só em Nível 2, e mesmo assim sem gerar página nova. Usar `zero-jank-scroll` para auditar e reparar scroll em qualquer nível, sem aumentar intensidade.

## O que esta gramática não autoriza

- Redesenhar Home, login, catálogo, overlay cinematográfico ou Motion Lab.
- Reintroduzir “Experimentar sem cadastro”, pata geométrica ou Patojitsu como logo.
- Smooth-scroll global sem override de reduced-motion.
- Parallax em operação, glow, bounce, neon, estética gamer.
- Segundo motor de scroll ao lado de `SiteScrollChoreography`.
- Merge, push ou deploy desta preparação.

## Relação com o restante do Design System

- Cores, tipo, radius, spacing: `README.md` e `sprint-6.5.md` prevalecem.
- Telas públicas já migradas: `PADRAO-TELAS.md`.
- Componentes-base: `components/ui`. React Bits não entra aí.
- Qualquer mudança visual futura continua testada por risco (`.claude/skills/validacao-por-risco`).
