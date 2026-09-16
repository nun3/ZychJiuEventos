@regression @authenticated @sprint7 @write
Feature: Checagem oficial de inscritos
  Como organizador do evento
  Quero ver somente inscrições efetivadas na checagem
  Para publicar a lista oficial sem pendências financeiras

  Background:
    Given que o owner está autenticado
    And existe um evento isolado com inscrições mistas para checagem

  @P0
  Scenario: lista oficial omite inscrições não efetivadas
    When abre a checagem do evento isolado
    Then a checagem lista somente os três atletas efetivados
    And as inscrições pendente, expirada, cancelada e estornada não aparecem

  @P0
  Scenario: filtros e atleta sozinho na categoria
    When abre a checagem do evento isolado
    And filtra a checagem pela categoria pesada
    Then somente o atleta sozinho permanece visível
    And a checagem identifica o atleta sozinho
    When filtra a checagem pela equipe beta
    Then somente o atleta da equipe beta permanece visível
