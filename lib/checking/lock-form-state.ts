export type LockFormState = {
  pending: boolean
  locked: boolean
  message: { ok: boolean; text: string } | null
}

export const idleLockForm: LockFormState = {
  pending: false,
  locked: false,
  message: null,
}

export function startLock(state: LockFormState): LockFormState {
  if (state.locked || state.pending) return state
  return { pending: true, locked: false, message: null }
}

export function finishLock(result: { ok: boolean; message: string }): LockFormState {
  return {
    pending: false,
    locked: result.ok,
    message: { ok: result.ok, text: result.message },
  }
}

export function lockButtonLabel(state: LockFormState) {
  return state.pending ? 'Travando…' : 'Travar checagem'
}
