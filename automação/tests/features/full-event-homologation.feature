# language: pt
@homologation @full-event-sandbox @writes
Funcionalidade: Homologação ponta a ponta no Sandbox MEU CAMP
  Como organização MEU CAMP
  Quero conduzir um campeonato realista e destrutível no Sandbox
  Para homologar o ciclo completo sem alterar o contrato canônico do Full Event

  Contexto:
    Dado que a escrita E2E foi habilitada
    E que o ambiente Sandbox da MEU CAMP foi confirmado antes de qualquer escrita

  @P0 @positive
  Cenário: Executar o ciclo completo de homologação
    Quando cria as contas descartáveis da homologação
    E cadastra as equipes da execução na MEU CAMP
    E cadastra o atleta independente, o menor e os atletas gerenciados
    E publica o evento de homologação com a categoria compatível
    E inscreve os quatro atletas pelos fluxos autorizados
    E reserva e efetiva as inscrições por baixa manual
    Então a checagem pública deve listar somente os efetivos da execução
    Quando solicita e revisa a correção auditada
    E trava a checagem da homologação
    E gera, ajusta e publica a chave semi4
    E configura a área e a programação
    E confirma a pesagem, inicia, registra resultados e premia
    E consulta o financeiro e conclui o evento
    Então o isolamento e o cleanup da execução devem estar limpos
