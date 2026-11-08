# Movimento e scrollytelling — MEU CAMP

Versão: 1.2
Data: 8 nov 2026
Status: gramática permanente de movimento. Não é autorização para redesenhar páginas nem para implementar visual.

Esta versão consolida a v1.1 (`0bd765a`) com a leitura aprovada de Nível 0, casca versus conteúdo e coexistência de intensidades na mesma rota. Não inventa token. Não altera componente.

Fontes:

- tokens de movimento de `docs/design-system/README.md` e `sprint-6.5.md`
- regras de motion de `AGENTS.md` (§11): animações funcionais, 150/200/250ms, `prefers-reduced-motion`
- `CLAUDE.md`: Design System permanente; pata geométrica e Patojitsu descartados
- skill `zero-jank-scroll` 0.2.0 — desempenho e arquitetura de scroll; não elimina microinteração útil
- skill `scroll-craft` — referência de contenção narrativa; **sem autoridade para redesenhar** layouts aprovados
- implementação cinematográfica aprovada na integração `integration/motion-lab-eventos-20261107` (Cover Flow, overlay, Halftone)

> Clareza antes de decoração. Competição antes de SaaS. Confiança antes de espetáculo.

## Objetivo

O movimento do MEU CAMP deve parecer o mesmo produto em qualquer superfície: suave, curto, funcional. A intensidade segue a **finalidade de cada região**, não o pathname inteiro.

Uma mesma página pode combinar níveis. Scrollytelling **não** é obrigatório. Operação não herda o pico emocional da Home. A Home não herda a densidade da secretaria. A casca cinematográfica aprovada pode aparecer sobre conteúdo operacional sem transformar a secretaria em landing.

## Tokens oficiais (não criar outros)

| Papel | Token CSS | Alias Tailwind | Duração |
| --- | --- | --- | --- |
| Rápido | `--mc-motion-fast` | `duration-mc-fast` | 150ms |
| Normal | `--mc-motion-normal` | `duration-mc-normal` | 200ms |
| Lento | `--mc-motion-slow` | `duration-mc-slow` | 250ms |

`prefers-reduced-motion: reduce` zera os três tokens em `app/globals.css`. Coreografia GSAP/Framer fica atrás de `gsap.matchMedia('(prefers-reduced-motion: no-preference)')` ou equivalente. Conteúdo, rótulo, foco e ação permanecem compreensíveis e operáveis sem animação.

Propriedades preferidas: `transform` e `opacity`. Evitar `transition: all`, animar width/height/top/left, `will-change` amplo e estado React a cada frame de scroll.

Acessibilidade permanente (`AGENTS.md` §10 e Design System): foco visível, teclado, `aria-*`, contraste, estado não só por cor. Motion não substitui nenhum desses requisitos.

## Casca versus conteúdo

Antes de classificar o nível, separar duas regiões:

### Casca compartilhada

Navbar, overlay de conta, wordmark, rodapé e as experiências cinematográficas **já aprovadas** (Cover Flow, menu fullscreen, Halftone). A casca é a mesma em várias rotas. O nível da casca **não** redefine o nível do miolo.

Na integração vigente, a casca aprovada (Nível 3) já envolve Home, `/eventos`, login, institucionais, dashboard, admin e platform. Preservar. Não redesenhar. Não substituir por `ModernNavbar`, drawer compacto ou bit de React Bits.

### Conteúdo funcional

O miolo da página: formulário, tabela, secretaria, checagem, catálogo, narrativa. Este é o nível que a finalidade da tela determina.

| Região | Nível do conteúdo | Casca |
| --- | --- | --- |
| `/admin/*`, `/dashboard/*`, `/platform/*`, placar, pesagem, checagem operacional, chaves de operação, LIVE | **0** | cinematográfica aprovada (Nível 3) |
| Catálogo em `/eventos`, detalhe público de tarefa, inscrição | **1** | cinematográfica aprovada; Cover Flow no palco de `/eventos` é Nível 3 |
| Home, `/quem-somos`, `/sistema`, `/academias`, `/noticias` | **2** | cinematográfica aprovada |
| Cover Flow, overlay fullscreen, Halftone | **3** | são a própria casca / palco |

