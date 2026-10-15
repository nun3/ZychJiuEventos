import { constants, inflateSync } from 'node:zlib'

// Ações que um comprovante bancário não precisa. /OpenAction e /URI ficam de fora: aparecem em PDFs legítimos.
const ACTIVE_NAMES = /\/(JavaScript|JS|Launch|EmbeddedFiles?|RichMedia|XFA|AA|SubmitForm|ImportData|GoToR|GoToE)(?![A-Za-z0-9])/
const MAX_INFLATED_BYTES = 16 * 1024 * 1024
const STREAM_START = /stream\r?\n/g

function decodeNameEscapes(text: string) {
  return text.replace(/#([0-9A-Fa-f]{2})/g, (_match, hex: string) => String.fromCharCode(parseInt(hex, 16)))
}

function hasActiveNames(text: string) {
  return ACTIVE_NAMES.test(text) || ACTIVE_NAMES.test(decodeNameEscapes(text))
}

/**
 * Inspeção servidor do PDF: texto bruto + streams Flate descomprimidos (incluindo object streams).
 * Retorna true quando há conteúdo ativo, criptografia (não inspecionável) ou expansão suspeita.
 */
export function pdfHasActiveContentDeep(bytes: Uint8Array) {
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const raw = buffer.toString('latin1')
  if (/\/Encrypt(?![A-Za-z])/.test(raw)) return true
  if (hasActiveNames(raw)) return true

  let inflatedTotal = 0
  STREAM_START.lastIndex = 0
  for (let match = STREAM_START.exec(raw); match; match = STREAM_START.exec(raw)) {
    const start = match.index + match[0].length
    const end = raw.indexOf('endstream', start)
    if (end < 0) break
    STREAM_START.lastIndex = end + 'endstream'.length
    let inflated: Buffer
    try {
      inflated = inflateSync(buffer.subarray(start, end), {
        finishFlush: constants.Z_SYNC_FLUSH,
        maxOutputLength: MAX_INFLATED_BYTES - inflatedTotal + 1,
      })
    } catch (error) {
      if (error instanceof RangeError) return true
      continue
    }
    inflatedTotal += inflated.length
    if (inflatedTotal > MAX_INFLATED_BYTES) return true
    if (hasActiveNames(inflated.toString('latin1'))) return true
  }
  return false
}
