@regression @sprint6 @integration @payments @webhook
Feature: Proteção HTTP do webhook Asaas

  @smoke @P0 @negative
  Scenario Outline: recusar webhook sem a credencial local correta
    When envia um webhook com credencial "<credencial>"
    Then o webhook deve responder 401 sem aceitar o evento
    Examples:
      | credencial |
      | ausente    |
      | incorreta  |

  @P0 @negative
  Scenario: recusar JSON incompleto mesmo com credencial correta
    When envia um webhook incompleto com credencial correta
    Then o webhook deve responder 400 sem aceitar o evento

  @P0 @negative
  Scenario: limitar o corpo autenticado antes de processar
    When envia um webhook autenticado acima do limite
    Then o webhook deve responder 413 sem aceitar o evento
