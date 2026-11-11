// Marcos do "Caminho" da página /experiencia. Cada marco repete um fato já documentado em historical-dossier.ts
// (mesmos anos e termos); nada aqui acrescenta afirmação histórica nova. A ordem é cronológica.
export type PathMilestone = {
  id: string
  /** Rótulo grande do marco (ano ou período, como no dossiê). */
  year: string
  /** Tradição ou contexto, em poucas palavras. */
  tradition: string
  /** Um fato, em uma frase. */
  fact: string
}

export const PATH_MILESTONES: PathMilestone[] = [
  { id: 'beni-hasan', year: 'c. 2000 a.C.', tradition: 'Egito', fact: 'Afrescos em Beni Hasan registram sequências de luta agarrada e projeções.' },
  { id: 'pankration', year: '648 a.C.', tradition: 'Grécia Antiga', fact: 'O Pankration entra nos Jogos Olímpicos, combinando luta e percussão sob arbitragem pública.' },
  { id: 'takenouchi', year: '1532', tradition: 'Japão · jujutsu', fact: 'A escola Takenouchi-ryū preserva técnicas de projeção, imobilização, estrangulamento e luxação.' },
  { id: 'jixiao', year: 'c. 1560', tradition: 'China · dinastia Ming', fact: 'O general Qi Jiguang documenta métodos de combate desarmado no manual Jixiao Xinshu.' },
  { id: 'kodokan', year: '1882', tradition: 'Judô', fact: 'Jigoro Kano funda o Kodokan e transforma o jujutsu em método educacional e esportivo, baseado no randori.' },
  { id: 'itosu', year: '1901', tradition: 'Karatê', fact: 'Ankō Itosu introduz o ensino sistematizado de karatê nas escolas públicas de Okinawa.' },
  { id: 'maeda', year: '1914', tradition: 'Jiu-Jitsu', fact: 'Mitsuyo Maeda chega ao Brasil e ensina em Belém do Pará.' },
  { id: 'ringue', year: 'Década de 1920', tradition: 'Muay Thai', fact: 'O ringue cercado por cordas e os rounds cronometrados são introduzidos.' },
  { id: 'kwans', year: '1944–1946', tradition: 'Taekwondo', fact: 'Surgem em Seul os cinco Kwans originais.' },
  { id: 'wt', year: '1973', tradition: 'Taekwondo', fact: 'A World Taekwondo é criada, depois do Kukkiwon (1972).' },
  { id: 'cbjj', year: '1994', tradition: 'Jiu-Jitsu', fact: 'A CBJJ/IBJJF é fundada e padroniza pesos, divisões, tempos de luta e pontuação.' },
  { id: 'sydney', year: '2000', tradition: 'Taekwondo', fact: 'O Taekwondo se torna modalidade olímpica oficial de medalha, em Sydney.' },
]
