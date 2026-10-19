import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

// Arquivos versionados para o build não baixar as fontes do Google.
const inter = localFont({
  src: [
    { path: '../fonts/inter/inter-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: '../fonts/inter/inter-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/inter/inter-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/inter/inter-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/inter/inter-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-inter',
})
const spaceGrotesk = localFont({
  src: [
    { path: '../fonts/space-grotesk/space-grotesk-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/space-grotesk/space-grotesk-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/space-grotesk/space-grotesk-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/space-grotesk/space-grotesk-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'Meu Camp - Plataforma de Eventos Online',
  description: 'Plataforma completa para gerenciar, divulgar e organizar eventos de Jiu-Jitsu. Campeonatos, cursos, seminários e workshops.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  )
}
