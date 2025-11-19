# Histórico de Migração de Arquitetura

Este documento registra o progresso da reestruturação da arquitetura de rotas e páginas do sistema, conforme o plano definido em `docs/page2.md`.

---

## Fase 1 – Autenticação Unificada em `/login` ✅

**Data de Conclusão:** 2025-01-XX

### Objetivo
Consolidar as rotas de autenticação (`/login`, `/cadastro`, `/recuperar-senha`) em uma única página `/login` com modos internos (tabs/steps).

### Mudanças Implementadas

1. **`app/login/page.tsx`**
   - Transformado em página multi-modo usando `useSearchParams` e estado interno
   - Modos disponíveis: `login`, `register`, `recover`
   - Links internos que alteram o modo sem recarregar a página
   - Mantém a mesma estrutura visual, apenas com navegação interna

2. **`app/cadastro/page.tsx`**
   - Removidos campos de CPF/E-mail do topo
   - CPF agora é campo direto no formulário principal (chave primária)
   - Estrutura mantida para migração futura (será transformado em componente reutilizável)

3. **Ajustes de Layout**
   - `components/Header.tsx`: Alterado de `position: fixed` para `sticky` e `z-index` reduzido para `z-40` (evita sobreposição de modais)
   - `components/DashboardHeader.tsx`: Mesmas alterações aplicadas

### Rotas Afetadas
- `/login` - Agora suporta `?mode=login`, `?mode=register`, `?mode=recover`
- `/cadastro` - Mantida temporariamente (será migrada para componente)
- `/recuperar-senha` - Mantida temporariamente (será migrada para componente)

### Status
✅ **Concluída** - Funcionalidade básica implementada. Próximos passos: migrar conteúdo de `/cadastro` e `/recuperar-senha` para componentes reutilizáveis e transformar essas rotas em redirects.

---

## Fase 2 – Fluxo de Inscrição Unificado `/eventos/[id]/inscricao` ✅

**Data de Conclusão:** 2025-01-XX

### Objetivo
Consolidar o fluxo fragmentado de inscrição (`/inscricao/minha`, `/inscricao/atletas`, `/inscricao/atletas/confirmar`, `/inscricao/cadastrar-atleta`) em um único wizard com steps internos na rota `/eventos/[id]/inscricao`.

### Mudanças Implementadas

1. **`app/eventos/[id]/inscricao/page.tsx`** (NOVO - Substitui a página anterior)
   - Wizard completo com 4 steps internos:
     - **Step 1**: Escolha do tipo de inscrição (própria ou de atletas)
     - **Step 2**: Seleção de atletas (com modal de seleção e opção de cadastrar novo)
     - **Step 3**: Configuração de categorias, faixas, pesos e tipo de inscrição (com/sem absoluto) por atleta
     - **Step 4**: Resumo e escolha de forma de pagamento (unificado ou individual)
   - Indicador de progresso visual no topo
   - Navegação entre steps com validação (botões desabilitados quando necessário)
   - Integração com `AthleteSelectionModal` existente
   - Estado gerenciado localmente para todos os dados da inscrição

2. **Componentes Reutilizados**
   - `components/AthleteSelectionModal.tsx` - Mantido e integrado no Step 2
   - `components/Header.tsx`, `components/Footer.tsx`, `components/WhatsAppWidget.tsx` - Reutilizados

### Rotas Afetadas

**Rotas Substituídas (mantidas temporariamente para compatibilidade):**
- `/eventos/[id]/inscricao/minha` - Funcionalidade migrada para Step 1 + Step 3
- `/eventos/[id]/inscricao/atletas` - Funcionalidade migrada para Step 2
- `/eventos/[id]/inscricao/atletas/confirmar` - Funcionalidade migrada para Step 3 + Step 4
- `/eventos/[id]/inscricao/cadastrar-atleta` - Funcionalidade será integrada via modal no Step 2

**Nova Rota:**
- `/eventos/[id]/inscricao` - Wizard unificado com todos os steps

### Benefícios Alcançados

1. **UX Melhorada**
   - Fluxo contínuo tipo checkout (sem múltiplas navegações)
   - Indicador de progresso claro
   - Validação em cada step antes de avançar
   - Contexto mantido durante todo o processo

2. **Arquitetura Otimizada**
   - Redução de 4 rotas para 1 rota principal
   - Estado centralizado facilita envio em lote para backend
   - Preparado para integração com tabelas relacionais (`registrations`, `payments`)

3. **Manutenibilidade**
   - Código mais organizado e fácil de manter
   - Lógica de negócio centralizada
   - Facilita testes e debug

### Próximos Passos (Fase 2 - Melhorias Futuras)

1. Implementar funcionalidade completa do Step 3 para inscrição própria (atleta)
2. Integrar modal de cadastro de novo atleta diretamente no Step 2
3. Adicionar validações mais robustas em cada step
4. Implementar persistência temporária do estado (localStorage) para recuperação em caso de refresh
5. Adicionar feedback visual de loading durante submissão
6. Remover rotas antigas após período de transição

### Status
✅ **Concluída** - Wizard funcional com todos os 4 steps implementados. Próximos passos: melhorias de UX e remoção de rotas legadas.

---

## Fase 3 – Dashboard: Consolidar "Meus Atletas" e "Inscrições" ⏳

**Status:** Pendente

### Objetivo
Reorganizar o Dashboard do Professor para uma visão centralizada com menos cliques, usando modais/drawers para edições rápidas.

---

## Fase 4 – Admin: Organizar Eventos ⏳

**Status:** Pendente

### Objetivo
Reorganizar a área administrativa para gestão eficiente de eventos.

---

## Fase 5 – Limpeza e Ajustes Finais ⏳

**Status:** Pendente

### Objetivo
Remover rotas legadas e atualizar documentação final.

---

## Notas Gerais

- Todas as fases mantêm compatibilidade retroativa durante o período de transição
- Rotas antigas são mantidas temporariamente para não quebrar links existentes
- Documentação atualizada em `docs/pages_rotas.md` e `docs/page2.md`

