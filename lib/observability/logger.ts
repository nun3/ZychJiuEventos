import 'server-only'

type Level = 'info' | 'warn' | 'error'
type FieldValue = string | number | boolean | null | undefined
type Fields = Record<string, FieldValue>

const sensitiveKey = /token|secret|password|authorization|api[-_]?key|jwt|cpf|cookie|session/i

function write(level: Level, event: string, fields: Fields = {}) {
  const payload: Record<string, string | number | boolean | null> = {
    level,
    event,
    ts: new Date().toISOString(),
  }
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || sensitiveKey.test(key)) continue
    payload[key] = value
  }
  const line = JSON.stringify(payload)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.info(line)
}

export const logger = {
  info(event: string, fields?: Fields) {
    write('info', event, fields)
  },
  warn(event: string, fields?: Fields) {
    write('warn', event, fields)
  },
  error(event: string, fields?: Fields) {
    write('error', event, fields)
  },
}
