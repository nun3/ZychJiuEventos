export type CorrectionSubmitMessage = { ok: boolean; text: string }

export type CorrectionSubmitState = {
  pending: boolean
  message: CorrectionSubmitMessage | null
}

export function beginCorrectionSubmit(pending: boolean): CorrectionSubmitState | null {
  if (pending) return null
  return { pending: true, message: null }
}

export function finishCorrectionSubmit(result: { ok: boolean; message: string }): CorrectionSubmitState {
  return { pending: false, message: { ok: result.ok, text: result.message } }
}

export function failCorrectionSubmit(): CorrectionSubmitState {
  return { pending: false, message: { ok: false, text: 'Não foi possível enviar a solicitação.' } }
}

export function correctionSubmitLabel(pending: boolean) {
  return pending ? 'Enviando…' : 'Enviar solicitação'
}
