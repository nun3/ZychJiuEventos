# Plano de Criação - Zych Jiu-Jitsu Eventos

## 📋 Visão Geral

Plataforma web completa para gerenciar, divulgar e organizar eventos de Jiu-Jitsu, similar ao iLutas (ilutas.com.br), mas adaptada para a marca Zych Jiu-Jitsu.

## ✅ Status do Projeto

### Fase 1: Estrutura Base e Páginas Principais (EM ANDAMENTO)

- [x] Configuração inicial do projeto Next.js
- [x] Configuração do Tailwind CSS
- [x] Estrutura de pastas e arquivos
- [x] Componente Header com logo Zych Jiu-Jitsu
- [x] Componente Footer completo
- [x] Componente WhatsApp Widget
- [x] Página Home (Landing Page)
  - [x] Hero Section com carousel
  - [x] Seção de Filtros de Eventos
  - [x] Grid de Eventos
- [ ] Página de Detalhes do Evento
- [ ] Páginas secundárias (Divulgue Academia, Sistema, Quem Somos)
- [ ] Páginas de Autenticação (Login, Cadastro)

### Fase 2: Componentes Reutilizáveis

- [ ] EventCard (card de evento)
- [ ] FilterBar (filtros avançados)
- [ ] Tabs/TabComponent (sistema de abas)
- [ ] Modal (confirmações, alertas)
- [ ] Form/FormInput (inputs reutilizáveis)
- [ ] Button (variações de botões)
- [ ] Carousel/Slider
- [ ] Map (integração Google Maps)
- [ ] Breadcrumb
- [ ] Pagination/Infinite Scroll
- [ ] LoadingSpinner
- [ ] ToastNotification

### Fase 3: Funcionalidades Backend

- [ ] API Routes (Next.js)
- [ ] Integração com banco de dados (PostgreSQL)
- [ ] Sistema de autenticação (JWT)
- [ ] CRUD de eventos
- [ ] Sistema de inscrições
- [ ] Integração com gateway de pagamento
- [ ] Sistema de chaves/brackets
- [ ] Notificações (email/SMS/WhatsApp)

### Fase 4: Painéis Administrativos

- [ ] Painel do Organizador
  - [ ] Dashboard
  - [ ] Criar/Editar Eventos
  - [ ] Gerenciar Inscrições
  - [ ] Gerenciar Chaves
  - [ ] Relatórios
- [ ] Painel do Atleta
  - [ ] Perfil
  - [ ] Meus Eventos
  - [ ] Histórico
  - [ ] Certificados

### Fase 5: Otimizações e Deploy

- [ ] SEO otimizado
- [ ] Performance optimization
- [ ] Testes (unitários e integração)
- [ ] Deploy (Vercel/Netlify)
- [ ] Certificado SSL
- [ ] Backup automático

## 🎨 Design System

### Paleta de Cores
- **Azul Escuro**: #1A3A52 (navegação, backgrounds)
- **Vermelho**: #E63946 (CTAs, destaques)
- **Laranja**: #FF9500 (botão primário "CRIAR EVENTO")
- **Verde WhatsApp**: #25D366
- **Branco**: #FFFFFF
- **Preto**: #000000
- **Vermelho Marca**: #DC2626 (logo)

### Tipografia
- **Font Family**: Inter, Roboto (sans-serif)
- **Headings**: Font weight 700-900
- **Body**: Font weight 400-500

### Logo Zych Jiu-Jitsu
- Símbolo: Diamante com raio central
- Cores: Vermelho (#DC2626), Preto (#000000), Branco (#FFFFFF)
- Texto: "ZYCH" (vermelho) | "JIU-JITSU" (preto)

## 📁 Estrutura de Arquivos

```
zych-jiu-eventos/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (Home)
│   ├── globals.css
│   ├── eventos/
│   │   └── [id]/
│   │       └── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── cadastro/
│   │   └── page.tsx
│   ├── academias/
│   │   └── page.tsx
│   ├── sistema/
│   │   └── page.tsx
│   └── quem-somos/
│       └── page.tsx
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Logo.tsx
│   ├── HeroSection.tsx
│   ├── EventFilters.tsx
│   ├── EventGrid.tsx
│   ├── EventCard.tsx
│   ├── WhatsAppWidget.tsx
│   └── ...
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   └── utils.ts
├── types/
│   └── index.ts
└── public/
    └── images/
```

## 🚀 Próximos Passos

1. **Completar páginas principais**
   - Página de Detalhes do Evento
   - Páginas secundárias (Divulgue Academia, Sistema, Quem Somos)
   - Páginas de autenticação

2. **Criar componentes reutilizáveis**
   - EventCard
   - Tabs
   - Modal
   - Form components

3. **Implementar funcionalidades**
   - Sistema de filtros funcional
   - Integração com API
   - Sistema de autenticação

4. **Otimizar e testar**
   - Responsividade completa
   - Performance
   - Testes

## 📝 Notas

- O projeto está usando Next.js 14 com App Router
- Tailwind CSS para estilização
- TypeScript para type safety
- React Icons para ícones
- O logo Zych Jiu-Jitsu foi criado conforme a descrição fornecida

