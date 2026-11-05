# MEU CAMP — Padronização das telas

**Status:** em aplicação local. Sem deploy.
**Fonte visual:** o calendário em `/eventos` e a demonstração interativa. O interior público e a navegação da área interna repetem essa gramática.
**Fonte de comportamento:** o código e `lib/events/public-event-presentation.ts`. Este documento não cria status, preço, fase, categoria nem permissão.

## 1. Decisão

A tela pública deixa de parecer um formulário SaaS (card arredondado, pílula, ícone decorativo, gradiente) e passa a parecer uma página de campeonato: palco, tipo display, cantos retos e um traço azul curto para dizer onde se está.

A migração é por tela. Uma mudança visual não altera link, rótulo oficial, condição de exibição nem dado gravado. O que não existe no banco não é inventado para completar o layout.

## 2. Gramática

| Peça | Como fica |
| --- | --- |
| Palco | Foto em tela cheia, sem blur. Overlay radial com o token `--mc-nav-dark`. Sem foto, o fundo é o navy. |
| Título | Space Grotesk, maiúsculas, entrelinha apertada. O `h1` do detalhe fica visível de imediato. Não usa `data-mc-line`, porque essa marca esconde o título até o scroll. |
| Status | Quadrado de 8px na cor do estado mais o texto. Nunca só a cor. |
| Meta | Data por extenso e local gravado, separados por `·`. Data de evento não ganha horário. |
| Seção | Faixa com `border-b`, título display e texto em Inter. Fase numerada `01`, `02` com borda azul à esquerda. |
| Ação | Retângulo. Primária branca no palco, sólida escura no miolo. Secundária é contorno. Sem pílula. |
| Navegação | Barra de 48px, rótulos em maiúsculas com tracking, item atual com traço de 36px em `#2563EB`. O traço também aparece no hover. |
| Encaixe | A barra fixa do site tem 64px (`h-16`). A faixa seguinte usa `pt-16` e, quando gruda, `top-16`. Não sobra faixa entre as duas. |
| Cantos | Retos nas peças novas desta gramática. O raio do Design System continua válido nas telas que ainda não migraram. |
| Celular | A barra pode rolar por dentro. A página não pode vazar na horizontal. O item atual permanece visível. |

Tokens continuam `mc-*`. Hex solto só entra quando não existe token equivalente.

## 3. Duas camadas de rótulo

O calendário e a página do evento não usam o mesmo texto de status. Isso é intencional.

- **Calendário** (`lib/events/catalog-presentation.ts`): rótulo curto. `publicado` aparece como "Em breve". `inscricao` aparece como "Inscrições abertas".
- **Página do evento** (`getPublicEventPresentation`): rótulo oficial. `publicado` aparece como "Campeonato publicado" no palco e "Inscrições em breve" na inscrição.

Não trocar um pelo outro. Os testes de apresentação cobrem a página.

## 4. O que cada tela pode mostrar

### Calendário `/eventos`

Com eventos publicados, lista só o que veio do banco. Sem eventos publicados, e apenas em `next dev`, três campeonatos fictícios ensaiam o calendário. Eles não são gravados. Em produção essa lista não aparece.

No ensaio, **Inscrever-se** abre a demonstração neste navegador (`/eventos#experimentar-demo`). **Detalhes** e **Ver campeonato** abrem `/eventos/preview-*`. Essa rota também só existe em development. Fora disso o id não resolve e a página responde 404, sem consulta ao banco.

A página de ensaio mostra título, data, local, foto e o status "Em breve". Ela declara que nada foi publicado. Não mostra preço, fase, categoria nem documento inventados.

No evento real, **Inscrever-se** só aponta para `/eventos/{id}/inscricao/cadastrar-atleta` quando o status é `inscricao`. **Chaves** no calendário só aparece nos status em que a operação já passou da inscrição (`pagamento`, `checagem`, `chaves`, `em_andamento`, `concluido`).

### Detalhe `/eventos/{id}`

O palco usa `PublicEventHero`: nome, foto do cartaz se houver, rótulo oficial, data e local. **Fazer inscrição** só entra no palco e na lateral quando `showRegistrationCta` é verdadeiro, com o mesmo href.

Dentro de **Informações**, a faixa de subseções (maiúsculas, traço de 36px) espelha o que o iLutas chama de abas internas, só com o que o MEU CAMP já publica:

