import { redirect } from 'next/navigation'
import AddMemberForm from './AddMemberForm'
import PixSettingsForm from './PixSettingsForm'
import RemoveMemberButton from './RemoveMemberButton'
import { DashboardPageHero } from '@/components/dashboard/DashboardPageHero'
import { PanelColumns } from '@/components/dashboard/PanelColumns'
import { Alert } from '@/components/ui/Alert'
import { PIX_KEY_TYPE_LABELS, formatPixKey } from '@/lib/finance/pix-key'
import { OrganizationMembersList } from '@/components/organizations/OrganizationMembersList'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/ui/PageContainer'
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

  const { data: pixSettings } = await supabase
    .from('organization_pix_settings')
    .select('pix_key_type, pix_key, recipient_name, updated_at')
    .eq('organization_id', owned.context.organizationId)
    .maybeSingle()

  return (
    <main className="py-5 sm:py-7">
      <PageContainer fluid className="space-y-5">
        <DashboardPageHero
          title="Organização"
          description="Administre os membros da sua organização. Somente contas já cadastradas. Sem convite por e-mail."
        />

        <PanelColumns
          asideFirstOnMobile
          main={(
            <>
              <Card className="p-mc-16 shadow-mc-subtle sm:p-mc-24" aria-labelledby="pix-settings-title">
                <div className="flex flex-wrap items-center justify-between gap-mc-8">
                  <h2 id="pix-settings-title" className="font-mc-display text-mc-h3 text-mc-text-primary">PIX de recebimento</h2>
                  <StatusBadge variant={pixSettings ? 'success' : 'warning'}>
                    {pixSettings ? 'Configurado' : 'Não configurado'}
                  </StatusBadge>
                </div>
                <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">
                  O atleta paga direto para a organização e envia o comprovante. O MEU CAMP não recebe nem repassa o valor: a inscrição é confirmada quando a organização aprova o comprovante.
                </p>
                {pixSettings ? (
                  <dl className="mt-mc-16 grid gap-mc-12 rounded-mc-medium bg-mc-surface-secondary p-mc-16 font-mc-interface text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-mc-text-secondary">Tipo</dt>
                      <dd className="mt-mc-4 font-semibold text-mc-text-primary">{PIX_KEY_TYPE_LABELS[pixSettings.pix_key_type]}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-mc-text-secondary">Chave</dt>
                      <dd className="mt-mc-4 break-all font-semibold text-mc-text-primary">{formatPixKey(pixSettings.pix_key_type, pixSettings.pix_key)}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-mc-text-secondary">Favorecido</dt>
                      <dd className="mt-mc-4 break-words font-semibold text-mc-text-primary">{pixSettings.recipient_name}</dd>
                    </div>
                  </dl>
                ) : (
                  <Alert variant="warning" className="mt-mc-16" title="Eventos pagos precisam de PIX">
                    Sem esta configuração, atletas não conseguem reservar pagamento nos eventos pagos da organização. Eventos gratuitos não são afetados.
                  </Alert>
                )}
                <p className="mt-mc-16 font-mc-interface text-xs text-mc-text-secondary">
                  Reservas já criadas mantêm a chave exibida no momento da reserva.
                </p>
                <div className="mt-mc-16">
                  <PixSettingsForm
                    initial={pixSettings ? {
                      pixKeyType: pixSettings.pix_key_type,
                      pixKey: pixSettings.pix_key,
                      recipientName: pixSettings.recipient_name,
                    } : null}
                  />
                </div>
              </Card>

              <Card className="p-mc-16 shadow-mc-subtle sm:p-mc-24">
                <h2 className="font-mc-display text-mc-h3 text-mc-text-primary">Adicionar membro</h2>
                <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">
                  Informe o e-mail e o papel. Organizador opera eventos. Financeiro acessa o que as regras atuais já permitem.
                </p>
                <div className="mt-mc-16">
                  <AddMemberForm />
                </div>
              </Card>
            </>
          )}
          aside={(
            <>
              <Card className="p-mc-16 shadow-mc-subtle sm:p-mc-24">
                <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.16em] text-mc-text-secondary">Organização atual</p>
                <div className="mt-mc-8 flex flex-wrap items-center gap-mc-8">
                  <h2 className="font-mc-display text-mc-h3 text-mc-text-primary">{owned.context.organizationName}</h2>
                  <StatusBadge variant="info">{organizationRoleLabel(owned.context.role)}</StatusBadge>
                </div>
              </Card>

              <Card className="overflow-hidden shadow-mc-subtle">
                <div className="border-b border-mc-border px-mc-16 py-mc-16 sm:px-mc-24">
                  <h2 className="font-mc-display text-mc-h3 text-mc-text-primary">Membros</h2>
                </div>
                <div className="p-mc-16 sm:p-mc-24">
                  <OrganizationMembersList
                    layout="stacked"
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
            </>
          )}
        />
      </PageContainer>
    </main>
  )
}
