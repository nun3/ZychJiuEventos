'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ProfileActionResult = { ok: boolean; message: string }

export async function updateMyProfile(formData: FormData): Promise<ProfileActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sessão expirada. Entre novamente para salvar as alterações.' }

  const nome = String(formData.get('nome_completo') || '').trim()
  const telefone = String(formData.get('telefone') || '').replace(/\s+/g, ' ').trim()
  const dataNascimento = String(formData.get('data_nascimento') || '').trim()

  if (nome.length < 3) return { ok: false, message: 'Informe o nome completo.' }
  if (dataNascimento && !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
    return { ok: false, message: 'Data de nascimento inválida.' }
  }

  const { error } = await supabase.from('profiles').update({
    nome_completo: nome,
    telefone: telefone || null,
    data_nascimento: dataNascimento || null,
  }).eq('id', user.id)

  if (error) return { ok: false, message: 'Não foi possível salvar os dados. Tente novamente.' }

  await supabase.auth.updateUser({ data: { nome_completo: nome } })
  revalidatePath('/dashboard/meu-perfil')
  revalidatePath('/dashboard')
  return { ok: true, message: 'Dados pessoais atualizados.' }
}
