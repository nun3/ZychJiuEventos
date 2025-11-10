# Próximos Passos – Fluxo de Autenticação

## Contexto Atual
- Telas *Login* (`/login`) e *Recuperar senha* (`/recuperar-senha`) replicam o layout base inspirado no iLutas.
- Fluxos ainda utilizam dados mockados, sem integração real com backend ou envio de mensagens.

## Ações Prioritárias
1. **Validar UX no Navegador**
   - Revisar responsividade (mobile/tablet).
   - Checar comportamento das tabs (CPF/E-mail, WhatsApp/E-mail) e estados de foco/erro.

2. **Conectar com Autenticação Real**
   - Definir contrato de API (login, gerar token, refresh).
   - Implementar chamadas `fetch`/`axios` com tratamento de erros e loading.
   - Persistir sessão (cookies ou storage) e redirecionar para dashboard.

3. **Recuperação de Senha**
   - Integrar endpoint de envio via WhatsApp (ou fallback e-mail).
   - Criar tela de confirmação pós-solicitação (ex.: “Enviamos uma mensagem...”).
   - Implementar página de redefinição com token e validação dupla de senha.

4. **Validações e Acessibilidade**
   - Aplicar máscaras reais (CPF, telefone) e validação de formulário.
   - Adicionar mensagens de erro/sucesso inline, com ARIA `role="alert"`.

5. **Fluxos Relacionados**
   - Tela de cadastro de novo usuário (etapas, termos).
   - Fluxo de “trocar senha” dentro do dashboard autenticado.
   - Logs/auditoria para tentativas falhas de login.

6. **Testes**
   - Criar testes e2e (Playwright/Cypress) cobrindo login, recuperação e redirecionamentos.
   - Adicionar testes unitários para hooks/serviços de autenticação.

7. **Experiência Pós-Login**
   - Implementar estado global (ex.: context provider) para controlar perfil logado.
   - Ajustar `DashboardHeader` para exibir nome/links dinâmicos conforme papel (professor ou responsável).
   - Integrar páginas secundárias do menu: Alterar cadastro, Inscrições, Filiações, Ingressos (telas restantes).
   - Conectar listagens (ex.: Meus Atletas) com ações reais (editar, excluir) e estados vazios.

8. **Dados Compartilhados**
   - Extrair mocks (perfil, eventos, ranking) para `lib/mocks/dashboard.ts`.
   - Criar tipagens TypeScript para perfil, evento, atleta, ranking, permitindo futura integração com API.
   - Implementar carregamento condicional (skeletons/spinners) para refletir estado de carregamento real.

> **Nota:** Revisitar este arquivo ao iniciar a implementação backend ou quando novos requisitos de autenticação forem definidos.

