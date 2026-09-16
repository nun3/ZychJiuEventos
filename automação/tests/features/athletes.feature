@regression @authenticated
Feature: Gestão de equipes e atletas
  Como owner de uma organização
  Quero gerenciar meus atletas
  Para manter dados esportivos consistentes e auditáveis

  Background:
    Given que o owner está autenticado

  @P0 @positive
  Scenario: consultar atletas permitidos
    When acessa a gestão de atletas
    Then a lista real de atletas deve ser exibida
    And as ações Nova equipe e Novo atleta devem estar disponíveis

  @write @P1 @positive
  Scenario: cadastrar e editar atleta com troca auditada de equipe
    Given que a escrita E2E foi habilitada
    When cadastra duas equipes únicas
    And cadastra um atleta fictício na primeira equipe
    Then o atleta deve aparecer na lista
    When edita o atleta e troca para a segunda equipe com motivo
    Then a atualização deve ser confirmada
    And o motivo deve aparecer no histórico de troca de equipe

  @P1
  Scenario: consultar histórico vazio de inscrições
    When acessa a gestão de atletas
    And abre as inscrições de um atleta disponível
    Then a página deve exibir o histórico ou o estado vazio de inscrições
