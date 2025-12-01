# Documentação da Rotina de Inscrição - Meu Camp

## 📋 Visão Geral

Este documento descreve o fluxo completo de inscrição de atletas em eventos, desde o acesso inicial até a confirmação final da inscrição e pagamento.

---

## 🔄 Fluxo Principal de Inscrição

### 1. PONTO DE ENTRADA - Página de Detalhes do Evento

**Localização:** `/eventos/[id]`

**Ações disponíveis:**
- Visualizar informações do evento
- Botão "INSCREVER-SE" ou "FAZER INSCRIÇÃO"
- Verificar período de inscrições (ativo/encerrado)
- Consultar valores e categorias

**Decisão:** Usuário clica em "INSCREVER-SE"

---

### 2. VERIFICAÇÃO DE AUTENTICAÇÃO

**Decisão:** Usuário está logado?

#### 2.1. NÃO AUTENTICADO
- **Redirecionamento:** `/login`
- **Ações:**
  - Fazer login com email/CPF e senha
  - Ou criar nova conta (`/cadastro`)
  - Após login, retorna ao fluxo de inscrição

#### 2.2. AUTENTICADO
- **Continua para:** Página de escolha do tipo de inscrição

---

### 3. ESCOLHA DO TIPO DE INSCRIÇÃO

**Localização:** `/eventos/[id]/inscricao`

**Opções disponíveis:**

#### 3.1. "FAZER MINHA INSCRIÇÃO"
- **Destino:** `/eventos/[id]/inscricao/minha`
- **Perfil:** Atleta maior de 18 anos ou professor
- **Descrição:** Inscrição do próprio usuário logado

#### 3.2. "REALIZAR INSCRIÇÃO DE MEUS ATLETAS"
- **Destino:** `/eventos/[id]/inscricao/atletas`
- **Perfil:** Responsável ou professor
- **Descrição:** Inscrição de múltiplos atletas (até 20 por vez)

---

## 🔀 FLUXO A: INSCRIÇÃO PRÓPRIA (Minha Inscrição)

### A1. Página de Inscrição Própria
**Localização:** `/eventos/[id]/inscricao/minha`

**Campos do formulário:**
- **Dados Pessoais** (pré-preenchidos do perfil):
  - Nome Completo *
  - CPF *
  - Data de Nascimento *
  - Telefone *
  
- **Dados da Academia:**
  - Academia *
  - Faixa *
  
- **Categoria do Evento:**
  - Categoria (idade/faixa) *
  - Peso (kg) *

**Validações:**
- Todos os campos obrigatórios preenchidos
- CPF válido
- Data de nascimento válida
- Peso dentro da faixa da categoria selecionada
- Idade compatível com a categoria

**Ação:** Clicar em "CONFIRMAR INSCRIÇÃO"

### A2. Confirmação e Seleção de Categorias
**Ações:**
- Selecionar categoria de peso
- Selecionar tipo de inscrição:
  - Apenas Categoria de Peso: R$ 50,00
  - Categoria de Peso + Absoluto: R$ 80,00

**Ação:** Clicar em "FINALIZAR INSCRIÇÃO"

### A3. Redirecionamento para Pagamento
**Destino:** Gateway de pagamento (PIX ou Boleto)

**Fluxo de pagamento:**
- Seleção do método (PIX ou Boleto)
- Geração do código de pagamento
- Confirmação pendente até pagamento

**Após pagamento:**
- Status da inscrição: "Pendente de Confirmação"
- Aguardar confirmação do pagamento
- Notificação por email/WhatsApp

---

## 🔀 FLUXO B: INSCRIÇÃO DE MÚLTIPLOS ATLETAS

### B1. Página de Seleção de Atletas
**Localização:** `/eventos/[id]/inscricao/atletas`

**Informações exibidas:**
- Card do evento com detalhes
- Período de inscrição
- Avisos importantes:
  - Limite de 20 inscrições por vez
  - Idade calculada pelo ano de nascimento

**Ações disponíveis:**
- Botão "SELECIONAR MEUS ATLETAS"
- Botão "CADASTRAR NOVO ATLETA"

### B2. Decisão: Atleta já cadastrado?

#### B2.1. ATLETA JÁ CADASTRADO
**Ação:** Clicar em "SELECIONAR MEUS ATLETAS"

**Modal de Seleção:**
- Lista de atletas cadastrados
- Filtros: nome, idade, academia
- Seleção múltipla (checkbox)
- Limite: 20 atletas por seleção
- Botão "CONFIRMAR SELEÇÃO"

**Após seleção:**
- Redirecionamento para: `/eventos/[id]/inscricao/atletas/confirmar`

