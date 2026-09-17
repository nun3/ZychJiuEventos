import { createCleanupClients } from '../tests/support/e2e-cleanup';
import { loadMcSimIdentity } from '../tests/support/mc-sim';

async function main() {
  const { admin } = await createCleanupClients();
  const identity = loadMcSimIdentity();
  const events = await admin.from('events').select('id, nome, status, organization_id, valor_inscricao, checagem_travada_em');
  const orgs = await admin.from('organizations').select('id, nome');
  const athletes = await admin.from('athletes').select('id, nome_completo, organization_id, team_id, data_nascimento, genero, faixa, peso_kg');
  const teams = await admin.from('teams').select('id, nome, organization_id');
  const regs = await admin.from('registrations').select('id, event_id, status, athlete_id, category_id, current_category_id, athlete_snapshot').eq('event_id', identity.eventId);
  const requests = await admin.from('category_change_requests').select('id, status, current_category_id, requested_category_id, registration_id').in('registration_id', identity.registrationIds || []);
  const payment = identity.paymentId
    ? await admin.from('payments').select('id, status, valor_total, metodo, gateway').eq('id', identity.paymentId).single()
    : { data: null, error: null };
  const lockAudit = await admin.from('event_audit_logs').select('action, created_at').eq('event_id', identity.eventId).eq('action', 'checagem_locked');
  console.log(JSON.stringify({
    events: events.data,
    orgs: orgs.data,
    athletes: athletes.data,
    teams: teams.data,
    registrations: regs.data,
    requests: requests.data,
    payment: payment.data,
    lockAudit: lockAudit.data,
    athleteCount: athletes.data?.length,
    teamCount: teams.data?.length,
    efetivadas: regs.data?.filter((row) => row.status === 'efetivada').length,
    lockedAt: events.data?.[0]?.checagem_travada_em || null,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
