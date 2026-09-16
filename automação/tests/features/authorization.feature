@regression
Feature: Proteção de rotas e autorização
  Como responsável pela segurança da plataforma
  Quero restringir rotas conforme sessão e vínculo organizacional
  Para impedir acesso indevido

  @smoke @P0 @negative
  Scenario: visitante não acessa Meus Atletas
    Given que o visitante não possui sessão
    When acessa diretamente a rota de Meus Atletas
    Then deve ser direcionado ao login preservando o destino

  @smoke @P0 @negative
  Scenario: visitante não acessa a área administrativa
    Given que o visitante não possui sessão
    When acessa diretamente a área administrativa
    Then deve ser direcionado ao login administrativo preservando o destino

  @authenticated @P0 @positive
  Scenario: owner acessa a área administrativa
    Given que o owner está autenticado
    When acessa diretamente a área administrativa
    Then a página Meus Eventos deve ser exibida
    And a organização e o papel owner devem ser apresentados

  @authenticated @P0 @negative
  Scenario: usuário sem vínculo não acessa a área administrativa
    Given que o usuário sem vínculo está autenticado
    When acessa diretamente a área administrativa
    Then deve retornar ao dashboard com negação de permissão

  @authenticated @P0
  Scenario: encerrar a sessão pela navegação
    Given que o owner está autenticado
    When encerra a sessão pelo menu da conta
    Then a tela de login deve ser exibida
    And a rota protegida deve voltar a exigir autenticação
