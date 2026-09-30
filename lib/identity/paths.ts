import { getSupabaseConfig } from '@/lib/supabase/config'

export const IDENTITY_BUCKET = 'identity-assets' as const

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EXT_RE = /^(jpe?g|png|webp)$/i

export type ProfileMediaField = 'avatar' | 'banner'
export type TeamMediaField = 'logo' | 'photo'

function publicObjectPrefix() {
  const { url } = getSupabaseConfig()
  return `${url.replace(/\/$/, '')}/storage/v1/object/public/${IDENTITY_BUCKET}/`
}

export function stripIdentityUrlVersion(url: string) {
  return url.split('?')[0]
}

/** Bust de CDN/browser para paths estáveis (avatar.webp permanece o mesmo após troca). */
export function withIdentityCacheBust(url: string | null | undefined, version: string | number | null | undefined) {
  if (!url) return null
  const clean = stripIdentityUrlVersion(url.trim())
  if (!clean) return null
  if (version == null || version === '') return clean
  const token = typeof version === 'number' ? String(version) : String(Date.parse(version) || version)
  return `${clean}?v=${encodeURIComponent(token)}`
}

export function identityObjectPathFromPublicUrl(url: string): string | null {
  const clean = stripIdentityUrlVersion(url.trim())
  const prefix = publicObjectPrefix()
  if (!clean.startsWith(prefix)) return null
  try {
    return decodeURIComponent(clean.slice(prefix.length))
  } catch {
    return null
  }
}

export function isOwnedProfileMediaUrl(url: string, userId: string, field: ProfileMediaField) {
  if (!UUID_RE.test(userId)) return false
  const path = identityObjectPathFromPublicUrl(url)
  if (!path) return false
  const folder = field === 'avatar' ? 'avatars' : 'banners'
  const base = field === 'avatar' ? 'avatar' : 'banner'
  const match = path.match(new RegExp(`^${folder}/${userId}/${base}\\.([a-z0-9]+)$`, 'i'))
  return Boolean(match && EXT_RE.test(match[1]))
}

export function isOwnedTeamMediaUrl(url: string, teamId: string, field: TeamMediaField) {
  if (!UUID_RE.test(teamId)) return false
  const path = identityObjectPathFromPublicUrl(url)
  if (!path) return false
  const base = field === 'logo' ? 'logo' : 'photo'
  const match = path.match(new RegExp(`^teams/${teamId}/${base}\\.([a-z0-9]+)$`, 'i'))
  return Boolean(match && EXT_RE.test(match[1]))
}

export function buildIdentityObjectPath(
  kind: 'avatar' | 'banner' | 'teamLogo' | 'teamPhoto',
  ownerId: string,
  extension: string,
) {
  const ext = extension.toLowerCase().replace(/^\./, '')
  if (kind === 'avatar') return `avatars/${ownerId}/avatar.${ext}`
  if (kind === 'banner') return `banners/${ownerId}/banner.${ext}`
  if (kind === 'teamLogo') return `teams/${ownerId}/logo.${ext}`
  return `teams/${ownerId}/photo.${ext}`
}

/** Pasta do objeto (sem o nome do arquivo), para limpar órfãos na troca de extensão. */
export function identityFolderFromPath(path: string) {
  const parts = path.split('/').filter(Boolean)
  if (parts.length < 2) return null
  return parts.slice(0, -1).join('/')
}

export function identityFileBaseFromKind(kind: 'avatar' | 'banner' | 'teamLogo' | 'teamPhoto') {
  if (kind === 'avatar') return 'avatar'
  if (kind === 'banner') return 'banner'
  if (kind === 'teamLogo') return 'logo'
  return 'photo'
}
