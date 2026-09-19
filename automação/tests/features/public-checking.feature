# language: pt
@regression @write @public-checking @sprint13
Funcionalidade: Checagem pública do evento
  Como visitante
  Quero ver somente atletas efetivados com nome, equipe e categoria vigente
  Para conferir a lista oficial sem dados pessoais ou financeiros

  Contexto:
    Dado que a escrita E2E foi habilitada
    E que existe um evento isolado com checagem pública

  @P0 @positive
  Cenário: somente efetivações entram na lista pública
    Quando abre a checagem pública sem autenticação
    Então a checagem pública lista os atletas efetivados
    E a inscrição pendente não aparece na checagem pública
    E a inscrição cancelada não aparece na checagem pública
    E o atleta realocado aparece na categoria vigente
    E nome, equipe e categoria vigentes estão visíveis
    E dados privados não aparecem na checagem pública
    E a checagem pública identifica o atleta sozinho

  @P0 @positive
  Cenário: filtros públicos de categoria e equipe
    Quando abre a checagem pública sem autenticação
    E filtra a checagem pública pela categoria média
    Então somente o atleta sozinho permanece visível na checagem pública
    Quando filtra a checagem pública pela equipe beta
    Então somente o atleta da equipe beta permanece visível na checagem pública

  @P0 @positive
  Cenário: checagem pública cabe em 390px
    Quando abre a checagem pública em 390px sem autenticação
    Então a checagem pública lista os atletas efetivados
    E nome, equipe e categoria vigentes estão visíveis
    E a checagem pública identifica o atleta sozinho
