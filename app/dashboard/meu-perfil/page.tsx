import Link from 'next/link'
import { FiUser, FiEdit, FiUsers, FiClipboard, FiAward, FiCreditCard, FiChevronRight, FiMapPin, FiFlag, FiTrendingUp, FiCalendar, FiStar } from 'react-icons/fi'
import { FaFacebook, FaInstagram, FaYoutube, FaLinkedin, FaTwitter } from 'react-icons/fa'

const menuItems = [
  { href: '/dashboard/meu-perfil', label: 'Meu Perfil', icon: FiUser, active: true },
  { href: '/dashboard/alterar-cadastro', label: 'Alterar Meu Cadastro', icon: FiEdit },
  { href: '/dashboard/meus-atletas', label: 'Meus Atletas', icon: FiUsers },
  { href: '/dashboard/inscricoes', label: 'Inscrições Realizadas', icon: FiClipboard },
  { href: '/dashboard/minhas-filiacoes', label: 'Minhas Filiações', icon: FiAward },
  { href: '/dashboard/meus-ingressos', label: 'Meus Ingressos', icon: FiCreditCard },
]

const profile = {
  name: 'Ricardo Zych',
  age: 43,
  belt: 'Preta',
  weight: '77.00',
  city: 'Pato Branco',
  state: 'PR',
  country: 'Brasil',
  team: 'Zych Jiu Jitsu',
  professor: 'Ricardo Zych',
  medals: [
    { type: 'gold', label: 'Ouro', wins: 0, total: 0, percentage: 0 },
    { type: 'silver', label: 'Prata', wins: 4, total: 4, percentage: 100 },
    { type: 'bronze', label: 'Bronze', wins: 1, total: 4, percentage: 25 },
  ],
  stats: {
    championships: 4,
  },
  social: [
    { label: 'facebook', href: '#', icon: FaFacebook },
    { label: 'instagram', href: '#', icon: FaInstagram },
    { label: 'youtube', href: '#', icon: FaYoutube },
    { label: 'linkedin', href: '#', icon: FaLinkedin },
    { label: 'twitter', href: '#', icon: FaTwitter },
  ],
}

const upcomingEvents = [
  {
    title: '2º Festival Kids de Jiu-Jitsu',
    date: '16 de Novembro de 2025',
    city: 'Clevelândia/PR',
  },
  {
    title: '1ª Copa Grêmio Industrial Kids de Jiu-Jitsu',
    date: '07 de Dezembro de 2025',
    city: 'Pato Branco/PR',
  },
]

const pastEvents = [
  { title: 'Copa Desterro Oeste Extremo Oeste Catarinense', date: '01/10/2023' },
  { title: 'Campeonato Paranaense de Jiu-Jitsu – 2ª Etapa', date: '29/04/2023' },
  { title: 'Paranaense de Jiu-Jitsu & Para Jiu-Jitsu – 2ª Etapa', date: '14/05/2022' },
]

