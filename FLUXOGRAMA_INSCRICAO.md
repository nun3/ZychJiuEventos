# Fluxograma de Inscrição em Eventos
## Plataforma Zych Jiu-Jitsu Eventos

---

## 📋 Visão Geral do Processo

O processo de inscrição é realizado em **4 passos simples e intuitivos**, permitindo que professores ou atletas inscrevam um ou múltiplos atletas em um evento de forma rápida e organizada.

---

## 🔄 Fluxo Principal de Inscrição

### **INÍCIO**
```
┌─────────────────────────────────────┐
│     PÁGINA DO EVENTO                 │
│                                     │
│  [INFORMAÇÕES] [INSCRIÇÕES] ...     │
└──────────────┬──────────────────────┘
               │
               │ Clica em "INSCRIÇÕES"
               ▼
```

### **PASSO 1: SELEÇÃO DE ATLETAS**
```
┌─────────────────────────────────────┐
│  PASSO 1: SELEÇÃO DE ATLETAS         │
│                                     │
│  ✓ Inscrição do Professor           │
│    (Opcional - Faixa Preta)         │
│                                     │
│  ✓ Selecionar Atletas Cadastrados   │
│    • Busca por nome/faixa/peso      │
│    • Selecionar todos               │
│    • Atletas já inscritos bloqueados│
│                                     │
│  ➕ Cadastrar Novo Atleta            │
│    (se necessário)                  │
└──────────────┬──────────────────────┘
               │
               │ Pelo menos 1 atleta selecionado
               ▼
```

### **PASSO 2: CONFIGURAÇÃO DE CATEGORIAS**
```
┌─────────────────────────────────────┐
│  PASSO 2: CONFIGURAÇÃO              │
│                                     │
│  Para cada atleta:                  │
│  • Inscrição: SIM / NÃO             │
│                                     │
│  Se SIM, definir:                   │
│  • Categoria (idade)                 │
│  • Faixa                            │
│  • Categoria de Peso                 │
│  • Tipo:                            │
│    - Só Peso: R$ 70,00              │
│    - Peso + Absoluto: R$ 95,00      │
└──────────────┬──────────────────────┘
               │
               │ Pelo menos 1 inscrição confirmada
               ▼
```

### **PASSO 3: PAGAMENTO**
```
┌─────────────────────────────────────┐
│  PASSO 3: PAGAMENTO                 │
│                                     │
│  Resumo:                            │
│  • X atleta(s) inscrito(s)          │
│  • Valor Total: R$ XXX,XX           │
│                                     │
│  Forma de Pagamento:                │
│  ○ Unificado (todos juntos)         │
│  ○ Individual (cada um separado)    │
│                                     │
│  Método: Boleto ou Pix               │
└──────────────┬──────────────────────┘
               │
               ▼
```

### **PASSO 4: CONFIRMAÇÃO**
```
┌─────────────────────────────────────┐
│  PASSO 4: CONFIRMAÇÃO                │
│                                     │
│  Revisão Final:                     │
│  • Lista de atletas                  │
│  • Categorias selecionadas           │
│  • Valor total                       │
│  • Forma de pagamento                │
│                                     │
│  [FINALIZAR INSCRIÇÃO]              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     ✅ INSCRIÇÃO CONCLUÍDA           │
│                                     │
│  • Boleto gerado                    │
│  • Email de confirmação enviado      │
│  • Inscrições registradas            │
└─────────────────────────────────────┘
```

---

## 🎯 Fluxos Alternativos

### **1. Inscrição Individual (Atleta Próprio)**

```
Página do Evento
    │
    └─→ [FAZER MINHA INSCRIÇÃO]
            │
            ▼
    Formulário Simplificado
    • Dados Pessoais
    • Academia e Faixa
    • Categoria do Evento
            │
            ▼
    [CONFIRMAR] → ✅ Inscrição Finalizada
```

### **2. Cadastro de Novo Atleta**

```
Passo 1: Seleção de Atletas
    │
    └─→ [Cadastrar Novo Atleta]
            │
            ▼
    Formulário Completo
    • Dados Pessoais (Nome, CPF, Nascimento)
    • Dados da Academia
    • Dados Físicos (Peso, Altura)
    • Responsável (se menor de idade)
            │
            ▼
    [CADASTRAR E INSCREVER]
            │
            ▼
    Retorna ao Passo 1 com novo atleta
```

### **3. Emissão de Boleto**

```
Página do Evento
    │
    └─→ [EMITIR BOLETO]
            │
            ▼
    Verificação de Inscrição
            │
        ┌────┴────┐
        │         │
      SIM       NÃO
        │         │
        ▼         ▼
    Boleto    Redireciona
    Disponível  para inscrição
    [BAIXAR]
```

---

## 📊 Resumo Visual do Processo

```
┌─────────────────────────────────────────────────────────────┐
│                    PROCESSO DE INSCRIÇÃO                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   [1] ATLETAS    →    [2] CATEGORIAS    →    [3] PAGAMENTO │
│                                                              │
│        │                    │                    │           │
│        ▼                    ▼                    ▼           │
│   Selecionar          Configurar          Escolher forma    │
│   quem vai            categorias e         de pagamento      │
│   competir            tipos de            (unificado ou      │
│                      inscrição            individual)        │
│                                                              │
│                          │                                   │
│                          ▼                                   │
│                   [4] CONFIRMAÇÃO                            │
│                          │                                   │
│                          ▼                                   │
│                   Revisar e Finalizar                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Regras e Validações Importantes

### **Limites**
- ✅ Máximo de **20 inscrições** por processo
- ✅ Se houver mais atletas, repetir o procedimento

### **Validações**
- ✅ Idade calculada pelo **ano de nascimento**
- ✅ Atletas já inscritos **não podem ser selecionados novamente**
- ✅ Categoria deve ser **compatível com a idade**
- ✅ Peso deve estar dentro da **categoria selecionada**

### **Formas de Pagamento**
- 💳 **Boleto Bancário**
- 📱 **Pix**
- 🔄 **Unificado** (todos juntos) ou **Individual** (cada um separado)

---

## 📱 Funcionalidades Adicionais

### **Visualização**
- Ver lista de **atletas já inscritos** no evento
- Filtrar por categoria, faixa ou peso
- Buscar atletas específicos

### **Gestão**
- **Emitir boleto** após inscrição
- **Visualizar minhas inscrições**
- **Histórico completo** de participações

---

## ✨ Benefícios do Sistema

✅ **Processo Simples**: 4 passos claros e objetivos  
✅ **Múltiplas Inscrições**: Inscreva vários atletas de uma vez  
✅ **Flexibilidade**: Pagamento unificado ou individual  
✅ **Segurança**: Validações automáticas  
✅ **Rastreabilidade**: Histórico completo de inscrições  
✅ **Praticidade**: Cadastro rápido de novos atletas  

---

## 📝 Notas para Apresentação

- O sistema foi projetado para ser **intuitivo e rápido**
- Professores podem gerenciar **múltiplas inscrições** facilmente
- O processo completo leva **menos de 5 minutos** para múltiplos atletas
- Todas as informações são **validadas automaticamente**
- **Confirmação por email** garante segurança e rastreabilidade

