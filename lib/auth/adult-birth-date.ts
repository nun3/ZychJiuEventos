const isoDate = /^\d{4}-\d{2}-\d{2}$/

export type AdultBirthDateResult =
  | { ok: true; iso: string }
  | { ok: false; code: 'missing' | 'invalid' | 'minor' }

function utcDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return date
}

export function evaluateAdultBirthDate(value: string, todayIso?: string): AdultBirthDateResult {
  const iso = value.trim()
  if (!iso) return { ok: false, code: 'missing' }
  if (!isoDate.test(iso)) return { ok: false, code: 'invalid' }
  const birth = utcDate(iso)
  if (!birth) return { ok: false, code: 'invalid' }

  const todayValue = todayIso?.trim() || new Date().toISOString().slice(0, 10)
  const today = utcDate(todayValue)
  if (!today) return { ok: false, code: 'invalid' }
  if (birth.getTime() > today.getTime()) return { ok: false, code: 'invalid' }

  const cutoff = new Date(today)
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 18)
  if (birth.getTime() > cutoff.getTime()) return { ok: false, code: 'minor' }
  return { ok: true, iso }
}

export const adultBirthDateMessages = {
  missing: 'Informe a data de nascimento.',
  invalid: 'Data de nascimento inválida.',
  minor: 'Menor de 18 anos não cria conta. O cadastro e a inscrição de menor são feitos por Professor ou Responsável.',
} as const