#### B2.2. ATLETA NÃO CADASTRADO
**Ação:** Clicar em "CADASTRAR NOVO ATLETA"

**Destino:** `/eventos/[id]/inscricao/cadastrar-atleta`

**Formulário de cadastro:**
- **Dados Pessoais:**
  - Nome Completo *
  - CPF *
  - Data de Nascimento *
  - Telefone/WhatsApp *
  
- **Dados da Academia:**
  - Academia *
  - Faixa *
  
- **Dados Físicos:**
  - Peso (kg) *
  - Altura (cm)
  
- **Responsável (se menor de idade):**
  - Nome do Responsável
  - Telefone do Responsável

**Validações:**
- CPF único (não pode estar cadastrado)
- Todos os campos obrigatórios
- Data de nascimento válida

**Ação:** Clicar em "CADASTRAR E INSCREVER"

**Após cadastro:**
- Atleta cadastrado no sistema
- Redirecionamento para: `/eventos/[id]/inscricao/atletas/confirmar`
- Atleta já aparece na lista de seleção

---

### B3. Página de Confirmação e Configuração
**Localização:** `/eventos/[id]/inscricao/atletas/confirmar`

**Para cada atleta selecionado:**

#### B3.1. Informações Exibidas
- Avatar/Foto
- Nome e idade
- Gênero (♂/♀)
- Categoria (idade)
- Faixa
- Categoria de peso
- Academia
- Professor

#### B3.2. Decisão: Inscrição do Atleta
**Opção:** "INSCREVER ESSE ATLETA?"
- **SIM:** Atleta será inscrito
- **NÃO:** Atleta não será inscrito (pode ser removido)

#### B3.3. Configuração de Categorias (se SIM)
Para cada atleta com inscrição ativa:

**Campos editáveis:**
- **Categoria:** Dropdown com faixas etárias
  - Ex: Infanto-Juvenil A (12 a 13 anos)
  - Ex: Infanto-Juvenil B (14 a 15 anos)
  - Ex: Juvenil (16 a 17 anos)
  
- **Faixa:** Dropdown
  - Branca, Cinza, Amarela, Laranja, Verde, Azul, Roxa, Marrom, Preta
  
- **Categoria de Peso:** Dropdown
  - Baseado na tabela de peso oficial
  - Ex: Pluma (Até 38.500 kg)
  - Ex: Pena (Até 42.500 kg)
  - Ex: Leve (Até 46.500 kg)
  - Ex: Médio (Até 50.500 kg)
  - Ex: Meio Pesado (Até 54.500 kg)
  - Ex: Pesado (Acima de 54.500 kg)
  
- **Tipo de Inscrição:** Dropdown
  - Apenas Categoria de Peso: R$ 50,00
  - Categoria de Peso + Absoluto: R$ 80,00

**Validações:**
- Categoria compatível com idade do atleta
- Peso do atleta dentro da faixa da categoria selecionada
- Faixa compatível com a categoria

**Ações disponíveis:**
- Botão "SELECIONAR MEUS ATLETAS" (adicionar mais)
- Botão "CADASTRAR NOVO ATLETA"

#### B3.4. Resumo da Inscrição
**Informações exibidas:**
- Número de atletas a serem inscritos
- Valor total das inscrições (soma de todos os atletas)

**Exemplo:**
- 3 atletas inscritos
- Valor Total: R$ 150,00

#### B3.5. Seleção da Forma de Pagamento
**Opções:**
- **Pagamento Unificado:** Todas as inscrições juntas (1 pagamento)
- **Pagamento Individual:** Cada inscrição terá seu próprio pagamento

**Métodos disponíveis:**
- Boleto Bancário
- PIX

**Ação:** Selecionar método e clicar em "FINALIZAR INSCRIÇÃO"

---

### B4. Finalização e Pagamento
**Após clicar em "FINALIZAR INSCRIÇÃO":**

**Validações finais:**
- Pelo menos 1 atleta selecionado para inscrição
- Todas as categorias configuradas corretamente
- Valores calculados corretamente

**Processamento:**
1. Criação das inscrições no sistema
2. Status inicial: "Pendente de Pagamento"
3. Geração do(s) pagamento(s):
   - Se Unificado: 1 boleto/PIX para o valor total
   - Se Individual: N boletos/PIX (um por atleta)

**Redirecionamento:**
- Página de confirmação de pagamento
- Exibição do(s) código(s) de pagamento
- Instruções de pagamento
- Prazo para pagamento

**Notificações:**
- Email com detalhes da inscrição
- WhatsApp (se configurado) com link de pagamento

---

## 📊 Estados da Inscrição

### Estados possíveis:
1. **Pendente de Pagamento**
   - Inscrição criada, aguardando pagamento
   - Prazo: conforme definido no evento

