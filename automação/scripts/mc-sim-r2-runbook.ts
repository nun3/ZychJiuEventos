import { runStage } from '../tests/support/mc-sim-r2-runbook';

async function main() {
  const stage = process.argv[2] || '';
  const result = await runStage(stage);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
