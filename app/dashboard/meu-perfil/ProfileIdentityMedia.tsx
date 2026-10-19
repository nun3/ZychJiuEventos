'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Camera, ImagePlus, Sparkles, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Dialog } from '@/components/ui/Dialog'
import {
  clearMyAvatar,
  clearMyBanner,
  clearTeamLogo,
  clearTeamPhoto,
  setMyAvatarUrl,
  setMyBannerUrl,
  setTeamLogoUrl,
  setTeamPhotoUrl,
  type ProfileActionResult,
} from './actions'
import { uploadIdentityImage } from '@/lib/identity/image-upload'
import { FUN_AVATAR_PRESETS } from '@/lib/profile/fun-avatar-presets'
import { cn } from '@/components/ui/utils'

type MediaKind = 'avatar' | 'banner' | 'teamLogo' | 'teamPhoto'

function MediaControls({
  label,
  hasImage,
  disabled,
  onPick,
  onRemove,
  tone = 'light',
}: {
  label: string
  hasImage: boolean
  disabled: boolean
  onPick: (file: File) => void
  onRemove?: () => void
  tone?: 'light' | 'dark'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const pickLabel = hasImage ? `Trocar ${label}` : `Adicionar ${label}`

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) onPick(file)
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        aria-label={pickLabel}
        title={pickLabel}
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-mc-full transition-colors duration-mc-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          tone === 'dark'
            ? 'border border-white/25 bg-black/30 text-white hover:bg-black/45'
            : 'border border-mc-border/80 bg-mc-surface/90 text-mc-text-secondary hover:border-mc-border hover:bg-mc-surface-secondary hover:text-mc-text-primary',
        )}
      >
        {hasImage ? <Camera aria-hidden="true" size={16} /> : <ImagePlus aria-hidden="true" size={16} />}
      </button>
      {hasImage && onRemove ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          aria-label={`Remover ${label}`}
          title={`Remover ${label}`}
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-mc-full transition-colors duration-mc-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            tone === 'dark'
              ? 'text-white/80 hover:bg-black/35 hover:text-white'
              : 'text-mc-text-secondary hover:bg-mc-surface-secondary hover:text-mc-error',
          )}
        >
          <Trash2 aria-hidden="true" size={16} />
        </button>
      ) : null}
    </div>
  )
}

