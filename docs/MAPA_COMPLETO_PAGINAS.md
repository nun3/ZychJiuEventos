# Mapa Completo de Páginas - Zych Jiu-Jitsu Eventos

## 📋 Visão Geral

Este documento lista todas as páginas existentes na aplicação, suas rotas, funcionalidades e status de implementação.

**Total de páginas encontradas:** 18

---

## 🏠 PÁGINAS PÚBLICAS (Não Autenticadas)

### 1. Home / Landing Page
**Rota:** `/`  
**Arquivo:** `app/page.tsx`  
**Status:** ✅ Implementada

**Funcionalidades:**
- Hero Section com carousel de eventos em destaque
- Seção de filtros de eventos (tipo, esporte, data, local)
- Grid de eventos com cards
- Header e Footer
- Widget WhatsApp

**Componentes utilizados:**
- `Header`
- `Footer`
- `WhatsAppWidget`
- `HeroSection`
- `EventFilters`
- `EventGrid`

---

### 2. Login / Autenticação
**Rota:** `/login`  
**Arquivo:** `app/login/page.tsx`  
**Status:** ✅ Implementada

**Funcionalidades:**
- Sistema de abas:
  - **Entrar:** Login com CPF ou E-mail
  - **Criar conta:** Cadastro de novo usuário
  - **Recuperar senha:** Recuperação de senha
- Suporte para login por CPF ou E-mail
- Link para página de cadastro
- Link para recuperação de senha

**Modos disponíveis:**
- `?mode=login` (padrão)
- `?mode=register`
- `?mode=recover`

---

### 3. Cadastro de Usuário
**Rota:** `/cadastro`  
**Arquivo:** `app/cadastro/page.tsx`  
**Status:** ✅ Implementada

**Funcionalidades:**
- Seleção de perfil:
  - **Atleta:** Maior de 18 anos ou professor
  - **Responsável:** Apenas responsável por atleta
- Formulário completo com:
  - Dados básicos (nome, CPF, data nascimento, sexo)
  - Informações de endereço
  - Informações de contato (e-mail, celular)
  - Informações de acesso (senha)
  - Informações do esporte (equipe, professor, faixa, peso) - apenas para atleta
- Opção de inscrição em evento durante cadastro
- Link para login

---

### 4. Recuperar Senha
**Rota:** `/recuperar-senha`  
**Arquivo:** `app/recuperar-senha/page.tsx`  
**Status:** ✅ Implementada

**Funcionalidades:**
- Formulário para recuperação de senha
- Entrada por CPF ou E-mail
- Link para voltar ao login

---

## 🎯 PÁGINAS DE EVENTOS

### 5. Detalhes do Evento
**Rota:** `/eventos/[id]`  
**Arquivo:** `app/eventos/[id]/page.tsx`  
**Status:** ✅ Implementada

**Funcionalidades:**
- Banner do evento com título
- Sistema de abas com 13 sub-tabs:
  1. **SOBRE O EVENTO:** Descrição, organização, datas importantes
  2. **LOCAL DO EVENTO:** Endereço e mapa
  3. **VALORES DAS INSCRIÇÕES:** Tabela de preços
  4. **FORMAS DE PAGAMENTO:** Informações de pagamento
  5. **PREMIAÇÃO:** Detalhes de medalhas e troféus
  6. **CATEGORIAS:** Faixas etárias, graduações e pesos
  7. **ABSOLUTO:** Critérios de participação
  8. **CHECAGEM:** Informações sobre checagem
  9. **CHAVES:** Visualização de brackets
  10. **PESAGEM:** Tabela de peso
  11. **REGRAS:** Regras do evento
  12. **DIREITO DE IMAGEM:** Termos de direito de imagem
  13. **DECLARAÇÃO DE SAÚDE:** Termos de saúde
- Botão "ATLETAS INSCRITOS"
- Link para inscrição

**Componentes utilizados:**
- `EventDetails`
- `Header`
- `Footer`
- `WhatsAppWidget`

---

### 6. Atletas Inscritos no Evento
**Rota:** `/eventos/[id]/inscritos`  
**Arquivo:** `app/eventos/[id]/inscritos/page.tsx`  
**Status:** ✅ Implementada

