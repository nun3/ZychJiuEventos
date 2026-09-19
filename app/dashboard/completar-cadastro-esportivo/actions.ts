'use server'

import { revalidatePath } from 'next/cache'
import { adultBirthDateMessages, evaluateAdultBirthDate } from '@/lib/auth/adult-birth-date'
import { getPublicOrganizationScope } from '@/lib/events/public-organization'
import { createClient } from '@/lib/supabase/server'

export type SelfAthleteActionResult = { ok: boolean; message: string }

export async function completeSelfAthleteProfile(formData: FormData): Promise<SelfAthleteActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sua sessão expirou. Entre novamente.' }

  const scope = getPublicOrganizationScope()
  if (scope.mode !== 'restricted') {
    return { ok: false, message: 'O cadastro esportivo depende da organização desta release.' }
  }

  const teamId = String(formData.get('team_id') || '').trim()
  const genero = String(formData.get('genero') || '').trim().toUpperCase()
  const faixa = String(formData.get('faixa') || '').trim()
  const peso = Number(String(formData.get('peso_kg') || '').replace(',', '.'))
  const birthInput = String(formData.get('data_nascimento') || '').trim()
  const nome = String(formData.get('nome_completo') || '').trim()
  const profilePatch: { data_nascimento?: string; nome_completo?: string } = {}

  if (nome) {
    if (nome.length < 3) return { ok: false, message: 'Informe o nome completo.' }
    profilePatch.nome_completo = nome
  }
  if (birthInput) {
    const birth = evaluateAdultBirthDate(birthInput)
    if (!birth.ok) return { ok: false, message: adultBirthDateMessages[birth.code] }
    profilePatch.data_nascimento = birth.iso
  }
  if (Object.keys(profilePatch).length) {
    const { error: profileError } = await supabase.from('profiles').update(profilePatch).eq('id', user.id)
    if (profileError) return { ok: false, message: 'Não foi possível gravar os dados pessoais.' }
  }

  if (!teamId) return { ok: false, message: 'Selecione uma equipe da organização.' }
  if (!['F', 'M', 'O'].includes(genero)) return { ok: false, message: 'Informe o gênero.' }
  if (!faixa) return { ok: false, message: 'Informe a faixa.' }
  if (!Number.isFinite(peso) || peso <= 0) return { ok: false, message: 'Informe um peso válido.' }

  const { data, error } = await supabase.rpc('create_self_athlete', {
    target_team_id: teamId,
    target_organization_id: scope.organizationId,
    athlete_gender: genero,
    athlete_belt: faixa,
    athlete_weight: peso,
    special_needs: formData.get('possui_necessidade_especial') === 'on',
  })

  if (error) {
    const mapped: Record<string, string> = {
      'Autenticacao obrigatoria': 'Sua sessão expirou. Entre novamente.',
      'Somente conta atleta completa o cadastro esportivo proprio': 'Esta conta não é de atleta independente.',
      'Perfil inexistente': 'Complete os dados pessoais no perfil antes de continuar.',
      'Informe o nome completo': 'Informe o nome completo no perfil antes de continuar.',
      'Data de nascimento obrigatoria': adultBirthDateMessages.missing,
      'Menor de idade nao pode criar conta': adultBirthDateMessages.minor,
      'Organizacao ativa indisponivel': 'O cadastro esportivo depende da organização desta release.',
      'Equipe inexistente': 'A equipe selecionada não está disponível.',
      'Equipe fora da organizacao ativa': 'Selecione uma equipe da organização ativa.',
      'Genero invalido': 'Informe o gênero.',
      'Faixa do atleta nao reconhecida': 'Informe uma faixa reconhecida, como Branca ou Azul.',
      'Peso invalido': 'Informe um peso válido.',
    }
    return { ok: false, message: mapped[error.message] || 'Não foi possível concluir o cadastro esportivo.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/completar-cadastro-esportivo')
  revalidatePath('/dashboard/meus-atletas')
  revalidatePath('/dashboard/inscricoes')
  return { ok: true, message: data ? 'Cadastro esportivo concluído. Você já pode fazer a própria inscrição.' : 'Cadastro esportivo já estava concluído.' }
}
