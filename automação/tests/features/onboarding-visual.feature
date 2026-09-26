# language: pt
@onboarding-visual @writes
Funcionalidade: Onboarding progressivo em evento vivo
  Como organizador da MEU CAMP
  Quero ver a orientação mudar com o estado real do evento
  Para conduzir o campeonato sem perguntar o que fazer agora

  @P0 @positive
  Cenário: Homologar a orientação em um evento temporário
    Dado a proteção do Sandbox para onboarding
    Quando o organizador conduz o evento temporário pelas fases
    Então o cleanup remove somente o cenário de onboarding