**Funcionalidades:**
- Lista completa de atletas inscritos
- Filtros:
  - Busca por nome
  - Filtro por categoria
  - Filtro por faixa
  - Filtro por peso
  - Filtro por status de pagamento
- Visualizações:
  - **Equipe:** Agrupado por equipe com acordeão
  - **Categoria de Peso:** Agrupado por categoria com acordeão
- Informações exibidas:
  - Nome, idade, gênero
  - Categoria, faixa, peso
  - Academia e professor
  - Status de pagamento
- Paginação (5 grupos por página)
- Exportação de dados

**Componentes utilizados:**
- `RegisteredAthletesContent`

---

### 7. Tabela de Peso do Evento
**Rota:** `/eventos/[id]/tabela-peso`  
**Arquivo:** `app/eventos/[id]/tabela-peso/page.tsx`  
**Status:** ✅ Implementada

**Funcionalidades:**
- Tabela de peso GI (com kimono)
- Tabela de peso NO-GI (sem kimono)
- Sistema de abas para alternar entre GI e NO-GI
- Acordeão por faixa etária
- Ferramenta de verificação de categoria:
  - Entrada: Idade, Peso, Gênero, Com/Sem Kimono
  - Saída: Categoria sugerida
- Download do PDF da tabela
- Informações importantes sobre pesagem

**Faixas etárias cobertas:**
- Pré-Mirim (4-5 anos)
- Mirim A (6-7 anos)
- Mirim B (8-9 anos)
- Infantil A (10-11 anos)
- Infantil B (12-13 anos)
- Infanto-Juvenil (14-15 anos) - M/F
- Juvenil (16-17 anos) - M/F
- Adulto/Master (18+ anos) - M/F

**Componentes utilizados:**
- `WeightTableContent`

---

## 📝 PÁGINAS DE INSCRIÇÃO

### 8. Hub de Inscrição
**Rota:** `/eventos/[id]/inscricao`  
**Arquivo:** ❌ Não existe `page.tsx`  
**Status:** ⚠️ Não implementada

**Observação:** Esta rota não possui uma página própria. O fluxo de inscrição parece ser direto:
- Botão "INSCREVER-SE" na página de detalhes do evento pode redirecionar diretamente para:
  - `/eventos/[id]/inscricao/minha` (inscrição própria)
  - `/eventos/[id]/inscricao/atletas` (inscrição de atletas)

**Funcionalidades esperadas (se implementada):**
- Escolha do tipo de inscrição:
  - "FAZER MINHA INSCRIÇÃO" → `/eventos/[id]/inscricao/minha`
  - "REALIZAR INSCRIÇÃO DE MEUS ATLETAS" → `/eventos/[id]/inscricao/atletas`

---

### 9. Inscrição Própria
**Rota:** `/eventos/[id]/inscricao/minha`  
**Arquivo:** `app/eventos/[id]/inscricao/minha/page.tsx`  
**Status:** ✅ Implementada (Wireframe)

**Funcionalidades:**
- Formulário de inscrição do próprio usuário
- Dados pessoais (pré-preenchidos)
- Dados da academia
- Seleção de categoria do evento
- Botão de confirmação

**Nota:** Página marcada como wireframe para apresentação

---

### 10. Seleção de Atletas para Inscrição
**Rota:** `/eventos/[id]/inscricao/atletas`  
**Arquivo:** `app/eventos/[id]/inscricao/atletas/page.tsx`  
**Status:** ✅ Implementada

**Funcionalidades:**
- Card do evento com informações
- Botão "SELECIONAR MEUS ATLETAS"
- Botão "CADASTRAR NOVO ATLETA"
- Modal de seleção de atletas
- Avisos:
  - Limite de 20 inscrições por vez
  - Cálculo de idade pelo ano de nascimento
- Lista de atletas cadastrados

**Componentes utilizados:**
- `AthleteSelectionModal`

---

### 11. Confirmação e Configuração de Inscrições
**Rota:** `/eventos/[id]/inscricao/atletas/confirmar`  
**Arquivo:** `app/eventos/[id]/inscricao/atletas/confirmar/page.tsx`  
**Status:** ✅ Implementada

