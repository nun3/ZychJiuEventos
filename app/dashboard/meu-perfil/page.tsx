import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Building2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Lock,
  Mail,
  Shield,
  Users,
  UsersRound,
} from 'lucide-react'
import { getDashboardActor } from '@/lib/auth/dashboard-actor'
import { getPublicOrganizationScope } from '@/lib/events/public-organization'
import { loadProfileJourney } from '@/lib/profile/load-profile-journey'
import { createClient } from '@/lib/supabase/server'
import { Alert } from '@/components/ui/Alert'
import { PageContainer } from '@/components/ui/PageContainer'
import { organizationRoleLabel } from '@/lib/organizations/membership'
import { withIdentityCacheBust } from '@/lib/identity/paths'
import ProfileForm from './ProfileForm'
import ProfileIdentityMedia from './ProfileIdentityMedia'
import ProfileJourneySection from './ProfileJourneySection'
import ProfileSportsSection from './ProfileSportsSection'

const roleLabels = {
  atleta: 'Atleta',
  professor: 'Professor',
  organizador: 'Organizador',
  responsavel: 'Responsável',
} as const

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })

function formatCpf(value: string | null) {
  if (!value) return 'Não informado'
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11) return value
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

function roleLine(params: {
  tipoCadastro: keyof typeof roleLabels | null
  isProfessor: boolean
  canManageEvents: boolean
  orgRoleLabel: string | null
}) {
  const parts: string[] = []
  if (params.tipoCadastro) parts.push(roleLabels[params.tipoCadastro])
  if (params.isProfessor && params.tipoCadastro !== 'professor') parts.push('Professor')
  if (params.canManageEvents && params.tipoCadastro !== 'organizador') parts.push('Organizador')
  if (params.orgRoleLabel && !parts.includes(params.orgRoleLabel)) parts.push(params.orgRoleLabel)
  return parts.length ? parts.join(' · ') : 'Conta MEU CAMP'
}

