/**
 * Cria as contas E2E usadas pelos specs Playwright (E2E_OWNER_*, E2E_UNAUTHORIZED_*,
 * E2E_STAFF_*) no stack Supabase LOCAL — nunca em zigjiu (guarda em local-homologation-guard.ts).
 * Idempotente: reaproveita a conta se o e-mail já existir.
 */
import { createClient } from '@supabase/supabase-js';
import { assertLocalHomologationEnvironment } from '../tests/support/local-homologation-guard';

async function ensureUser(admin: any, email: string, password: string, nomeCompleto: string) {
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome_completo: nomeCompleto, synthetic: true },
  });
  if (!error && created.user) return created.user.id;
  if (error && !/already.*registered|already exists/i.test(error.message)) {
    throw new Error(`Falha ao criar ${email}: ${error.message}`);
  }
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (listError) throw new Error(`Falha ao listar usuários para localizar ${email}: ${listError.message}`);
  const existing = list.users.find((user: { email?: string }) => user.email === email);
  if (!existing) throw new Error(`Usuário ${email} deveria existir mas não foi encontrado.`);
  return existing.id;
}

async function main() {
  const env = assertLocalHomologationEnvironment(process.env);
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey, { auth: { persistSession: false } });

  const ownerEmail = process.env.E2E_OWNER_EMAIL || '';
  const ownerPassword = process.env.E2E_OWNER_PASSWORD || '';
  const unauthorizedEmail = process.env.E2E_UNAUTHORIZED_EMAIL || '';
  const unauthorizedPassword = process.env.E2E_UNAUTHORIZED_PASSWORD || '';
  const staffEmail = process.env.E2E_STAFF_EMAIL || '';
  const staffPassword = process.env.E2E_STAFF_PASSWORD || '';
  if (!ownerEmail || !ownerPassword || !unauthorizedEmail || !unauthorizedPassword || !staffEmail || !staffPassword) {
    throw new Error('Defina E2E_OWNER_*, E2E_UNAUTHORIZED_* e E2E_STAFF_* antes de rodar este script.');
  }

  const ownerId = await ensureUser(admin, ownerEmail, ownerPassword, 'E2E Owner Local');
  const unauthorizedId = await ensureUser(admin, unauthorizedEmail, unauthorizedPassword, 'E2E Unauthorized Local');
  const staffId = await ensureUser(admin, staffEmail, staffPassword, 'E2E Staff Local');
  console.log(`owner=${ownerId} unauthorized=${unauthorizedId} staff=${staffId}`);

  const orgName = 'E2E Local Organização';
  const { data: existingOrg } = await admin.from('organizations').select('id').eq('nome', orgName).maybeSingle();
  let orgId = existingOrg?.id as string | undefined;
  if (!orgId) {
    const { data: org, error: orgError } = await admin.from('organizations').insert({
      nome: orgName,
      slug: 'e2e-local-organizacao',
      created_by: ownerId,
    }).select('id').single();
    if (orgError || !org) throw new Error(`Falha ao criar organização E2E: ${orgError?.message}`);
    orgId = org.id;
  }

  for (const { userId, role } of [{ userId: ownerId, role: 'owner' as const }, { userId: staffId, role: 'staff' as const }]) {
    const { data: existingMember } = await admin
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .eq('role', role)
      .maybeSingle();
    if (!existingMember) {
      const { error: memberError } = await admin.from('organization_members').insert({ organization_id: orgId, user_id: userId, role });
      if (memberError) throw new Error(`Falha ao vincular ${role}: ${memberError.message}`);
    }
  }

  // category-version-ui.spec.ts e integration-lots.spec.ts navegam a partir de /admin/eventos e
  // esperam ao menos um evento visível para o owner — sem isso, os specs ficam sem link para
  // clicar e nunca chegam a exercitar a página real.
  const draftEventName = 'E2E Local Evento Rascunho';
  const { data: existingEvent } = await admin.from('events').select('id').eq('nome', draftEventName).maybeSingle();
  if (!existingEvent) {
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 45);
    const { error: eventError } = await admin.from('events').insert({
      organization_id: orgId,
      nome: draftEventName,
      slug: 'e2e-local-evento-rascunho',
      data_evento: eventDate.toISOString().slice(0, 10),
      local: 'Ginásio E2E local',
      valor_inscricao: 0,
      created_by: ownerId,
      // "publicado": adminEventContinuePath (lib/onboarding/event-guidance.ts) só leva a
      // /configuracao (onde este spec espera "Nova versão de categorias") para status fora de
      // rascunho/pagamento/checagem/chaves/em_andamento/concluido — "rascunho" vai para /editar.
      status: 'publicado',
    });
    if (eventError) throw new Error(`Falha ao criar evento E2E publicado: ${eventError.message}`);
  }

  console.log(`Organização E2E: ${orgId}. Contas prontas: owner (owner), staff (staff), unauthorized (sem vínculo).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
