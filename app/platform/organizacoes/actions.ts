'use server'

import { revalidatePath } from 'next/cache'
import { requirePlatformAdmin } from '@/lib/auth/platform-admin-server'
import { mapMembershipError, slugifyOrganizationName } from '@/lib/organizations/membership'

export type OrganizationActionResult = { ok: boolean; message: string; organizationId?: string }

function text(formData: FormData, field: string) {
  return String(formData.get(field) || '').trim()
}

export async function createOrganizationWithOwner(formData: FormData): Promise<OrganizationActionResult> {
  const access = await requirePlatformAdmin()
  if (access.status === 'unauthenticated') return { ok: false, message: 'Sua sessão expirou. Entre novamente.' }
  if (access.status === 'forbidden') return { ok: false, message: 'Você não tem permissão para criar organização.' }

  const nome = text(formData, 'nome')
  const ownerEmail = text(formData, 'owner_email')
  if (nome.length < 2) return { ok: false, message: 'Informe um nome de organização válido.' }
  if (!ownerEmail.includes('@')) return { ok: false, message: 'Informe o e-mail do proprietário já cadastrado.' }

  const slug = `${slugifyOrganizationName(nome)}-${Date.now().toString(36)}`
  const { data, error } = await access.supabase.rpc('create_organization_with_owner', {
    organization_name: nome,
    owner_email: ownerEmail,
    organization_slug: slug,
  })
  if (error || !data) return { ok: false, message: mapMembershipError(error?.message || '') }

  revalidatePath('/platform/organizacoes')
  revalidatePath(`/platform/organizacoes/${data}`)
  return { ok: true, message: 'Organização criada e proprietário associado.', organizationId: data }
}
