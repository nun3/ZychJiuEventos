@regression @authenticated
Feature: Gestão de eventos
  Como owner de uma organização
  Quero cadastrar eventos com cronograma válido
  Para publicá-los com dados persistidos e isolados

  Background:
    Given que o owner está autenticado

  @P0 @positive
  Scenario: consultar eventos da organização
    When acessa a gestão de eventos
    Then a lista real de eventos deve ser exibida
    And a ação Novo evento deve estar disponível

  @write @P0 @positive
  Scenario: criar e publicar evento com fases ordenadas
    Given que a escrita E2E foi habilitada
    When inicia o cadastro de um evento
    And preenche os dados e as fases válidas do evento
    And publica o evento
    Then o evento publicado deve aparecer na lista administrativa

  @P1 @negative
  Scenario: rejeitar fases sobrepostas
    When inicia o cadastro de um evento
    And preenche fases sobrepostas
    And tenta salvar o rascunho
    Then a mensagem de fases fora de ordem deve ser exibida

  @write @P0 @public
  Scenario: evento publicado aparece para o público
    Given que a escrita E2E foi habilitada
    When inicia o cadastro de um evento
    And preenche os dados e as fases válidas do evento
    And publica o evento
    And encerra a sessão e acessa a página pública
    Then o evento deve aparecer na lista pública
    And os detalhes públicos do evento devem abrir
    And o cronograma deve preservar o horário do fuso do evento

  @write @P0 @security
  Scenario: rascunho permanece privado
    Given que a escrita E2E foi habilitada
    When inicia o cadastro de um evento
    And preenche os dados e as fases válidas do evento
    And salva o evento como rascunho
    And encerra a sessão e acessa a página pública
    Then o rascunho não deve aparecer na lista pública

  @write @P1 @categories
  Scenario: criar versão de categorias
    Given que a escrita E2E foi habilitada
    When cria um evento publicado para configuração
    And acessa as categorias do evento criado
    And cadastra uma versão com categoria válida
    Then a versão e a categoria devem aparecer na configuração

  @write @P1 @storage
  Scenario: publicar evento com arquivos
    Given que a escrita E2E foi habilitada
    When inicia o cadastro de um evento
    And preenche os dados e as fases válidas do evento
    And anexa banner, regulamento e tabela de peso válidos
    And publica o evento
    And abre os detalhes públicos do evento criado
    Then o banner e os documentos públicos devem estar disponíveis