1. Sobre o evento — `informacoes`
2. Local do evento — endereço estruturado + mapa OpenStreetMap quando há coordenadas gravadas ou geocode do endereço
3. Valor da inscrição — `valor_inscricao` e hint oficial
4. Prazos e fases — fases gravadas
5. Categorias — regras ativas
6. Regulamento — URLs públicas de regulamento/tabela de peso
7. Checagem — só quando a apresentação libera o link
8. Chaves — ponte para a página pública de chaves

Não entram aqui, porque não existem no domínio público atual: formas de pagamento em texto livre, premiação, absoluto narrativo, direito de imagem, declaração de saúde, pesagem descritiva nem contato da organização. A lateral continua com valor, hint e links operacionais.

### Calendário `/eventos` — palco em destaque

O carrossel usa a foto do campeonato atual à esquerda. À direita, em desktop, fica uma imagem companheira estática diferente. Se o evento não tem cartaz, a esquerda cai no inventário cinematográfico e a direita **não** pode repetir a mesma arquivo.

### Chaves `/eventos/{id}/chaves`

Cabeçalho no mesmo tipo do detalhe. Sem chave publicada, a faixa diz "Nenhuma chave publicada" e explica que rascunho não aparece. A composição oficial continua vindo de `get_public_event_brackets`. Esta tela não fabrica atleta, confronto nem colocação.

A lista preenchida (grupos, confrontos, WO e colocações) usa a mesma gramática de faixas: número à esquerda, confrontos em linha, status com quadrado + texto. Textos oficiais (Grupo A/B/C, Copo, Sem confronto, Colocações, Vitória por WO) permanecem para os testes.

### Área interna

`InternalNavigation` é a faixa Visão geral, Eventos, Organização, Atletas, Inscrições, Perfil. Os itens continuam condicionados à permissão de quem entrou. O que mudou foi o desenho: mesma altura, mesmas maiúsculas e o mesmo traço de 36px da barra pública, encostado nela.

A faixa do campeonato público usa a mesma marca, sobre o navy, nesta ordem:

1. Informações — a página do evento.
2. Participantes — inscrições efetivadas da projeção pública de checagem: nome, equipe e categoria. A inicial ocupa o lugar da foto. Foto, ranking, país e peso não entram, porque a função pública foi definida sem esses dados.
3. Chaves — composição oficial já publicada.
4. Lutas — confrontos da programação publicada, na ordem do número global.
5. Horário — a programação por área, na rota `/programacao`.
6. Resultados — colocações já registradas nos grupos da chave. Categoria sem confronto não vira campeão.

Antes da checagem, de chave ou de horário publicados, a seção correspondente fica vazia e diz isso. A rota `/checagem` continua existindo para a lista operacional já testada.

## 5. O que ainda não entrou

- O miolo administrativo das seis superfícies usa a mesma marca de status (quadrado 8px + texto) e cantos retos em `[data-mc-admin-op]`. Tabelas, filtros e ações operacionais permanecem densos (`DataTable`/`MobileRecord`). Não foi editorializado como palco público.
- O placar LIVE permanece especializado: alto contraste, controles grandes e raios amplos nos painéis de pontuação. Só o chip “Sair da operação” ficou retangular.
- Home cinematográfica não entra neste lote.
- Formulários de perfil/dashboard fora da operação do evento ainda podem usar raio do Design System.

Inventário detalhado: `COMPONENT-INVENTORY.md`, `UI-CONSISTENCY-AUDIT.md`, `UI-MIGRATION-REPORT.md`, `UI-REGRESSION-RESULTS.md`.
Manifesto de release candidate: `docs/releases/UI-CONSOLIDATION-RC.md`.

## 6. O que esta padronização não faz

- Não altera status, transição, trava de checagem, publicação de chave, pagamento, autenticação, RLS nem Server Action.
- Não publica chave vazia para a página "ficar completa". Chave oficial exige geração e publicação pela organização, depois da checagem travada.
- Não copia a referência visual de outro portal: sem pílulas vermelhas, sem card de hospedagem Airbnb/Booking, sem inventar lote, premiação ou declaração que o organizador não gravou.
- Não trata o campeonato fictício como dado real. O ensaio serve para ver o calendário quando o banco público está vazio.

## 7. Conferência

Em 4 de novembro de 2026, no `localhost:3000`, o rascunho **TESTE** foi publicado pelo fluxo do produto. O detalhe mostrou o palco, as quatro fases gravadas, o local e o valor **R$ 9,33**, com inscrições ainda em breve. A chave mostrou o estado vazio oficial. A barra interna ficou encostada na barra pública, com traço de 36px, em 1440px e em 390px, sem overflow horizontal da página.
