import { getPublicOrganizationScope } from '../events/public-organization'

export type AuthenticatedOrganizationContext = {
  organizationId: string
  organizationName: string
  role: string
}

export type OrganizationContextResolution =
  | { status: 'resolved'; context: AuthenticatedOrganizationContext }
  | { status: 'unavailable'; reason?: 'none' | 'ambiguous' }

export function isAdministrativeOrganizationRole(role: string) {
  return role === 'owner' || role === 'organizer'
}

export function resolveAuthenticatedOrganizationContext(
  memberships: AuthenticatedOrganizationContext[],
  env: NodeJS.ProcessEnv = process.env,
): OrganizationContextResolution {
  const scope = getPublicOrganizationScope(env)

  if (scope.mode === 'blocked') {
    return { status: 'unavailable' }
  }

  if (scope.mode === 'restricted') {
    const match = memberships.find((membership) => membership.organizationId === scope.organizationId)
    if (!match) return { status: 'unavailable', reason: 'none' }
    return { status: 'resolved', context: match }
  }

  // Sem PUBLIC_ORGANIZATION_ID, não há como adivinhar qual organização é a "ativa" de um
  // usuário com mais de uma filiação administrativa. Escolher a primeira (ordem não garantida
  // pelo PostgREST sem ORDER BY) arriscava criar evento, categoria ou qualquer outra gravação
  // administrativa na organização errada. Falhar fechado aqui é mais seguro do que adivinhar.
  if (memberships.length === 0) return { status: 'unavailable', reason: 'none' }
  if (memberships.length > 1) return { status: 'unavailable', reason: 'ambiguous' }
  return { status: 'resolved', context: memberships[0] }
}

export function resolveOwnedOrganizationContext(
  ownerMemberships: AuthenticatedOrganizationContext[],
  env: NodeJS.ProcessEnv = process.env,
): OrganizationContextResolution {
  const scope = getPublicOrganizationScope(env)
  if (scope.mode === 'blocked') return { status: 'unavailable' }
  if (scope.mode === 'restricted') {
    const release = ownerMemberships.find((membership) => membership.organizationId === scope.organizationId)
    if (release) return { status: 'resolved', context: release }
  }
  if (ownerMemberships.length === 1) return { status: 'resolved', context: ownerMemberships[0] }
  if (ownerMemberships.length === 0) return { status: 'unavailable', reason: 'none' }
  return { status: 'unavailable', reason: 'ambiguous' }
}
