import { createCleanupClients } from '../tests/support/e2e-cleanup';
import { loadMcSimIdentity } from '../tests/support/mc-sim';
import { loadMcSimR2Identity } from '../tests/support/mc-sim-r2';

async function main() {
  const { admin } = await createCleanupClients();
  const r1 = loadMcSimIdentity();
  const r2 = loadMcSimR2Identity();
  if (r1.eventId === r2.eventId) throw new Error('r2 colidiu com r1.');

  const r1Event = await admin.from('events').select('id, nome, status, checagem_travada_em').eq('id', r1.eventId).single();
  const r2Event = await admin.from('events').select('id, nome, status, checagem_travada_em, organization_id').eq('id', r2.eventId).single();
  const regs = await admin.from('registrations').select('id, status, athlete_id, category_id, current_category_id, athlete_snapshot, category_snapshot').eq('event_id', r2.eventId);
  const athleteA = (regs.data || []).find((row) => row.id === r2.registrationIds.a);
  const requests = await admin.from('category_change_requests').select('id, status, current_category_id, requested_category_id, registration_id').eq('registration_id', r2.registrationIds.a);
  const payment = r2.paymentId
    ? await admin.from('payments').select('id, status, valor_total, metodo').eq('id', r2.paymentId).single()
    : { data: null, error: null };
  const lockAudit = await admin.from('event_audit_logs').select('action, created_at').eq('event_id', r2.eventId).eq('action', 'checagem_locked');

  const athleteSnapshot = athleteA?.athlete_snapshot && typeof athleteA.athlete_snapshot === 'object' && !Array.isArray(athleteA.athlete_snapshot)
    ? athleteA.athlete_snapshot as Record<string, unknown>
    : {};

  const checks = {
    r1StillLocked: Boolean(r1Event.data?.checagem_travada_em),
    r1UntouchedEvent: r1Event.data?.id === r1.eventId,
    r2Distinct: r2.eventId !== r1.eventId,
    aOnMedioOverride: athleteA?.current_category_id === r2.categoryIds.medio,
    aOriginalLeve: athleteA?.category_id === r2.categoryIds.leve,
    snapshotWeight70: Number(athleteSnapshot.peso_kg) === 70,
    snapshotNameA: athleteSnapshot.nome_completo === 'MC-SIM r2 Atleta A',
    rejectedExists: (requests.data || []).some((row) => row.id === r2.rejectedRequestId && row.status === 'recusada'),
    approvedExists: (requests.data || []).some((row) => row.id === r2.approvedRequestId && row.status === 'aprovada'),
    locked: Boolean(r2Event.data?.checagem_travada_em),
    efetivadas: (regs.data || []).filter((row) => row.status === 'efetivada').length === 3,
  };
  const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
  if (failed.length) {
    throw new Error(`MC-SIM r2 verify falhou: ${failed.join(', ')}`);
  }
  console.log(JSON.stringify({
    ok: true,
    checks,
    r1: r1Event.data,
    r2: r2Event.data,
    athleteA,
    requests: requests.data,
    payment: payment.data,
    lockAudit: lockAudit.data,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