**Funcionalidades:**
- Lista de atletas selecionados
- Para cada atleta:
  - Informações completas
  - Opção de inscrever ou não
  - Seleção de categoria
  - Seleção de faixa
  - Seleção de categoria de peso
  - Tipo de inscrição (Categoria ou Categoria + Absoluto)
  - Valor da inscrição
- Resumo:
  - Número de atletas
  - Valor total
- Forma de pagamento:
  - Pagamento Unificado
  - Pagamento Individual
- Botão "FINALIZAR INSCRIÇÃO"
- Botão para adicionar mais atletas
- Botão para cadastrar novo atleta

---

### 12. Cadastro de Novo Atleta
**Rota:** `/eventos/[id]/inscricao/cadastrar-atleta`  
**Arquivo:** `app/eventos/[id]/inscricao/cadastrar-atleta/page.tsx`  
**Status:** ✅ Implementada

**Funcionalidades:**
- Formulário completo de cadastro:
  - **Dados Pessoais:** Nome, CPF, Data de Nascimento, Telefone
  - **Dados da Academia:** Academia, Faixa
  - **Dados Físicos:** Peso, Altura
  - **Responsável:** Nome e telefone (se menor de idade)
- Botão "CADASTRAR E INSCREVER"
- Após cadastro, redireciona para confirmação

---

### 13. Emissão de Boleto
**Rota:** `/eventos/[id]/boleto`  
**Arquivo:** `app/eventos/[id]/boleto/page.tsx`  
**Status:** ✅ Implementada (Wireframe)

**Funcionalidades:**
- Página para emissão de boleto
- Link para fazer inscrição (se não inscrito)
- Informações sobre pagamento

**Nota:** Página marcada como wireframe para apresentação

---

## 👤 PÁGINAS DO DASHBOARD (Autenticadas)

### 14. Dashboard Principal
**Rota:** `/dashboard`  
**Arquivo:** `app/dashboard/page.tsx`  
**Status:** ✅ Implementada

**Funcionalidades:**
- Hero Section
- Grid de eventos com filtros
- Sidebar com:
  - **Resultados:** Lista de eventos com resultados
  - **Ranking:** Lista de rankings
- Layout responsivo

**Componentes utilizados:**
- `HeroSection`
- `EventFilters`
- `EventGrid`

---

### 15. Meu Perfil
**Rota:** `/dashboard/meu-perfil`  
**Arquivo:** `app/dashboard/meu-perfil/page.tsx`  
**Status:** ✅ Implementada

**Funcionalidades:**
- Visualização e edição do perfil do usuário
- Dados pessoais
- Dados de contato
- Configurações de conta

---

### 16. Meus Atletas
**Rota:** `/dashboard/meus-atletas`  
**Arquivo:** `app/dashboard/meus-atletas/page.tsx`  
**Status:** ✅ Implementada

**Funcionalidades:**
- Lista de atletas cadastrados
- Gerenciamento de atletas
- Ações:
  - Cadastrar novo atleta
  - Editar atleta
  - Ver inscrições do atleta

---

### 17. Editar Atleta
**Rota:** `/dashboard/meus-atletas/[id]/editar`  
**Arquivo:** `app/dashboard/meus-atletas/[id]/editar/page.tsx`  
**Status:** ✅ Implementada

**Funcionalidades:**
- Formulário de edição de atleta
- Atualização de dados pessoais
- Atualização de dados da academia
- Atualização de dados físicos
- Salvar alterações

---

### 18. Inscrições do Atleta
**Rota:** `/dashboard/meus-atletas/[id]/inscricoes`  
**Arquivo:** `app/dashboard/meus-atletas/[id]/inscricoes/page.tsx`  
**Status:** ✅ Implementada

**Funcionalidades:**
- Lista de inscrições do atleta
- Histórico de eventos
- Status das inscrições
- Detalhes de cada inscrição

---

## 🔧 PÁGINAS ADMINISTRATIVAS

### 19. Criar Novo Evento (Admin)
**Rota:** `/admin/eventos/novo`  
**Arquivo:** `app/admin/eventos/novo/page.tsx`  
**Status:** ✅ Implementada

