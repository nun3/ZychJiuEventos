# language: pt
@regression @write @professor @sprint13
Funcionalidade: Professor como gestor de equipe
  Como professor
  Quero nascer no produto, gerir minha equipe e inscrever atletas
  Para acompanhar a competição sem administrar o evento

  Contexto:
    Dado que a escrita E2E foi habilitada
    E que existe um evento isolado disponível para o professor

  @P0 @positive
  Cenário: professor cadastra, cria equipe e inscreve atleta
    Quando cadastra uma conta como Professor
    E entra com a conta de Professor
    Então vê o painel do professor
    Quando cria sua equipe
    E cadastra um atleta na equipe
    E inscreve o atleta no evento disponível
    Então a inscrição do atleta aparece
    Quando acompanha a checagem pública do evento
    Então o atleta inscrito aparece na checagem pública

  @P0 @negative
  Cenário: professor não administra o evento
    Quando cadastra uma conta como Professor
    E entra com a conta de Professor
    E tenta abrir a administração de eventos
    Então o acesso administrativo é negado
    Quando tenta abrir o financeiro de um evento alheio
    Então o acesso administrativo é negado
