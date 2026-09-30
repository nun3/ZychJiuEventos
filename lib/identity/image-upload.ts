'use client'

import { createClient } from '@/lib/supabase/client'
import { IDENTITY_BUCKET, buildIdentityObjectPath } from '@/lib/identity/paths'

export type IdentityImageKind = 'avatar' | 'banner' | 'teamLogo' | 'teamPhoto'

const KIND_CONFIG: Record<
  IdentityImageKind,
  { maxBytes: number; maxEdge: number; quality: number }
> = {
  avatar: { maxBytes: 2 * 1024 * 1024, maxEdge: 512, quality: 0.85 },
  banner: { maxBytes: 5 * 1024 * 1024, maxEdge: 1600, quality: 0.82 },
  teamLogo: { maxBytes: 2 * 1024 * 1024, maxEdge: 512, quality: 0.85 },
  teamPhoto: { maxBytes: 5 * 1024 * 1024, maxEdge: 1200, quality: 0.82 },
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

export type IdentityUploadResult =
  | { ok: true; publicUrl: string; path: string }
  | { ok: false; message: string }

function extensionForMime(mime: string) {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler a imagem.'))
    }
    image.src = url
  })
}

async function resizeToBlob(file: File, maxEdge: number, quality: number): Promise<{ blob: Blob; mime: string }> {
  const image = await loadImage(file)
  const longest = Math.max(image.width, image.height)
  const scale = longest > maxEdge ? maxEdge / longest : 1
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas indisponível neste navegador.')
  context.drawImage(image, 0, 0, width, height)

  const mime = 'image/webp'
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), mime, quality)
  })
  if (blob) return { blob, mime }

  const jpegBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), 'image/jpeg', quality)
  })
  if (!jpegBlob) throw new Error('Falha ao compactar a imagem.')
  return { blob: jpegBlob, mime: 'image/jpeg' }
}

export async function uploadIdentityImage(params: {
  kind: IdentityImageKind
  ownerId: string
  file: File
}): Promise<IdentityUploadResult> {
  const config = KIND_CONFIG[params.kind]
  if (!params.file || params.file.size === 0) return { ok: false, message: 'Selecione uma imagem.' }
  if (!ALLOWED_MIME.has(params.file.type)) {
    return { ok: false, message: 'Use JPEG, PNG ou WebP.' }
  }
  if (params.file.size > config.maxBytes * 4) {
    return { ok: false, message: 'Arquivo muito grande. Escolha uma imagem menor.' }
  }

  let prepared: { blob: Blob; mime: string }
  try {
    prepared = await resizeToBlob(params.file, config.maxEdge, config.quality)
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Não foi possível processar a imagem.' }
  }

  if (prepared.blob.size > config.maxBytes) {
    return { ok: false, message: 'A imagem continua grande demais após compactação.' }
  }

  const extension = extensionForMime(prepared.mime)
  const path = buildIdentityObjectPath(params.kind, params.ownerId, extension)
  const supabase = createClient()
  const { error } = await supabase.storage.from(IDENTITY_BUCKET).upload(path, prepared.blob, {
    upsert: true,
    contentType: prepared.mime,
    cacheControl: '60',
  })
  if (error) return { ok: false, message: 'Não foi possível enviar a imagem. Tente novamente.' }

  const publicUrl = supabase.storage.from(IDENTITY_BUCKET).getPublicUrl(path).data.publicUrl
  // A UI persiste a URL limpa; o bust de cache (?v=updated_at) é aplicado na leitura.
  return { ok: true, publicUrl, path }
}

export async function removeIdentityObject(path: string): Promise<{ ok: boolean; message?: string }> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(IDENTITY_BUCKET).remove([path])
  if (error) return { ok: false, message: 'Não foi possível remover o arquivo.' }
  return { ok: true }
}

export { IDENTITY_BUCKET, buildIdentityObjectPath, identityObjectPathFromPublicUrl } from '@/lib/identity/paths'
