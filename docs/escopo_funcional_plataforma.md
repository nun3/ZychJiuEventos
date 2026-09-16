# Escopo Funcional da Plataforma

## 1. Visao Geral

Este documento consolida o escopo funcional da plataforma de gerenciamento de campeonatos de lutas, com foco inicial em Jiu-Jitsu. O objetivo do sistema e automatizar e centralizar o ciclo de vida dos eventos, desde a configuracao inicial ate a inscricao, pagamento, checagem, geracao de chaves e fechamento financeiro.

A plataforma foi pensada para atender diferentes perfis de usuarios, permitindo operacao publica, autogestao dos participantes e controle administrativo do evento.

## 2. Perfis de Usuario

### 2.1 Administrador da Plataforma

Responsavel pela gestao global da plataforma.

Permissoes previstas:
- administrar organizacoes e clientes
- acompanhar operacao geral do sistema
- manter parametros globais
- acessar auditoria e configuracoes sensiveis

### 2.2 Organizador de Evento

Responsavel pela criacao e operacao dos eventos da propria organizacao.

Permissoes previstas:
- criar, editar, publicar e encerrar eventos
- configurar fases do evento
- definir categorias, regras e datas importantes
- acompanhar inscricoes e pagamentos
- operar checagem, chaves, pesagem, resultados e financeiro

### 2.3 Professor

Responsavel pela gestao de equipe e atletas vinculados.

Permissoes previstas:
- cadastrar e editar atletas
- gerenciar equipe
- inscrever atletas em eventos
- gerar pagamentos
- acompanhar checagem e solicitar alteracoes

### 2.4 Responsavel

Responsavel legal por atletas dependentes, especialmente menores de idade.

Permissoes previstas:
- cadastrar e editar atletas dependentes
- realizar inscricoes
- gerar pagamentos
- acompanhar checagem e solicitar alteracoes

### 2.5 Atleta

Usuario independente, especialmente maior de idade, que administra o proprio perfil.

Permissoes previstas:
- manter dados pessoais e esportivos atualizados
- realizar a propria inscricao
- gerar pagamento da propria inscricao
- acompanhar checagem e solicitar ajustes quando permitido

### 2.6 Publico

Visitante nao autenticado.

Permissoes previstas:
- visualizar eventos publicados
- consultar detalhes do evento
- consultar regulamento e tabela de peso
- consultar checagem publica e chaves publicadas

## 3. Modulos do Sistema

### 3.1 Gestao de Contas e Perfis

Funcionalidades previstas:
- cadastro de usuario com e-mail e senha
- autenticacao
- recuperacao de senha
- controle de papeis por perfil
- manutencao de dados cadastrais

### 3.2 Meus Atletas

Funcionalidades previstas:
- cadastro de atletas vinculados
- edicao cadastral
- associacao entre professor ou responsavel e atleta
- visualizacao do historico de inscricoes do atleta

### 3.3 Gestao de Eventos

Funcionalidades previstas:
- criacao e edicao de eventos
- publicacao e encerramento
- configuracao de categorias
- configuracao de fases do evento
- upload de banner, regulamento e tabela de peso

### 3.4 Inscricoes

Funcionalidades previstas:
- inscricao propria
- inscricao de um ou varios atletas
- alocacao automatica em categoria
- controle de status da inscricao

### 3.5 Pagamentos

Funcionalidades previstas:
- pagamento via Pix
- pagamento via boleto
- pagamento individual
- pagamento unificado para varios atletas
- integracao com gateway e webhook
- baixa manual quando necessario

### 3.6 Operacao do Evento

Funcionalidades previstas:
- lista publica de checagem
- solicitacao de alteracao de inscricao
- identificacao de atleta sozinho na categoria
- geracao de chaves
- pesagem
- resultados
- fechamento financeiro do evento

### 3.7 Relatorios

Funcionalidades previstas:
- total de inscricoes realizadas
- total de inscricoes canceladas
- total de inscricoes efetivadas
- receita bruta
- taxa da plataforma
- receita liquida
- detalhamento analitico por inscricao

## 4. Regras de Negocio Principais

