export type CategoryVersionEditability = { ok: true } | { ok: false; message: string }

/**
 * Depois que a checagem é travada, as chaves já podem ter sido geradas a partir da versão ativa
 * de categorias — trocar ou criar uma nova versão nesse ponto não apaga inscrições existentes
 * (FK `ON DELETE RESTRICT`), mas desalinha o que o operador vê como "a" versão ativa do que foi
 * efetivamente usado para travar a checagem e gerar chaves. Mesma fronteira já usada por
 * `transitionEvent` para liberar o estado `chaves`.
 */
export function assertCategoryVersionEditable(
  event: { checagem_travada_em: string | null },
): CategoryVersionEditability {
  if (event.checagem_travada_em) {
    return {
      ok: false,
      message: 'A checagem deste evento já foi travada. Não é possível criar ou ativar uma nova versão de categorias.',
    }
  }
  return { ok: true }
}
