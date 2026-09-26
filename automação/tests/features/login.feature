@regression
Feature: Fluxo de autenticação do portal Meu Camp
  Como visitante do portal Meu Camp
  Quero acessar as opções de autenticação
  Para entrar, criar uma conta ou recuperar minha senha

  @smoke @P0 @navigation
  Scenario: acessar a tela de login pela página inicial
    Given o usuário acessa a página inicial
    When seleciona o link "Entrar"
    Then a rota de login deve ser exibida
    And o formulário deve apresentar os campos de e-mail e senha

  @smoke @P0 @negative
  Scenario: rejeitar credenciais inválidas
    Given o usuário está na tela de login
    When informa o e-mail "qa-invalido@example.com" e a senha "senha-incorreta"
    And seleciona o botão "Entrar na conta"
    Then a mensagem "E-mail ou senha inválidos." deve ser exibida
    And o usuário deve permanecer na rota de login

  @P1 @navigation
  Scenario: abrir recuperação de senha por e-mail
    Given o usuário está na tela de login
    When seleciona a aba "Recuperar senha"
    And seleciona o link "Recuperar por e-mail"
    Then a rota de recuperação de senha deve ser exibida
    And o botão "Enviar link de recuperação" deve estar disponível

  @P1 @navigation
  Scenario: selecionar cadastro de atleta
    Given o usuário está na tela de login
    When seleciona a aba "Criar conta"
    And seleciona a opção de cadastro "Atleta"
    Then o formulário de criar conta deve pedir nome, e-mail, senha e data de nascimento
    And a orientação de que menor é cadastrado por Professor ou Responsável deve ser exibida

  @smoke @P0 @negative
  Scenario: tratar link de recuperação expirado
    Given o usuário acessa um link de recuperação expirado
    Then a rota de recuperação de senha deve ser exibida
    And a orientação para solicitar um novo link deve ser exibida
