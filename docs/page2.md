## Nova Estrutura de Rotas e Páginas

> Objetivo: reduzir rotas, melhorar UX (fluxos em steps/modais) e preparar o projeto para uma futura integração com banco relacional.

---

### 1. Páginas Públicas

- **Home**  
  - **Rota**: `/`  
  - **Arquivo**: `app/page.tsx`  
  - **Função**: Landing page pública com header, hero de eventos, filtros (`EventFilters`), grid de eventos (`EventGrid`), footer e widget do WhatsApp.

- **Autenticação (Login / Cadastro / Recuperar senha)**  
  - **Rota**: `/login`  
  - **Arquivo**: `app/login/page.tsx`  
  - **Função**: Reúne em uma única página:
    - Step/Abas para **Acessar conta** (CPF ou e-mail + senha).  
    - Step/Abas para **Esqueci minha senha** (antes `/recuperar-senha`).  
    - Step/Abas para **Criar conta** (antes `/cadastro`).  
  - **Benefício**: diminui navegação dispersa; fluxo de autenticação fica centralizado e simples para o usuário e para o backend.

- **Detalhes do Evento**  
  - **Rota**: `/eventos/[eventId]`  
  - **Arquivo**: `app/eventos/[eventId]/page.tsx`  
  - **Função**: Página pública do evento (banner, informações principais, abas de conteúdo, botões de ação: inscrever, ver atletas, tabela de peso).

- **Inscrição – Checkout Unificado**  
  - **Rota**: `/eventos/[eventId]/inscricao`  
  - **Arquivo**: `app/eventos/[eventId]/inscricao/page.tsx`  
  - **Função**: **Wizard único de inscrição**, com steps internos:
    1. Quem está se inscrevendo (atleta x professor/responsável).  
    2. Seleção de atletas (lista/vinculados + botão “Cadastrar novo atleta” em modal/drawer).  
    3. Configuração de categorias/faixas/pesos/absoluto por atleta.  
    4. Resumo e escolha de forma de pagamento (unificado x individual).  
  - **Substitui**: `/inscricao/minha`, `/inscricao/atletas`, `/inscricao/atletas/confirmar`, `/inscricao/cadastrar-atleta`.  
  - **Benefício**: fluxo contínuo tipo checkout, menos URLs e melhor envio de dados em lote para a tabela `registrations`/`payments`.

- **Atletas Inscritos / Checagem**  
  - **Rota**: `/eventos/[eventId]/inscritos`  
  - **Arquivo**: `app/eventos/[eventId]/inscritos/page.tsx`  
  - **Função**: Checagem e listagem de atletas inscritos com visões em abas (geral, categoria de peso, absoluto, equipe, equipe/professor) e filtros.  
  - **Benefício**: centraliza todo o “olhar de conferência” do evento em uma única rota.

- **Tabela de Peso do Evento**  
  - **Rota**: `/eventos/[eventId]/tabela-peso`  
  - **Arquivo**: `app/eventos/[eventId]/tabela-peso/page.tsx`  
  - **Função**: Exibe tabela oficial por faixa etária/categoria/gênero + botão “Baixar PDF”.  
  - **Benefício**: conteúdo estático/referência, reutilizável em inscrição, checagem e página pública.

- **Pagamento / Boleto / Pix do Evento**  
  - **Rota**: `/eventos/[eventId]/pagamento`  
  - **Arquivo**: `app/eventos/[eventId]/pagamento/page.tsx`  
  - **Função**: Centralizar informações e ações de pagamento para as inscrições do usuário naquele evento (boleto, Pix, status).  
  - **Substitui**: `/eventos/[id]/boleto`.  
  - **Benefício**: visão única de pagamentos por evento, alinhada com um modelo `payments` em banco.

---

### 2. Dashboard / Painel do Professor

- **Layout do Dashboard**  
  - **Rota base**: `/dashboard/*`  
  - **Arquivo**: `app/dashboard/layout.tsx`  
  - **Função**: Layout compartilhado (header do painel, menu, footer, WhatsApp).

- **Dashboard Home (Visão Geral)**  
  - **Rota**: `/dashboard`  
  - **Arquivo**: `app/dashboard/page.tsx`  
  - **Função**: Painel inicial com cards/resumos: próximos eventos, resumo de inscrições, meus atletas, atalhos para financeiro/checagem.  
  - **Benefício**: ponto único de entrada; o professor vê tudo em um só lugar.

- **Perfil do Usuário**  
  - **Rota**: `/dashboard/perfil`  
  - **Arquivo**: `app/dashboard/perfil/page.tsx` (renomear `meu-perfil`)  
  - **Função**: Gerir dados de conta (nome, e-mail, telefone, documentos, preferências).

