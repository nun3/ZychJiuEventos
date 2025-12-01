import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}