`/eventos` combina **Cover Flow Nível 3** (palco) e **catálogo Nível 1** (lista, filtros, ações). Dashboard e admin combinam **shell cinematográfico aprovado** com **conteúdo operacional Nível 0**.

## Intensidade

O agente classifica **cada região**, não a rota como um bloco único. Não obrigar scrollytelling. Não misturar pico emocional no miolo operacional.

### Nível 0 — Operação (conteúdo)

Movimento **funcional, suave, imediato e interruptível**. Não é ausência de animação.

Deve existir:

- hover, foco, press, abrir/fechar de dialog/dropdown/menu
- underline da aba ativa, loading, status, disabled
- duração `duration-mc-fast` (150ms) ou `duration-mc-normal` (200ms); `duration-mc-slow` (250ms) só quando o feedback precisa de leitura, nunca para atrasar o clique
- resposta no mesmo gesto; a ação não espera a animação terminar
- reduced-motion: estado final visível, controle operável

Não deve existir no miolo operacional:

- scrollytelling, parallax, pin, scrub, trilha `300vh`
- entrada cinematográfica que esconda a ação principal
- GSAP ScrollTrigger, React Bits, pico emocional
- duração acima dos tokens oficiais, bounce, glow, neon

A internet pode parar. As lutas não. A secretaria não é landing. A casca Nível 3 acima dela continua aprovada.

### Nível 1 — Superfície pública de tarefa (conteúdo)

Catálogo, detalhe, inscrição, formulário de acesso.

- Revelações curtas e opt-in (`data-mc-fade`, `data-mc-line`) **somente onde a página já as usa**
- Sem pin de seção, sem segundo motor de scroll
- Catálogo e formulário prevalecem sobre espetáculo
- Em `/eventos`, o palco Cover Flow permanece Nível 3; este nível descreve só o catálogo abaixo

### Nível 2 — Narrativa institucional (conteúdo)

Home cinematográfica e páginas institucionais.

- Scrollytelling é **opt-in desta finalidade**, não regra global
- `SiteScrollChoreography` (`app/layout.tsx`) é o motor único de scroll institucional
- Home usa `CinematicStory` (GSAP + ScrollTrigger). Não criar um segundo scrollytelling paralelo
- Um pico emocional por jornada, não por seção
- Respeitar opt-out já existente: `[data-hero]`, `[data-login-stage]`, `[data-portal]`, `[data-finale]`, `[data-chapter]`, `[data-traditions]`, `[data-no-scroll-choreography]`
- `SiteScrollChoreography` já recusa pathnames operacionais (`/admin`, `/dashboard`, `/platform`, placar)

### Nível 3 — Cinematográfico aprovado (casca e palcos)

Cover Flow 3D, overlay de conta em tela cheia, rodapé Halftone.

Fonte de verdade da implementação: worktree `jiu-motion-integration`, branch `integration/motion-lab-eventos-20261107`. Referência visual original: Motion Lab `experiment/meucamp-motion-design`.

Não redesenhar. Não portar de volta para este checkout nesta missão. Qualquer ajuste é lote separado, com autorização.

## Skills

### Zero-Jank Scroll

Orienta desempenho e arquitetura. Preserva scroll nativo. Classifica ativação discreta versus mapeamento contínuo. **Não** elimina microinteração útil de Nível 0 (hover, foco, underline, dialog).

Antes de editar scroll-driven:

1. **Ativação discreta** — capítulos, item ativo, sticky. Elementos reais + `position: sticky` + um `IntersectionObserver`. Sem progresso contínuo por frame.
2. **Mapeamento contínuo** — parallax, scrub. Native scroll + `transform`/`opacity`, sem `setState` por frame.

Regras vigentes:

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

Motor já existente: GSAP + ScrollTrigger + `@gsap/react`. Framer Motion em cards/modais pontuais. Não adicionar Lenis, Locomotive, nova lib de smooth-scroll nem segundo ScrollTrigger root.

Auditoria de fonte: `.agents/skills/zero-jank-scroll/scripts/audit-scroll-source.mjs`. Inventário: `MOTION-INVENTORY.md`.

### Scroll Craft

