@regression @authenticated @sprint6 @integration @payments @write
Feature: Reserva do checkout de pagamentos
  Como pagador autenticado
  Quero reservar inscrições pendentes por PIX ou boleto
  Para conferir um resumo persistido sem duplicar pagamentos

  Background:
    Given que o owner está autenticado
    And existem inscrições isoladas para testar o checkout

  @P0
  Scenario: mostrar somente inscrições gerenciadas na seleção
    When seleciona o primeiro evento no checkout
    Then a seleção contém somente atletas gerenciados pelo pagador

  @P0 @negative
  Scenario: rejeitar método adulterado no formulário
    When seleciona o primeiro evento no checkout
    And seleciona duas inscrições e a forma "PIX"
    And adultera o método de pagamento para cartão
    And confirma a reserva pelo formulário
    Then o checkout informa "Selecione inscrições e uma forma de pagamento."
    And nenhuma reserva deve existir no banco