export default function ProfileIdentityMedia({
  userId,
  name,
  email,
  rolesText,
  initials,
  avatarUrl,
  bannerUrl,
  belt,
  teamSummary,
  team,
}: {
  userId: string
  name: string
  email: string
  rolesText: string
  initials: string
  avatarUrl: string | null
  bannerUrl: string | null
  belt: string | null
  teamSummary: string | null
  team: {
    id: string
    nome: string
    isOwner: boolean
    logoUrl: string | null
    photoUrl: string | null
  } | null
}) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<ProfileActionResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const [busyKind, setBusyKind] = useState<MediaKind | null>(null)
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false)

  const run = (kind: MediaKind, work: () => Promise<ProfileActionResult>, onSuccess?: () => void) => {
    setFeedback(null)
    setBusyKind(kind)
    startTransition(async () => {
      const result = await work()
      setFeedback(result)
      setBusyKind(null)
      if (result.ok) {
        if (kind === 'avatar') window.dispatchEvent(new Event('meucamp:avatar-updated'))
        onSuccess?.()
        router.refresh()
      }
    })
  }

  const uploadThenPersist = (
    kind: MediaKind,
    ownerId: string,
    file: File,
    persist: (url: string) => Promise<ProfileActionResult>,
  ) => {
    run(kind, async () => {
      const uploaded = await uploadIdentityImage({ kind, ownerId, file })
      if (!uploaded.ok) return uploaded
      return persist(uploaded.publicUrl)
    })
  }

  const disabled = isPending || busyKind !== null
  const selectedAvatar = avatarUrl?.split('?')[0] || null

  const avatarControls = (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
      <MediaControls
        label="foto de perfil"
        hasImage={Boolean(avatarUrl)}
        disabled={disabled}
        onPick={(file) => uploadThenPersist('avatar', userId, file, setMyAvatarUrl)}
        onRemove={() => run('avatar', clearMyAvatar)}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAvatarPickerOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-mc-full border border-mc-border bg-mc-surface px-3 font-mc-interface text-xs font-semibold text-mc-text-primary transition-colors hover:border-mc-action/35 hover:bg-mc-action/5 hover:text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Sparkles aria-hidden="true" size={15} />
        Avatar divertido
      </button>
    </div>
  )

  return (
    <div className={cn('grid items-start gap-5', team && 'lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.85fr)]')}>
      <section aria-labelledby="profile-identity-title" className="overflow-hidden rounded-mc-large border border-mc-border bg-mc-surface shadow-sm">
        <div className="relative h-24 bg-[linear-gradient(118deg,#071b2e_0%,#0C3049_46%,#164e73_100%)] sm:h-28">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="" className="absolute inset-0 h-full w-full object-contain object-center p-3" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.28),transparent_55%)]" aria-hidden="true" />
          )}
          <div className="absolute bottom-mc-8 right-mc-8 sm:bottom-mc-12 sm:right-mc-12">
            <MediaControls
              label="banner"
              hasImage={Boolean(bannerUrl)}
              disabled={disabled}
              tone="dark"
              onPick={(file) => uploadThenPersist('banner', userId, file, setMyBannerUrl)}
              onRemove={() => run('banner', clearMyBanner)}
            />
          </div>
        </div>

        <div className="relative px-mc-16 pb-mc-24 pt-mc-16 sm:px-mc-24 sm:pb-mc-32 sm:pt-mc-20">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-mc-24 sm:text-left">
            <div className="relative z-10 -mt-8 flex shrink-0 flex-col items-center gap-mc-8">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={`Foto de ${name}`}
                  width={80}
                  height={80}
                  sizes="80px"
                  className="h-20 w-20 rounded-full border-4 border-mc-surface bg-mc-surface object-contain shadow-mc-subtle"
                />
              ) : (
                <span
                  className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-mc-surface bg-mc-action font-mc-display text-2xl font-semibold text-white shadow-mc-subtle"
                  aria-hidden="true"
                >
                  {initials}
                </span>
              )}
              <div className="sm:hidden">
                {avatarControls}
              </div>
            </div>

            <div className="mt-mc-12 min-w-0 flex-1 sm:mt-0">
              <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.14em] text-mc-text-secondary">
                Meu espaço
              </p>
              <h1 id="profile-identity-title" className="mt-mc-4 truncate font-mc-display text-mc-h2 text-mc-text-primary sm:text-mc-h1">
                {name}
              </h1>
              <p className="mt-mc-8 break-all font-mc-interface text-sm text-mc-text-secondary">{email}</p>
              <p className="mt-mc-8 font-mc-interface text-sm font-semibold text-mc-structure">{rolesText}</p>

              <div className="mt-mc-12 flex flex-wrap items-center justify-center gap-x-mc-16 gap-y-mc-8 font-mc-interface text-sm text-mc-text-secondary sm:justify-start">
                {teamSummary ? (
                  <span>
                    <span className="text-mc-text-secondary">Equipe: </span>
                    <span className="font-semibold text-mc-text-primary">{teamSummary}</span>
                  </span>
                ) : null}
                {belt ? (
                  <span className="inline-flex items-center rounded-mc-medium bg-mc-surface-secondary px-mc-12 py-1 text-xs font-semibold uppercase tracking-wide text-mc-structure">
                    Faixa {belt}
                  </span>
                ) : null}
              </div>

              <div className="mt-mc-12 hidden sm:flex sm:justify-start">
                {avatarControls}
              </div>
            </div>
          </div>

          {feedback ? (
            <div className="mt-mc-16">
              <Alert variant={feedback.ok ? 'success' : 'error'} role="status">{feedback.message}</Alert>
            </div>
          ) : null}
        </div>
      </section>

      {team ? (
        <section aria-labelledby="team-media-title" className="rounded-mc-large border border-mc-border bg-mc-surface p-mc-16 sm:p-mc-24">
          <h2 id="team-media-title" className="font-mc-display text-mc-h3 text-mc-text-primary">
            Logo / foto da equipe
          </h2>
          <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">
            Separado da foto pessoal. {team.isOwner ? 'Você pode atualizar as imagens da equipe.' : 'Somente o responsável pela equipe altera estas imagens.'}
          </p>
          <div className="mt-mc-16 grid gap-mc-16 sm:grid-cols-2">
            <div className="rounded-mc-medium bg-mc-surface-secondary p-mc-16">
              <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.12em] text-mc-text-secondary">Logo</p>
              <div className="mt-mc-12 flex flex-col items-center gap-mc-12 sm:flex-row sm:items-center">
                {team.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={team.logoUrl} alt={`Logo de ${team.nome}`} className="h-14 w-14 rounded-mc-medium bg-mc-surface object-contain" />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-mc-medium bg-mc-structure font-mc-display text-sm font-semibold text-white" aria-hidden="true">
                    {team.nome.slice(0, 2).toUpperCase()}
                  </span>
                )}
                {team.isOwner ? (
                  <MediaControls
                    label="logo da equipe"
                    hasImage={Boolean(team.logoUrl)}
                    disabled={disabled}
                    onPick={(file) => uploadThenPersist('teamLogo', team.id, file, (url) => setTeamLogoUrl(team.id, url))}
                    onRemove={() => run('teamLogo', () => clearTeamLogo(team.id))}
                  />
                ) : null}
              </div>
            </div>
            <div className="rounded-mc-medium bg-mc-surface-secondary p-mc-16">
              <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.12em] text-mc-text-secondary">Foto da equipe</p>
              <div className="mt-mc-12 flex flex-col items-center gap-mc-12 sm:flex-row sm:items-center">
                {team.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={team.photoUrl} alt={`Foto de ${team.nome}`} className="h-14 w-20 rounded-mc-medium object-cover" />
                ) : (
                  <span className="flex h-14 w-20 items-center justify-center rounded-mc-medium border border-dashed border-mc-border bg-mc-surface font-mc-interface text-xs text-mc-text-secondary">
                    Sem foto
                  </span>
                )}
                {team.isOwner ? (
                  <MediaControls
                    label="foto da equipe"
                    hasImage={Boolean(team.photoUrl)}
                    disabled={disabled}
                    onPick={(file) => uploadThenPersist('teamPhoto', team.id, file, (url) => setTeamPhotoUrl(team.id, url))}
                    onRemove={() => run('teamPhoto', () => clearTeamPhoto(team.id))}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <Dialog
        open={avatarPickerOpen}
        onClose={() => !disabled && setAvatarPickerOpen(false)}
        title="Avatar divertido"
        description="Escolha um lutador para representar seu perfil. Você pode trocar por uma foto a qualquer momento."
        className="max-w-2xl"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {FUN_AVATAR_PRESETS.map((preset) => {
            const isSelected = selectedAvatar === preset.src
            return (
              <button
                key={preset.id}
                type="button"
                disabled={disabled}
                aria-pressed={isSelected}
                onClick={() => run('avatar', () => setMyAvatarUrl(preset.src), () => setAvatarPickerOpen(false))}
                className={cn(
                  'group relative overflow-hidden rounded-mc-medium border bg-mc-surface-secondary p-2 text-left transition-all duration-mc-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                  isSelected
                    ? 'border-mc-action ring-2 ring-mc-action/20'
                    : 'border-mc-border hover:border-mc-action/45 hover:bg-mc-action/5',
                )}
              >
                <span className="relative flex aspect-square items-end justify-center overflow-hidden rounded-mc-small bg-[radial-gradient(circle_at_50%_20%,#1c3d59_0%,#0C3049_64%,#071b2e_100%)]">
                  <Image
                    src={preset.src}
                    alt=""
                    fill
                    sizes="(max-width: 639px) 45vw, (max-width: 1023px) 28vw, 160px"
                    quality={65}
                    className="object-contain transition-transform duration-mc-normal group-hover:scale-[1.03]"
                  />
                </span>
                <span className="mt-2 block font-mc-interface text-sm font-semibold text-mc-text-primary">{preset.label}</span>
                <span className="mt-0.5 block text-xs text-mc-text-secondary">{isSelected ? 'Selecionado' : preset.description}</span>
              </button>
            )
          })}
        </div>
      </Dialog>
    </div>
  )
}
