export type HistoricalEpistemology =
  | 'documented_fact'
  | 'historiographical_interpretation'
  | 'oral_tradition_popular_narrative'

export type MartialTraditionEntry = {
  id: string
  region: string
  period: string
  title: string
  disciplineContext: string
  summaryShort: string
  documentedFacts: string[]
  historiographicalNotes: string[]
  oralTraditionsOrMythsToAvoid: string[]
  competitionTransformation: string
  sources: string[]
}

export type HistoricalBibliographyItem = {
  id: string
  author: string
  year: number
  title: string
  publisherOrJournal: string
  relevance: string
}

export const HISTORICAL_METAPHOR_DISCLAIMER =
  'A transição visual entre as tradições marciais e a interface do MEU CAMP é uma metáfora narrativa de organização esportiva contemporânea — não uma afirmação histórica de que a tecnologia seja o destino natural das artes marciais.'

export const OPERATIONAL_MODALITY_NOTICE =
  'O Jiu-Jitsu é a modalidade operacional atual do MEU CAMP (categorias GI oficiais, checagem, chaves, programação por área e placar LIVE). A referência às demais artes marciais expressa a cultura esportiva e a arquitetura preparada para expansão futura.'

export const MARTIAL_ARTS_HISTORICAL_DOSSIER: MartialTraditionEntry[] = [
  {
    id: 'antiquity-plural-origins',
    region: 'Mediterrâneo, Vale do Nilo, Mesopotâmia, Índia e China',
    period: 'c. 2000 a.C. – séc. XVI d.C.',
    title: 'Origens plurais e independentes do combate sistematizado',
    disciplineContext: 'Lutas agarradas, percussão e manuais militares',
    summaryShort:
      'As artes marciais não surgiram de um único ponto geográfico: diferentes civilizações codificaram técnicas de projeção, imobilização e percussão de modo independente.',
    documentedFacts: [
      'Afrescos nas tumbas de Beni Hasan (Egito, c. 2000 a.C.) registram centenas de sequências de luta agarrada e projeções.',
      'O Pankration foi introduzido nos Jogos Olímpicos da Grécia Antiga em 648 a.C. (33ª Olimpíada), combinando luta e percussão sob arbitragem pública.',
      'Na China da dinastia Ming, o general Qi Jiguang documentou métodos de combate desarmado (Quanjing Jieyao) no manual militar Jixiao Xinshu (c. 1560).',
    ],
    historiographicalNotes: [
      'Historiadores contemporâneos (Green & Svinth, 2010; Henning, 1999) demonstram que práticas de luta surgem onde há organização social, treinamento militar e rituais agonísticos.',
    ],
    oralTraditionsOrMythsToAvoid: [
      'A narrativa popular de que todas as artes marciais asiáticas descenderiam de um único monge (Bodhidharma) no Templo Shaolin no século VI é identificada pela historiografia (Henning, 1999) como construção literária tardia do período Qing.',
    ],
    competitionTransformation:
      'Festivais cívicos, jogos pan-helênicos e exames militares estabeleceram os primeiros conceitos de área delimitada, árbitro e regras de vitória.',
    sources: ['henning-1999', 'green-svinth-2010'],
  },
  {
    id: 'japan-jujutsu-to-judo',
    region: 'Japão (Período Edo à Era Meiji)',
    period: '1532 – 1882',
    title: 'Do Koryū Jujutsu à síntese pedagógica do Kodokan Judô',
    disciplineContext: 'Jujutsu clássico e Judô',
    summaryShort:
      'Em 1882, Jigoro Kano fundou o Kodokan em Tóquio, transformando técnicas de escolas clássicas de jujutsu em um método educacional e esportivo seguro baseado em randori.',
    documentedFacts: [
      'Escolas clássicas (koryū) como Takenouchi-ryū (1532), Tenjin Shin’yō-ryū e Kitō-ryū preservavam técnicas de projeção, imobilização, estrangulamento e luxação.',
      'Jigoro Kano (1860–1938) estudou Tenjin Shin’yō-ryū e Kitō-ryū e fundou o Kodokan em 1882, removendo técnicas perigosas do treino livre (randori) para permitir prática competitiva com resistência total.',
      'Kano instituiu o sistema moderno de graduação por faixas e graus (kyū/dan) em 1883, posteriormente adotado por diversas outras modalidades.',
    ],
    historiographicalNotes: [
      'A transição do jujutsu feudal (jutsu) para o caminho educativo (dō) refletiu a modernização institucional do Japão na Era Meiji e o diálogo com a educação física internacional.',
    ],
    oralTraditionsOrMythsToAvoid: [
      'O jujutsu clássico não era um sistema único e uniforme, mas dezenas de linhagens independentes (ryūha) com currículos distintos.',
    ],
    competitionTransformation:
      'A regulamentação do shiai (combate de teste) e a criação do sistema kyū/dan estabeleceram a base das divisões por graduação nas competições modernas.',
    sources: ['kano-2005', 'green-svinth-2010'],
  },
  {
    id: 'okinawa-karate',
    region: 'Reino de Ryukyu (Okinawa) e Japão continental',
    period: 'séc. XVIII – décadas de 1920–1930',
    title: 'Okinawa Te, intercâmbio com Fujian e a difusão do Karatê-dō',
    disciplineContext: 'Karatê',
    summaryShort:
      'No arquipélago de Ryukyu, práticas locais (Te) combinaram-se a métodos do sul da China (Tōde) e foram sistematizadas no início do século XX para o ensino escolar e universitário.',
    documentedFacts: [
      'Ankō Itosu introduziu o ensino sistematizado de karatê nas escolas públicas de Okinawa em 1901.',
      'Gichin Funakoshi (1868–1957), Chōjun Miyagi e Kenwa Mabuni apresentaram e difundiram a arte nas universidades japonesas a partir de 1922.',
      'Na década de 1930, a grafia japonesa consolidou-se como "caminho das mãos vazias" (Karatê-dō) e o sistema de faixas inspirado no Kodokan foi incorporado.',
    ],
    historiographicalNotes: [
      'O desenvolvimento em Naha, Shuri e Tomari esteve ligado a elites administrativas e ao comércio marítimo entre Ryukyu e a província chinesa de Fujian.',
    ],
    oralTraditionsOrMythsToAvoid: [
      'A ideia de que o karatê foi criado exclusivamente por camponeses desarmados contra samurais carece de respaldo documental primário; muitos mestres históricos pertenciam à classe letrada pechin de Ryukyu.',
    ],
    competitionTransformation:
      'A adoção de regulamentos de kumite e kata por clubes universitários japoneses permitiu torneios padronizados com arbitragem de pontos.',
    sources: ['green-svinth-2010'],
  },
  {
    id: 'thailand-muay-thai',
    region: 'Tailândia (Sião)',
    period: 'Período Ayutthaya – décadas de 1920–1950',
    title: 'Das tradições regionais (Muay Boran) aos estádios regulamentados de Muay Thai',
    disciplineContext: 'Muay Thai',
    summaryShort:
      'As tradições regionais de combate tailandês adotaram ringue, luvas e divisão por rounds e peso nas décadas de 1920–1930, consolidando um circuito profissional de alta precisão.',
    documentedFacts: [
      'Estilos regionais históricos (como Muay Chaiya, Muay Korat e Muay Lopburi) utilizavam bandagens de cânhamo (kard chuek) em festivais e apresentações reais.',
      'Na década de 1920 (reinado de Rama VI e Rama VII), foram introduzidos o ringue cercado por cordas, luvas acolchoadas (1929) e rounds cronometrados.',
      'Os estádios Rajadamnern (inaugurado em 1945) e Lumpinee (1956) unificaram rankings e categorias de peso.',
    ],
    historiographicalNotes: [
      'A modernização do Muay Thai combinou rituais tradicionais (Wai Kru Ram Muay) com parâmetros internacionais de segurança e cronometragem esportiva (Vail, 2014).',
    ],
    oralTraditionsOrMythsToAvoid: [
      'Episódios populares como o duelo de Nai Khanom Tom em 1774 fazem parte da memória cultural nacional tailandesa, devendo ser distinguidos da documentação administrativa moderna dos estádios.',
    ],
    competitionTransformation:
      'A divisão estrita por peso, tempo de round e papeletas de arbitragem profissionalizou a gestão de eventos de combate em pé.',
    sources: ['vail-2014', 'green-svinth-2010'],
  },
  {
    id: 'korea-taekwondo',
    region: 'Coreia',
    period: '1945 – 2000',
    title: 'As escolas pós-1945 (Kwans) e a consolidação esportiva do Taekwondo',
    disciplineContext: 'Taekwondo',
    summaryShort:
      'Formado pela unificação das escolas coreanas (Kwans) abertas após 1945, o Taekwondo desenvolveu um regulamento próprio de competição dinâmica que chegou aos Jogos Olímpicos.',
    documentedFacts: [
      'Entre 1944 e 1946 surgiram em Seul os cinco Kwans originais (Chung Do Kwan, Moo Duk Kwan, Yun Moo Kwan, Chang Moo Kwan e Oh Do Kwan).',
      'O nome Taekwondo foi proposto em 1955 e institucionalizado com a Korea Taekwondo Association (1959/1961), o Kukkiwon (1972) e a World Taekwondo (1973).',
      'O Taekwondo foi esporte de demonstração nos Jogos Olímpicos de Seul (1988) e tornou-se modalidade olímpica oficial de medalha em Sydney (2000).',
    ],
    historiographicalNotes: [
      'A historiografia acadêmica (Moenig, 2015) distingue as práticas folclóricas coreanas anteriores (como o Taekkyeon) da formação técnica inicial dos Kwans na década de 1940, que dialogou com o karatê universitário japonês antes de desenvolver a ênfase técnica de chutes característica do Taekwondo.',
    ],
    oralTraditionsOrMythsToAvoid: [
      'Evita-se atribuir diretamente o regulamento moderno do Taekwondo a murais de dois mil anos da dinastia Goguryeo sem contextualizar a síntese institucional ocorrida entre 1945 e 1973.',
    ],
    competitionTransformation:
      'Pioneiro na adoção de áreas octogonais/quadradas de tatame modular, coletes protetores e placares eletrônicos por tatame.',
    sources: ['moenig-2015', 'green-svinth-2010'],
  },
  {
    id: 'brazil-jiu-jitsu',
    region: 'Brasil (Belém, Rio de Janeiro e difusão nacional/global)',
    period: '1914 – presente',
    title: 'Da chegada de Mitsuyo Maeda (1914) ao Jiu-Jitsu Brasileiro e seus campeonatos',
    disciplineContext: 'Jiu-Jitsu Brasileiro (modalidade operacional atual do MEU CAMP)',
    summaryShort:
      'Trazido ao Brasil por diplomatas e lutadores japoneses como Mitsuyo Maeda em 1914, o Jiu-Jitsu desenvolveu no país múltiplas linhagens e um sistema próprio de competição por categorias de idade, faixa e peso.',
    documentedFacts: [
      'Mitsuyo Maeda (1878–1941), formado no Kodokan em Tóquio, chegou ao Brasil em novembro de 1914, apresentando-se e ensinando em Belém do Pará.',
      'No Brasil formaram-se importantes linhagens técnicas, incluindo Carlos e Hélio Gracie, Luiz França e Oswaldo Fadda, que expandiram o refinamento da luta de solo (ne-waza), guarda e finalizações.',
      'A partir das décadas de 1970–1990, federações esportivas (como a FJJ-Rio e a CBJJ/IBJJF, fundada em 1994) padronizaram tabelas de peso, divisões etárias, tempos de luta por faixa e pontuação posicional (2, 3 e 4 pontos, vantagens e punições).',
    ],
    historiographicalNotes: [
      'Pesquisas documentais recentes (Pedreira, 2014) mostram que o intercâmbio marcial no Brasil no início do século XX envolveu múltiplos professores japoneses (como Takeo Yano, Geo Omori e Soshihiro Satake) além de Maeda.',
    ],
    oralTraditionsOrMythsToAvoid: [
      'A história do Jiu-Jitsu no Brasil é plural e inclui tanto a vertente Gracie quanto linhagens independentes como a de Luiz França e Oswaldo Fadda.',
    ],
    competitionTransformation:
      'O formato de campeonato aberto por inscrição, checagem pública, chaves eliminatórias/copo de 3 e múltiplas áreas simultâneas inspira diretamente a operação atual do MEU CAMP.',
    sources: ['pedreira-2014', 'kano-2005', 'green-svinth-2010'],
  },
]

