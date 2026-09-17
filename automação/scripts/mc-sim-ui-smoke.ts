import { chromium, type BrowserContext } from '@playwright/test';
import { createCleanupClients, loadCleanupEnv, resolveOwnerId, SANDBOX_HOST } from '../tests/support/e2e-cleanup';
import { loadMcSimIdentity } from '../tests/support/mc-sim';

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
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  const identity = loadMcSimIdentity();
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
    const openChecagem = page.getByRole('button', { name: 'Abrir checagem' });
    if (await openChecagem.count()) {
      await openChecagem.click();
      clicked.push('abrir-checagem');
    }
    await page.goto(`/admin/eventos/${identity.eventId}/checagem`);
    await page.getByRole('heading', { name: `Checagem — ${identity.eventName}` }).waitFor();
    clicked.push('abrir-pagina-checagem');
    await page.getByText('4 de 4 inscrições efetivadas').waitFor();
    await page.getByText('MC-SIM Atleta 1').first().waitFor();
    await page.getByText('MC-SIM Atleta 2').first().waitFor();
    await page.getByText('MC-SIM Atleta 3').first().waitFor();
    await page.getByText('MC-SIM Atleta 4').first().waitFor();
    await page.getByText('Atleta sozinho').first().waitFor();
    await page.getByLabel('Filtrar por categoria').selectOption('MC-SIM Adulto Médio');
    await page.getByText('MC-SIM Atleta 4').first().waitFor();
    await page.getByLabel('Filtrar por categoria').selectOption('all');
    await page.getByLabel('Filtrar por equipe').selectOption('MC-SIM Equipe Beta');
    await page.getByText('MC-SIM Atleta 3').first().waitFor();
    clicked.push('filtros-checagem');

    await page.goto('/dashboard/inscricoes');
    const requestForm = page.getByText('Solicitar mudança de categoria');
    const requestVisible = await requestForm.count();
    clicked.push('abrir-inscricoes-dashboard');

    await page.goto(`/admin/eventos/${identity.eventId}/checagem`);
    const lockButton = page.getByRole('button', { name: 'Travar checagem' });
    if (await lockButton.count()) {
      await page.getByRole('checkbox', { name: /Confirmo que a lista oficial/ }).check();
      await lockButton.click();
      await page.getByText(/Checagem travada/).first().waitFor();
      clicked.push('travar-checagem');
    } else {
      blocked.push('botao-travar-ausente');
    }

    console.log(JSON.stringify({
      ok: true,
      url: page.url(),
      clicked,
      requestFormVisible: requestVisible > 0,
      blocked,
    }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
