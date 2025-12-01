# Meu Camp

Plataforma web completa para gerenciar, divulgar e organizar eventos de Jiu-Jitsu (campeonatos, cursos, seminários, workshops), similar ao site iLutas (ilutas.com.br).

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilização
- **React Icons** - Ícones

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar em produção
npm start
```

O site estará disponível em [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
zych-jiu-eventos/
├── app/                    # Páginas (App Router)
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página Home
│   ├── eventos/           # Páginas de eventos
│   └── globals.css        # Estilos globais
├── components/            # Componentes reutilizáveis
│   ├── Header.tsx        # Cabeçalho com navegação
│   ├── Footer.tsx        # Rodapé
│   ├── Logo.tsx          # Logo Meu Camp
│   ├── HeroSection.tsx   # Hero com carousel
│   ├── EventFilters.tsx  # Filtros de eventos
│   ├── EventGrid.tsx     # Grid de eventos
│   ├── EventDetails.tsx # Detalhes do evento
│   └── WhatsAppWidget.tsx # Widget WhatsApp
├── public/               # Arquivos estáticos
└── zych/                # Documentação
    └── readme           # Especificações do projeto
```

## 🎨 Design System

### Paleta de Cores
- **Azul Escuro**: #1A3A52
- **Vermelho**: #E63946
- **Laranja**: #FF9500 (botão "CRIAR EVENTO")
- **Verde WhatsApp**: #25D366
- **Vermelho Marca**: #DC2626 (logo)

### Logo Meu Camp
O logo consiste em:
- Símbolo: Diamante com raio central (estilo yin-yang)
- Cores: Vermelho (#DC2626), Preto (#000000), Branco (#FFFFFF)
- Texto: "MEU CAMP" (branco) | "SEU CAMPEONATO ONLINE" (laranja)

## 📄 Páginas Implementadas

- ✅ **Home** - Landing page com hero, filtros e grid de eventos
- ✅ **Detalhes do Evento** - Página com sistema de abas
- ⏳ **Login** - Página de autenticação
- ⏳ **Cadastro** - Página de registro
- ⏳ **Divulgue Academia** - Página para academias
- ⏳ **Sistema** - Página sobre o sistema
- ⏳ **Quem Somos** - Página institucional

## 🔄 Próximos Passos

Consulte o arquivo `PLANO_CRIACAO.md` para ver o plano completo de desenvolvimento.

## 📝 Licença

Este projeto é privado e proprietário.