- **Gestão de Atletas (Lista + Modais)**  
  - **Rota**: `/dashboard/atletas`  
  - **Arquivo**: `app/dashboard/atletas/page.tsx` (renomear `meus-atletas`)  
  - **Função**: Lista de atletas com busca/filtros e ações:
    - Editar cadastro (abre **drawer/modal**, sem sair da lista).  
    - Ver inscrições do atleta (drawer/painel lateral).  
    - Ver filiações, excluir atleta.  
  - **Rotas auxiliares (opcional, para deep-linking)**:  
    - `/dashboard/atletas/[athleteId]` – detalhes do atleta (pode ser usada via rota interceptada como modal).  
    - `/dashboard/atletas/[athleteId]/inscricoes` – detalhes de inscrições do atleta (também como modal).  
  - **Benefício**: UX tipo SPA; professor continua na lista e apenas abre/fecha painéis para ações pontuais.

- **Minhas Inscrições**  
  - **Rota**: `/dashboard/inscricoes`  
  - **Arquivo**: `app/dashboard/inscricoes/page.tsx`  
  - **Função**: Listar todas as inscrições que o usuário gerencia (por atleta, evento, status de pagamento).  
    - Ações: ver detalhes (modal), acessar checagem do evento (`/eventos/[eventId]/inscritos`), ir para pagamento (`/eventos/[eventId]/pagamento`).  
  - **Benefício**: visão centrada em `registrations`, alinhada com o modelo relacional.

---

### 3. Admin / Organização

- **Layout do Admin**  
  - **Rota base**: `/admin/*`  
  - **Arquivo**: `app/admin/layout.tsx`  
  - **Função**: Layout para organizadores, com menu tipo “mosaico” (planejamento, checagem, financeiro, chaves, etc.).

- **Lista de Eventos (Admin)**  
  - **Rota**: `/admin/eventos`  
  - **Arquivo**: `app/admin/eventos/page.tsx`  
  - **Função**: Listar eventos do organizador, com ações: criar, editar, duplicar, abrir painel de gestão (checagem, chaves, resultados, financeiro).  
  - **Benefício**: ponto único para gestão de eventos, facilita queries em `events` e `event_schedule`.

- **Criar Evento (Wizard)**  
  - **Rota**: `/admin/eventos/novo`  
  - **Arquivo**: `app/admin/eventos/novo/page.tsx`  
  - **Função**: Wizard de criação de evento com steps:
    1. Dados básicos (título, datas, local, banner/destaque).  
    2. Categorias, faixas etárias, faixas de graduação, tabela de peso.  
    3. Inscrições e pagamento (valores, regras de reembolso, formas de pagamento).  
    4. Checagem, chaves, cronograma.  
    5. Regras, direito de imagem, termos de aceite.  
  - **Benefício**: formulário grande, mas dividido em partes lógicas, refletindo tabelas diferentes no banco (`events`, `categories`, `payments`, `rules`).

- **Editar Evento**  
  - **Rota**: `/admin/eventos/[eventId]/editar`  
  - **Arquivo**: `app/admin/eventos/[eventId]/editar/page.tsx`  
  - **Função**: Reutiliza o mesmo wizard de criação, carregando dados existentes para edição.  
  - **Benefício**: mesma experiência de criação/edição, facilitando manutenção.

---

### 4. Infraestrutura / Layout Global

- **Root Layout**  
  - **Arquivo**: `app/layout.tsx`  
  - **Função**: Layout global do App Router, definindo metadados padrão e carregando `globals.css`.  
  - **Benefício**: mantém a base consistente para todas as rotas, facilitando inclusão de providers (autenticação, tema, etc.).

---

### Resumo das Principais Mudanças

- **Consolidação de fluxos**:  
  - Auth em `/login` (login + cadastro + recuperação).  
  - Inscrição em `/eventos/[eventId]/inscricao` como checkout único.  
  - Pagamentos em `/eventos/[eventId]/pagamento`.

- **UX mais fluida**:  
  - Uso de **wizards, modais e drawers** para edição/visualização rápida (especialmente em `/dashboard/atletas` e `/eventos/[eventId]/inscricao`).  
  - Menos recarregamento de página; o usuário permanece no contexto principal.

- **Arquitetura de dados mais clara**:  
  - Rotas focadas em recursos principais (`events`, `athletes`, `registrations`, `payments`).  
  - Facilita o mapeamento para tabelas relacionais e para APIs REST/GraphQL futuras.


