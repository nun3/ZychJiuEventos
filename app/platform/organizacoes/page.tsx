import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { requirePlatformAdmin } from '@/lib/auth/platform-admin-server'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import CreateOrganizationForm from './CreateOrganizationForm'

export default async function PlatformOrganizationsPage() {
  const access = await requirePlatformAdmin()
  if (access.status === 'unauthenticated') redirect('/login?redirectTo=/platform/organizacoes')
  if (access.status === 'forbidden') redirect('/dashboard?erro=sem_permissao')

  const { data: organizations } = await access.supabase
    .from('organizations')
    .select('id, nome, slug, ativo, created_at')
    .order('created_at', { ascending: false })

  const rows = organizations || []

  return (
    <main className="py-mc-32 sm:py-mc-48">
      <PageContainer>
        <PageHeader
          title="Organizações"
          description="Crie o tenant e associe um proprietário já cadastrado. Sem onboarding público e sem convite por e-mail."
        />

        <div className="mt-mc-32 grid gap-mc-24 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card className="p-mc-16 sm:p-mc-24">
            <h2 className="font-mc-display text-mc-h3 text-mc-text-primary">Nova organização</h2>
            <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">
              O proprietário precisa existir. Se o e-mail não tiver conta, a criação falha fechada.
            </p>
            <div className="mt-mc-16">
              <CreateOrganizationForm />
            </div>
          </Card>

          <section aria-labelledby="org-list-title">
            <h2 id="org-list-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Organizações existentes</h2>
            {!rows.length ? (
              <EmptyState
                icon={<Building2 size={34} />}
                title="Nenhuma organização"
                description="Crie a primeira organização e associe o proprietário."
                className="mt-mc-16 rounded-mc-medium border border-mc-border bg-mc-surface"
              />
            ) : (
              <Card className="mt-mc-16 divide-y divide-mc-border overflow-hidden">
                {rows.map((organization) => (
                  <Link
                    key={organization.id}
                    href={`/platform/organizacoes/${organization.id}`}
                    className="block px-mc-16 py-mc-16 transition-colors hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus sm:px-mc-24"
                  >
                    <strong className="block font-mc-interface font-semibold text-mc-text-primary">{organization.nome}</strong>
                    <span className="mt-mc-4 block font-mc-interface text-sm text-mc-text-secondary">
                      {organization.slug} · {organization.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </Link>
                ))}
              </Card>
            )}
          </section>
        </div>
      </PageContainer>
    </main>
  )
}