export const HISTORICAL_BIBLIOGRAPHY: HistoricalBibliographyItem[] = [
  {
    id: 'kano-2005',
    author: 'Kano, Jigoro',
    year: 2005,
    title: 'Mind Over Muscle: Writings from the Founder of Judo',
    publisherOrJournal: 'Kodansha International',
    relevance: 'Fontes primárias sobre a fundação do Kodokan (1882), segurança no randori e criação das graduações.',
  },
  {
    id: 'green-svinth-2010',
    author: 'Green, Thomas A.; Svinth, Joseph R. (Eds.)',
    year: 2010,
    title: 'Martial Arts of the World: An Encyclopedia of History and Innovation (2 vols.)',
    publisherOrJournal: 'ABC-CLIO',
    relevance: 'Referência acadêmica comparativa sobre origens plurais, Okinawa, Japão, China, Coreia, Tailândia e Brasil.',
  },
  {
    id: 'henning-1999',
    author: 'Henning, Stanley E.',
    year: 1999,
    title: 'Academia Encounters the Chinese Martial Arts',
    publisherOrJournal: 'China Review International, 6(2), 319–332',
    relevance: 'Análise documental dos manuais da dinastia Ming (Qi Jiguang) e crítica historiográfica aos mitos de origem única.',
  },
  {
    id: 'vail-2014',
    author: 'Vail, Peter',
    year: 2014,
    title: 'Muay Thai: Inventing Tradition for a National Sport',
    publisherOrJournal: 'Sojourn: Journal of Social Issues in Southeast Asia, 29(3), 509–553',
    relevance: 'Documentação da transição do Muay Boran para os regulamentos modernos de estádio nas décadas de 1920–1950.',
  },
  {
    id: 'moenig-2015',
    author: 'Moenig, Udo',
    year: 2015,
    title: 'Taekwondo: From a Martial Art to a Martial Sport',
    publisherOrJournal: 'Routledge',
    relevance: 'Estudo histórico dos Kwans pós-1945, unificação institucional e evolução do regulamento esportivo olímpico.',
  },
  {
    id: 'pedreira-2014',
    author: 'Pedreira, Roberto',
    year: 2014,
    title: 'Choque: The Untold Story of Jiu-Jitsu in Brazil (Vol. 1, 1856–1949)',
    publisherOrJournal: 'CreateSpace / Clube de Autores',
    relevance: 'Levantamento de fontes hemerográficas primárias sobre Mitsuyo Maeda, Takeo Yano, Carlos/Hélio Gracie, Luiz França e Oswaldo Fadda.',
  },
]
