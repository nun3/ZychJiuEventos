## Rotas e Páginas do Projeto

### Páginas Públicas

- **Home**  
  - **Rota**: `/`  
  - **Arquivo**: `app/page.tsx`  
  - **Função**: Landing page pública. Exibe header, hero com destaques de eventos, filtros (`EventFilters`) e grid de eventos (`EventGrid`), além de footer e widget do WhatsApp.

- **Login (Portal do Atleta)**  
  - **Rota**: `/login`  
  - **Arquivo**: `app/login/page.tsx`  
  - **Função**: Tela de acesso à conta do atleta/professor, com login por CPF ou e-mail, opção "manter conectado" e links para recuperação de senha e novo cadastro.

- **Cadastro (Novo Usuário)**  
  - **Rota**: `/cadastro`  
  - **Arquivo**: `app/cadastro/page.tsx`  
  - **Função**: Fluxo de cadastro de atleta ou responsável. Primeiro passo por CPF ou e-mail, depois formulário completo com dados pessoais, endereço, contato, esporte, acesso e opção de iniciar inscrição em evento.

- **Recuperar Senha**  
  - **Rota**: `/recuperar-senha`  
  - **Arquivo**: `app/recuperar-senha/page.tsx`  
  - **Função**: Tela de início de fluxo para recuperação de senha (wireframe), acessível a partir da tela de login.

- **Detalhes do Evento**  
  - **Rota**: `/eventos/[id]`  
  - **Arquivo**: `app/eventos/[id]/page.tsx`  
  - **Função**: Página pública de detalhes do evento. Usa `EventDetails` para exibir banner, informações principais, abas (sobre, local, valores, regras etc.) e botões de ação (inscrever, emitir boleto, atletas inscritos, tabela de peso).

- **Inscrição - Escolha de Fluxo**  
  - **Rota**: `/eventos/[id]/inscricao`  
  - **Arquivo**: `app/eventos/[id]/inscricao/page.tsx`  
  - **Função**: Tela inicial da inscrição do evento. Oferece as opções: "Fazer minha inscrição", "Inscrever meus atletas" e "Cadastrar novo atleta", com explicação para professores/responsáveis.

- **Inscrição - Minha Inscrição**  
  - **Rota**: `/eventos/[id]/inscricao/minha`  
  - **Arquivo**: `app/eventos/[id]/inscricao/minha/page.tsx`  
  - **Função**: Wireframe do formulário de inscrição individual do atleta (dados pessoais, academia, faixa, categoria e peso), com botão de confirmar inscrição (desabilitado).

- **Inscrição - Inscrever Meus Atletas**  
  - **Rota**: `/eventos/[id]/inscricao/atletas`  
  - **Arquivo**: `app/eventos/[id]/inscricao/atletas/page.tsx`  
  - **Função**: Tela para professores/responsáveis gerenciarem inscrições múltiplas. Mostra card do evento, botão "Selecionar meus atletas" (abre modal), avisos sobre limite de 20 inscrições e regras de idade.

- **Inscrição - Modal de Seleção de Atletas**  
  - **Componente**: `components/AthleteSelectionModal.tsx`  
  - **Usado em**: `/eventos/[id]/inscricao/atletas`  
  - **Função**: Modal com lista de atletas cadastrados, busca por nome, seleção múltipla, status de inscrição e ação para confirmar seleção (redireciona para tela de confirmação).

- **Inscrição - Confirmar Atletas**  
  - **Rota**: `/eventos/[id]/inscricao/atletas/confirmar`  
  - **Arquivo**: `app/eventos/[id]/inscricao/atletas/confirmar/page.tsx`  
  - **Função**: Wireframe de checagem final das inscrições dos atletas selecionados. Permite escolher categoria, faixa, peso, tipo de inscrição, definir se cada atleta será inscrito e configurar forma de pagamento (unificado ou individual).

- **Inscrição - Cadastrar Novo Atleta (no fluxo de evento)**  
  - **Rota**: `/eventos/[id]/inscricao/cadastrar-atleta`  
  - **Arquivo**: `app/eventos/[id]/inscricao/cadastrar-atleta/page.tsx`  
  - **Função**: Wireframe de formulário para cadastro de novo atleta diretamente dentro do fluxo de inscrição do evento.

