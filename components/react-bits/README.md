# React Bits — isolamento

Este diretório é o destino do registry `@react-bits` declarado em `components.json`.

Não misturar com `components/ui` (Design System MEU CAMP).
Não instalar bits nesta missão. Qualquer `npx shadcn add @react-bits/…` exige autorização explícita e revisão de movimento (intensidade da página, `prefers-reduced-motion`, tokens `mc-*`).

## Instalados

- `StaggeredMenu` (JS + CSS + `.d.ts`). Autorizado pelo proprietário em 10 nov 2026 para o menu das telas internas
  (dashboard, admin e platform): `components/navigation/InternalNav.tsx`. Depende só do `gsap`, que o projeto já tem.
  Revisão de movimento (o que o README exige) e desvios do original:
  1. **`prefers-reduced-motion`**: o original não trata. Com a preferência ligada, painel, camadas, itens, ícone, cor e
     rolo de palavras do botão vão direto ao estado final (sem tweens).
  2. **Acessibilidade**: painel fechado fica `inert` (o original deixava os links focáveis sob `aria-hidden`); abrir leva o
     foco ao 1º item; Esc fecha e devolve o foco ao botão; a página atrás fica inert e sem rolagem enquanto aberto.
  3. **Navegação**: itens com `link` chamam `onItemClick` (o app navega sem recarregar; clique com modificador segue o
     navegador); itens sem `link` viram `<button>` com `onClick` (ex.: sair da conta); `current` marca a página atual.
  4. **Textos em props** (`labels`, `socialsTitle`, `panelLabel`) em vez de fixos em inglês; `logo` aceita um elemento.
  5. CSS: sem o filtro que invertia a logo (a do projeto é escura), cabeçalho por variável, foco visível, `dvh`.
  As telas públicas usam o menu cinematográfico (`components/navigation/CinematicMenu.tsx`), não este bit.

