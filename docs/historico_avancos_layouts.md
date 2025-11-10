# Histórico de Avanços – Layouts do Portal Zych

## 2025-11-10

### Tela de Login
- Replicação do layout inspirado no iLutas com tabs `Por CPF` e `Por e-mail`.
- CTA destacado para novo cadastro, link “Esqueci a senha” e opção “Manter conectado”.
- Integração com `Header`, `Footer` e `WhatsAppWidget` para manter consistência visual.

### Recuperar Senha
- Fluxo dual (WhatsApp ou e-mail) com alerta explicativo e botão de retorno.
- Formulário simplificado para solicitar redefinição, alinhado ao comportamento real.
- Estrutura pronta para conectar ao backend (whatsapp/email), registrada em `docs/proximos_passos_fluxo_autenticacao.md`.

### Novo Cadastro – Etapa Inicial
- Tabs `Por CPF` e `Por E-mail` com estado compartilhado (`documentValue`).
- Seleção de perfil (“Sou atleta...” ou “Sou responsável”), com copy informativa.

### Novo Cadastro – Perfil Atleta/Professor
- Expansão condicional exibindo todas as seções necessárias (Dados básicos, Endereço, Contato, Esporte, Acesso, Inscrição).
- Campo de CPF/E-mail preenchido automaticamente a partir da escolha inicial.
- Estrutura modular pronta para inserir máscaras, validações e integração futura.

### Novo Cadastro – Perfil Responsável
- Layout específico com alerta de atenção e formulários adaptados ao responsável.
- Reaproveitamento do CPF/E-mail inicial e seções essenciais (Dados básicos, Endereço, Contato, Acesso).

### Dashboard (Professor/Responsável)
- Header autenticado com menu “Minha Conta” e dropdown de ações rápidas.
- Página inicial do painel com filtros de eventos, grid de cards, blocos de resultados e ranking.
- Página “Meu Perfil” com resumo do atleta/professor, estatísticas, últimos e próximos eventos.
- Página “Meus Atletas” com listagem, ações rápidas (alterar, inscrições, filiações, excluir) e barra de busca/novo atleta, incluindo modal de cadastro com todo o formulário original.

> Próximos incrementos planejados permanecem no arquivo `docs/proximos_passos_fluxo_autenticacao.md`. Atualizar este histórico sempre que novas etapas/lotes forem entregues.

