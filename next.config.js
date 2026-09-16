/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    ],
  },
}

module.exports = nextConfig