export default function MeuPerfilPage() {
  return (
    <div className="container mx-auto px-6 pt-6 pb-12">
      <section className="rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="relative bg-gradient-to-r from-[#0C3049] via-blue-800 to-[#0C3049] px-6 py-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="relative">
            <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wide mb-2">Meu Perfil</h1>
            <p className="text-base text-blue-100">Bem-vindo, Ricardo! Acompanhe suas estatísticas e próximas competições.</p>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-8 lg:grid-cols-[220px,1fr]">
          <aside className="space-y-3">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                    item.active
                      ? 'border-primary-blue bg-primary-blue text-white shadow'
                      : 'border-gray-200 text-gray-600 hover:border-primary-blue hover:text-primary-blue'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              )
            })}
            <button className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition">
              Sair da conta
              <FiChevronRight size={14} />
            </button>
          </aside>

          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
              {/* Card Principal do Perfil - Design Premium */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 shadow-xl">
                {/* Decoração de fundo */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
                
                <div className="relative px-8 py-8">
                  {/* Header do Perfil */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-white uppercase tracking-wide mb-2">
                        {profile.name}
                      </h2>
                      <p className="text-teal-100 text-base mb-3">
                        ({profile.age} anos)
                      </p>
                      <p className="text-white/90 text-sm font-medium mb-4">
                        Atleta de Jiu-Jitsu
                      </p>
                      <div className="flex items-center gap-4 text-white/90 text-sm">
                        <div className="flex items-center gap-2">
                          <FiMapPin size={16} />
                          <span>{profile.city} - {profile.state}, {profile.country}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                          <FiFlag size={16} className="text-white" />
                          <span className="text-white font-semibold">{profile.belt}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                          <FiTrendingUp size={16} className="text-white" />
                          <span className="text-white font-semibold">{profile.weight} Kg</span>
                        </div>
                      </div>
                    </div>
                    {/* Avatar Placeholder */}
                    <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center flex-shrink-0">
                      <FiUser size={40} className="text-white" />
                    </div>
                  </div>

                  {/* Equipe e Professor */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-xs font-bold uppercase tracking-wider text-white/80 mb-1">Equipe</p>
                      <p className="text-lg font-bold text-white">{profile.team}</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-xs font-bold uppercase tracking-wider text-white/80 mb-1">Professor</p>
                      <p className="text-lg font-bold text-white">{profile.professor}</p>
                    </div>
                  </div>

                  {/* Participações em Campeonatos */}
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 mb-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/80 mb-3">
                      Participações em Campeonatos: {profile.stats.championships}
                    </p>
                    
                    {/* Medalhas com Progress Bars */}
                    <div className="space-y-4">
                      {profile.medals.map((medal, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FiStar 
                                size={20} 
                                className={
                                  medal.type === 'gold' ? 'text-yellow-300' :
                                  medal.type === 'silver' ? 'text-gray-300' :
                                  'text-amber-600'
                                }
                              />
                              <span className="text-white font-semibold text-sm">{medal.label}</span>
                            </div>
                            <span className="text-white/90 text-sm font-medium">
                              taxa de vitórias: {medal.wins} / {medal.percentage.toFixed(2)}%
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                medal.type === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                medal.type === 'silver' ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                                'bg-gradient-to-r from-amber-600 to-amber-700'
                              }`}
                              style={{ width: `${medal.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Perfis Sociais */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/80 mb-3">
                      Perfis Sociais de {profile.name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.social.map((social) => {
                        const Icon = social.icon
                        return (
                          <a
                            key={social.label}
                            href={social.href}
                            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all hover:scale-110"
                            title={social.label}
                          >
                            <Icon size={18} />
                          </a>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Últimos Eventos - Design Premium */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0C3049] to-blue-900 shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative px-6 py-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold uppercase tracking-wide text-white flex items-center gap-2">
                        <FiAward className="text-yellow-400" size={20} />
                        Últimos eventos que participei
                      </h3>
                    </div>
                    <ul className="space-y-3">
                      {pastEvents.map((event, index) => (
                        <li 
                          key={event.title} 
                          className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-4 hover:bg-white/15 transition-all"
                        >
                          <p className="font-semibold text-white text-sm mb-1 line-clamp-2">{event.title}</p>
                          <div className="flex items-center gap-2 text-white/70 text-xs">
                            <FiCalendar size={12} />
                            <span>{event.date}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Próximos Eventos - Design Premium */}
                <div className="rounded-2xl border-2 border-primary-blue bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-primary-blue to-blue-600 px-6 py-4">
                    <h3 className="text-base font-bold uppercase tracking-wide text-white flex items-center gap-2">
                      <FiCalendar className="text-white" size={18} />
                      Veja os nossos próximos eventos
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {upcomingEvents.map((event) => (
                      <Link
                        key={event.title}
                        href="#"
                        className="block bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-primary-blue hover:shadow-md transition-all group"
                      >
                        <p className="font-bold text-gray-900 text-sm mb-2 group-hover:text-primary-blue transition">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-2 text-gray-600 text-xs">
                          <FiCalendar size={12} />
                          <span>{event.date}</span>
                          <span className="text-gray-400">·</span>
                          <FiMapPin size={12} />
                          <span>{event.city}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

