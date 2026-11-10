/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Comprovante PIX vai até 4 MB (validado no servidor). A Vercel corta corpos acima de 4,5 MB antes daqui.
    serverActions: { bodySizeLimit: '5mb' },
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
