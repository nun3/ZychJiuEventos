export type CategoryVersionEditability = { ok: true } | { ok: false; message: string }

const terminalStatuses = ['cancelado', 'concluido']

/**
 * Depois que a checagem é travada, as chaves já podem ter sido geradas a partir da versão ativa
 * de categorias — trocar ou criar uma nova versão nesse ponto não apaga inscrições existentes
 * (FK `ON DELETE RESTRICT`), mas desalinha o que o operador vê como "a" versão ativa do que foi
 * efetivamente usado para travar a checagem e gerar chaves. Mesma fronteira já usada por
 * `transitionEvent` para liberar o estado `chaves`.
 *
 * `cancelado` não passa necessariamente por `chaves`/checagem travada (pode ser cancelado ainda
 * em `inscricao` ou `pagamento`), e `concluido` só é alcançado depois de `chaves`, mas checar o
 * status diretamente evita depender só da ordem de transições para cobrir os dois casos.
 */
export function assertCategoryVersionEditable(
  event: { checagem_travada_em: string | null; status: string },
): CategoryVersionEditability {
  if (terminalStatuses.includes(event.status)) {
    return {
      ok: false,
      message: 'Este evento está cancelado ou concluído. Não é possível criar ou ativar uma nova versão de categorias.',
    }
  }
  if (event.checagem_travada_em) {
    return {
      ok: false,
      message: 'A checagem deste evento já foi travada. Não é possível criar ou ativar uma nova versão de categorias.',
    }
  }
  return { ok: true }
}
