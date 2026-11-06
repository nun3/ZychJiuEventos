import {
  isAdministrativeOrganizationRole,
  resolveAuthenticatedOrganizationContext,
  resolveOwnedOrganizationContext,
  type AuthenticatedOrganizationContext,
  type OrganizationContextResolution,
} from '@/lib/auth/organization-context'
import { createClient } from '@/lib/supabase/server'

function organizationName(value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value) && typeof (value as { nome?: unknown }).nome === 'string') {
    return (value as { nome: string }).nome
  }
  return ''
}

/**
 * Busca todas as filiações administrativas (owner/organizer) do usuário e delega a escolha da
 * organização ativa a `resolveAuthenticatedOrganizationContext` — a mesma função pura já coberta
 * por `organization-context.test.ts`. Antes desta correção, esta função reimplementava a mesma
 * regra com `.limit(1)` sem `ORDER BY`: com mais de uma filiação, a organização escolhida
 * dependia da ordem não garantida do PostgREST. Buscar todas e delegar fecha essa ambiguidade
 * (ver `resolveAuthenticatedOrganizationContext`) em vez de duplicar a regra aqui.
 */
export async function getAuthenticatedOrganizationContext(): Promise<OrganizationContextResolution> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'unavailable' }

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(nome)')
    .eq('user_id', user.id)
    .in('role', ['owner', 'organizer'])

  const mapped: AuthenticatedOrganizationContext[] = (memberships || []).map((membership) => ({
    organizationId: membership.organization_id,
    organizationName: organizationName(membership.organizations),
    role: membership.role,
  }))

  return resolveAuthenticatedOrganizationContext(mapped)
}

export async function getAdministrativeOrganizationContext(): Promise<OrganizationContextResolution> {
  const resolved = await getAuthenticatedOrganizationContext()
  if (resolved.status !== 'resolved' || !isAdministrativeOrganizationRole(resolved.context.role)) {
    return { status: 'unavailable' }
  }
  return resolved
}

export async function getOwnedOrganizationContext(): Promise<OrganizationContextResolution> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'unavailable' }

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(nome)')
    .eq('user_id', user.id)
    .eq('role', 'owner')

  const ownerMemberships: AuthenticatedOrganizationContext[] = (memberships || []).map((membership) => ({
    organizationId: membership.organization_id,
    organizationName: organizationName(membership.organizations),
    role: membership.role,
  }))

  return resolveOwnedOrganizationContext(ownerMemberships)
}
