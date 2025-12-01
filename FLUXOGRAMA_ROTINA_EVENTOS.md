# Fluxograma da Rotina de Eventos
## Plataforma Meu Camp

---

## 📋 Visão Geral

A página de eventos oferece **5 abas principais** que permitem aos usuários visualizar informações, realizar inscrições, consultar atletas inscritos, verificar tabelas de peso e gerenciar aspectos financeiros do evento.

---

## 🎯 Estrutura Principal

```
┌─────────────────────────────────────────────────────────────┐
│                    PÁGINA DO EVENTO                          │
│              /eventos/[id]                                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Menu de Navegação (5 Abas Principais)               │  │
│  │                                                       │  │
│  │  [INFORMAÇÕES] [INSCRIÇÕES] [ATLETAS INSCRITOS]      │  │
│  │  [TABELA DE PESO] [FINANCEIRO]                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📑 ABA 1: INFORMAÇÕES

### **Estrutura**
A aba INFORMAÇÕES contém **7 sub-abas** com informações detalhadas do evento:

```
┌─────────────────────────────────────────────────────────────┐
│  ABA: INFORMAÇÕES                                            │
│                                                              │
│  Sub-abas:                                                   │
│  • SOBRE O EVENTO                                            │
│  • LOCAL DO EVENTO                                           │
│  • VALORES DAS INSCRIÇÕES                                    │
│  • FORMAS DE PAGAMENTO                                       │
│  • PREMIAÇÃO                                                 │
│  • CATEGORIAS                                                │
│  • ABSOLUTO                                                  │
└─────────────────────────────────────────────────────────────┘
```

### **Fluxo de Navegação**

```
Página do Evento
    │
    ├─→ Clica em "INFORMAÇÕES" (aba ativa por padrão)
    │
    └─→ Visualiza conteúdo da primeira sub-aba
            │
            ├─→ Navega entre sub-abas
            │   • SOBRE O EVENTO
            │   • LOCAL DO EVENTO
            │   • VALORES DAS INSCRIÇÕES
            │   • FORMAS DE PAGAMENTO
            │   • PREMIAÇÃO
            │   • CATEGORIAS
            │   • ABSOLUTO
            │
            └─→ Pode mudar para outras abas principais
```

### **Conteúdo de Cada Sub-aba**

**SOBRE O EVENTO**
- Descrição completa do evento
- Informações sobre organização
- Datas importantes (inscrições, pagamento, checagem, chaves)

**LOCAL DO EVENTO**
- Endereço completo
- Mapa integrado (Google Maps)
- Horário de abertura dos portões

**VALORES DAS INSCRIÇÕES**
- Tabela de preços por categoria
- Valores para 1 categoria, 2 categorias, absoluto

**FORMAS DE PAGAMENTO**
- Informações sobre métodos aceitos
- Instruções de pagamento

**PREMIAÇÃO**
- Detalhes sobre premiação
- Categorias premiadas

**CATEGORIAS**
- Lista de categorias disponíveis
- Faixas etárias e faixas de graduação

**ABSOLUTO**
- Informações sobre categoria absoluto
- Regras específicas

---

## 📝 ABA 2: INSCRIÇÕES

### **Fluxo Completo**

```
Página do Evento
    │
    ├─→ Clica em "INSCRIÇÕES"
    │
    └─→ Wizard de Inscrição (4 Passos)
            │
            ├─→ PASSO 1: Seleção de Atletas
            │   • Inscrição do Professor (opcional)
            │   • Selecionar atletas cadastrados
            │   • Cadastrar novo atleta (se necessário)
            │
            ├─→ PASSO 2: Configuração de Categorias
            │   • Definir categoria, faixa e peso
            │   • Escolher tipo de inscrição
            │
            ├─→ PASSO 3: Pagamento
            │   • Escolher forma de pagamento
            │   • Unificado ou Individual
            │
            └─→ PASSO 4: Confirmação
                • Revisar informações
                • Finalizar inscrição
                • Gerar boleto(s)
