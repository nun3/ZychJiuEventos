import 'server-only'
import { resolveAthleteAsaasConfig } from './asaas-config'
import { AsaasSandboxGateway } from './asaas'

export function createPaymentGateway() {
  const config = resolveAthleteAsaasConfig()
  return new AsaasSandboxGateway(config.apiKey, fetch, config.baseUrl)
}