**Funcionalidades:**
- Formulário completo de criação de evento
- Sistema de abas:
  - **Sobre:** Informações básicas, apresentação, categorias
  - **Inscrições:** Valores, formas de pagamento
  - **Pagamento:** Informações financeiras
  - **Checagem:** Informações sobre checagem
  - **Chaves:** Informações sobre chaves
  - **Pesagem:** Informações sobre pesagem
  - **Premiação:** Sistema de pontuação
  - **Cronograma:** Datas importantes
  - **Avaliação:** Termos e condições
- Upload de imagens:
  - Banner do evento
  - Imagem de destaque
- Campos editáveis:
  - Organizador, código, título
  - Apresentação e descrições
  - Valores de inscrição
  - Informações de categorias
  - Regras e termos
- Botões de ação:
  - Salvar rascunho
  - Publicar evento
  - Cancelar

---

## 📊 Resumo por Categoria

### Páginas Públicas: 4
1. Home
2. Login
3. Cadastro
4. Recuperar Senha

### Páginas de Eventos: 3
5. Detalhes do Evento
6. Atletas Inscritos
7. Tabela de Peso

### Páginas de Inscrição: 6
8. Hub de Inscrição (verificar)
9. Inscrição Própria
10. Seleção de Atletas
11. Confirmação de Inscrições
12. Cadastro de Novo Atleta
13. Emissão de Boleto

### Páginas do Dashboard: 5
14. Dashboard Principal
15. Meu Perfil
16. Meus Atletas
17. Editar Atleta
18. Inscrições do Atleta

### Páginas Administrativas: 1
19. Criar Novo Evento

**Total:** 18 páginas implementadas + 1 rota não implementada

---

## 🔍 Páginas que Precisam de Verificação

### 1. Hub de Inscrição
**Rota esperada:** `/eventos/[id]/inscricao`  
**Status:** ⚠️ Não encontrado arquivo `page.tsx`  
**Ação:** Verificar se está implementado como componente ou se precisa ser criado

---

## 📝 Notas Importantes

### Layouts Especiais
- **Dashboard:** Possui layout próprio (`app/dashboard/layout.tsx`)
- **Admin:** Possui layout próprio (`app/admin/layout.tsx`)

### Rotas Dinâmicas
- `[id]` - ID do evento ou atleta
- Todas as rotas de eventos usam `[id]` para identificar o evento

### Componentes Reutilizáveis
- `Header` - Usado em todas as páginas públicas
- `Footer` - Usado em todas as páginas públicas
- `WhatsAppWidget` - Usado em todas as páginas públicas
- `EventDetails` - Componente principal da página de detalhes
- `WeightTableContent` - Componente da tabela de peso
- `RegisteredAthletesContent` - Componente de atletas inscritos

---

## ✅ Checklist de Implementação

### Páginas Completas: 18
- [x] Home
- [x] Login
- [x] Cadastro
- [x] Recuperar Senha
- [x] Detalhes do Evento
- [x] Atletas Inscritos
- [x] Tabela de Peso
- [x] Inscrição Própria
- [x] Seleção de Atletas
- [x] Confirmação de Inscrições
- [x] Cadastro de Novo Atleta
- [x] Emissão de Boleto
- [x] Dashboard Principal
- [x] Meu Perfil
- [x] Meus Atletas
- [x] Editar Atleta
- [x] Inscrições do Atleta
- [x] Criar Novo Evento

### Páginas Não Implementadas: 1
- [ ] Hub de Inscrição (`/eventos/[id]/inscricao`) - Pode ser opcional se o fluxo for direto

---

## 🎯 Próximos Passos Sugeridos

1. **Verificar Hub de Inscrição:** Confirmar se a rota `/eventos/[id]/inscricao` existe ou precisa ser criada
2. **Implementar funcionalidades wireframe:** Páginas marcadas como wireframe precisam de implementação completa
3. **Integração com backend:** Conectar todas as páginas com API/banco de dados
4. **Testes:** Criar testes para todas as rotas
5. **Documentação de rotas:** Criar documentação de API routes (se houver)

---

**Última atualização:** 2025-01-XX  
**Versão:** 1.0

