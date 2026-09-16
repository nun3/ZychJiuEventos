import { createCleanupClients, resolveOwnerId, SANDBOX_HOST } from '../tests/support/e2e-cleanup';

async function main() {
  const { admin, actor } = await createCleanupClients();
  const ownerUserId = await resolveOwnerId(actor);
  const org = await admin.from('organizations').select('id, nome').eq('id', '0c7cf475-f5db-4ef0-9f41-dd8fef20c91d').single();
  const leftoverEvents = await admin.from('events').select('id, nome');
  const leftoverAthletes = await admin.from('athletes').select('id, nome_completo').like('nome_completo', 'Atleta E2E %');
  const leftoverTeams = await admin.from('teams').select('id, nome').like('nome', 'E2E Equipe %');
  const checkoutOrg = await admin.from('organizations').select('id, nome').in('nome', ['Checkout E2E', 'Checagem E2E']);
  const roles = await admin.from('platform_user_roles').select('user_id, role').eq('user_id', ownerUserId);
  const member = await admin.from('organization_members').select('organization_id, role').eq('user_id', ownerUserId);
  const buckets = await admin.storage.listBuckets();
  const remainingOrgs = await admin.from('organizations').select('id, nome');
  const athletes = await admin.from('athletes').select('id', { count: 'exact', head: true });
  const teams = await admin.from('teams').select('id', { count: 'exact', head: true });
  const regs = await admin.from('registrations').select('id', { count: 'exact', head: true });
  const e2eNamed = (leftoverEvents.data || []).filter((event) =>
    event.nome.startsWith('Evento E2E ') || event.nome.startsWith('Checkout E2E') || event.nome.startsWith('Checagem E2E') || event.nome.startsWith('MC-SIM'));
  console.log(JSON.stringify({
    host: SANDBOX_HOST,
    ownerUserId,
    ownerOrg: org.data,
    leftoverNamedEvents: e2eNamed,
    leftoverAthletes: leftoverAthletes.data?.length || 0,
    leftoverTeams: leftoverTeams.data?.length || 0,
    leftoverTechOrgs: checkoutOrg.data,
    platformRoles: roles.data,
    memberships: member.data,
    buckets: (buckets.data || []).map((bucket) => ({ id: bucket.id, name: bucket.name, public: bucket.public })),
    remainingEvents: leftoverEvents.data,
    remainingOrgs: remainingOrgs.data,
    remainingAthletes: athletes.count,
    remainingTeams: teams.count,
    remainingRegs: regs.count,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
