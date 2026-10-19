/** @type {import('next').NextConfig} */
const isProduction = process.env.VERCEL_ENV === 'production'

// Report-Only: Next.js 14 injeta scripts e estilos inline. Enforcement quebraria
// autenticação e hidratação antes de uma prova em produção. Sem `*` e sem
// `unsafe-eval`. `unsafe-inline` fica restrito a script/style por essa limitação.
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://kfvypacjzlzwwblsbpwj.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://kfvypacjzlzwwblsbpwj.supabase.co wss://kfvypacjzlzwwblsbpwj.supabase.co",
  "frame-src 'none'",
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
]

if (isProduction) {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  })
}

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Comprovante PIX vai até 4 MB (validado no servidor). A Vercel corta corpos acima de 4,5 MB antes daqui.
    serverActions: { bodySizeLimit: '5mb' },
    // Reaproveita o payload das abas do evento por alguns segundos. Mutações chamam router.refresh().
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'kfvypacjzlzwwblsbpwj.supabase.co',
        pathname: '/storage/v1/object/public/event-assets/**',
      },
      {
        protocol: 'https',
        hostname: 'kfvypacjzlzwwblsbpwj.supabase.co',
        pathname: '/storage/v1/object/public/identity-assets/**',
      },
    ],
  },
}

module.exports = nextConfig
