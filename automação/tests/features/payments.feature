@regression @sprint6 @integration @payments
Feature: Reserva de pagamento pelo checkout real
  # Browser -> Server Action -> Supabase real. Sem mock de rede nem cobrança Asaas.

  @smoke @P0 @negative
  Scenario: visitante precisa entrar antes de acessar o checkout
    Given que o visitante não possui sessão
    When abre a consulta de inscrições para pagamento
    Then o login deve preservar o destino do checkout

  @authenticated @write @P0
  Scenario Outline: reservar lote e recuperar resumo persistido
    Given que o owner está autenticado
    And existem inscrições isoladas para testar o checkout
    When seleciona o primeiro evento no checkout
    Then reservar fica bloqueado sem inscrições selecionadas
    When seleciona duas inscrições e a forma "<metodo>"
    Then o total do checkout deve ser "246,90"
    When confirma a reserva pelo formulário
    Then o resumo e o banco devem confirmar uma reserva "<metodo>" de duas inscrições
    And atualizar a página deve preservar o resumo sem emitir cobrança
    Examples:
      | metodo |
      | PIX    |
      | Boleto |

  @authenticated @write @P1
  Scenario: trocar evento limpa a seleção e o total
    Given que o owner está autenticado
    And existem inscrições isoladas para testar o checkout
    When seleciona o primeiro evento no checkout
    And seleciona duas inscrições e a forma "PIX"
    And troca para o segundo evento
    Then reservar fica bloqueado sem inscrições selecionadas
    And o total do checkout deve ser "0,00"
    And nenhuma reserva deve existir no banco

  @authenticated @write @P0 @negative
  Scenario: duas abas não reservam as mesmas inscrições
    Given que o owner está autenticado
    And existem inscrições isoladas para testar o checkout
    When seleciona o primeiro evento no checkout
    And seleciona duas inscrições e a forma "PIX"
    And tenta reservar as mesmas inscrições por duas abas
    Then somente uma reserva deve existir e a segunda aba informa duplicidade

  @authenticated @write @P0 @negative
  Scenario: prazo expirado após carregar a tela bloqueia reserva
    Given que o owner está autenticado
    And existem inscrições isoladas para testar o checkout
    When seleciona o primeiro evento no checkout
    And seleciona duas inscrições e a forma "PIX"
    And o prazo de pagamento expira no banco
    And confirma a reserva pelo formulário
    Then o checkout informa "Este evento está fora do prazo de pagamento."
    And nenhuma reserva deve existir no banco

  @authenticated @write @P0
  Scenario: reservar apenas uma inscrição
    Given que o owner está autenticado
    And existem inscrições isoladas para testar o checkout
    When seleciona o primeiro evento no checkout
    And seleciona somente a primeira inscrição
    Then o total do checkout deve ser "123,45"
    When confirma a reserva pelo formulário
    Then uma reserva individual deve estar persistida

  @authenticated @write @P0 @negative
  Scenario: envios simultâneos não duplicam a reserva
    Given que o owner está autenticado
    And existem inscrições isoladas para testar o checkout
    When seleciona o primeiro evento no checkout
    And seleciona duas inscrições e a forma "PIX"
    And envia reservas simultâneas por duas abas
    Then somente uma reserva deve existir no banco

  @authenticated @write @P0 @negative
  Scenario: inscrição que deixou de estar pendente não pode ser reservada
    Given que o owner está autenticado
    And existem inscrições isoladas para testar o checkout
    When seleciona o primeiro evento no checkout
    And seleciona duas inscrições e a forma "PIX"
    And uma inscrição selecionada expira no banco
    And confirma a reserva pelo formulário
    Then o checkout informa "Uma inscrição selecionada não está pendente de pagamento."
    And nenhuma reserva deve existir no banco

  @authenticated @write @P0 @negative
  Scenario Outline: servidor rejeita adulteração dos IDs do formulário
    Given que o owner está autenticado
    And existem inscrições isoladas para testar o checkout
    When seleciona o primeiro evento no checkout
    And seleciona duas inscrições e a forma "PIX"
    And adultera uma inscrição para "<alvo>"
    And confirma a reserva pelo formulário
    Then o checkout informa "<mensagem>"
    And nenhuma reserva deve existir no banco
    Examples:
      | alvo           | mensagem                                                   |
      | outro evento   | Selecione inscrições do mesmo evento.                       |
      | outro gestor   | Não foi possível reservar as inscrições selecionadas.       |

  @authenticated @write @P0 @negative
  Scenario: total adulterado no navegador não altera o valor persistido
    Given que o owner está autenticado
    And existem inscrições isoladas para testar o checkout
    When seleciona o primeiro evento no checkout
    And seleciona duas inscrições e a forma "PIX"
    And injeta um preço de um centavo no formulário
    And confirma a reserva pelo formulário
    Then o resumo e o banco devem confirmar uma reserva "PIX" de duas inscrições

  @authenticated @write @P0 @negative
  Scenario: outro usuário não acessa o resumo de pagamento
    Given que o owner está autenticado
    And existem inscrições isoladas para testar o checkout
    When seleciona o primeiro evento no checkout
    And seleciona duas inscrições e a forma "PIX"
    And confirma a reserva pelo formulário
    Then o resumo e o banco devem confirmar uma reserva "PIX" de duas inscrições
    When outro usuário tenta abrir esse resumo
    Then os dados do pagamento não devem ser expostos

  @authenticated @write @manual-settlement @P0
  Scenario: organizador realiza baixa manual auditada
    Given que o owner está autenticado
    And existem inscrições isoladas para testar o checkout
    When seleciona o primeiro evento no checkout
    And seleciona somente a primeira inscrição
    And confirma a reserva pelo formulário
    Then uma reserva individual deve estar persistida
    Given que o usuário é owner do evento da reserva
    When abre o financeiro do evento
    And confirma a baixa manual com justificativa
    Then pagamento e inscrição ficam pagos com auditoria

  @authenticated @write @manual-settlement @P0 @negative
  Scenario: pagador comum não acessa o financeiro do evento
    Given que o owner está autenticado
    And existem inscrições isoladas para testar o checkout
    When seleciona o primeiro evento no checkout
    And seleciona somente a primeira inscrição
    And confirma a reserva pelo formulário
    Then uma reserva individual deve estar persistida
    When abre o financeiro do evento
    Then retorna ao dashboard com negação financeira

  @authenticated @write @asaas @P0
  Scenario Outline: emitir e reconsultar cobrança real no Asaas Sandbox
    Given que o owner está autenticado
    And que a emissão real no Asaas Sandbox foi habilitada
    And existem inscrições isoladas para testar o checkout
    And o perfil fictício está pronto para emissão
    When seleciona o primeiro evento no checkout
    And seleciona somente a primeira inscrição
    And escolhe a forma "<metodo>"
    And confirma a reserva pelo formulário
    Then uma reserva individual "<metodo>" deve estar persistida
    When emite a cobrança no Asaas Sandbox
    Then as instruções de "<metodo>" e uma tentativa devem ser exibidas e persistidas
    When recarrega e solicita novamente a mesma cobrança
    Then a mesma tentativa deve ser reutilizada sem duplicidade
    When o Asaas envia duas vezes o recebimento autenticado dessa cobrança
    Then o pagamento e a inscrição devem ser efetivados uma única vez
    @asaas_pix
    Examples:
      | metodo |
      | PIX    |
    @asaas_boleto
    Examples:
      | metodo |
      | Boleto |
