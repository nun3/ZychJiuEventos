# language: pt
@regression @authenticated @write @full-event
Funcionalidade: Jornada completa de um campeonato
  Como organizador
  Quero conduzir um campeonato do cadastro ao encerramento
  Para garantir que o ciclo esportivo funcione de ponta a ponta

  Contexto:
    Dado que a escrita E2E foi habilitada
    E que o organizador inicia a jornada Full Event

  @P0 @positive
  Cenário: Executar um campeonato completo
    Quando cria e publica o evento
    E configura as categorias oficiais com duração
    E cadastra as equipes do campeonato
    E cadastra os atletas do campeonato
    E avança o evento para inscrição
    E inscreve os atletas
    E avança o evento para pagamento
    E reserva o pagamento sem Asaas
    E efetiva as inscrições por baixa manual
    E avança o evento para checagem
    Então a lista de checagem deve exibir as inscrições efetivadas
    Quando travo a checagem
    E avanço o evento para chaves
    E gero as chaves final_2, copo_3 e semi_4
    E ajusto manualmente a chave em rascunho
    E publico as chaves
    Então a chave pública deve estar correta e sem dados administrativos
    Quando configuro as áreas
    E atribuo as subchaves com numeração global
    E reordeno a programação em rascunho
    E publico a programação
    Então a programação pública deve estar correta
    E a visão por equipe deve estar disponível
    Quando confirmo a pesagem
    Então a premiação permanece bloqueada
    Quando inicio a operação
    E registro um resultado normal
    E registro um WO
    E concluo a final da chave
    E confirmo a premiação
    Então as colocações devem estar corretas
    E o WO deve ser distinto de bye
    E o público deve refletir os resultados sem controles administrativos
    Quando concluo o evento
    Então o estado final administrativo deve ser concluído
    E o público deve permanecer encerrado
