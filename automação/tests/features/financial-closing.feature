# language: pt
@regression @authenticated @write @closing
Funcionalidade: Fechamento financeiro do evento
  Como organizador
  Quero conferir os totais e as inscrições do encerramento
  Para fechar o evento com números auditáveis, inclusive quando a taxa contratada é zero

  Contexto:
    Dado que a escrita E2E foi habilitada
    E que existe um evento isolado com massa de fechamento financeiro

  @P0 @positive
  Cenário: totais sintéticos batem com a visão analítica
    Dado que o owner está autenticado
    Quando abre o financeiro do evento de fechamento
    Então o fechamento deve mostrar 4 inscrições realizadas
    E 1 inscrição cancelada
    E 1 inscrição efetivada
    E a receita bruta deve ser "R$ 80,00"
    E a visão analítica lista as 4 inscrições do fechamento
    E a soma dos valores considerados deve ser "R$ 80,00"
    E a inscrição pendente não entra na receita
    E a inscrição efetivada por baixa manual entra na receita
    E a inscrição cancelada é contabilizada como cancelada
    E a inscrição estornada não entra na receita
    E o fechamento explica que a taxa vem do valor registrado na efetivação

  @P0 @security
  Cenário: usuário sem permissão não acessa o fechamento
    Dado que o usuário sem vínculo está autenticado
    Quando abre o financeiro do evento de fechamento
    Então deve retornar ao dashboard com negação de permissão
