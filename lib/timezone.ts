function partsAt(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day), Number(value.hour), Number(value.minute), Number(value.second))
}

export function zonedLocalToUtc(value: string, timeZone: string) {
  const assumedUtc = new Date(`${value}:00.000Z`)
  if (Number.isNaN(assumedUtc.getTime())) throw new Error('Data local inválida')
  const firstOffset = partsAt(assumedUtc, timeZone) - assumedUtc.getTime()
  const firstResult = new Date(assumedUtc.getTime() - firstOffset)
  const finalOffset = partsAt(firstResult, timeZone) - firstResult.getTime()
  return new Date(assumedUtc.getTime() - finalOffset).toISOString()
}
