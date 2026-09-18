import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Database } from '../../../lib/supabase/database.types';

type EventStatus = Database['public']['Enums']['event_status'];

export function operationalEventFixture(status: EventStatus) {
  if (process.env.E2E_ALLOW_WRITES !== 'true') throw new Error('Fixture operacional exige E2E_ALLOW_WRITES=true no Sandbox.');
  const envPath = path.resolve(__dirname, '../../../.env.local');
  const local = Object.fromEntries((existsSync(envPath) ? readFileSync(envPath, 'utf8') : '')
    .split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
    }));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || local.NEXT_PUBLIC_SUPABASE_URL;
  if (new URL(url).hostname !== 'kfvypacjzlzwwblsbpwj.supabase.co') throw new Error('Fixture restrita ao Sandbox autorizado.');
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient<Database>(url, process.env.SUPABASE_SECRET_KEY || local.SUPABASE_SECRET_KEY, options);
  const actor = createClient<Database>(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || local.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
  const org = randomUUID();
  const eventId = randomUUID();
  const eventName = `Evento E2E operação ${eventId.slice(0, 8)}`;
  let owner = '';

  async function checked(result: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await result;
    if (error) throw new Error(`Fixture operacional: ${error.message}`);
  }

  return {
    eventId,
    eventName,
    status,
    async setup() {
      const { data, error } = await actor.auth.signInWithPassword({ email: process.env.E2E_OWNER_EMAIL || '', password: process.env.E2E_OWNER_PASSWORD || '' });
      if (error || !data.user) throw new Error('Credenciais OWNER E2E ausentes ou inválidas.');
      owner = data.user.id;
      await checked(admin.from('organizations').insert({ id: org, nome: 'Operação E2E', slug: org, created_by: owner }));
      await checked(admin.from('organization_members').insert({ organization_id: org, user_id: owner, role: 'owner' }));
      await checked(admin.from('events').insert({
        id: eventId,
        organization_id: org,
        nome: eventName,
        slug: eventId,
        data_evento: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        local: 'Sandbox E2E',
        status,
        created_by: owner,
        valor_inscricao: 80,
      }));
    },
    async cleanup() {
      await admin.from('event_audit_logs').delete().eq('event_id', eventId);
      await admin.from('events').delete().eq('id', eventId);
      await admin.from('organization_members').delete().eq('organization_id', org).eq('user_id', owner);
      await admin.from('organizations').delete().eq('id', org);
    },
  };
}

export type OperationalEventFixture = ReturnType<typeof operationalEventFixture>;