```

> **Nota:** O fluxo detalhado de inscrição está documentado em `FLUXOGRAMA_INSCRICAO.md`

---

## 👥 ABA 3: ATLETAS INSCRITOS

### **Estrutura**

```
┌─────────────────────────────────────────────────────────────┐
│  ABA: ATLETAS INSCRITOS                                      │
│                                                              │
│  Modos de Visualização:                                     │
│  • Geral                                                     │
│  • Categoria de Peso                                        │
│  • Absoluto Jiu-Jitsu                                       │
│  • Equipe                                                    │
│  • Equipe e Professor                                       │
└─────────────────────────────────────────────────────────────┘
```

### **Fluxo de Navegação**

```
Página do Evento
    │
    ├─→ Clica em "ATLETAS INSCRITOS"
    │
    └─→ Lista de Atletas Inscritos
            │
            ├─→ Escolhe modo de visualização
            │   • Geral (todos os atletas)
            │   • Categoria de Peso (agrupado)
            │   • Absoluto (apenas absoluto)
            │   • Equipe (agrupado por academia)
            │   • Equipe e Professor (agrupado)
            │
            ├─→ Busca por nome/academia/professor
            │
            ├─→ Filtros (no modo Categoria de Peso)
            │   • Categoria
            │   • Faixa
            │   • Peso
            │   • Sexo
            │
            └─→ Visualiza informações de cada atleta
                • Nome, idade, categoria
                • Faixa, peso, academia
                • Status de pagamento
                • ID do atleta
```

### **Funcionalidades**

- **Busca**: Por nome, academia, professor, categoria
- **Filtros**: Aplicáveis no modo "Categoria de Peso"
- **Paginação**: Navegação entre páginas de resultados
- **Agrupamento**: Visualização organizada por diferentes critérios
- **Status de Pagamento**: Visualização de pagamento confirmado/pendente

---

## ⚖️ ABA 4: TABELA DE PESO

### **Estrutura**

```
┌─────────────────────────────────────────────────────────────┐
│  ABA: TABELA DE PESO                                         │
│                                                              │
│  Tabela organizada por:                                     │
│  • Faixa Etária (Mirim, Pré-Mirim, Infantil)                │
│  • Categorias de Peso (Galão, Pluma, Pena, etc.)            │
│  • Peso Mínimo e Máximo                                      │
│  • Gênero (Masculino/Feminino)                              │
└─────────────────────────────────────────────────────────────┘
```

### **Fluxo de Navegação**

```
Página do Evento
    │
    ├─→ Clica em "TABELA DE PESO"
    │
    └─→ Visualiza Tabela de Peso
            │
            ├─→ Navega por grupos de idade
            │   • Mirim (4-5 anos)
            │   • Pré-Mirim (6-7 anos)
            │   • Mirim (8-9 anos)
            │   • Infantil (10-11 anos)
            │   • Infantil (12-13 anos)
            │
            ├─→ Expande/recolhe grupos
            │
            └─→ Baixa PDF da tabela (opcional)
```

### **Informações Exibidas**

- **Categoria**: Nome da categoria de peso
- **Peso Mínimo**: Limite inferior
- **Peso Máximo**: Limite superior
- **Gênero**: Masculino/Feminino ou Misto

### **Funcionalidades**

- **Expansão/Recolhimento**: Grupos de idade podem ser expandidos
- **Download PDF**: Botão para baixar tabela completa
- **Informações Importantes**: Avisos sobre pesagem e regras

---

## 💰 ABA 5: FINANCEIRO

### **Estrutura**

```
┌─────────────────────────────────────────────────────────────┐
│  ABA: FINANCEIRO                                              │
│                                                              │
│  Funcionalidades:                                            │
│  • Emitir 2ª Via do Boleto                                  │
│  • Consultar Boletos por CPF                                 │
│  • Visualizar Status de Pagamento                            │
│  • Imprimir Boletos                                          │
└─────────────────────────────────────────────────────────────┘
```

### **Fluxo de Navegação**

```
Página do Evento
    │
    ├─→ Clica em "FINANCEIRO"
    │
    └─→ Área Financeira
            │
            ├─→ [EMITIR 2ª VIA DO BOLETO]
            │       │
            │       └─→ Modal de Consulta
            │           • Informa CPF do responsável
            │           • Clica em "CONSULTAR"
            │           • Visualiza lista de boletos
            │           • [IMPRIMIR] ou [VER ATLETAS]
            │
            └─→ Informações sobre boletos
                • Valor
                • Vencimento
                • Situação (Pendente/Pago/Vencido)
