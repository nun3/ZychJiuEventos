'use server'

import { evaluateAdultBirthDate, adultBirthDateMessages } from '@/lib/auth/adult-birth-date'
import { parseSignupRole } from '@/lib/auth/signup-role'
import { createClient } from '@/lib/supabase/server'

export type SignupActionResult = { ok: boolean; message: string }

function publicSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export async function registerPublicAccount(formData: FormData): Promise<SignupActionResult> {
  const role = parseSignupRole(formData.get('tipo_cadastro'))
  const nome = String(formData.get('nome_completo') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const confirm = String(formData.get('confirm_password') || '')
  const birth = evaluateAdultBirthDate(String(formData.get('data_nascimento') || ''))

  if (!role) return { ok: false, message: 'Selecione o tipo de cadastro.' }
  if (nome.length < 3) return { ok: false, message: 'Informe o nome completo.' }
  if (!email || !email.includes('@')) return { ok: false, message: 'Informe um e-mail válido.' }
  if (password.length < 8) return { ok: false, message: 'A senha deve ter ao menos 8 caracteres.' }
  if (password !== confirm) return { ok: false, message: 'As senhas informadas não coincidem.' }
  if (!birth.ok) return { ok: false, message: adultBirthDateMessages[birth.code] }

  const afterAuth = role === 'atleta'
    ? '/dashboard/completar-cadastro-esportivo'
    : '/dashboard'
  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${publicSiteUrl()}/auth/callback?redirectTo=${encodeURIComponent(afterAuth)}`,
      data: {
        nome_completo: nome,
        tipo_cadastro: role,
        data_nascimento: birth.iso,
      },
    },
  })

  if (error) {
    const mapped: Record<string, string> = {
      'Data de nascimento obrigatoria': adultBirthDateMessages.missing,
      'Data de nascimento invalida': adultBirthDateMessages.invalid,
      'Menor de idade nao pode criar conta': adultBirthDateMessages.minor,
    }
    return { ok: false, message: mapped[error.message] || 'Não foi possível criar a conta. Verifique os dados e tente novamente.' }
  }

  return {
    ok: true,
    message: 'Cadastro recebido. Verifique seu e-mail para confirmar a conta. Menor de 18 anos não cria login: ele é cadastrado por Professor ou Responsável.',
  }
}
