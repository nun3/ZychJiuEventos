import { parseSignupRole, type SignupRole } from '@/lib/auth/signup-role'
import { createClient } from '@/lib/supabase/server'

export type DashboardActor = {
  userId: string
  name: string
  tipoCadastro: SignupRole | null
  canManageEvents: boolean
  isProfessor: boolean
}

export async function getDashboardActor(): Promise<DashboardActor | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const tipoCadastro = parseSignupRole(user.user_metadata?.tipo_cadastro)
  const [{ data: membership }, { data: createdTeam }, { data: professorLink }] = await Promise.all([
    supabase.from('organization_members').select('organization_id').in('role', ['owner', 'organizer']).limit(1).maybeSingle(),
    supabase.from('teams').select('id').eq('created_by', user.id).limit(1).maybeSingle(),
    supabase.from('athlete_managers').select('athlete_id').eq('manager_id', user.id).eq('relationship_type', 'professor').limit(1).maybeSingle(),
  ])

  return {
    userId: user.id,
    name: typeof user.user_metadata?.nome_completo === 'string' ? user.user_metadata.nome_completo : '',
    tipoCadastro,
    canManageEvents: Boolean(membership),
    isProfessor: tipoCadastro === 'professor' || Boolean(createdTeam) || Boolean(professorLink),
  }
}
