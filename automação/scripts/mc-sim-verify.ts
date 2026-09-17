import { createCleanupClients } from '../tests/support/e2e-cleanup';
import { loadMcSimIdentity } from '../tests/support/mc-sim';

async function main() {
  const { admin } = await createCleanupClients();
  const identity = loadMcSimIdentity();
  const events = await admin.from('events').select('id, nome, status, organization_id, valor_inscricao');
  const orgs = await admin.from('organizations').select('id, nome');
  const athletes = await admin.from('athletes').select('id, nome_completo, organization_id, team_id, data_nascimento, genero, faixa, peso_kg');
  const teams = await admin.from('teams').select('id, nome, organization_id');
  const regs = await admin.from('registrations').select('id, event_id, status, athlete_id, category_id').eq('event_id', identity.eventId);
  const payment = identity.paymentId
    ? await admin.from('payments').select('id, status, valor_total, metodo, gateway').eq('id', identity.paymentId).single()
    : { data: null, error: null };
  const audit = identity.paymentId
    ? await admin.from('event_audit_logs').select('action, reason').eq('resource_id', identity.paymentId)
    : { data: null, error: null };
  const smokeEvent = await admin.from('events').select('id').eq('id', '647cca9f-d350-4d83-9400-fbd231399146').maybeSingle();
  const smokeOrg = await admin.from('organizations').select('id').eq('id', '2a503036-39f8-4a32-b36a-e5cb9b2a3806').maybeSingle();
  console.log(JSON.stringify({
    events: events.data,
    orgs: orgs.data,
    athletes: athletes.data,
    teams: teams.data,
    registrations: regs.data,
    payment: payment.data,
    audit: audit.data,
    smokeGone: { event: smokeEvent.data, org: smokeOrg.data },
    athleteCount: athletes.data?.length,
    teamCount: teams.data?.length,
    efetivadas: regs.data?.filter((row) => row.status === 'efetivada').length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
