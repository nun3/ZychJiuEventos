import ModernNavbar from '@/components/ModernNavbar'
import { CinematicStory } from '@/components/home-cinematic/CinematicStory'
import { HomePlatformSection } from '@/components/HomePlatformSection'
import { SiteFooter } from '@/components/SiteFooter'
import { WhatsAppFloat } from '@/components/WhatsAppFloat'

// Experiência coreografada (scrollytelling), aberta pela faixa do menu. A listagem de campeonatos vive em /eventos.
export default function Experiencia() {
  return (
    <main id="conteudo-principal" className="relative min-h-screen bg-mc-background">
      <ModernNavbar />
      <CinematicStory />
      <HomePlatformSection />
      <SiteFooter />
      <WhatsAppFloat />
    </main>
  )
}
