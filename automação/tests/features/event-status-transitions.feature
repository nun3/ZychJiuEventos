@regression @authenticated @write @transitions
Feature: Transições de estado do evento pela UI
  Como owner de uma organização
  Quero avançar o evento pelas transições já permitidas pelo domínio
  Para fechar a jornada administrativa sem atalhos de banco

  Background:
    Given que o owner está autenticado
    And que a escrita E2E foi habilitada

  @P0 @positive
  Scenario: inscrição avança para pagamento
    When inicia o cadastro de um evento
    And preenche os dados e as fases válidas do evento
    And publica o evento
    And abre as inscrições do evento criado
    Then o evento criado deve exibir o status "Inscrições"
    And a ação "Abrir pagamento" deve estar disponível no evento criado
    And a ação "Abrir chaves" não deve estar disponível no evento criado
    And a ação "Concluir evento" não deve estar disponível no evento criado
    When abre o pagamento do evento criado
    Then o evento criado deve exibir o status "Pagamento"
    And a ação "Abrir checagem" deve estar disponível no evento criado

  @P1 @negative
  Scenario: evento publicado não oferece transições fora da ordem
    When inicia o cadastro de um evento
    And preenche os dados e as fases válidas do evento
    And publica o evento
    Then o evento criado deve exibir o status "Publicado"
    And a ação "Abrir pagamento" não deve estar disponível no evento criado
    And a ação "Abrir chaves" não deve estar disponível no evento criado
    And a ação "Concluir evento" não deve estar disponível no evento criado

  @P0 @negative
  Scenario: checagem sem lock não avança para chaves
    Given existe um evento isolado com inscrições mistas para checagem
    When abre a checagem do evento isolado
    Then a ação "Abrir chaves" não deve estar visível
    And a ação "Travar checagem" deve estar visível

  @P0 @positive
  Scenario: checagem travada avança para chaves
    Given existe um evento isolado com inscrições mistas para checagem
    When abre a checagem do evento isolado
    And trava a checagem oficial
    Then a ação "Abrir chaves" deve estar visível
    When abre a fase de chaves
    Then a checagem deve indicar a fase de chaves
    When acessa as chaves pela checagem
    Then a tela administrativa de chaves deve abrir

  @P0 @positive
  Scenario: evento em andamento é concluído e permanece concluído
    Given existe um evento operacional em andamento
    When abre os resultados do evento operacional
    Then a ação "Concluir evento" deve estar visível
    When conclui o evento operacional
    Then os resultados devem indicar evento concluído
    And a ação "Concluir evento" não deve estar visível
    And a ação "Cancelar" não deve estar visível
    When recarrega os resultados do evento operacional
    Then os resultados devem indicar evento concluído
    When abre a página pública do evento operacional
    Then o evento público deve permanecer concluído
    And as inscrições públicas devem permanecer indisponíveis

  @P0 @security
  Scenario: usuário sem vínculo não acessa a transição de checagem alheia
    Given existe um evento isolado com inscrições mistas para checagem
    And que o usuário sem vínculo está autenticado
    When acessa a checagem do evento isolado
    Then deve retornar ao dashboard com negação de permissão
