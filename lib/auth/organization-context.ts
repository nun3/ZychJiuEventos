import { getPublicOrganizationScope } from '../events/public-organization'

export type AuthenticatedOrganizationContext = {
  organizationId: string
  organizationName: string
  role: string
}

export type OrganizationContextResolution =
  | { status: 'resolved'; context: AuthenticatedOrganizationContext }
  | { status: 'unavailable' }

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
    if (!match) return { status: 'unavailable' }
    return { status: 'resolved', context: match }
  }

  const first = memberships[0]
  if (!first) return { status: 'unavailable' }
  return { status: 'resolved', context: first }
}
