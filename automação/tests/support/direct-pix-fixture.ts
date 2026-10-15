import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../lib/supabase/database.types';

// Chave aleatória fictícia exclusiva de E2E: nunca é usada para receber dinheiro.
export const E2E_PIX_KEY = '00000000-0000-4000-8000-0000000e2e00';
export const E2E_PIX_RECIPIENT = 'MEU CAMP E2E - NAO PAGAR';

/**
 * Garante PIX direto na organização para reservas E2E no modo PAYMENTS_MANUAL_ONLY.
 * Se já existir configuração real, ela é preservada. A limpeza remove somente a chave E2E criada aqui.
 */
export async function ensureDirectPixForE2E(admin: SupabaseClient<Database>, organizationId: string) {
  const existing = await admin
    .from('organization_pix_settings')
    .select('organization_id')
    .eq('organization_id', organizationId)
    .maybeSingle();
  if (existing.error) throw new Error(`PIX E2E: ${existing.error.message}`);
  if (existing.data) return async () => undefined;

  const inserted = await admin.from('organization_pix_settings').insert({
    organization_id: organizationId,
    pix_key_type: 'aleatoria',
    pix_key: E2E_PIX_KEY,
    recipient_name: E2E_PIX_RECIPIENT,
  });
  if (inserted.error) throw new Error(`PIX E2E: ${inserted.error.message}`);

  return async () => {
    const removed = await admin
      .from('organization_pix_settings')
      .delete()
      .eq('organization_id', organizationId)
      .eq('pix_key', E2E_PIX_KEY);
    if (removed.error) throw new Error(`Limpeza PIX E2E: ${removed.error.message}`);
  };
}
