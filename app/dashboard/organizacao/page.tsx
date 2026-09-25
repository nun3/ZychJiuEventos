import { redirect } from 'next/navigation'
import AddMemberForm from './AddMemberForm'
import RemoveMemberButton from './RemoveMemberButton'
import { OrganizationMembersList } from '@/components/organizations/OrganizationMembersList'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getOwnedOrganizationContext } from '@/lib/auth/organization-context-server'
import { createClient } from '@/lib/supabase/server'
import { organizationRoleLabel } from '@/lib/organizations/membership'

export default async function OrganizationMembersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard/organizacao')

  const owned = await getOwnedOrganizationContext()
  if (owned.status !== 'resolved') redirect('/dashboard?erro=sem_permissao')

  const { data: members, error } = await supabase.rpc('list_organization_members', {
    target_organization_id: owned.context.organizationId,
  })
  if (error) redirect('/dashboard?erro=sem_permissao')

  return (
    <main className="py-mc-32 sm:py-mc-48">
      <PageContainer>
        <PageHeader
          title="Organização"
          description="Administre os membros da sua organização. Somente contas já cadastradas. Sem convite por e-mail."
        />

        <Card className="mt-mc-24 p-mc-16 sm:p-mc-24">
          <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.16em] text-mc-text-secondary">Organização atual</p>
          <div className="mt-mc-8 flex flex-wrap items-center gap-mc-8">
            <h2 className="font-mc-display text-mc-h3 text-mc-text-primary">{owned.context.organizationName}</h2>
            <StatusBadge variant="info">{organizationRoleLabel(owned.context.role)}</StatusBadge>
          </div>
        </Card>

        <Card className="mt-mc-24 p-mc-16 sm:p-mc-24">
          <h2 className="font-mc-display text-mc-h3 text-mc-text-primary">Adicionar membro</h2>
          <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">
            Informe o e-mail e o papel. Organizador opera eventos. Financeiro acessa o que as regras atuais já permitem.
          </p>
          <div className="mt-mc-16">
            <AddMemberForm />
          </div>
        </Card>

        <Card className="mt-mc-24 overflow-hidden">
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
              renderActions={(member) => <RemoveMemberButton userId={member.userId} name={member.name} />}
            />
          </div>
        </Card>
      </PageContainer>
    </main>
  )
}
