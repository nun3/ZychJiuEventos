import 'server-only'
import { AsaasSandboxGateway } from './asaas'
import { GatewayError } from './gateway'
import { isPaymentsManualOnly } from './manual-only'

export function createPaymentGateway() {
  if (isPaymentsManualOnly()) throw new GatewayError('configuration')
  if (process.env.ASAAS_ENVIRONMENT !== 'sandbox' || !process.env.ASAAS_SANDBOX_API_KEY) {
    throw new GatewayError('configuration')
  }
  return new AsaasSandboxGateway(process.env.ASAAS_SANDBOX_API_KEY)
}
