import {
  isAdministrativeOrganizationRole,
  resolveOwnedOrganizationContext,
  type AuthenticatedOrganizationContext,
  type OrganizationContextResolution,
} from '@/lib/auth/organization-context'
import { getPublicOrganizationScope } from '@/lib/events/public-organization'
import { createClient } from '@/lib/supabase/server'

function organizationName(value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value) && typeof (value as { nome?: unknown }).nome === 'string') {
    return (value as { nome: string }).nome
  }
  return ''
}

export async function getAuthenticatedOrganizationContext(): Promise<OrganizationContextResolution> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'unavailable' }

  const scope = getPublicOrganizationScope()
  if (scope.mode === 'blocked') return { status: 'unavailable' }

  if (scope.mode === 'restricted') {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id, role, organizations(nome)')
      .eq('user_id', user.id)
      .eq('organization_id', scope.organizationId)
      .maybeSingle()

    if (!membership) return { status: 'unavailable' }
    return {
      status: 'resolved',
      context: {
        organizationId: membership.organization_id,
        organizationName: organizationName(membership.organizations),
        role: membership.role,
      },
    }
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(nome)')
    .eq('user_id', user.id)
    .in('role', ['owner', 'organizer'])
    .limit(1)
    .maybeSingle()

  if (!membership) return { status: 'unavailable' }
  return {
    status: 'resolved',
    context: {
      organizationId: membership.organization_id,
      organizationName: organizationName(membership.organizations),
      role: membership.role,
    },
  }
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
