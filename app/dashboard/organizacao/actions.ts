'use server'

import { revalidatePath } from 'next/cache'
import { getOwnedOrganizationContext } from '@/lib/auth/organization-context-server'
import { createClient } from '@/lib/supabase/server'
import { isOwnerAssignableRole, mapMembershipError } from '@/lib/organizations/membership'
import { isPixKeyType, normalizePixKey, normalizeRecipientName } from '@/lib/finance/pix-key'

export type MembershipActionResult = { ok: boolean; message: string }

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function text(formData: FormData, field: string) {
  return String(formData.get(field) || '').trim()
}

async function requireOwnedOrganization() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'unauthenticated' as const }
  const owned = await getOwnedOrganizationContext()
  if (owned.status !== 'resolved') return { status: 'forbidden' as const }
  return { status: 'ok' as const, supabase, organizationId: owned.context.organizationId }
}

export async function addOrganizationMember(formData: FormData): Promise<MembershipActionResult> {
  const access = await requireOwnedOrganization()
  if (access.status === 'unauthenticated') return { ok: false, message: 'Sua sessão expirou. Entre novamente.' }
  if (access.status === 'forbidden') return { ok: false, message: 'Somente o proprietário administra membros desta organização.' }

  const email = text(formData, 'email')
  const role = text(formData, 'role')
  if (!email.includes('@')) return { ok: false, message: 'Informe o e-mail de um usuário já cadastrado.' }
  if (!isOwnerAssignableRole(role)) return { ok: false, message: 'Este papel não pode ser atribuído pelo proprietário.' }

  const { error } = await access.supabase.rpc('add_organization_member', {
    target_organization_id: access.organizationId,
    member_email: email,
    member_role: role,
  })
  if (error) return { ok: false, message: mapMembershipError(error.message) }

  revalidatePath('/dashboard/organizacao')
  const message =
    role === 'finance' ? 'Membro financeiro adicionado.'
      : role === 'staff' ? 'Staff adicionado.'
        : 'Organizador adicionado.'
  return { ok: true, message }
}

export async function removeOrganizationMember(formData: FormData): Promise<MembershipActionResult> {
  const access = await requireOwnedOrganization()
  if (access.status === 'unauthenticated') return { ok: false, message: 'Sua sessão expirou. Entre novamente.' }
  if (access.status === 'forbidden') return { ok: false, message: 'Somente o proprietário administra membros desta organização.' }

  const memberUserId = text(formData, 'member_user_id')
  if (!uuid.test(memberUserId)) return { ok: false, message: 'Membro inválido.' }

  const { error } = await access.supabase.rpc('remove_organization_member', {
    target_organization_id: access.organizationId,
    member_user_id: memberUserId,
  })
  if (error) return { ok: false, message: mapMembershipError(error.message) }

  revalidatePath('/dashboard/organizacao')
  return { ok: true, message: 'Membro removido. A conta do usuário permanece na plataforma.' }
}

export async function saveOrganizationPixSettings(formData: FormData): Promise<MembershipActionResult> {
  const access = await requireOwnedOrganization()
  if (access.status === 'unauthenticated') return { ok: false, message: 'Sua sessão expirou. Entre novamente.' }
  if (access.status === 'forbidden') return { ok: false, message: 'Somente o proprietário configura o PIX de recebimento.' }

  const keyType = text(formData, 'pix_key_type')
  if (!isPixKeyType(keyType)) return { ok: false, message: 'Selecione o tipo da chave PIX.' }
  const key = normalizePixKey(keyType, String(formData.get('pix_key') || ''))
  if (!key.ok) return { ok: false, message: key.message }
  const recipient = normalizeRecipientName(String(formData.get('recipient_name') || ''))
  if (!recipient.ok) return { ok: false, message: recipient.message }
  if (formData.get('confirmed') !== 'yes') {
    return { ok: false, message: 'Confirme que a chave pertence à organização antes de salvar.' }
  }

  const { data, error } = await access.supabase.rpc('set_organization_pix_settings', {
    target_organization_id: access.organizationId,
    key_type: keyType,
    key_value: key.value,
    recipient: recipient.value,
  })
  if (error || !data || typeof data !== 'object' || Array.isArray(data) || data.kind !== 'organization_pix_settings') {
    return { ok: false, message: 'Não foi possível salvar o PIX. Confira os dados e tente novamente.' }
  }

  revalidatePath('/dashboard/organizacao')
  return { ok: true, message: 'PIX de recebimento salvo. Novas reservas usarão esta chave.' }
}
