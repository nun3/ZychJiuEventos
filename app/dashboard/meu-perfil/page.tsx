import Link from 'next/link'
import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import { FiUser, FiEdit, FiUsers, FiClipboard, FiAward, FiCreditCard, FiChevronRight } from 'react-icons/fi'

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
  age: 42,
  belt: 'Preta',
  weight: '77.0 kg',
  city: 'Pato Branco – PR, Brasil',
  team: 'Zych Jiu Jitsu',
  professor: 'Ricardo Zych',
  victories: [
    { label: 'taxa de vitórias', value: '4 / 100.00%' },
    { label: 'taxa de vitórias', value: '1 / 25.00%' },
  ],
  stats: {
    championships: 4,
  },
  social: [
    { label: 'facebook', href: '#' },
    { label: 'instagram', href: '#' },
    { label: 'youtube', href: '#' },
    { label: 'linkedin', href: '#' },
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
    <main className="min-h-screen bg-[#f8fafc]">
      <ModernNavbar />
      <div className="pt-20 container mx-auto px-6 pb-12">
      <section className="rounded-2xl bg-white shadow">
        <div className="border-b border-gray-200 bg-[#0C3049] px-6 py-6 text-white">
          <h1 className="text-2xl font-bold uppercase tracking-wide">Bem-vindo, Ricardo!</h1>
          <p className="text-sm text-blue-100">Acompanhe suas estatísticas e próximas competições.</p>
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
                      ? 'border-primary-red bg-primary-red text-white shadow'
                      : 'border-gray-200 text-gray-600 hover:border-primary-red hover:text-primary-red'
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
              <div className="rounded-xl border border-gray-200 bg-sky-50/80 px-6 py-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#0C3049] uppercase tracking-wide">{profile.name}</h2>
                    <p className="text-sm text-sky-900/80">
                      {profile.age} anos · Atleta de Jiu-Jitsu
                      <br />
                      {profile.city}
                    </p>
                  </div>
                  <div className="rounded-full border border-white/30 bg-white/60 px-4 py-2 text-sm font-semibold text-[#0C3049] shadow">
                    {profile.belt} · {profile.weight}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#0C3049]">Equipe</p>
                    <p className="text-sm text-sky-900/80">{profile.team}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#0C3049]">Professor</p>
                    <p className="text-sm text-sky-900/80">{profile.professor}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#0C3049]">
                    Participações em campeonatos
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#0C3049] shadow">
                      {profile.stats.championships} eventos
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {profile.victories.map((item, index) => (
                    <div key={index} className="rounded-lg border border-white/70 bg-white/70 px-4 py-3 text-sm text-[#0C3049] shadow-sm">
                      <p className="text-xs uppercase tracking-wide text-[#0C3049]/70">{item.label}</p>
                      <p className="text-sm font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#0C3049]">Perfis sociais</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-sky-900/80">
                    {profile.social.map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        className="rounded-full border border-white/60 bg-white/80 px-4 py-1 capitalize text-[#0C3049] transition hover:bg-white"
                      >
                        {social.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-red">
                    Últimos eventos que participei
                  </h3>
                  <ul className="mt-4 space-y-3 text-sm text-gray-600">
                    {pastEvents.map((event) => (
                      <li key={event.title} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                        <p className="font-semibold text-gray-800">{event.title}</p>
                        <p className="text-xs text-gray-500">{event.date}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-red">Veja os próximos eventos</h3>
                  <ul className="mt-4 space-y-3 text-sm text-gray-600">
                    {upcomingEvents.map((event) => (
                      <li key={event.title} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="font-semibold text-gray-800">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {event.date} · {event.city}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
      <ModernFooter />
    </main>
  )
}

