@regression @authenticated @sprint5
Feature: Inscrições reais
  Background:
    Given que o owner está autenticado
    And que a escrita E2E foi habilitada

  @write @P0
  Scenario: inscrever atleta e bloquear duplicidade
    When cadastra duas equipes únicas
    And cadastra um atleta fictício na primeira equipe
    And cria evento com prazo de inscrição vigente
    And acessa as categorias do evento criado
    And configura categoria elegível para o atleta da inscrição
    And abre inscrições do evento criado
    And acessa o formulário de inscrição do evento criado
    Then confirmar inscrições fica bloqueado sem seleção e aceite
    When seleciona o atleta e aceita os termos
    And confirma as inscrições
    Then a inscrição pendente deve ser confirmada
    And o atleta inscrito não pode ser selecionado novamente
    And o histórico apresenta a inscrição com categoria e preço
    And a inscrição aparece na consulta consolidada

  @write @P0 @negative
  Scenario: bloquear inscrição sem categoria elegível
    When cadastra duas equipes únicas
    And cadastra um atleta fictício na primeira equipe
    And cria evento com prazo de inscrição vigente
    And abre inscrições do evento criado
    And acessa o formulário de inscrição do evento criado
    Then o atleta sem categoria não pode ser selecionado

  @write @P0 @negative
  Scenario: bloquear inscrição fora do prazo
    When cria um evento publicado para configuração
    And abre inscrições do evento criado
    And acessa o formulário de inscrição do evento criado
    Then o prazo indisponível deve ser informado
