'use server'

import { revalidatePath } from 'next/cache'
import { adultBirthDateMessages, evaluateAdultBirthDate } from '@/lib/auth/adult-birth-date'
import {
  IDENTITY_BUCKET,
  identityFolderFromPath,
  identityObjectPathFromPublicUrl,
  isOwnedProfileMediaUrl,
  isOwnedTeamMediaUrl,
  stripIdentityUrlVersion,
} from '@/lib/identity/paths'
import { createClient } from '@/lib/supabase/server'

export type ProfileActionResult = { ok: boolean; message: string }

type SupabaseServer = ReturnType<typeof createClient>

function revalidateProfile() {
  revalidatePath('/dashboard/meu-perfil')
  revalidatePath('/dashboard')
}

/** Remove objetos do mesmo slot (ex.: avatar.jpg ao trocar para avatar.webp), mantendo só o path atual. */
async function purgeIdentitySlotExcept(
  supabase: SupabaseServer,
  keepPath: string | null,
  previousUrl: string | null | undefined,
) {
  const previousPath = previousUrl ? identityObjectPathFromPublicUrl(previousUrl) : null
  const folder = (keepPath && identityFolderFromPath(keepPath)) || (previousPath && identityFolderFromPath(previousPath))
  if (!folder) {
    if (previousPath && previousPath !== keepPath) {
      await supabase.storage.from(IDENTITY_BUCKET).remove([previousPath])
    }
    return
  }

  const baseName = (keepPath || previousPath)?.split('/').pop()?.replace(/\.[^.]+$/, '') || null
  const { data: listed } = await supabase.storage.from(IDENTITY_BUCKET).list(folder)
  const stale = (listed || [])
    .map((item) => `${folder}/${item.name}`)
    .filter((path) => {
      if (keepPath && path === keepPath) return false
      if (!baseName) return path !== keepPath
      const file = path.split('/').pop() || ''
      return file === baseName || file.startsWith(`${baseName}.`)
    })

  if (stale.length > 0) {
    await supabase.storage.from(IDENTITY_BUCKET).remove(stale)
  }
}

export async function updateMyProfile(formData: FormData): Promise<ProfileActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sessão expirada. Entre novamente para salvar as alterações.' }

  const nome = String(formData.get('nome_completo') || '').trim()
  const telefone = String(formData.get('telefone') || '').replace(/\s+/g, ' ').trim()
  const dataNascimento = String(formData.get('data_nascimento') || '').trim()

  if (nome.length < 3) return { ok: false, message: 'Informe o nome completo.' }
  if (!dataNascimento) return { ok: false, message: adultBirthDateMessages.missing }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
    return { ok: false, message: adultBirthDateMessages.invalid }
  }
  const birth = evaluateAdultBirthDate(dataNascimento)
  if (!birth.ok) return { ok: false, message: adultBirthDateMessages[birth.code] }

  const { error } = await supabase.from('profiles').update({
    nome_completo: nome,
    telefone: telefone || null,
    data_nascimento: birth.iso,
    updated_at: new Date().toISOString(),
  }).eq('id', user.id)

  if (error) return { ok: false, message: 'Não foi possível salvar os dados. Tente novamente.' }

  await supabase.auth.updateUser({ data: { nome_completo: nome } })
  revalidateProfile()
  return { ok: true, message: 'Dados pessoais atualizados.' }
}

export async function setMyAvatarUrl(publicUrl: string): Promise<ProfileActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sessão expirada. Entre novamente.' }
  const clean = stripIdentityUrlVersion(publicUrl)
  if (!isOwnedProfileMediaUrl(clean, user.id, 'avatar')) {
    return { ok: false, message: 'URL de foto inválida para esta conta.' }
  }
  const { data: previous } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle()
  const keepPath = identityObjectPathFromPublicUrl(clean)
  const { error } = await supabase.from('profiles').update({
    avatar_url: clean,
    updated_at: new Date().toISOString(),
  }).eq('id', user.id)
  if (error) return { ok: false, message: 'Não foi possível salvar a foto de perfil.' }
  await purgeIdentitySlotExcept(supabase, keepPath, previous?.avatar_url)
  revalidateProfile()
  return { ok: true, message: 'Foto de perfil atualizada.' }
}

export async function clearMyAvatar(): Promise<ProfileActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sessão expirada. Entre novamente.' }
  const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle()
  const { error } = await supabase.from('profiles').update({
    avatar_url: null,
    updated_at: new Date().toISOString(),
  }).eq('id', user.id)
  if (error) return { ok: false, message: 'Não foi possível remover a foto de perfil.' }
  await purgeIdentitySlotExcept(supabase, null, profile?.avatar_url)
  revalidateProfile()
  return { ok: true, message: 'Foto de perfil removida.' }
}

