import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { OrganizationMembersList } from '@/components/organizations/OrganizationMembersList'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { requirePlatformAdmin } from '@/lib/auth/platform-admin-server'

export default async function PlatformOrganizationDetailPage({ params }: { params: { id: string } }) {
  const access = await requirePlatformAdmin()
  if (access.status === 'unauthenticated') redirect(`/login?redirectTo=/platform/organizacoes/${params.id}`)
  if (access.status === 'forbidden') redirect('/dashboard?erro=sem_permissao')

  const [{ data: organization }, { data: members, error }] = await Promise.all([
    access.supabase.from('organizations').select('id, nome, slug, ativo').eq('id', params.id).maybeSingle(),
    access.supabase.rpc('list_organization_members', { target_organization_id: params.id }),
  ])
  if (!organization) notFound()
  if (error) redirect('/dashboard?erro=sem_permissao')

  return (
    <main className="py-mc-32 sm:py-mc-48">
      <PageContainer>
        <PageHeader
          title={organization.nome}
          description={`${organization.slug} · ${organization.ativo ? 'Ativa' : 'Inativa'}. Somente visualização de membros nesta console.`}
          breadcrumb={<Link href="/platform/organizacoes" className="font-semibold text-mc-action hover:underline">Voltar para organizações</Link>}
        />

        <Card className="mt-mc-32 overflow-hidden">
          <div className="border-b border-mc-border px-mc-16 py-mc-16 sm:px-mc-24">
            <h2 className="font-mc-display text-mc-h3 text-mc-text-primary">Membros</h2>
          </div>
          <div className="p-mc-16 sm:p-mc-24">
            <OrganizationMembersList
              members={(members || []).map((member) => ({
                userId: member.user_id,
                name: member.nome_completo,
                email: member.email,
                role: member.role,
              }))}
            />
          </div>
        </Card>
      </PageContainer>
    </main>
  )
}
