import { isAdministrativeOrganizationRole, type AuthenticatedOrganizationContext } from '@/lib/auth/organization-context'
import { getAuthenticatedOrganizationContext, getOwnedOrganizationContext } from '@/lib/auth/organization-context-server'
import { parseSignupRole, type SignupRole } from '@/lib/auth/signup-role'
import { createClient } from '@/lib/supabase/server'

export type DashboardActor = {
  userId: string
  name: string
  tipoCadastro: SignupRole | null
  canManageEvents: boolean
  canManageOrganization: boolean
  isPlatformAdmin: boolean
  isProfessor: boolean
  organization: AuthenticatedOrganizationContext | null
  ownedOrganization: AuthenticatedOrganizationContext | null
  hasSelfAthlete: boolean
  needsSportsProfile: boolean
}

export async function getDashboardActor(): Promise<DashboardActor | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const tipoCadastro = parseSignupRole(user.user_metadata?.tipo_cadastro)
  const [organization, owned, platformAdmin, { data: createdTeam }, { data: professorLink }, { data: selfAthlete }] = await Promise.all([
    getAuthenticatedOrganizationContext(),
    getOwnedOrganizationContext(),
    supabase.rpc('is_platform_admin'),
    supabase.from('teams').select('id').eq('created_by', user.id).limit(1).maybeSingle(),
    supabase.from('athlete_managers').select('athlete_id').eq('manager_id', user.id).eq('relationship_type', 'professor').limit(1).maybeSingle(),
    supabase.from('athletes').select('id').eq('user_id', user.id).maybeSingle(),
  ])
  const context = organization.status === 'resolved' ? organization.context : null
  const ownedContext = owned.status === 'resolved' ? owned.context : null
  const hasSelfAthlete = Boolean(selfAthlete)

  return {
    userId: user.id,
    name: typeof user.user_metadata?.nome_completo === 'string' ? user.user_metadata.nome_completo : '',
    tipoCadastro,
    canManageEvents: Boolean(context && isAdministrativeOrganizationRole(context.role)),
    canManageOrganization: Boolean(ownedContext),
    isPlatformAdmin: Boolean(platformAdmin.data),
    isProfessor: tipoCadastro === 'professor' || Boolean(createdTeam) || Boolean(professorLink),
    organization: context,
    ownedOrganization: ownedContext,
    hasSelfAthlete,
    needsSportsProfile: tipoCadastro === 'atleta' && !hasSelfAthlete,
  }
}
