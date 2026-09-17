import {
  buildCleanupPlanFromExactIds,
  createCleanupClients,
  executeCleanup,
  summarizePlan,
} from '../tests/support/e2e-cleanup';
import identity from '../tests/support/mc-sim.identity.json';

/** Residual do Lote 2, endereçado por IDs exatos — não por nome. */
const SEED = {
  eventIds: ['647cca9f-d350-4d83-9400-fbd231399146'],
  organizationIds: ['2a503036-39f8-4a32-b36a-e5cb9b2a3806'],
  athleteIds: ['10527ffe-548f-4a11-ac23-282e443ec5c9'],
  teamIds: ['762cba1d-4012-4c98-b6e9-98b54790feaf'],
};

const OWNER_ORG = '0c7cf475-f5db-4ef0-9f41-dd8fef20c91d';

async function main() {
  const execute = process.argv.includes('--execute');
  const { admin } = await createCleanupClients();
  if (!identity.eventId) throw new Error('Identidade MC-SIM ausente. Cleanup abortado.');
  const plan = await buildCleanupPlanFromExactIds(admin, {
    ...SEED,
    protectedEventIds: [identity.eventId],
    protectedOrgIds: [OWNER_ORG],
  });
  console.log(JSON.stringify({ mode: execute ? 'execute' : 'dry-run', ...summarizePlan(plan) }, null, 2));
  if (plan.events.some((event) => event.id === identity.eventId)) {
    throw new Error('MC-SIM entrou no recorte. Cleanup abortado.');
  }
  if (plan.disposableOrgs.some((org) => org.id === OWNER_ORG)) {
    throw new Error('Org permanente entrou no recorte. Cleanup abortado.');
  }
  if (!execute) {
    console.log('Dry-run: nada foi removido. Passe --execute para aplicar.');
    return;
  }
  await executeCleanup(admin, plan);
  const leftoverEvent = await admin.from('events').select('id, nome').eq('id', SEED.eventIds[0]).maybeSingle();
  const leftoverOrg = await admin.from('organizations').select('id, nome').eq('id', SEED.organizationIds[0]).maybeSingle();
  const leftoverAthlete = await admin.from('athletes').select('id').eq('id', SEED.athleteIds[0]).maybeSingle();
  const leftoverTeam = await admin.from('teams').select('id').eq('id', SEED.teamIds[0]).maybeSingle();
  const remainingEvents = await admin.from('events').select('id, nome, organization_id');
  const remainingOrgs = await admin.from('organizations').select('id, nome');
  const remainingAthletes = await admin.from('athletes').select('id, nome_completo, organization_id');
  const remainingTeams = await admin.from('teams').select('id, nome, organization_id');
  const mcSim = await admin.from('events').select('id, nome, status').eq('id', identity.eventId).single();
  console.log(JSON.stringify({
    leftoverSeed: {
      event: leftoverEvent.data,
      org: leftoverOrg.data,
      athlete: leftoverAthlete.data,
      team: leftoverTeam.data,
    },
    remainingEvents: remainingEvents.data,
    remainingOrgs: remainingOrgs.data,
    remainingAthletes: remainingAthletes.data,
    remainingTeams: remainingTeams.data,
    mcSim: mcSim.data,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
