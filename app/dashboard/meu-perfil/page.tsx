import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarDays, ClipboardList, Lock, Mail, Shield, UserRound, UsersRound } from 'lucide-react'
import { getDashboardActor } from '@/lib/auth/dashboard-actor'
import { getPublicOrganizationScope } from '@/lib/events/public-organization'
import { createClient } from '@/lib/supabase/server'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import ProfileForm from './ProfileForm'

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

function formatBirth(value: string | null) {
  if (!value) return 'Não informado'
  return dateFormatter.format(new Date(`${value}T12:00:00Z`))
}

export default async function MeuPerfilPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard/meu-perfil')

  const actor = await getDashboardActor()
  const organization = actor?.organization ?? null
  const scope = getPublicOrganizationScope()
  const releaseOrganizationId = scope.mode === 'restricted' ? scope.organizationId : null
  let teamsQuery = supabase.from('teams').select('id, nome').eq('created_by', user.id).order('nome')
  if (releaseOrganizationId) teamsQuery = teamsQuery.eq('organization_id', releaseOrganizationId)
  const [{ data: profile }, { data: teams }, { data: managedAthletes }] = await Promise.all([
    supabase.from('profiles').select('nome_completo, cpf, telefone, data_nascimento, created_at').eq('id', user.id).maybeSingle(),
    teamsQuery,
    supabase.from('athlete_managers').select('athlete_id, athletes(organization_id)').eq('manager_id', user.id),
  ])
  const managedCount = (managedAthletes || []).filter((link) => {
    const athlete = link.athletes as unknown as { organization_id: string } | null
    if (!releaseOrganizationId) return true
    return athlete?.organization_id === releaseOrganizationId
  }).length

  const name = profile?.nome_completo?.trim() || actor?.name?.trim() || user.email?.split('@')[0] || 'Sua conta'
  const initial = name.charAt(0).toUpperCase()
  const roleLabel = actor?.tipoCadastro ? roleLabels[actor.tipoCadastro] : null
  const organizationName = organization?.organizationName || null

  return (
    <main className="py-mc-32 sm:py-mc-48">
      <PageContainer>
        <PageHeader
          title="Meu perfil"
          description="Veja quem você é na plataforma, o que pode alterar e como acessar atletas, inscrições e segurança da conta."
        />

        {actor?.needsSportsProfile ? (
          <Alert variant="warning" role="status" className="mt-mc-24">
            Seu cadastro esportivo ainda não está completo.{' '}
            <Link href="/dashboard/completar-cadastro-esportivo" className="font-semibold text-mc-action hover:underline">Completar cadastro esportivo</Link>
          </Alert>
        ) : null}

        <section aria-labelledby="profile-identity-title" className="mt-mc-32">
          <Card className="overflow-hidden">
            <div className="bg-mc-structure px-mc-16 py-mc-24 text-white sm:px-mc-24">
              <div className="flex flex-col gap-mc-16 sm:flex-row sm:items-center">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-mc-full bg-white/15 font-mc-display text-2xl font-semibold" aria-hidden="true">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Identidade</p>
                  <h2 id="profile-identity-title" className="mt-mc-8 truncate font-mc-display text-mc-h2 text-white">{name}</h2>
                  <p className="mt-mc-8 break-all font-mc-interface text-sm text-slate-200">{user.email}</p>
                </div>
              </div>
              <div className="mt-mc-16 flex flex-wrap gap-mc-8">
                {roleLabel ? <StatusBadge className="bg-white/15 text-white">{roleLabel}</StatusBadge> : null}
                {actor?.isProfessor ? <StatusBadge className="bg-white/15 text-white">Gerencia equipe</StatusBadge> : null}
                {actor?.canManageEvents ? <StatusBadge className="bg-white/15 text-white">Administra eventos</StatusBadge> : null}
              </div>
            </div>
          </Card>
        </section>

        <div className="mt-mc-24 grid gap-mc-24 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
          <div className="space-y-mc-24">
            <section id="dados-pessoais" aria-labelledby="personal-data-title">
              <Card className="p-mc-16 sm:p-mc-24">
                <h2 id="personal-data-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Dados pessoais</h2>
                <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">
                  Nome, telefone e nascimento podem ser alterados. O CPF, quando existir, permanece como identificação da conta.
                </p>
                <dl className="mt-mc-16 grid gap-mc-12 border-y border-mc-border py-mc-16 font-mc-interface text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-mc-text-secondary">CPF</dt>
                    <dd className="mt-mc-4 font-semibold text-mc-text-primary">{formatCpf(profile?.cpf ?? null)}</dd>
                  </div>
                  <div>
                    <dt className="text-mc-text-secondary">Nascimento atual</dt>
                    <dd className="mt-mc-4 font-semibold text-mc-text-primary">{formatBirth(profile?.data_nascimento ?? null)}</dd>
                  </div>
                </dl>
                <div className="mt-mc-16">
                  <ProfileForm
                    nomeCompleto={profile?.nome_completo || ''}
                    telefone={profile?.telefone || ''}
                    dataNascimento={profile?.data_nascimento || ''}
                  />
                </div>
              </Card>
            </section>

            <section aria-labelledby="sports-links-title">
              <Card className="p-mc-16 sm:p-mc-24">
                <h2 id="sports-links-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Vínculos na plataforma</h2>
                <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">
                  Somente o que já existe na sua conta: tipo de cadastro, equipes criadas e atletas que você gerencia.
                </p>
                <dl className="mt-mc-16 space-y-mc-16 font-mc-interface text-sm">
                  <div className="grid gap-mc-4 sm:grid-cols-[10rem_1fr]">
                    <dt className="text-mc-text-secondary">Tipo de cadastro</dt>
                    <dd className="font-semibold text-mc-text-primary">{roleLabel || 'Não informado no cadastro'}</dd>
                  </div>
                  <div className="grid gap-mc-4 sm:grid-cols-[10rem_1fr]">
                    <dt className="text-mc-text-secondary">Organização</dt>
                    <dd className="font-semibold text-mc-text-primary">
                      {organizationName ? `${organizationName} · ${organization?.role === 'owner' ? 'proprietário' : organization?.role === 'organizer' ? 'organizador' : organization?.role}` : 'Nenhuma organização administrativa'}
                    </dd>
                  </div>
                  <div className="grid gap-mc-4 sm:grid-cols-[10rem_1fr]">
                    <dt className="text-mc-text-secondary">Equipes</dt>
                    <dd className="font-semibold text-mc-text-primary">
                      {teams?.length ? teams.map((team) => team.nome).join(', ') : 'Nenhuma equipe criada por você'}
                    </dd>
                  </div>
                  <div className="grid gap-mc-4 sm:grid-cols-[10rem_1fr]">
                    <dt className="text-mc-text-secondary">Atletas gerenciados</dt>
                    <dd className="font-semibold text-mc-text-primary">{managedCount ?? 0}</dd>
                  </div>
                </dl>
              </Card>
            </section>
          </div>

          <aside className="space-y-mc-24">
            <section aria-labelledby="account-security-title">
              <Card className="p-mc-16 sm:p-mc-24">
                <h2 id="account-security-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Conta e segurança</h2>
                <ul className="mt-mc-16 space-y-mc-16 font-mc-interface text-sm">
                  <li className="flex items-start gap-mc-12">
                    <Mail aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-mc-action" />
                    <div>
                      <p className="font-semibold text-mc-text-primary">E-mail de acesso</p>
                      <p className="mt-mc-4 break-all text-mc-text-secondary">{user.email}</p>
                      <p className="mt-mc-4 text-mc-text-secondary">O e-mail não é alterado por esta tela.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-mc-12">
                    <Lock aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-mc-action" />
                    <div>
                      <p className="font-semibold text-mc-text-primary">Senha</p>
                      <p className="mt-mc-4 text-mc-text-secondary">Redefina pelo e-mail cadastrado, sem alterar a senha direto aqui.</p>
                      <Link href="/recuperar-senha" className="mt-mc-8 inline-flex min-h-11 items-center font-semibold text-mc-action hover:underline">
                        Recuperar senha
                      </Link>
                    </div>
                  </li>
                  <li className="flex items-start gap-mc-12">
                    <Shield aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-mc-action" />
                    <div>
                      <p className="font-semibold text-mc-text-primary">Conta criada</p>
                      <p className="mt-mc-4 text-mc-text-secondary">
                        {profile?.created_at ? dateFormatter.format(new Date(profile.created_at)) : 'Data não disponível'}
                      </p>
                    </div>
                  </li>
                </ul>
              </Card>
            </section>

            <section aria-labelledby="profile-actions-title">
              <Card className="divide-y divide-mc-border overflow-hidden">
                <div className="p-mc-16 sm:p-mc-24">
                  <h2 id="profile-actions-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Ações</h2>
                  <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">Caminhos reais da sua conta.</p>
                </div>
                <Link href="/dashboard/meus-atletas" className="flex min-h-14 items-center gap-mc-12 px-mc-16 py-mc-12 font-mc-interface text-sm font-semibold text-mc-text-primary transition-colors hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus sm:px-mc-24">
                  <UsersRound aria-hidden="true" size={18} className="text-mc-action" />
                  Ver meus atletas
                </Link>
                <Link href="/dashboard/inscricoes" className="flex min-h-14 items-center gap-mc-12 px-mc-16 py-mc-12 font-mc-interface text-sm font-semibold text-mc-text-primary transition-colors hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus sm:px-mc-24">
                  <ClipboardList aria-hidden="true" size={18} className="text-mc-action" />
                  Ver inscrições e pagamentos
                </Link>
                <Link href="/eventos" className="flex min-h-14 items-center gap-mc-12 px-mc-16 py-mc-12 font-mc-interface text-sm font-semibold text-mc-text-primary transition-colors hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus sm:px-mc-24">
                  <CalendarDays aria-hidden="true" size={18} className="text-mc-action" />
                  Ver eventos publicados
                </Link>
                {actor?.canManageEvents ? (
                  <Link href="/admin/eventos" className="flex min-h-14 items-center gap-mc-12 px-mc-16 py-mc-12 font-mc-interface text-sm font-semibold text-mc-text-primary transition-colors hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus sm:px-mc-24">
                    <UserRound aria-hidden="true" size={18} className="text-mc-action" />
                    Administrar eventos
                  </Link>
                ) : null}
              </Card>
            </section>
          </aside>
        </div>
      </PageContainer>
    </main>
  )
}