Informa variedade e contenção em narrativa (Nível 2). **Não tem autoridade para redesenhar** Home, catálogo, overlay, Cover Flow, Halftone, secretaria ou qualquer layout aprovado. Não gera página nova. Não impõe template de landing, diorama, glow, “01 / 06” nem scrollytelling onde ele não existe.

Instalação local, modo copy, lock em `skills-lock.json`:

| Skill | Fonte | Agentes |
| --- | --- | --- |
| `scroll-craft` | `nateherkai/scroll-craft` | Codex (`.agents/skills`), Claude Code (`.claude/skills`), GitHub Copilot (lê `.agents/skills`) |
| `zero-jank-scroll` | `harshavarma02/zero-jank-scroll-agent-skill` | Idem |

`validacao-por-risco` permanece intacta em `.claude/skills/validacao-por-risco`.

## React Bits

Catálogo auxiliar. **Não substitui** `components/ui` nem o Design System.

Registry em `components.json`:

```
"registries": {
  "@react-bits": "https://reactbits.dev/r/{name}.json"
}
```

Validado em 8 nov 2026: `GET https://reactbits.dev/r/BlurText-JS-CSS.json` → HTTP 200, `type: registry:component`.

- Alias `ui` do `components.json` aponta para `components/react-bits` para não colidir com o Design System
- `npx shadcn add @react-bits/…` exige autorização explícita; nenhum bit está instalado
- Bits de fundo (Aurora, Dark Veil, glitch, neon, metal) são incompatíveis com a identidade MEU CAMP, salvo prova em contrário no lote que os pedir
- Preferir ausência a um bit que dispute atenção com a competição
- O diretório `skills-react/` **não** faz parte desta gramática e não deve ser incorporado

## O que esta gramática não autoriza

- Redesenhar Home, login, catálogo, overlay, Cover Flow, Halftone ou Motion Lab
- Reintroduzir “Experimentar sem cadastro”, pata geométrica ou Patojitsu como logo
- Interpretar Nível 0 como “sem animação”
- Tornar scrollytelling obrigatório
- Smooth-scroll global sem override de reduced-motion
- Parallax no miolo operacional, glow, bounce, neon, estética gamer
- Segundo motor de scroll ao lado de `SiteScrollChoreography`
- Usar Scroll Craft para redesenhar layout aprovado
- Usar Zero-Jank para remover hover/foco/dialog
- Substituir `components/ui` por React Bits
- Merge, push, cherry-pick ou deploy desta preparação

## Relação com o restante do Design System

- Cores, tipo, radius, spacing: `README.md` e `sprint-6.5.md` prevalecem
- Telas públicas já migradas: `PADRAO-TELAS.md`
- Componentes-base: `components/ui`
- Inventário de fonte desta base: `MOTION-INVENTORY.md`
- Mudança visual futura: skill `validacao-por-risco`; implementação só depois desta gramática ser aprovada

## Incorporação posterior (não executar aqui)

Worktree de destino, quando o proprietário autorizar: `/home/nune/Meus Projetos/jiu-motion-integration`, branch `integration/motion-lab-eventos-20261107`.

Não incorporar deste worktree: working tree sujo (`AGENTS.md`, `CLAUDE.md`, `ModernNavbar`, login, `globals.css`, `CURRENT-HANDOFF.md`), `skills-react/`, `automação/node_modules`, `docs/CODEBASE_MAP.md`, patches de `supabase/`.

Antes do cherry-pick: reler o HEAD da integração. Em 8 nov 2026, o commit ainda era `5ce3369`, com working tree sujo (Claude Code em andamento). Não cherry-pickar sobre working tree sujo.

Commits deste worktree a levar, nesta ordem, quando o destino estiver limpo:

1. `0bd765a` — skills, `skills-lock.json`, `components.json`, `components/react-bits/README.md`, gramática v1.1, inventário, evidência de auditoria, três linhas em `docs/design-system/README.md`
2. o commit desta v1.2 — só os arquivos documentais da gramática consolidada

Conflito esperado: `docs/design-system/README.md` (três linhas da v1.1). Resolver mantendo o parágrafo de movimento da v1.2 (casca versus conteúdo). Os demais arquivos de `0bd765a` são aditivos e não existiam na integração.
