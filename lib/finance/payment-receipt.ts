export const PAYMENT_RECEIPT_MAX_BYTES = 4 * 1024 * 1024;
export const PAYMENT_RECEIPT_BUCKET = 'payment-receipts';
export const PAYMENT_RECEIPT_SIGNED_URL_SECONDS = 120;
export const PAYMENT_RECEIPT_ACCEPT = 'image/jpeg,image/png,application/pdf';
export const REJECTION_REASON_MIN = 5;
export const REJECTION_REASON_MAX = 300;

export type PaymentReceiptStatus = 'em_analise' | 'aprovado' | 'rejeitado';
export type ReceiptMimeType = 'image/jpeg' | 'image/png' | 'application/pdf';
export type ReceiptExtension = 'jpg' | 'png' | 'pdf';

const EXTENSION_BY_MIME: Record<ReceiptMimeType, ReceiptExtension> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

const ALLOWED_NAME_EXTENSIONS: Record<ReceiptMimeType, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'application/pdf': ['pdf'],
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d];

// Comprovante bancário não precisa de conteúdo ativo; recusar reduz superfície contra quem revisa.
const PDF_ACTIVE_CONTENT = /\/(JavaScript|JS|Launch|EmbeddedFile|RichMedia|XFA|AA)(?![A-Za-z])/;

function startsWith(bytes: Uint8Array, signature: number[]) {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

/** Tipo real pelo conteúdo (magic bytes). Nome e Content-Type do navegador não são confiáveis. */
export function detectReceiptMimeType(bytes: Uint8Array): ReceiptMimeType | null {
  if (startsWith(bytes, PNG_SIGNATURE)) return 'image/png';
  if (startsWith(bytes, JPEG_SIGNATURE)) return 'image/jpeg';
  if (startsWith(bytes, PDF_SIGNATURE)) return 'application/pdf';
  return null;
}

export function pdfHasActiveContent(bytes: Uint8Array) {
  return PDF_ACTIVE_CONTENT.test(new TextDecoder('latin1').decode(bytes));
}

export type ReceiptFileCheck =
  | { ok: true; mimeType: ReceiptMimeType; extension: ReceiptExtension }
  | { ok: false; message: string };

export function validateReceiptFile(input: {
  name: string;
  declaredType: string;
  size: number;
  bytes: Uint8Array;
}): ReceiptFileCheck {
  if (!Number.isFinite(input.size) || input.size <= 0 || input.bytes.length === 0) {
    return { ok: false, message: 'Selecione o arquivo do comprovante.' };
  }
  if (input.size > PAYMENT_RECEIPT_MAX_BYTES || input.bytes.length > PAYMENT_RECEIPT_MAX_BYTES) {
    return { ok: false, message: 'O comprovante deve ter no máximo 4 MB.' };
  }
  if (input.size !== input.bytes.length) {
    return { ok: false, message: 'Arquivo inválido. Envie novamente.' };
  }

  const mimeType = detectReceiptMimeType(input.bytes);
  if (!mimeType) {
    return { ok: false, message: 'Envie uma foto (JPG ou PNG) ou um PDF do comprovante.' };
  }
  const declared = input.declaredType.toLowerCase();
  const genericDeclared = !declared || declared === 'application/octet-stream';
  if (!genericDeclared && declared !== mimeType && !(mimeType === 'image/jpeg' && declared === 'image/jpg')) {
    return { ok: false, message: 'O conteúdo do arquivo não corresponde ao formato informado.' };
  }
  const nameExtension = input.name.toLowerCase().split('.').pop() ?? '';
  if (input.name.includes('.') && !ALLOWED_NAME_EXTENSIONS[mimeType].includes(nameExtension)) {
    return { ok: false, message: 'O conteúdo do arquivo não corresponde à extensão.' };
  }
  if (mimeType === 'application/pdf' && pdfHasActiveContent(input.bytes)) {
    return { ok: false, message: 'Este PDF contém conteúdo ativo e não pode ser aceito. Envie uma foto ou o PDF original do banco.' };
  }

  return { ok: true, mimeType, extension: EXTENSION_BY_MIME[mimeType] };
}

/** Com PIX direto como modelo ativo, só evento pago depende de instruções PIX da organização. */
export function requiresDirectPixInstructions(input: { manualOnly: boolean; eventFee: number | string | null }) {
  return input.manualOnly && Number(input.eventFee ?? 0) > 0
}

export function buildReceiptStoragePath(parts: {
  organizationId: string;
  eventId: string;
  paymentId: string;
  receiptId: string;
  extension: ReceiptExtension;
}) {
  return `${parts.organizationId}/${parts.eventId}/${parts.paymentId}/${parts.receiptId}.${parts.extension}`;
}

export function normalizeRejectionReason(raw: string): { ok: true; value: string } | { ok: false; message: string } {
  const source = String(raw ?? '');
  const value = source.trim().replace(/\s+/g, ' ');
  if (value.length < REJECTION_REASON_MIN || value.length > REJECTION_REASON_MAX) {
    return {
      ok: false,
      message: `Informe o motivo com ${REJECTION_REASON_MIN} a ${REJECTION_REASON_MAX} caracteres.`,
    };
  }
  return { ok: true, value };
}

export const PAYMENT_RECEIPT_STATUS_LABELS: Record<PaymentReceiptStatus, string> = {
  em_analise: 'Comprovante em análise',
  aprovado: 'Comprovante aprovado',
  rejeitado: 'Comprovante rejeitado',
};

export type PayerPaymentStage =
  | 'aguardando_pagamento'
  | 'em_analise'
  | 'rejeitado'
  | 'aprovado'
  | 'encerrado';

/** Etapa exibida ao pagador a partir do pagamento e do comprovante mais recente. */
export function resolvePayerPaymentStage(
  paymentStatus: string,
  latestReceiptStatus: PaymentReceiptStatus | null,
): PayerPaymentStage {
  if (paymentStatus === 'pago') return 'aprovado';
  if (paymentStatus !== 'aguardando') return 'encerrado';
  if (latestReceiptStatus === 'em_analise') return 'em_analise';
  if (latestReceiptStatus === 'rejeitado') return 'rejeitado';
  return 'aguardando_pagamento';
}

export const PAYER_PAYMENT_STAGE_LABELS: Record<PayerPaymentStage, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  em_analise: 'Comprovante em análise',
  rejeitado: 'Comprovante rejeitado',
  aprovado: 'Pagamento aprovado',
  encerrado: 'Pagamento encerrado',
};

export function canSubmitReceipt(stage: PayerPaymentStage) {
  return stage === 'aguardando_pagamento' || stage === 'rejeitado';
}