export async function setMyBannerUrl(publicUrl: string): Promise<ProfileActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sessão expirada. Entre novamente.' }
  const clean = stripIdentityUrlVersion(publicUrl)
  if (!isOwnedProfileMediaUrl(clean, user.id, 'banner')) {
    return { ok: false, message: 'URL de banner inválida para esta conta.' }
  }
  const { data: previous } = await supabase.from('profiles').select('banner_url').eq('id', user.id).maybeSingle()
  const keepPath = identityObjectPathFromPublicUrl(clean)
  const { error } = await supabase.from('profiles').update({
    banner_url: clean,
    updated_at: new Date().toISOString(),
  }).eq('id', user.id)
  if (error) return { ok: false, message: 'Não foi possível salvar o banner.' }
  await purgeIdentitySlotExcept(supabase, keepPath, previous?.banner_url)
  revalidateProfile()
  return { ok: true, message: 'Banner atualizado.' }
}

export async function clearMyBanner(): Promise<ProfileActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sessão expirada. Entre novamente.' }
  const { data: profile } = await supabase.from('profiles').select('banner_url').eq('id', user.id).maybeSingle()
  const { error } = await supabase.from('profiles').update({
    banner_url: null,
    updated_at: new Date().toISOString(),
  }).eq('id', user.id)
  if (error) return { ok: false, message: 'Não foi possível remover o banner.' }
  await purgeIdentitySlotExcept(supabase, null, profile?.banner_url)
  revalidateProfile()
  return { ok: true, message: 'Banner removido.' }
}

async function assertTeamOwner(teamId: string, userId: string) {
  const supabase = createClient()
  const { data: team } = await supabase
    .from('teams')
    .select('id, created_by')
    .eq('id', teamId)
    .maybeSingle()
  if (!team || team.created_by !== userId) return null
  return team
}

export async function setTeamLogoUrl(teamId: string, publicUrl: string): Promise<ProfileActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sessão expirada. Entre novamente.' }
  if (!(await assertTeamOwner(teamId, user.id))) {
    return { ok: false, message: 'Sem permissão para editar esta equipe.' }
  }
  const clean = stripIdentityUrlVersion(publicUrl)
  if (!isOwnedTeamMediaUrl(clean, teamId, 'logo')) {
    return { ok: false, message: 'URL de logo inválida para esta equipe.' }
  }
  const { data: previous } = await supabase.from('teams').select('logo_url').eq('id', teamId).maybeSingle()
  const keepPath = identityObjectPathFromPublicUrl(clean)
  const { error } = await supabase.from('teams').update({
    logo_url: clean,
    updated_at: new Date().toISOString(),
  }).eq('id', teamId)
  if (error) return { ok: false, message: 'Não foi possível salvar o logo da equipe.' }
  await purgeIdentitySlotExcept(supabase, keepPath, previous?.logo_url)
  revalidateProfile()
  return { ok: true, message: 'Logo da equipe atualizado.' }
}

export async function clearTeamLogo(teamId: string): Promise<ProfileActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sessão expirada. Entre novamente.' }
  if (!(await assertTeamOwner(teamId, user.id))) {
    return { ok: false, message: 'Sem permissão para editar esta equipe.' }
  }
  const { data: team } = await supabase.from('teams').select('logo_url').eq('id', teamId).maybeSingle()
  const { error } = await supabase.from('teams').update({
    logo_url: null,
    updated_at: new Date().toISOString(),
  }).eq('id', teamId)
  if (error) return { ok: false, message: 'Não foi possível remover o logo da equipe.' }
  await purgeIdentitySlotExcept(supabase, null, team?.logo_url)
  revalidateProfile()
  return { ok: true, message: 'Logo da equipe removido.' }
}

export async function setTeamPhotoUrl(teamId: string, publicUrl: string): Promise<ProfileActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sessão expirada. Entre novamente.' }
  if (!(await assertTeamOwner(teamId, user.id))) {
    return { ok: false, message: 'Sem permissão para editar esta equipe.' }
  }
  const clean = stripIdentityUrlVersion(publicUrl)
  if (!isOwnedTeamMediaUrl(clean, teamId, 'photo')) {
    return { ok: false, message: 'URL de foto inválida para esta equipe.' }
  }
  const { data: previous } = await supabase.from('teams').select('photo_url').eq('id', teamId).maybeSingle()
  const keepPath = identityObjectPathFromPublicUrl(clean)
  const { error } = await supabase.from('teams').update({
    photo_url: clean,
    updated_at: new Date().toISOString(),
  }).eq('id', teamId)
  if (error) return { ok: false, message: 'Não foi possível salvar a foto da equipe.' }
  await purgeIdentitySlotExcept(supabase, keepPath, previous?.photo_url)
  revalidateProfile()
  return { ok: true, message: 'Foto da equipe atualizada.' }
}

export async function clearTeamPhoto(teamId: string): Promise<ProfileActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sessão expirada. Entre novamente.' }
  if (!(await assertTeamOwner(teamId, user.id))) {
    return { ok: false, message: 'Sem permissão para editar esta equipe.' }
  }
  const { data: team } = await supabase.from('teams').select('photo_url').eq('id', teamId).maybeSingle()
  const { error } = await supabase.from('teams').update({
    photo_url: null,
    updated_at: new Date().toISOString(),
  }).eq('id', teamId)
  if (error) return { ok: false, message: 'Não foi possível remover a foto da equipe.' }
  await purgeIdentitySlotExcept(supabase, null, team?.photo_url)
  revalidateProfile()
  return { ok: true, message: 'Foto da equipe removida.' }
}
