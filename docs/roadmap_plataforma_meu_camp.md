# Roadmap da Plataforma Meu Camp

## Objetivo

Este roadmap organiza a evolucao da plataforma em fases de entrega, priorizando fundacao tecnica, regras de negocio, operacao do evento e preparacao para producao.

## Fase 1 - Saneamento da Base Atual

### Objetivo
Remover fragilidades tecnicas do projeto atual e preparar a aplicacao para crescimento estruturado.

### Entregas
- correcao de layouts do App Router
- correcao de erros de lint
- ajuste de rotas quebradas
- consolidacao de componentes duplicados
- revisao de mocks e centralizacao de dados temporarios

### Resultado esperado
Aplicacao estavel, coerente e pronta para receber backend real.

## Fase 2 - Consolidacao Funcional e Modelagem

### Objetivo
Transformar os requisitos aprovados em modelo funcional e modelo de dados.

### Entregas
- consolidacao dos requisitos validados
- definicao das entidades principais
- definicao dos estados do sistema
- definicao das regras de negocio
- definicao das permissoes por perfil

### Resultado esperado
Base funcional e conceitual pronta para implementacao em banco relacional.

## Fase 3 - Fundacao com Supabase

### Objetivo
Implantar a infraestrutura principal da aplicacao usando Supabase.

### Entregas
- configuracao do projeto Supabase
- configuracao de autenticacao
- configuracao de banco PostgreSQL
- configuracao de armazenamento de arquivos
- configuracao inicial de politicas de acesso

### Resultado esperado
Infraestrutura principal disponivel para persistencia, autenticacao e arquivos.

## Fase 4 - Contas, Perfis e Meus Atletas

### Objetivo
Entregar o nucleo de usuarios e atletas gerenciados.

### Entregas
- cadastro e login
- recuperacao de senha
- perfis por tipo de usuario
- CRUD de atletas vinculados
- painel de meus atletas

### Resultado esperado
Usuarios autenticados com capacidade real de gerenciar atletas e perfis.

## Fase 5 - Eventos e Publicacao

### Objetivo
Entregar o modulo de criacao e publicacao de eventos com persistencia real.

### Entregas
- CRUD de eventos
- upload de banner e regulamento
- configuracao de fases
- configuracao de categorias
- listagem publica de eventos
- pagina de detalhes do evento com dados reais

### Resultado esperado
Organizadores conseguem publicar e administrar eventos reais.

## Fase 6 - Inscricoes e Pagamentos

### Objetivo
Entregar o fluxo transacional principal da plataforma.

### Entregas
- inscricao propria
- inscricao de multiplos atletas
- alocacao automatica de categoria
- pagamento individual
- pagamento unificado
- integracao com Pix
- integracao com boleto
- webhook de confirmacao

### Resultado esperado
Fluxo completo de inscricao e pagamento operando de forma real.

## Fase 7 - Checagem e Ajustes

### Objetivo
Diminuir operacao manual e dar autonomia aos usuarios.

### Entregas
- lista publica de checagem
- filtros por categoria e evento
- solicitacao de alteracao de dados
- identificacao de atleta sozinho na categoria
- travamento da lista ao final da fase

### Resultado esperado
Checagem publica estruturada, com menos retrabalho para o organizador.

## Fase 8 - Chaves, Pesagem e Resultados

### Objetivo
Entregar a operacao esportiva do campeonato.

### Entregas
- pesagem
- geracao de chaves
- regras de distribuicao de atletas
- confrontos
- resultados
- publicacao de brackets e resultados

### Resultado esperado
Plataforma apta a operar o campeonato alem da inscricao.

## Fase 9 - Financeiro e Fechamento

### Objetivo
Entregar visao gerencial e fechamento do evento.

### Entregas
- relatorio financeiro sintetico
- relatorio analitico de inscricoes
- totais de inscritos, cancelados e pagos
- receita bruta, taxa da plataforma e receita liquida
- encerramento do evento com historico publico

### Resultado esperado
Organizador e administracao com controle financeiro claro e auditavel.

## Fase 10 - Qualidade, Seguranca e Producao

### Objetivo
Preparar a plataforma para operacao confiavel em ambiente real.

### Entregas
- testes automatizados
- logs e auditoria
- tratamento de erros
- politicas de seguranca
- monitoramento
- rotina de backup
- pipeline de deploy

### Resultado esperado
Plataforma pronta para uso real com confiabilidade e previsibilidade operacional.

## Prioridade Recomendada

### Curto prazo
- Fase 1
- Fase 2
- Fase 3

### Medio prazo
- Fase 4
- Fase 5
- Fase 6

### Longo prazo
- Fase 7
- Fase 8
- Fase 9
- Fase 10

## Observacao Final

O roadmap deve ser tratado como guia evolutivo. As fases podem ser refinadas em sprints menores conforme validacao com o cliente, disponibilidade de integracoes externas e prioridade comercial da operacao.
