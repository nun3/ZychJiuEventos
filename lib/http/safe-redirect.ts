const fallbackPath = '/dashboard'

/** Aceita somente caminho interno. Rejeita protocolo, host e barra invertida. */
export function safeInternalPath(value: string | null | undefined, fallback = fallbackPath) {
  if (!value || value.length > 512) return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  if (value.includes('\\') || value.includes('://') || value.includes('\0') || /[\r\n]/.test(value)) return fallback
  return value
}