export default async function MeuPerfilPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard/meu-perfil')

  const actor = await getDashboardActor()
  const organization = actor?.organization ?? null
  const scope = getPublicOrganizationScope()
  const releaseOrganizationId = scope.mode === 'restricted' ? scope.organizationId : null

  let teamsQuery = supabase.from('teams').select('id, nome, logo_url, photo_url, updated_at').eq('created_by', user.id).order('nome')
  if (releaseOrganizationId) teamsQuery = teamsQuery.eq('organization_id', releaseOrganizationId)

  const [
    { data: profile },
    { data: createdTeams },
    { data: managedAthletes },
    { data: selfAthlete },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('nome_completo, cpf, telefone, data_nascimento, created_at, updated_at, avatar_url, banner_url')
      .eq('id', user.id)
      .maybeSingle(),
    teamsQuery,
    supabase.from('athlete_managers').select('athlete_id, athletes(organization_id)').eq('manager_id', user.id),
    supabase
      .from('athletes')
      .select('id, faixa, peso_kg, team_id, teams(id, nome, created_by, logo_url, photo_url, updated_at)')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const managedAthleteIds = (managedAthletes || [])
    .filter((link) => {
      const athlete = link.athletes as unknown as { organization_id: string } | null
      if (!releaseOrganizationId) return true
      return athlete?.organization_id === releaseOrganizationId
    })
    .map((link) => link.athlete_id)

  const managedCount = managedAthleteIds.length

  const selfTeam = selfAthlete?.teams as unknown as {
    id: string
    nome: string
    created_by: string
    logo_url: string | null
    photo_url: string | null
    updated_at: string
  } | null
  const primaryTeam = createdTeams?.[0]
    ? {
        id: createdTeams[0].id,
        nome: createdTeams[0].nome,
        isOwner: true as const,
        logoUrl: withIdentityCacheBust(createdTeams[0].logo_url, createdTeams[0].updated_at),
        photoUrl: withIdentityCacheBust(createdTeams[0].photo_url, createdTeams[0].updated_at),
      }
    : selfTeam
      ? {
          id: selfTeam.id,
          nome: selfTeam.nome,
          isOwner: false as const,
          logoUrl: withIdentityCacheBust(selfTeam.logo_url, selfTeam.updated_at),
          photoUrl: withIdentityCacheBust(selfTeam.photo_url, selfTeam.updated_at),
        }
      : null

  let teamAthleteCount: number | null = null
  let teamProfessorName: string | null = null
  if (primaryTeam) {
    const [{ count }, professorResult] = await Promise.all([
      supabase.from('athletes').select('id', { count: 'exact', head: true }).eq('team_id', primaryTeam.id),
      primaryTeam.isOwner
        ? Promise.resolve({ data: { nome_completo: profile?.nome_completo || null } })
        : supabase.from('profiles').select('nome_completo').eq('id', selfTeam!.created_by).maybeSingle(),
    ])
    teamAthleteCount = count ?? 0
    teamProfessorName = professorResult.data?.nome_completo?.trim() || null
  }

  const journey = await loadProfileJourney({
    userId: user.id,
    selfAthleteId: selfAthlete?.id ?? null,
    managedAthleteIds,
    canManageEvents: Boolean(actor?.canManageEvents),
    isProfessor: Boolean(actor?.isProfessor),
  })

  const name = profile?.nome_completo?.trim() || actor?.name?.trim() || user.email?.split('@')[0] || 'Sua conta'
  const initials = initialsFromName(name)
  const mediaVersion = profile?.updated_at || profile?.created_at || null
  const avatarUrl = withIdentityCacheBust(profile?.avatar_url, mediaVersion)
  const bannerUrl = withIdentityCacheBust(profile?.banner_url, mediaVersion)
  const tipoCadastro = actor?.tipoCadastro ?? null
  const orgRole = organization?.role ? organizationRoleLabel(organization.role) : null
  const rolesText = roleLine({
    tipoCadastro,
    isProfessor: Boolean(actor?.isProfessor),
    canManageEvents: Boolean(actor?.canManageEvents),
    orgRoleLabel: orgRole,
  })
  const belt = selfAthlete?.faixa?.trim() || null

  const shortcuts: Array<{ href: string; label: string; icon: typeof UsersRound }> = [
    { href: '/dashboard/inscricoes', label: 'Minhas inscrições', icon: ClipboardList },
  ]
  if (actor?.isProfessor || managedCount > 0 || actor?.hasSelfAthlete) {
    shortcuts.push({ href: '/dashboard/meus-atletas', label: 'Meus atletas', icon: UsersRound })
  }
  if (primaryTeam) {
    shortcuts.push({ href: '/dashboard/meus-atletas', label: 'Minha equipe', icon: Users })
  }
  if (actor?.canManageEvents) {
    shortcuts.push({ href: '/admin/eventos', label: 'Meus eventos', icon: CalendarDays })
  }
  shortcuts.push({ href: '/dashboard', label: 'Painel', icon: LayoutDashboard })
  if (actor?.canManageOrganization) {
    shortcuts.push({ href: '/dashboard/organizacao', label: 'Organização', icon: Building2 })
  }

  return (
    <main className="pb-mc-48 pt-mc-24 sm:pb-mc-64 sm:pt-mc-32">
      <PageContainer>
        {actor?.needsSportsProfile ? (
          <Alert variant="warning" role="status" className="mb-mc-24">
            Seu cadastro esportivo ainda não está completo.{' '}
            <Link href="/dashboard/completar-cadastro-esportivo" className="font-semibold text-mc-action hover:underline">
              Completar cadastro esportivo
            </Link>
          </Alert>
        ) : null}

        <ProfileIdentityMedia
          userId={user.id}
          name={name}
          email={user.email || ''}
          rolesText={rolesText}
          initials={initials}
          avatarUrl={avatarUrl}
          bannerUrl={bannerUrl}
          belt={belt}
          teamSummary={primaryTeam?.nome ?? null}
          team={primaryTeam}
        />

        <div className="mt-mc-24 space-y-mc-24">
          <ProfileSportsSection
            faixa={belt}
            pesoKg={selfAthlete?.peso_kg ?? null}
            teamName={primaryTeam?.nome ?? selfTeam?.nome ?? null}
            professorName={teamProfessorName}
          />

          <ProfileJourneySection journey={journey} />
        </div>

        <div className="mt-mc-24 grid gap-mc-24 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
          <div className="space-y-mc-24">
            {primaryTeam ? (
              <section aria-labelledby="my-team-title" className="rounded-mc-large border border-mc-border bg-mc-surface p-mc-16 sm:p-mc-24">
                <h2 id="my-team-title" className="font-mc-display text-mc-h3 text-mc-text-primary">
                  Minha equipe
                </h2>
                <div className="mt-mc-16 flex flex-col gap-mc-16 sm:flex-row sm:items-center">
                  {primaryTeam.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={primaryTeam.logoUrl}
                      alt={`Logo de ${primaryTeam.nome}`}
                      className="h-16 w-16 shrink-0 rounded-mc-large object-cover"
                    />
                  ) : (
                    <span
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-mc-large bg-mc-structure font-mc-display text-lg font-semibold text-white"
                      aria-hidden="true"
                    >
                      {initialsFromName(primaryTeam.nome)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-mc-display text-lg font-semibold text-mc-text-primary">{primaryTeam.nome}</p>
                    {teamProfessorName ? (
                      <p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">
                        Professor responsável: <span className="font-semibold text-mc-text-primary">{teamProfessorName}</span>
                      </p>
                    ) : null}
                    {teamAthleteCount !== null ? (
                      <p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">
                        {teamAthleteCount} {teamAthleteCount === 1 ? 'atleta' : 'atletas'}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-mc-16 flex flex-wrap gap-mc-12">
                  <Link
                    href="/dashboard/meus-atletas"
                    className="inline-flex min-h-11 items-center rounded-mc-medium bg-mc-action px-mc-16 font-mc-interface text-sm font-semibold text-white hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                  >
                    Ver minha equipe
                  </Link>
                  {primaryTeam.isOwner ? (
                    <Link
                      href="/dashboard/meus-atletas"
                      className="inline-flex min-h-11 items-center rounded-mc-medium border border-mc-border px-mc-16 font-mc-interface text-sm font-semibold text-mc-text-primary hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                    >
                      Editar equipe
                    </Link>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section id="dados-pessoais" aria-labelledby="personal-data-title" className="rounded-mc-large border border-mc-border bg-mc-surface p-mc-16 sm:p-mc-24">
              <h2 id="personal-data-title" className="font-mc-display text-mc-h3 text-mc-text-primary">
                Dados pessoais
              </h2>
              <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">
                Atualize o que a operação precisa de você. O CPF, quando existir, permanece como identificação.
              </p>
              <dl className="mt-mc-16 grid gap-mc-12 rounded-mc-medium bg-mc-surface-secondary px-mc-16 py-mc-16 font-mc-interface text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-mc-text-secondary">CPF</dt>
                  <dd className="mt-mc-4 font-semibold text-mc-text-primary">{formatCpf(profile?.cpf ?? null)}</dd>
                </div>
                <div>
                  <dt className="text-mc-text-secondary">Conta desde</dt>
                  <dd className="mt-mc-4 font-semibold text-mc-text-primary">
                    {profile?.created_at ? dateFormatter.format(new Date(profile.created_at)) : '—'}
                  </dd>
                </div>
              </dl>
              <div className="mt-mc-16">
                <ProfileForm
                  nomeCompleto={profile?.nome_completo || ''}
                  telefone={profile?.telefone || ''}
                  dataNascimento={profile?.data_nascimento || ''}
                />
              </div>
            </section>
          </div>

          <aside className="space-y-mc-24">
            <section
              aria-labelledby="account-security-title"
              className="rounded-mc-large border border-mc-border bg-mc-surface-secondary/60 p-mc-16 sm:p-mc-24"
            >
              <h2 id="account-security-title" className="font-mc-display text-lg font-semibold text-mc-text-primary">
                Conta e segurança
              </h2>
              <ul className="mt-mc-16 space-y-mc-16 font-mc-interface text-sm">
                <li className="flex items-start gap-mc-12">
                  <Mail aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-mc-text-secondary" />
                  <div>
                    <p className="font-semibold text-mc-text-primary">E-mail</p>
                    <p className="mt-mc-4 break-all text-mc-text-secondary">{user.email}</p>
                    <p className="mt-mc-4 text-xs text-mc-text-secondary">Não é alterado por esta tela.</p>
                  </div>
                </li>
                <li className="flex items-start gap-mc-12">
                  <Lock aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-mc-text-secondary" />
                  <div>
                    <p className="font-semibold text-mc-text-primary">Senha</p>
                    <p className="mt-mc-4 text-mc-text-secondary">Redefina pelo e-mail cadastrado.</p>
                    <Link
                      href="/recuperar-senha"
                      className="mt-mc-8 inline-flex min-h-11 items-center font-semibold text-mc-action hover:underline"
                    >
                      Recuperar senha
                    </Link>
                  </div>
                </li>
                <li className="flex items-start gap-mc-12">
                  <Shield aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-mc-text-secondary" />
                  <div>
                    <p className="font-semibold text-mc-text-primary">Criação da conta</p>
                    <p className="mt-mc-4 text-mc-text-secondary">
                      {profile?.created_at ? dateFormatter.format(new Date(profile.created_at)) : 'Data não disponível'}
                    </p>
                  </div>
                </li>
              </ul>
            </section>

            <section
              aria-labelledby="profile-shortcuts-title"
              className="divide-y divide-mc-border overflow-hidden rounded-mc-large border border-mc-border bg-mc-surface"
            >
              <div className="p-mc-16 sm:p-mc-24">
                <h2 id="profile-shortcuts-title" className="font-mc-display text-lg font-semibold text-mc-text-primary">
                  Atalhos
                </h2>
                <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">Caminhos reais da sua conta.</p>
              </div>
              {shortcuts.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    className="flex min-h-14 items-center gap-mc-12 px-mc-16 py-mc-12 font-mc-interface text-sm font-semibold text-mc-text-primary transition-colors hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus sm:px-mc-24"
                  >
                    <Icon aria-hidden="true" size={18} className="text-mc-action" />
                    {item.label}
                  </Link>
                )
              })}
            </section>
          </aside>
        </div>
      </PageContainer>
    </main>
  )
}
