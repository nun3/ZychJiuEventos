import { getPublicOrganizationScope } from '../events/public-organization'

export type AuthenticatedOrganizationContext = {
  organizationId: string
  organizationName: string
  role: string
}

export type OrganizationContextResolution =
  | { status: 'resolved'; context: AuthenticatedOrganizationContext }
  | { status: 'unavailable'; reason?: 'none' | 'ambiguous' | 'invalid-choice'; options?: AuthenticatedOrganizationContext[] }

export function isAdministrativeOrganizationRole(role: string) {
  return role === 'owner' || role === 'organizer'
}

export function resolveAuthenticatedOrganizationContext(
  memberships: AuthenticatedOrganizationContext[],
  env: NodeJS.ProcessEnv = process.env,
  requestedOrganizationId?: string,
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

  if (memberships.length === 0) return { status: 'unavailable', reason: 'none' }
  if (memberships.length === 1) return { status: 'resolved', context: memberships[0] }

  // Mais de uma filiação administrativa: não há organização "ativa" implícita. A regra de
  // produto exige escolha explícita do operador, revalidada aqui contra as filiações reais
  // (não confiar num organizationId vindo só do cliente) em vez de adivinhar a primeira (ordem
  // não garantida pelo PostgREST sem ORDER BY) ou de bloquear a criação por completo.
  if (requestedOrganizationId) {
    const match = memberships.find((membership) => membership.organizationId === requestedOrganizationId)
    if (match) return { status: 'resolved', context: match }
    return { status: 'unavailable', reason: 'invalid-choice', options: memberships }
  }
  return { status: 'unavailable', reason: 'ambiguous', options: memberships }
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
