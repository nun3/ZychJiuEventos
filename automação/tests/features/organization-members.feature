# language: pt
@organization-members @writes
Funcionalidade: Organizações e membros
  Como platform admin e owner
  Quero criar organização e administrar membros já cadastrados
  Para fechar o gap sem onboarding self-service

  @P0 @positive
  Cenário: Platform admin cria organização e owner administra membros existentes
    Dado a proteção do Sandbox para organizações
    Quando o platform admin cria a organização de homologação
    Então o owner inicial fica associado
    E o owner adiciona organizer e finance
    E a duplicidade e a proteção do owner são recusadas
    E organizer e finance não gerenciam membros
    E o ataque cross-tenant falha
    E o owner remove o organizer
    E o cleanup remove somente o cenário
