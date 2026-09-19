export function isPaymentsManualOnly(env: NodeJS.ProcessEnv = process.env) {
  return env.PAYMENTS_MANUAL_ONLY === 'true'
}
