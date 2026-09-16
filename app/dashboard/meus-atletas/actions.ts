'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type AthleteActionResult = { ok: boolean; message: string }

const failure = (message: string): AthleteActionResult => ({ ok: false, message })

export async function createTeam(formData: FormData): Promise<AthleteActionResult> {
  const nome = String(formData.get('nome') || '').trim()
  if (nome.length < 2) return failure('Informe um nome de equipe válido.')

  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return failure('Sua sessão expirou. Entre novamente.')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .in('role', ['owner', 'organizer'])
    .limit(1)
    .maybeSingle()

  if (!membership) return failure('Você não possui permissão para cadastrar equipes.')

  const { error } = await supabase.from('teams').insert({
    nome,
    organization_id: membership.organization_id,
    created_by: authData.user.id,
  })

  if (error?.code === '23505') return failure('Já existe uma equipe com esse nome na organização.')
  if (error) return failure('Não foi possível cadastrar a equipe.')

  revalidatePath('/dashboard/meus-atletas')
  return { ok: true, message: 'Equipe cadastrada com sucesso.' }
}

export async function createManagedAthlete(formData: FormData): Promise<AthleteActionResult> {
  const nome = String(formData.get('nome') || '').trim()
  const dataNascimento = String(formData.get('data_nascimento') || '')
  const genero = String(formData.get('genero') || '').trim()
  const faixa = String(formData.get('faixa') || '').trim()
  const teamId = String(formData.get('team_id') || '')
  const relationship = formData.get('relationship') === 'responsavel' ? 'responsavel' : 'professor'
  const peso = Number(String(formData.get('peso_kg') || '').replace(',', '.'))
  const cpf = String(formData.get('cpf') || '').replace(/\D/g, '')

  if (nome.length < 3 || !dataNascimento || !genero || !faixa || !teamId || !Number.isFinite(peso) || peso <= 0) {
    return failure('Preencha todos os campos obrigatórios com valores válidos.')
  }

  const supabase = createClient()
  const { error } = await supabase.rpc('create_managed_athlete', {
    target_team_id: teamId,
    athlete_name: nome,
    athlete_birth_date: dataNascimento,
    athlete_gender: genero,
    athlete_belt: faixa,
    athlete_weight: peso,
    relationship,
    athlete_cpf: cpf || undefined,
    special_needs: formData.get('possui_necessidade_especial') === 'on',
  })

  if (error?.code === '23505') return failure('Já existe um atleta com esse CPF.')
  if (error) return failure('Não foi possível cadastrar o atleta. Confira sua equipe e permissões.')

  revalidatePath('/dashboard/meus-atletas')
  return { ok: true, message: 'Atleta cadastrado com sucesso.' }
}

export async function updateManagedAthlete(formData: FormData): Promise<AthleteActionResult> {
  const athleteId = String(formData.get('athlete_id') || '')
  const teamId = String(formData.get('team_id') || '')
  const nome = String(formData.get('nome') || '').trim()
  const dataNascimento = String(formData.get('data_nascimento') || '')
  const genero = String(formData.get('genero') || '').trim()
  const faixa = String(formData.get('faixa') || '').trim()
  const peso = Number(String(formData.get('peso_kg') || '').replace(',', '.'))
  const cpf = String(formData.get('cpf') || '').replace(/\D/g, '')
  const reason = String(formData.get('change_reason') || '').trim()

  if (!athleteId || !teamId || nome.length < 3 || !dataNascimento || !genero || !faixa || !Number.isFinite(peso) || peso <= 0) {
    return failure('Preencha todos os campos obrigatórios com valores válidos.')
  }

  const { error } = await createClient().rpc('update_managed_athlete', {
    target_athlete_id: athleteId,
    target_team_id: teamId,
    athlete_name: nome,
    athlete_birth_date: dataNascimento,
    athlete_gender: genero,
    athlete_belt: faixa,
    athlete_weight: peso,
    athlete_cpf: cpf || undefined,
    special_needs: formData.get('possui_necessidade_especial') === 'on',
    change_reason: reason || undefined,
  })

  if (error?.message.includes('Motivo obrigatorio')) return failure('Informe o motivo da troca de equipe.')
  if (error?.code === '23505') return failure('Já existe um atleta com esse CPF.')
  if (error) return failure('Não foi possível atualizar o atleta. Confira seus dados e permissões.')

  revalidatePath('/dashboard/meus-atletas')
  revalidatePath(`/dashboard/meus-atletas/${athleteId}/editar`)
  return { ok: true, message: 'Atleta atualizado com sucesso.' }
}

export async function linkAthleteToCurrentUser(athleteId: string): Promise<AthleteActionResult> {
  if (!athleteId) return failure('Atleta inválido.')
  const { error } = await createClient().rpc('link_athlete_to_current_user', { target_athlete_id: athleteId })
  if (error?.message.includes('maior de idade')) return failure('Somente atletas maiores de idade podem ser vinculados à própria conta.')
  if (error?.message.includes('outra conta')) return failure('Este atleta já está vinculado a outra conta.')
  if (error) return failure('Não foi possível vincular o atleta à sua conta.')
  revalidatePath(`/dashboard/meus-atletas/${athleteId}/editar`)
  return { ok: true, message: 'Atleta vinculado à sua conta.' }
}