- **Emitir Boleto (Evento)**  
  - **Rota**: `/eventos/[id]/boleto`  
  - **Arquivo**: `app/eventos/[id]/boleto/page.tsx`  
  - **Função**: Página de wireframe para emissão de boleto. Explica que o sistema de boleto será implementado, mostra valor, status de pagamento e botões para baixar boleto (desabilitado) e ir para inscrição.

- **Tabela de Peso (Evento)**  
  - **Rota**: `/eventos/[id]/tabela-peso`  
  - **Arquivo**: `app/eventos/[id]/tabela-peso/page.tsx`  
  - **Função**: Apresenta a tabela de peso oficial por faixa etária, categoria e gênero. Possui botão "Baixar PDF" (`/tabela-peso.pdf`) e seções agrupadas (Mirim, Pré-Mirim, Infantil, etc.).

- **Atletas Inscritos (Evento)**  
  - **Rota**: `/eventos/[id]/inscritos`  
  - **Arquivo**: `app/eventos/[id]/inscritos/page.tsx`  
  - **Função**: Tela de checagem/listagem de atletas inscritos com múltiplas visões: geral, por categoria de peso, absoluto, por equipe e por equipe/professor. Inclui filtros (categoria, faixa, peso, sexo), cards com status de pagamento e agrupamentos por equipe.

### Dashboard / Painel do Professor

- **Dashboard Home**  
  - **Rota**: `/dashboard`  
  - **Arquivo**: `app/dashboard/page.tsx`  
  - **Função**: Home do painel com hero, filtros e grid de eventos, além de colunas de resultados e ranking (mock).

- **Layout do Dashboard**  
  - **Rota base**: `/dashboard/*`  
  - **Arquivo**: `app/dashboard/layout.tsx`  
  - **Função**: Layout compartilhado do painel, incluindo `DashboardHeader`, footer e widget do WhatsApp.

- **Meu Perfil**  
  - **Rota**: `/dashboard/meu-perfil`  
  - **Arquivo**: `app/dashboard/meu-perfil/page.tsx`  
  - **Função**: Wireframe para visualização/edição de dados do perfil do professor/organizador.

- **Meus Atletas - Lista**  
  - **Rota**: `/dashboard/meus-atletas`  
  - **Arquivo**: `app/dashboard/meus-atletas/page.tsx`  
  - **Função**: Lista de atletas cadastrados pelo professor, com ações: Alterar Cadastro, Inscrições, Filiações e Excluir. Possui filtro/busca e botão "Novo Atleta" que abre o modal de cadastro/edição de atleta.

- **Meus Atletas - Editar Cadastro**  
  - **Rota**: `/dashboard/meus-atletas/[id]/editar`  
  - **Arquivo**: `app/dashboard/meus-atletas/[id]/editar/page.tsx`  
  - **Função**: Formulário completo de edição de cadastro de atleta (dados pessoais, equipe, professor, esporte, faixa, peso, necessidades especiais), inspirado no modal `NewAthleteModal`.

- **Meus Atletas - Inscrições do Atleta**  
  - **Rota**: `/dashboard/meus-atletas/[id]/inscricoes`  
  - **Arquivo**: `app/dashboard/meus-atletas/[id]/inscricoes/page.tsx`  
  - **Função**: Mostra as inscrições do atleta em campeonatos. Separa "Campeonato ativo" (com botões de pagamento, checagem, alterar/cancelar inscrição) e "Campeonato já concluído" (com emissão de declaração de participação).

### Admin / Organização

- **Layout do Admin**  
  - **Rota base**: `/admin/*`  
  - **Arquivo**: `app/admin/layout.tsx`  
  - **Função**: Layout da área administrativa, reutilizando `DashboardHeader`, footer e WhatsApp.

- **Criar Evento (Admin)**  
  - **Rota**: `/admin/eventos/novo`  
  - **Arquivo**: `app/admin/eventos/novo/page.tsx`  
  - **Função**: Formulário extenso para criação de eventos, dividido em seções: Sobre o Evento, Inscrições/Pagamento, Checagem/Chaves/Pesagem, Premiação/Regras/Termos. Possui uploads de banner/cartaz e destaque (com validação de dimensões), campos de texto para todos os blocos de conteúdo (apresentação, categorias, absoluto, checagem, pesagem, premiação, direito de imagem, termos, etc.) e botões "Salvar rascunho", "Publicar" e "Cancelar".

### Infraestrutura / Layout Global

- **Root Layout**  
  - **Arquivo**: `app/layout.tsx`  
  - **Função**: Layout global do Next.js (App Router). Define metadados padrão e carrega `globals.css`.


