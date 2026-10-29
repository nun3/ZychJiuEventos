const ERROR_MESSAGES: Record<string, string> = {
  'Sessao obrigatoria': 'Sua sessão expirou. Entre novamente.',
  'Sem permissao para operar LIVE': 'Você não tem permissão para operar o placar ao vivo.',
  'Sem permissao gerencial LIVE': 'Somente a organização pode confirmar o resultado.',
  'Conflito de versao LIVE': 'Outra mesa atualizou esta luta. O placar foi sincronizado.',
  'Idempotency key reutilizada com comando diferente': 'Este comando já foi usado com outro conteúdo.',
  'Idempotency key invalida': 'Não foi possível registrar o comando. Tente novamente.',
  'Transicao LIVE invalida': 'Esta ação não é válida no estado atual da luta.',
  'Resultado LIVE confirmado e terminal': 'Este resultado já foi confirmado e não pode ser alterado.',
  'Area nao pertence ao evento': 'A área selecionada não pertence a este evento.',
  'Evento fora de operacao LIVE': 'O evento ainda não está em andamento para operação ao vivo.',
  'Chave fora de operacao LIVE': 'A chave precisa estar em andamento para operar a luta.',
  'Confronto ja possui resultado na chave': 'Este confronto já possui resultado na chave.',
  'Sessao LIVE ja existe para este confronto': 'Já existe uma sessão ao vivo para este confronto.',
  'Sessao LIVE inexistente': 'A sessão ao vivo não foi encontrada.',
  'Confronto inexistente': 'O confronto não foi encontrado.',
  'Confronto obrigatorio': 'Selecione um confronto válido.',
  'Sessao LIVE obrigatoria': 'Abra a luta antes de operar o placar.',
  'Versao obrigatoria': 'Estado da luta desatualizado. Atualize e tente novamente.',
  'Acao LIVE invalida': 'Ação inválida para o placar ao vivo.',
  'Lado obrigatorio': 'Informe o lado do atleta.',
  'Pontuacao LIVE invalida': 'Pontuação inválida. Use 2, 3 ou 4.',
  'Alvo do undo obrigatorio': 'Selecione a pontuação a desfazer.',
  'Evento alvo inexistente': 'A pontuação a desfazer não foi encontrada.',
  'Alvo do undo fora da sessao': 'Essa pontuação não pertence a esta luta.',
  'Nao e permitido desfazer um undo': 'Não é permitido desfazer um desfazer.',
  'Somente pontuacao pode ser desfeita': 'Somente pontuação, vantagem ou penalidade podem ser desfeitas.',
  'Acao ja desfeita': 'Essa pontuação já foi desfeita.',
  'Resultado da luta incompleto': 'Informe o vencedor e o tipo de resultado.',
  'Luta nao esta pausada': 'A luta não está pausada.',
  'Categoria sem duracao oficial configurada': 'Configure a duração oficial da categoria antes de operar.',
  'Duracao oficial fora do intervalo permitido': 'A duração oficial da categoria está fora do intervalo permitido.',
}

export function isLiveVersionConflict(message: string | undefined) {
  return Boolean(message && message.includes('Conflito de versao LIVE'))
}

export function mapLiveError(message: string | undefined, fallback: string) {
  if (!message) return fallback
  if (isLiveVersionConflict(message)) return ERROR_MESSAGES['Conflito de versao LIVE']
  return ERROR_MESSAGES[message] || fallback
}
