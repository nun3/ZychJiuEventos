import type { HalftoneShape } from '@/components/ui/halftone-wordmark-footer'

// Torii dupla diante do sol, traçada sobre a imagem de referência da marca (coordenadas do arquivo de 1932 px).
// Os traços do sol e da travessa foram engrossados para que a retícula de pontos os leia com nitidez.
export const TORII_SHAPE: HalftoneShape = {
  id: 'torii-dupla',
  viewBox: [400, 345, 1031, 1075],
  // Reserva o cabeçalho do campo de pontos (em cima) e a frase com o botão (embaixo).
  insetTop: 135,
  insetBottom: 195,
  paths: [
    // Sol (aro)
    { d: 'M635 660 A300 300 0 1 1 1235 660 A300 300 0 1 1 635 660 Z', stroke: 22 },
    // Kasagi superior e travessa (nuki)
    { d: 'M590 575 Q937 607 1285 575 Q1250 626 1187 647 L707 647 Q640 646 590 575 Z' },
    { d: 'M611 672 H1268 V718 H611 Z' },
    // Pilares internos
    { d: 'M722 647 L775 647 L782 1410 L697 1410 Z' },
    { d: 'M1101 647 L1154 647 L1162 1410 L1077 1410 Z' },
    // Kasagi inferior
    { d: 'M410 741 Q915 771 1421 741 Q1380 790 1283 812 L565 812 Q470 805 410 741 Z' },
    // Pilares externos
    { d: 'M565 812 L618 812 L626 1410 L541 1410 Z' },
    { d: 'M1229 812 L1283 812 L1291 1410 L1206 1410 Z' },
  ],
}