```

### **Funcionalidades**

- **Consulta por CPF**: Busca boletos do responsável
- **Emissão de 2ª Via**: Gera nova via de boleto
- **Status de Pagamento**: Visualiza situação de cada boleto
- **Impressão**: Imprime boleto diretamente
- **Associação com Atletas**: Visualiza atletas vinculados ao boleto

### **Informações do Boleto**

- Número do boleto
- Valor
- Data de vencimento
- Situação (Pendente/Pago/Vencido)
- Lista de atletas associados

---

## 🔄 Fluxo Completo de Navegação

```
┌─────────────────────────────────────────────────────────────┐
│                    PÁGINA DO EVENTO                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ INFORMAÇÕES   │  │ INSCRIÇÕES    │  │ ATLETAS      │     │
│  │              │  │               │  │ INSCRITOS    │     │
│  │ 7 sub-abas   │  │ 4 passos      │  │ 5 modos      │     │
│  │              │  │ wizard        │  │ visualização │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ TABELA       │  │ FINANCEIRO    │                        │
│  │ DE PESO      │  │               │                        │
│  │              │  │ Emissão       │                        │
│  │ Por idade    │  │ boletos       │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Casos de Uso Principais

### **1. Consultar Informações do Evento**
```
Usuário → INFORMAÇÕES → Navega entre sub-abas → Encontra informações necessárias
```

### **2. Realizar Inscrição**
```
Usuário → INSCRIÇÕES → Completa wizard (4 passos) → Finaliza inscrição
```

### **3. Verificar Atletas Inscritos**
```
Usuário → ATLETAS INSCRITOS → Escolhe modo → Busca/Filtra → Visualiza lista
```

### **4. Consultar Tabela de Peso**
```
Usuário → TABELA DE PESO → Expande grupo de idade → Verifica categoria → Baixa PDF (opcional)
```

### **5. Gerenciar Pagamentos**
```
Usuário → FINANCEIRO → Emite 2ª via → Informa CPF → Consulta → Imprime boleto
```

---

## ✨ Benefícios da Estrutura

✅ **Organização Clara**: Cada aba tem função específica e bem definida  
✅ **Navegação Intuitiva**: Fácil acesso a todas as informações  
✅ **Múltiplas Visualizações**: Diferentes formas de ver os dados  
✅ **Gestão Completa**: Desde informações até pagamentos  
✅ **Acessibilidade**: Informações sempre disponíveis  

---

## 📱 Responsividade

Todas as abas são **totalmente responsivas**, adaptando-se a:
- 📱 Dispositivos móveis
- 📱 Tablets
- 💻 Desktops

---

## 🔗 Integração entre Abas

As abas trabalham de forma integrada:

- **INFORMAÇÕES** → Fornece contexto para **INSCRIÇÕES**
- **INSCRIÇÕES** → Gera dados para **ATLETAS INSCRITOS**
- **ATLETAS INSCRITOS** → Referencia **TABELA DE PESO**
- **FINANCEIRO** → Gerencia pagamentos das **INSCRIÇÕES**

---

## 📝 Notas para Apresentação

- A navegação entre abas é **instantânea** (sem recarregar página)
- Todas as abas mantêm o **contexto do evento** selecionado
- O sistema permite **múltiplas consultas simultâneas**
- As informações são **atualizadas em tempo real**
- A interface é **intuitiva e autoexplicativa**

---

## 🎨 Design e UX

- **Cores Consistentes**: Laranja para ações principais, vermelho para destaque
- **Ícones Claros**: Cada aba possui ícone identificador
- **Feedback Visual**: Estados ativos/inativos claramente diferenciados
- **Loading States**: Indicadores de carregamento quando necessário
- **Mensagens de Erro**: Feedback claro em caso de problemas

