# Status das Sprints da Plataforma

## Visao Geral

Este documento registra o andamento das sprints do projeto Meu Camp, considerando o plano funcional consolidado, o roadmap macro e as correcoes tecnicas ja executadas na base atual.

## Sprint 1 - Estabilizacao da Base Atual

### Status
Concluida

### Objetivo
Remover inconsistencias tecnicas da aplicacao atual para preparar o projeto para a proxima fase de evolucao.

### Entregas realizadas
- correcao dos layouts do App Router em `admin` e `dashboard`
- correcao de erros de lint
- ajuste de navegacao quebrada na area administrativa
- correcao de inconsistencias em componentes centrais
- validacao da base com execucao de lint

### Resultado
- aplicacao com estrutura mais consistente
- sem erros de lint bloqueantes
- base pronta para avancar para modelagem e backend

### Pendencias remanescentes
- warnings de uso de `<img>` que podem ser tratados em etapa de refinamento de frontend

## Sprint 2 - Modelagem de Dominio e Banco

### Status
Proxima sprint

### Objetivo
Transformar os requisitos consolidados em estrutura de dados, regras do sistema e base arquitetural para Supabase.

### Escopo previsto
- consolidacao final das entidades principais
- definicao de relacionamentos
- definicao de estados do sistema
- definicao de permissoes por papel
- definicao do schema inicial do banco
- definicao da estrategia de autenticacao e armazenamento

### Entregas esperadas
- documento de modelo de dados
- estrutura inicial de tabelas
- definicao de papeis e politicas de acesso
- base para implementacao com Supabase

## Sprint 3 - Fundacao com Supabase

### Status
Planejada

### Objetivo
Preparar a infraestrutura principal da plataforma com autenticacao, banco de dados e armazenamento.

### Escopo previsto
- configuracao do projeto Supabase
- configuracao de autenticacao
- configuracao de banco PostgreSQL
- configuracao de storage
- definicao inicial de RLS

### Entregas esperadas
- conexao da aplicacao com Supabase
- autenticacao pronta para integracao
- persistencia inicial habilitada

## Sprint 4 - Contas, Perfis e Meus Atletas

### Status
Planejada

### Objetivo
Implementar o nucleo de usuarios e atletas gerenciados.

### Escopo previsto
- cadastro e login reais
- recuperacao de senha
- perfis por tipo de usuario
- CRUD de atletas vinculados
- modulo meus atletas com persistencia real

## Sprint 5 - Eventos

### Status
Planejada

### Objetivo
Migrar a gestao de eventos para persistencia real.

### Escopo previsto
- CRUD de eventos
- configuracao de fases
- configuracao de categorias
- upload de arquivos e imagens
- pagina publica de evento conectada ao banco

## Sprint 6 - Inscricoes e Pagamentos

### Status
Planejada

### Objetivo
Entregar o fluxo principal de inscricao e pagamento.

### Escopo previsto
- inscricao propria
- inscricao de multiplos atletas
- alocacao automatica em categorias
- pagamento individual
- pagamento unificado
- integracao com Pix e boleto
- webhook de confirmacao

## Sprint 7 - Checagem e Ajustes

### Status
Planejada

### Objetivo
Dar autonomia aos usuarios e reduzir retrabalho manual do organizador.

### Escopo previsto
- lista publica de checagem
- filtros e consultas
- solicitacao de alteracoes
- tratamento de atleta sozinho na categoria
- travamento da lista ao final da fase

## Sprint 8 - Operacao do Evento

### Status
Planejada

### Objetivo
Entregar os modulos de operacao esportiva.

### Escopo previsto
- pesagem
- geracao de chaves
- confrontos
- resultados
- publicacao de brackets

## Sprint 9 - Financeiro e Fechamento

### Status
Planejada

### Objetivo
Consolidar visao gerencial e fechamento do evento.

### Escopo previsto
- relatorio sintetico
- relatorio analitico
- totais financeiros
- fechamento do evento
- historico publico de eventos realizados

## Sprint 10 - Qualidade e Producao

### Status
Planejada

### Objetivo
Preparar a plataforma para uso real com seguranca e previsibilidade operacional.

### Escopo previsto
- testes automatizados
- auditoria
- monitoramento
- backup
- deploy e ambiente produtivo

## Resumo Executivo

### Ja concluido
- Sprint 1 - Estabilizacao da base atual

### Em seguida
- Sprint 2 - Modelagem de dominio e banco
- Sprint 3 - Fundacao com Supabase

### Observacao
Este documento deve ser atualizado ao final de cada sprint para manter historico de execucao, entregas realizadas, bloqueios encontrados e proximos passos aprovados.
