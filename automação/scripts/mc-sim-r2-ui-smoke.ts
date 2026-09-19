import { chromium, type BrowserContext } from '@playwright/test';
import { createCleanupClients, loadCleanupEnv, resolveOwnerId, SANDBOX_HOST } from '../tests/support/e2e-cleanup';
import { requireE2eWrites } from '../tests/support/e2e-writes';
import { loadMcSimR2Identity } from '../tests/support/mc-sim-r2';

async function applyOwnerSession(context: BrowserContext, baseURL: string) {
  const { actor } = await createCleanupClients();
  await resolveOwnerId(actor);
  const { data: { session } } = await actor.auth.getSession();
  if (!session) throw new Error('Sessão owner ausente.');
  const projectRef = SANDBOX_HOST.split('.')[0];
  await context.addCookies([{
    name: `sb-${projectRef}-auth-token`,
    value: JSON.stringify(session),
    url: baseURL,
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  }]);
}

async function main() {
  loadCleanupEnv();
  requireE2eWrites('MC-SIM r2 UI smoke');
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  const identity = loadMcSimR2Identity();
  if (!identity.approvedRequestId || !identity.checagemLockedAt) {
    throw new Error('UI smoke r2 exige aprovação e travamento. Rode o runbook até lock.');
  }
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL });
  const clicked: string[] = [];
  const blocked: string[] = [];
  try {
    await applyOwnerSession(context, baseURL);
    const page = await context.newPage();
    await page.goto('/admin/eventos');
    if (/\/(login|admin\/autenticacao)/.test(page.url())) {
      blocked.push('sessao-cookie-nao-reconhecida');
      console.log(JSON.stringify({ ok: false, url: page.url(), clicked, blocked }, null, 2));
      return;
    }
    await page.goto(`/admin/eventos/${identity.eventId}/checagem`);
    await page.getByRole('heading', { name: `Checagem — ${identity.eventName}` }).waitFor();
    clicked.push('abrir-pagina-checagem');
    await page.getByText('3 de 3 inscrições efetivadas').waitFor();
    await page.getByText('MC-SIM r2 Atleta A').first().waitFor();
    await page.getByText('MC-SIM r2 Atleta B').first().waitFor();
    await page.getByText('MC-SIM r2 Atleta C').first().waitFor();
    await page.getByText('Original: MC-SIM r2 Adulto Leve').first().waitFor();
    await page.getByText('Checagem travada').first().waitFor();
    await page.getByLabel('Filtrar por categoria').selectOption('MC-SIM r2 Adulto Médio');
    await page.getByText('MC-SIM r2 Atleta A').first().waitFor();
    await page.getByText('MC-SIM r2 Atleta B').first().waitFor();
    await page.getByText('MC-SIM r2 Atleta C').first().waitFor();
    clicked.push('filtros-medio-com-tres');

    await page.goto('/dashboard/inscricoes');
    const requestVisible = await page.getByText('Solicitar mudança de categoria').count();
    clicked.push('abrir-inscricoes-dashboard');

    await page.goto(`/admin/eventos/${identity.eventId}/checagem`);
    if (await page.getByRole('button', { name: 'Travar checagem' }).count()) {
      blocked.push('botao-travar-ainda-visivel');
    }

    console.log(JSON.stringify({
      ok: blocked.length === 0,
      url: page.url(),
      clicked,
      requestFormVisible: requestVisible > 0,
      blocked,
    }, null, 2));
    if (blocked.length) process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
