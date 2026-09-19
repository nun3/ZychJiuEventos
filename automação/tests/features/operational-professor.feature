# language: pt
@regression @write @operational-professor @sprint13
Funcionalidade: Professor operacional da inscrição
  Como quem inscreve um atleta
  Quero informar o treinador daquele atleta naquele evento
  Para a checagem e a programação usarem o nome histórico da inscrição

  Contexto:
    Dado que a escrita E2E foi habilitada
    E que existe um evento isolado com dois atletas da mesma equipe

  @P0 @positive
  Cenário: informa professores diferentes na mesma equipe
    Quando entra com a conta que gerencia os atletas
    E inscreve os dois atletas com professores operacionais distintos
    Então as inscrições mostram os professores informados
    Quando acompanha a checagem pública do evento operacional
    Então os dois professores operacionais aparecem
    Quando filtra a checagem pública pelo primeiro professor operacional
    Então somente o atleta daquele professor permanece visível
    E a conta do professor operacional não aparece na checagem pública
