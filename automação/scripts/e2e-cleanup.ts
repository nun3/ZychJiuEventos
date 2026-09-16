import { buildCleanupPlan, createCleanupClients, executeCleanup, resolveOwnerId, summarizePlan } from '../tests/support/e2e-cleanup';

async function main() {
  const execute = process.argv.includes('--execute');
  const { admin, actor } = await createCleanupClients();
  const ownerUserId = await resolveOwnerId(actor);
  const plan = await buildCleanupPlan(admin, ownerUserId);
  const { data: mcSim } = await admin.from('events').select('id, nome, status, organization_id').like('nome', 'MC-SIM%');
  const summary = { ...summarizePlan(plan), mcSimPreserved: mcSim || [] };
  console.log(JSON.stringify({ mode: execute ? 'execute' : 'dry-run', ownerUserId, ...summary }, null, 2));
  if (!execute) {
    console.log('Dry-run: nada foi removido. Passe --execute para aplicar.');
    return;
  }
  await executeCleanup(admin, plan);
  const after = await buildCleanupPlan(admin, ownerUserId);
  console.log(JSON.stringify({ after: summarizePlan(after) }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