- O sistema deve suportar diferentes papeis de usuario.
- Um professor ou responsavel pode gerenciar varios atletas.
- O atleta pode ser inscrito pelo proprio usuario, pelo professor ou pelo responsavel.
- O evento deve possuir fases configuraveis com inicio e fim.
- A inscricao deve respeitar as regras do evento.
- O sistema deve alocar a categoria automaticamente com base nos dados do atleta e na configuracao do evento.
- Apenas atletas com pagamento confirmado devem seguir para checagem e chaves.
- Durante a fase de checagem, o sistema deve permitir solicitacoes de ajuste conforme regras configuradas.
- O sistema deve permitir pagamento unificado para multiplas inscricoes.
- O encerramento do evento deve manter historico publico e gerar consolidacao financeira.

## 5. Fases do Evento

### 5.1 Inscricao

- permite novas inscricoes
- permite geracao de cobrancas

### 5.2 Pagamento

- bloqueia novas inscricoes
- aguarda confirmacao de pagamentos pendentes
- pode cancelar inscricoes nao pagas ao final do prazo

### 5.3 Checagem

- publica lista de atletas efetivados
- permite revisao e solicitacoes de alteracao
- identifica atletas sozinhos na categoria

### 5.4 Chaves

- utiliza a lista consolidada da checagem
- gera brackets por categoria
- busca evitar confronto entre atletas da mesma equipe na primeira luta, quando possivel

### 5.5 Encerramento

- finaliza o evento para operacao
- preserva historico publico
- habilita fechamento financeiro e relatorios

## 6. Permissoes por Perfil

### Administrador da Plataforma
- acesso total a configuracoes e visao global

### Organizador de Evento
- acesso aos eventos e dados da propria organizacao

### Professor
- acesso a equipe e atletas vinculados

### Responsavel
- acesso aos atletas dependentes vinculados

### Atleta
- acesso ao proprio perfil e a propria inscricao

### Publico
- acesso somente a conteudos publicos

## 7. Integracoes Previstas

- Supabase para autenticacao, banco de dados e armazenamento de arquivos
- gateway de pagamento para Pix e boleto
- webhooks para conciliacao automatica de pagamentos

## 8. Roadmap Macro

### Etapa 1 - Estruturacao Tecnica
- estabilizacao da base atual
- correcao de inconsistencias tecnicas
- preparacao do projeto para backend real

### Etapa 2 - Modelagem e Persistencia
- definicao do modelo de dados
- configuracao do banco
- preparacao da camada de autenticacao e arquivos

### Etapa 3 - Fluxos Essenciais
- contas e perfis
- meus atletas
- eventos
- inscricoes
- pagamentos

### Etapa 4 - Operacao Completa do Evento
- checagem
- chaves
- pesagem
- resultados
- financeiro

### Etapa 5 - Producao e Escalabilidade
- testes
- seguranca
- auditoria
- monitoramento
- deploy

## 9. Pontos para Validacao com o Cliente

### Decisoes confirmadas

- cada atleta pertence a uma unica equipe
- atletas menores de idade nao possuem login proprio; o acesso e feito pela conta do responsavel
- a idade e calculada pela data completa de nascimento
- a categoria e calculada automaticamente no momento da inscricao
- durante a checagem, o usuario pode solicitar mudanca de categoria e o organizador deve aprovar ou recusar
- eventos concluidos permanecem em um historico publico com os resultados das lutas
- o pagamento unificado pode reunir somente inscricoes do mesmo evento

### Decisoes pendentes

- confirmar a taxa da plataforma e sua forma de incidencia
- definir a logica detalhada de geracao de chaves
- definir a politica de cancelamento e estorno
- confirmar o formato final dos relatorios financeiros

### Diretriz inicial de gateway

Para a primeira integracao, o Asaas deve ser avaliado como opcao principal por oferecer ambiente Sandbox separado, cobrancas PIX, integracao por API e Webhooks. O Mercado Pago permanece como alternativa, pois tambem oferece PIX, boleto, ambiente de testes e Webhooks.

A escolha definitiva deve ocorrer depois de comparar tarifas de PIX e boleto, prazo de disponibilidade dos valores, requisitos de cadastro, suporte a contas de teste e regras de recebimento para a plataforma. Nenhum gateway deve ser tratado como gratuito em producao sem validacao comercial atualizada.
