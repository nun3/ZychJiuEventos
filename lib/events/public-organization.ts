const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type PublicOrganizationScope =
  | { mode: 'unrestricted' }
  | { mode: 'restricted'; organizationId: string }
  | { mode: 'blocked' }

export function getPublicOrganizationScope(env: NodeJS.ProcessEnv = process.env): PublicOrganizationScope {
  const raw = env.PUBLIC_ORGANIZATION_ID?.trim() || ''
  if (!raw) return { mode: 'unrestricted' }
  if (!uuidPattern.test(raw)) return { mode: 'blocked' }
  return { mode: 'restricted', organizationId: raw }
}

export function allowsPublicOrganization(organizationId: string, env: NodeJS.ProcessEnv = process.env) {
  const scope = getPublicOrganizationScope(env)
  if (scope.mode === 'unrestricted') return true
  if (scope.mode === 'blocked') return false
  return scope.organizationId === organizationId
}
