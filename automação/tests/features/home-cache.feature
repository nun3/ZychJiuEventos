@regression @write @P0 @home-cache
Feature: Atualização pública da Home
  Como organizador
  Quero publicar um evento sem esperar o TTL público
  Para vê-lo imediatamente no carrossel quando estiver marcado como destaque

  Scenario: publicar evento invalida a Home e atualiza o carrossel
    Given que o owner possui uma sessão E2E
    When cria um rascunho marcado para destaque na Home
    And aquece o cache da Home antes de publicar
    And publica o rascunho marcado para destaque
    Then o evento publicado deve aparecer imediatamente no carrossel da Home