2. **Pagamento Confirmado**
   - Pagamento aprovado
   - Inscrição confirmada
   - Atleta aparece na lista de inscritos

3. **Pagamento Expirado**
   - Prazo de pagamento vencido
   - Inscrição cancelada automaticamente
   - Possibilidade de reativar (se houver prazo)

4. **Cancelada**
   - Inscrição cancelada pelo usuário ou sistema
   - Reembolso conforme política do evento

---

## ⚠️ Regras de Negócio Importantes

### Limites e Restrições:
1. **Limite de inscrições por vez:** Máximo de 20 atletas
2. **Período de inscrições:** Apenas dentro do prazo definido
3. **Validação de idade:** Calculada pelo ano de nascimento
4. **Validação de peso:** Deve estar dentro da faixa da categoria
5. **Validação de faixa:** Deve ser compatível com a categoria
6. **CPF único:** Cada atleta pode ter apenas 1 inscrição por evento

### Validações Técnicas:
1. **CPF:** Formato válido e único no sistema
2. **Data de nascimento:** Data válida e compatível com categoria
3. **Peso:** Número válido, dentro da faixa da categoria
4. **Categoria:** Compatível com idade, faixa e peso do atleta

### Avisos ao Usuário:
1. **Limite de 20 inscrições:** Se houver mais atletas, repetir o processo
2. **Cálculo de idade:** Baseado no ano de nascimento
3. **Prazo de pagamento:** Informar prazo e consequências do atraso
4. **Política de reembolso:** Conforme definido no evento

---

## 🔄 Fluxos Alternativos e Exceções

### Exceção 1: Período de Inscrições Encerrado
- **Ação:** Botão de inscrição desabilitado
- **Mensagem:** "Período de inscrições encerrado"
- **Alternativa:** Contato com organizador

### Exceção 2: Evento Lotado
- **Ação:** Verificar disponibilidade de vagas
- **Mensagem:** "Evento lotado" ou "Categoria lotada"
- **Alternativa:** Lista de espera (se disponível)

### Exceção 3: Pagamento Não Confirmado
- **Ação:** Aguardar confirmação do gateway
- **Prazo:** Conforme política do evento
- **Alternativa:** Contato com suporte

### Exceção 4: Erro na Validação
- **Ação:** Exibir mensagem de erro específica
- **Campos:** Destacar campos com erro
- **Alternativa:** Corrigir dados e tentar novamente

---

## 📱 Páginas e Rotas do Fluxo

### Mapa de Navegação:
```
/eventos/[id]
  └── /inscricao
      ├── /minha (Inscrição própria)
      └── /atletas
          ├── /confirmar (Confirmação e configuração)
          └── /cadastrar-atleta (Cadastro de novo atleta)
```

### Componentes Utilizados:
- `Header` - Cabeçalho com navegação
- `Footer` - Rodapé
- `WhatsAppWidget` - Widget de contato
- `AthleteSelectionModal` - Modal de seleção de atletas
- Formulários de cadastro e inscrição
- Componentes de pagamento

---

## 🎨 Elementos Visuais para o Fluxograma

### Formas Sugeridas:
- **Retângulo:** Processo/Ação
- **Losango:** Decisão/Pergunta
- **Cilindro:** Banco de Dados
- **Paralelogramo:** Entrada/Saída de Dados
- **Retângulo arredondado:** Início/Fim
- **Documento:** Página/Tela

### Cores Sugeridas:
- **Azul:** Processos normais
- **Verde:** Sucesso/Confirmação
- **Vermelho:** Erro/Cancelamento
- **Amarelo:** Aviso/Validação
- **Laranja:** Ação do usuário

---

## 📝 Notas para Implementação no Figma

1. **Organização:** Criar frames separados para cada fluxo (A e B)
2. **Conectores:** Usar setas para indicar fluxo e decisões
3. **Legendas:** Adicionar legenda explicando símbolos e cores
4. **Anotações:** Incluir notas sobre validações e regras de negócio
5. **Responsividade:** Considerar diferentes estados (mobile/desktop)
6. **Interatividade:** Se possível, criar protótipo clicável

---

## ✅ Checklist para Validação do Fluxograma

- [ ] Todos os pontos de decisão estão claros
- [ ] Fluxos alternativos estão mapeados
- [ ] Validações estão indicadas
- [ ] Estados da inscrição estão definidos
- [ ] Páginas e rotas estão documentadas
- [ ] Regras de negócio estão incluídas
- [ ] Exceções e erros estão tratados
- [ ] Notificações estão indicadas
- [ ] Processo de pagamento está detalhado
- [ ] Navegação entre páginas está clara

---

**Última atualização:** 2025-01-XX
**Versão:** 1.0

