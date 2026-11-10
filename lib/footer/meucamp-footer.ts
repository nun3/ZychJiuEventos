import type { FooterColumn } from '@/components/ui/halftone-wordmark-footer'

/**
 * Configuração do rodapé Halftone (retícula), aprovado no Motion Lab (experiment/meucamp-motion-design, 72a88a5)
 * e integrado em integration/motion-lab-eventos-20261107. Mesmos destinos do ModernFooter; "Eventos" aponta para a Home,
 * que substituiu a página de listagem.
 */
export const MEUCAMP_FOOTER_WORDMARK = 'meu camp'
export const MEUCAMP_FOOTER_LABEL = 'Meu Camp'
export const MEUCAMP_FOOTER_FONT_FAMILY = '"Space Grotesk", Inter, "Helvetica Neue", Arial, sans-serif'
export const MEUCAMP_FOOTER_FONT_WEIGHT = 700

/**
 * Paleta da Home: fundo igual ao fim do calendário (azul-marinho quase preto), tinta azul-esbranquiçada como o texto do site
 * e o vermelho da marca (#DC2626, o mesmo da lua e das folhas da arte) como a cor em que os pontos "esquentam".
 * O preset `night` (preto quente, creme, laranja) destoava do azul frio da Home.
 */
export const MEUCAMP_FOOTER_PALETTE = { background: '#050a14', ink: '#dfe7f5', warm: '#dc2626' }

export function meucampFooterMeta() {
  return `©${new Date().getFullYear()} · Meu Camp`
}

export const MEUCAMP_FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Produto',
    links: [
      { label: 'Eventos', href: '/eventos' },
      { label: 'Notícias', href: '/noticias' },
      { label: 'Academias e equipes', href: '/academias' },
      { label: 'O sistema', href: '/sistema' },
      { label: 'Entrar', href: '/login' },
      { label: 'Criar evento', href: '/admin/eventos/novo' },
    ],
  },
  {
    title: 'Institucional',
    links: [
      { label: 'Quem somos', href: '/quem-somos' },
      { label: 'Sobre o MEU CAMP', href: '/sistema' },
    ],
  },
  {
    title: 'Contato',
    links: [
      { label: 'contato@meucamp.com.br', href: 'mailto:contato@meucamp.com.br' },
      {
        label: 'WhatsApp',
        href: 'https://wa.me/5541991526177?text=' + encodeURIComponent('Olá! Gostaria de mais informações sobre o MEU CAMP.'),
      },
    ],
  },
]
