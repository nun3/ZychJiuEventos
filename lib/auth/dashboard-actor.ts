import { isAdministrativeOrganizationRole, type AuthenticatedOrganizationContext } from '@/lib/auth/organization-context'
import { getAuthenticatedOrganizationContext } from '@/lib/auth/organization-context-server'
import { parseSignupRole, type SignupRole } from '@/lib/auth/signup-role'
import { createClient } from '@/lib/supabase/server'

export type DashboardActor = {
  userId: string
  name: string
  tipoCadastro: SignupRole | null
  canManageEvents: boolean
  isProfessor: boolean
  organization: AuthenticatedOrganizationContext | null
  hasSelfAthlete: boolean
  needsSportsProfile: boolean
}

export async function getDashboardActor(): Promise<DashboardActor | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const tipoCadastro = parseSignupRole(user.user_metadata?.tipo_cadastro)
  const [organization, { data: createdTeam }, { data: professorLink }, { data: selfAthlete }] = await Promise.all([
    getAuthenticatedOrganizationContext(),
    supabase.from('teams').select('id').eq('created_by', user.id).limit(1).maybeSingle(),
    supabase.from('athlete_managers').select('athlete_id').eq('manager_id', user.id).eq('relationship_type', 'professor').limit(1).maybeSingle(),
    supabase.from('athletes').select('id').eq('user_id', user.id).maybeSingle(),
  ])
  const context = organization.status === 'resolved' ? organization.context : null
  const hasSelfAthlete = Boolean(selfAthlete)

  return {
    userId: user.id,
    name: typeof user.user_metadata?.nome_completo === 'string' ? user.user_metadata.nome_completo : '',
    tipoCadastro,
    canManageEvents: Boolean(context && isAdministrativeOrganizationRole(context.role)),
    isProfessor: tipoCadastro === 'professor' || Boolean(createdTeam) || Boolean(professorLink),
    organization: context,
    hasSelfAthlete,
    needsSportsProfile: tipoCadastro === 'atleta' && !hasSelfAthlete,
  }
}
