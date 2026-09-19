export function requireE2eWrites(label: string) {
  if (process.env.E2E_ALLOW_WRITES === 'true') return
  throw new Error(`${label} bloqueado: E2E_ALLOW_WRITES não é true. Nenhuma escrita foi feita.`)
}
