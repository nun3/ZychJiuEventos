# language: pt
@regression @authenticated @write @closing @platform-fee
Funcionalidade: Taxa MEU CAMP por inscrição efetivada
  Como plataforma
  Quero cobrar uma taxa fixa por inscrição efetivada, contratada evento a evento
  Para apurar a receita líquida sem depender da taxa vigente no momento da consulta

  Contexto:
    Dado que a escrita E2E foi habilitada

  @P0 @positive
  Cenário: evento sem taxa contratada mantém a receita líquida igual à bruta
    Dado que existe um evento isolado com massa de fechamento financeiro
    E que o owner está autenticado
    Quando abre o financeiro do evento de fechamento
    Então a taxa por inscrição do evento deve ser "R$ 0,00"
    E a taxa MEU CAMP apurada deve ser "R$ 0,00"
    E a receita bruta deve ser "R$ 80,00"
    E a receita líquida deve ser "R$ 80,00"
    E a receita bruta menos a taxa deve ser igual à receita líquida

  @P0 @positive
  Cenário: taxa é congelada na efetivação e sobrevive à mudança do contrato
    Dado que existe um evento isolado com taxa MEU CAMP contratada
    E que o owner está autenticado
    Quando abre o financeiro do evento com taxa
    Então a taxa por inscrição do evento deve ser "R$ 5,00"
    E a inscrição do atleta "confirmada" mostra taxa "R$ 5,00"
    E a inscrição do atleta "pendente A" não gera taxa
    E a inscrição do atleta "cancelada" não gera taxa
    E a inscrição do atleta "estornada" não gera taxa
    E a taxa MEU CAMP apurada deve ser "R$ 5,00"
    Quando registra a baixa manual da inscrição "pendente A"
    Então a inscrição do atleta "pendente A" mostra taxa "R$ 5,00"
    E a taxa registrada para o atleta "pendente A" deve ser "R$ 5,00"
    Quando a plataforma passa a cobrar "R$ 9,00" por inscrição
    E recarrega o financeiro do evento com taxa
    Então a taxa por inscrição do evento deve ser "R$ 9,00"
    E a inscrição do atleta "confirmada" mostra taxa "R$ 5,00"
    E a inscrição do atleta "pendente A" mostra taxa "R$ 5,00"
    Quando registra a baixa manual da inscrição "pendente B"
    Então a inscrição do atleta "pendente B" mostra taxa "R$ 9,00"
    E a taxa MEU CAMP apurada deve ser "R$ 19,00"
    E a receita bruta deve ser "R$ 240,00"
    E a receita líquida deve ser "R$ 221,00"
    E a receita bruta menos a taxa deve ser igual à receita líquida
    E a soma das taxas da visão analítica bate com a taxa apurada

  @P0 @security
  Cenário: organizador consulta a taxa mas não altera o contrato
    Dado que existe um evento isolado com taxa MEU CAMP contratada
    E que o organizador do evento com taxa está autenticado
    Quando abre o financeiro do evento com taxa
    Então a taxa por inscrição do evento deve ser "R$ 5,00"
    E a tela informa que a taxa é configurada pela plataforma
    E não deve existir formulário de alteração da taxa
    E a tentativa do organizador de alterar a taxa deve ser recusada
    E a taxa contratada permanece "R$ 5,00"
