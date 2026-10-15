export const PIX_KEY_TYPES = ['cpf', 'cnpj', 'email', 'telefone', 'aleatoria'] as const;

export type PixKeyType = (typeof PIX_KEY_TYPES)[number];

export const PIX_KEY_TYPE_LABELS: Record<PixKeyType, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  telefone: 'Celular',
  aleatoria: 'Chave aleatória',
};

export const RECIPIENT_NAME_MIN = 3;
export const RECIPIENT_NAME_MAX = 120;

export type PixKeyResult = { ok: true; value: string } | { ok: false; message: string };

const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/;
const PHONE_PATTERN = /^\+55[1-9][1-9]9\d{8}$/;
const RANDOM_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

export function isPixKeyType(value: unknown): value is PixKeyType {
  return typeof value === 'string' && (PIX_KEY_TYPES as readonly string[]).includes(value);
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function allSameDigit(value: string) {
  return /^(\d)\1*$/.test(value);
}

export function isValidCpf(value: string) {
  if (!/^\d{11}$/.test(value) || allSameDigit(value)) return false;
  const digits = value.split('').map(Number);
  for (const length of [9, 10]) {
    let sum = 0;
    for (let index = 0; index < length; index += 1) sum += digits[index] * (length + 1 - index);
    const check = ((sum * 10) % 11) % 10;
    if (check !== digits[length]) return false;
  }
  return true;
}

export function isValidCnpj(value: string) {
  if (!/^\d{14}$/.test(value) || allSameDigit(value)) return false;
  const digits = value.split('').map(Number);
  const weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (const length of [12, 13]) {
    const offset = 13 - length;
    let sum = 0;
    for (let index = 0; index < length; index += 1) sum += digits[index] * weights[index + offset];
    const remainder = sum % 11;
    const check = remainder < 2 ? 0 : 11 - remainder;
    if (check !== digits[length]) return false;
  }
  return true;
}

/** Mesma normalização de set_organization_pix_settings, com checksum de CPF/CNPJ. */
export function normalizePixKey(type: PixKeyType, raw: string): PixKeyResult {
  const input = String(raw ?? '').trim();
  if (!input) return { ok: false, message: 'Informe a chave PIX.' };
  if (input.length > 120) return { ok: false, message: 'Chave PIX longa demais.' };

  switch (type) {
    case 'cpf': {
      const value = onlyDigits(input);
      return isValidCpf(value) ? { ok: true, value } : { ok: false, message: 'CPF inválido.' };
    }
    case 'cnpj': {
      const value = onlyDigits(input);
      return isValidCnpj(value) ? { ok: true, value } : { ok: false, message: 'CNPJ inválido.' };
    }
    case 'email': {
      const value = input.toLowerCase();
      return value.length <= 77 && EMAIL_PATTERN.test(value)
        ? { ok: true, value }
        : { ok: false, message: 'E-mail inválido.' };
    }
    case 'telefone': {
      const digits = onlyDigits(input);
      const value =
        digits.length === 11 ? `+55${digits}` : digits.length === 13 && digits.startsWith('55') ? `+${digits}` : digits;
      return PHONE_PATTERN.test(value)
        ? { ok: true, value }
        : { ok: false, message: 'Informe um celular com DDD, por exemplo (41) 99999-0000.' };
    }
    case 'aleatoria': {
      const value = input.toLowerCase();
      return RANDOM_KEY_PATTERN.test(value)
        ? { ok: true, value }
        : { ok: false, message: 'Chave aleatória inválida.' };
    }
  }
}

export function normalizeRecipientName(raw: string): PixKeyResult {
  const value = String(raw ?? '').trim().replace(/\s+/g, ' ');
  if (CONTROL_CHARS.test(String(raw ?? ''))) return { ok: false, message: 'Nome do favorecido inválido.' };
  if (value.length < RECIPIENT_NAME_MIN || value.length > RECIPIENT_NAME_MAX) {
    return {
      ok: false,
      message: `O favorecido deve ter entre ${RECIPIENT_NAME_MIN} e ${RECIPIENT_NAME_MAX} caracteres.`,
    };
  }
  return { ok: true, value };
}

/** Formata a chave canônica para leitura humana (o valor copiado continua o canônico). */
export function formatPixKey(type: PixKeyType, value: string) {
  if (type === 'cpf' && /^\d{11}$/.test(value)) {
    return value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  if (type === 'cnpj' && /^\d{14}$/.test(value)) {
    return value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  if (type === 'telefone' && /^\+55\d{11}$/.test(value)) {
    return value.replace(/^\+55(\d{2})(\d{5})(\d{4})$/, '+55 ($1) $2-$3');
  }
  return value;
}

/** Máscara para contextos de registro/auditoria: preserva apenas o final. */
export function maskPixKey(value: string) {
  const tail = value.slice(-4);
  return `•••${tail}`;
}
