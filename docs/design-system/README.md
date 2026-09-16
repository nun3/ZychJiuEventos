# Design System MEU CAMP

## Objetivo

MEU CAMP é uma plataforma para organização e operação de competições. Jiu-Jitsu é a primeira modalidade, não a definição permanente da plataforma. A migração é incremental: os tokens novos são opt-in e os valores legados permanecem disponíveis até que cada tela seja migrada e validada.

## Identidade visual aprovada

A identidade combina azul estrutural, azul de acao e superficies claras. O resultado deve transmitir organizacao, precisao, confianca e competencia esportiva.

### Marca aprovada

- Nome: MEU CAMP
- Símbolo: pata de pato abstrata, geométrica e minimalista
- Patojitsu: mascote complementar, não logo principal
- A marca principal não deve depender de quimono, faixa ou lutador.

O esporte influencia a experiência. A competição define a marca.

### Princípios

> Clareza antes de decoração. Competição antes de SaaS. Confiança antes de espetáculo.

- Azul de acao: `#2563EB`
- Navy estrutural: `#0C3049`
- Fundo: `#F8FAFC`
- Superficie: `#FFFFFF`
- Superficie secundaria: `#F1F5F9`
- Borda: `#E2E8F0`
- Texto primario: `#0F172A`
- Texto secundario: `#475569`
- Sucesso: `#16A34A`
- Aviso: `#D97706`
- Erro: `#DC2626`
- Informacao: `#2563EB`
- Foco: `#2563EB`

Nao usar roxo como cor dominante, estetica neon, excesso de gradientes ou visual gamer. Vermelho e verde devem ser reservados principalmente para estados e acoes semanticas.

## Tokens oficiais

Os tokens CSS vivem em `app/globals.css` com prefixo `--mc-`. O Tailwind expoe aliases com prefixo `mc-` em `tailwind.config.js`.

### Cores

- `--mc-action`
- `--mc-structure`
- `--mc-background`
- `--mc-surface`
- `--mc-surface-secondary`
- `--mc-border`
- `--mc-text-primary`
- `--mc-text-secondary`
- `--mc-success`
- `--mc-warning`
- `--mc-error`
- `--mc-info`
- `--mc-focus`

Os tokens de cor usam canais RGB para permitir opacidade pelo Tailwind.

## Tipografia

Fontes aprovadas:

- Space Grotesk para display, H1 e H2.
- Inter para interface, formularios, tabelas, botoes e textos corridos.

As fontes sao carregadas por `next/font` em `app/layout.tsx` e expostas por `--font-space-grotesk` e `--font-inter`.

Escala oficial:

| Papel | Tamanho / entrelinha |
| --- | --- |
| Display | 48 / 56 |
| H1 | 36 / 44 |
| H2 | 28 / 36 |
| H3 | 22 / 28 |
| Body | 16 / 24 |
| Small | 14 / 20 |
| Caption | 12 / 16 |

A escala nova nao deve ser aplicada globalmente de uma vez. Cada pagina deve ser migrada e validada isoladamente.

## Radius

- `small`: `6px`
- `medium`: `10px`
- `large`: `14px`
- `full`: `9999px`

Os aliases Tailwind sao `rounded-mc-small`, `rounded-mc-medium`, `rounded-mc-large` e `rounded-mc-full`. Os valores `rounded-*` existentes permanecem validos durante a migracao.

## Spacing

Escala conceitual oficial:

`4`, `8`, `12`, `16`, `24`, `32`, `48`, `64`

Os aliases CSS sao `--mc-space-4` ate `--mc-space-64`, e os aliases Tailwind sao `mc-4` ate `mc-64`. A escala nativa do Tailwind nao deve ser removida.

## Sombras

- `shadow-none`: `0 0 #0000`
- `shadow-subtle`: `0 1px 3px rgba(15, 23, 42, 0.08)`
- `shadow-elevated`: `0 10px 30px rgba(15, 23, 42, 0.12)`

As sombras legadas nao devem ser substituidas globalmente nesta fase.

## Movimento

- `fast`: `150ms`
- `normal`: `200ms`
- `slow`: `250ms`

Os aliases Tailwind sao `duration-mc-fast`, `duration-mc-normal` e `duration-mc-slow`. O suporte a `prefers-reduced-motion: reduce` zera os tokens de movimento para consumidores futuros. Animacoes legadas nao devem ser refatoradas automaticamente.

## Regras de componentes

Estas regras orientam a Fase 2 e as migracoes seguintes:

- Preferir componentes reutilizaveis e estados explicitos.
- Usar icones consistentes e acessiveis em botoes de ferramenta.
- Usar botoes com texto quando a acao nao for universalmente reconhecivel por icone.
- Manter raio de ate 14px; cards compactos devem preferir 6px ou 10px.
- Nao colocar cards dentro de cards sem necessidade funcional.
- Reservar sombras elevadas para elementos realmente destacados.
- Componentes e fluxos devem contemplar os estados relevantes ao seu contexto — loading, vazio, erro, sucesso e desabilitado quando aplicáveis. Não criar estados artificiais apenas para cumprir o Design System.
- Nao alterar contratos de dados, URLs, Server Actions ou regras de negocio durante uma migracao visual.
- Nao substituir tokens legados em massa.

## Acessibilidade

- Manter contraste suficiente entre texto, fundo, borda e estados.
- Todo controle deve possuir nome acessivel e rotulo compreensivel.
- Foco visivel e consistente usa o token `mc-focus`.
- A interface deve funcionar com teclado e ordem de foco previsivel.
- Nao usar cor como unica forma de comunicar estado.
- Imagens devem possuir texto alternativo quando informativas.
- Respeitar `prefers-reduced-motion`.
- Mensagens de erro e sucesso devem ser anunciadas de forma compreensivel.

## Principios de responsividade

- Projetar primeiro o conteudo e o fluxo, depois a ornamentacao.
- Usar layouts fluidos com limites de largura e espacamento estavel.
- Manter alvos de toque confortaveis em telas pequenas.
- Evitar tabelas ilegiveis; transformar registros em blocos empilhados quando necessario.
- Garantir que textos, botoes e badges nao estourem seus containers.
- Preservar hierarquia e acao principal em desktop, tablet e mobile.
- Validar estados de loading, vazio e erro em mais de um viewport.
- Nao usar tipografia dependente de viewport para compensar layouts instaveis.

## Compatibilidade e governanca

- Tokens novos devem ser adicionados com prefixo `mc-`.
- Alteracoes de identidade devem ser registradas em `docs/design-system/sprint-6.5.md`.
- Toda fase deve passar por build, TypeScript, lint e testes proporcionais ao risco.
- A migracao visual nao pode alterar autenticacao, pagamentos, Supabase, RLS, APIs, webhooks, Server Actions ou queries.
