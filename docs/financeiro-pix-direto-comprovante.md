# Financeiro — PIX direto ao organizador com comprovante

Fonte de verdade do Lote 3 do financeiro. Vale enquanto `PAYMENTS_MANUAL_ONLY=true`.

## Modelo

- O atleta paga por PIX direto na conta da organização. O dinheiro não passa pelo MEU CAMP: sem Asaas, BaaS, split ou payout.
- O atleta envia o comprovante; owner/organizer da organização (ou platform admin) aprova ou rejeita.
- Aprovar reutiliza `settle_payment_manually`: o pagamento vira `pago` e as inscrições `efetivada` pela mesma regra auditada da baixa manual.
- Rejeitar exige motivo (5–300 caracteres, sem caracteres de controle). O pagamento segue `aguardando` e o atleta pode reenviar. O histórico é preservado (máximo 10 comprovantes por pagamento; um único em análise por vez).
- Evento gratuito não muda. Evento pago só aceita reserva quando o modo manual está ligado, o método é PIX e a organização tem PIX configurado (`requiresDirectPixInstructions` + `event_direct_pix_configured`).
- Com comprovante em análise, a baixa manual direta fica bloqueada no financeiro: a decisão passa pela revisão do comprovante.

## Dados

| Tabela | Conteúdo | Leitura (RLS) |
| --- | --- | --- |
| `organization_pix_settings` | chave PIX vigente da organização (tipo, chave normalizada, favorecido) | owner, organizer, finance |
| `payment_pix_instructions` | snapshot da chave no momento da reserva | pagador e staff financeiro da organização |
| `payment_receipts` | comprovantes, status `em_analise`/`aprovado`/`rejeitado`, revisor e motivo | pagador e staff financeiro da organização |

- Nenhuma escrita direta pelo cliente: tabelas só com `SELECT`; mutações apenas por RPCs `SECURITY DEFINER` com `search_path = ''` e grants explícitos (sem `anon`).
- Trocar a chave PIX não altera reservas existentes (snapshot).
- Configurar a chave é exclusivo do owner. A auditoria (`organization_pix_settings_updated`) guarda só os 4 últimos caracteres da chave.
- Auditoria em `event_audit_logs`: `payment_receipt_submitted`, `payment_receipt_rejected`, `payment_receipt_approved` e `payment_manually_settled`.

## Arquivos

- Bucket privado `payment-receipts`: 4 MB, `image/jpeg`, `image/png`, `application/pdf`. Caminho `org/evento/pagamento/comprovante.ext`, derivado no banco.
- Única policy em `storage.objects`: leitura de objeto referenciado por comprovante visível ao usuário. Não há policy de escrita.
- Upload pelo servidor (`receipt-actions.ts`): checagens com a sessão do usuário, validação de magic bytes + MIME + extensão, análise profunda de PDF (descompacta streams Flate com teto de 16 MB, decodifica nomes `#hex`, recusa JavaScript, ações automáticas, arquivos embutidos e PDF criptografado). Só então grava com credencial privada (`upsert: false`) e registra pela RPC, que confere tamanho e tipo nos metadados do Storage. Se a RPC falhar, o objeto é removido.
- Visualização: `/dashboard/pagamentos/comprovantes/[id]` gera URL assinada de 120 s com a sessão do usuário (a policy decide) e responde 303 com `no-store` e `no-referrer`. A URL nunca é persistida.
- Fotos acima de 4 MB são reduzidas no navegador; o servidor valida o resultado de novo.

## Decisões e limites

- Limite de 4 MB (não 10 MB): a Vercel corta corpos acima de 4,5 MB; `serverActions.bodySizeLimit` está em `5mb`.
- O banco não exige PIX configurado na reserva: o modo manual é configuração da aplicação, então o gate fica na server action. Checksum de CPF/CNPJ é validado na aplicação; o banco valida formato.
- No modo manual o checkout esconde Boleto. Cenários BDD de Boleto/Asaas só fazem sentido com o modo manual desligado.
- Não há infraestrutura de notificação: atleta e organizador acompanham o status nas telas.
- Se o servidor cair entre o upload e a RPC, pode sobrar objeto órfão no bucket. Ele continua privado e ilegível, pois a policy exige um comprovante registrado.

## Validação

- Unit: `automação/tests/pix-direct-receipt.test.ts`.
- SQL (rollback): `supabase/tests/payment_receipts_smoke.sql`, casos 1–3 e 5–19 da especificação.
- E2E + visual: `automação/scripts/pix-receipt-smoke.ts` (servidor local + Sandbox). Evidências em `docs/design-system/evidencias/pix-direto/`.
- Fixtures E2E usam a chave fictícia `00000000-0000-4000-8000-0000000e2e00` (favorecido "MEU CAMP E2E - NAO PAGAR") e preservam configuração real existente.
