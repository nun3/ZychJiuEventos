export const SIGNUP_ROLES = ['atleta', 'organizador', 'responsavel', 'professor'] as const

export type SignupRole = typeof SIGNUP_ROLES[number]

export function parseSignupRole(value: unknown): SignupRole | null {
  return typeof value === 'string' && SIGNUP_ROLES.includes(value as SignupRole)
    ? value as SignupRole
    : null
}
