const environment = process.env.ASAAS_ENVIRONMENT
const apiKey = process.env.ASAAS_PRODUCTION_API_KEY?.trim()

if (environment !== 'production' || !apiKey) {
  console.error('ASAAS PRODUCTION CHECK: configuração ausente')
  process.exit(1)
}

async function main() {
  const response = await fetch('https://api.asaas.com/v3/customers?limit=1', {
    method: 'GET',
    redirect: 'error',
    cache: 'no-store',
    headers: { access_token: apiKey, 'User-Agent': 'MeuCamp/1.0' },
    signal: AbortSignal.timeout(15000),
  })
  console.log(`ASAAS PRODUCTION CHECK: HTTP ${response.status}`)
  process.exit(response.ok ? 0 : 1)
}

main().catch(() => {
  console.error('ASAAS PRODUCTION CHECK: falha de consulta')
  process.exit(1)
})
