'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FiUser, FiEdit, FiUsers, FiClipboard, FiAward, FiCreditCard, FiChevronRight, FiCalendar, FiTrash2, FiSearch, FiPlus } from 'react-icons/fi'
import dynamic from 'next/dynamic'

const NewAthleteModal = dynamic(() => import('@/components/Modals/NewAthleteModal'), { ssr: false })

const menuItems = [
  { href: '/dashboard/meu-perfil', label: 'Meu Perfil', icon: FiUser },
  { href: '/dashboard/alterar-cadastro', label: 'Alterar Meu Cadastro', icon: FiEdit },
  { href: '/dashboard/meus-atletas', label: 'Meus Atletas', icon: FiUsers, active: true },
  { href: '/dashboard/inscricoes', label: 'Inscrições Realizadas', icon: FiClipboard },
  { href: '/dashboard/minhas-filiacoes', label: 'Minhas Filiações', icon: FiAward },
  { href: '/dashboard/meus-ingressos', label: 'Meus Ingressos', icon: FiCreditCard },
]
const athletes = [
  {
    id: 'agata-gordiani',
    name: 'Ágata Gordiani',
    age: 9,
    team: 'Zych Jiu Jitsu',
    coach: 'Ricardo Zych',
    belt: 'Branca',
    weight: '35,00 kg',
  },
  {
    id: 'benjamin-grobe',
    name: 'Benjamín Grobe de Almeida',
    age: 8,
    team: 'Zych Jiu Jitsu',
    coach: 'Ricardo Zych',
    belt: 'Branca',
    weight: '40,80 kg',
  },
  {
    id: 'caetano-dall-acqua',
    name: 'Caetano Dall Acqua',
    age: 10,
    team: 'Zych Jiu Jitsu',
    coach: 'Ricardo Zych',
    belt: 'Branca',
    weight: '46,00 kg',
  },
  {
    id: 'catarina-l-basso',
    name: 'Catarina Lourenço Basso',
    age: 7,
    team: 'Zych Jiu Jitsu',
    coach: 'Ricardo Zych',
    belt: 'Branca',
    weight: '32,00 kg',
  },
  {
    id: 'pietro-g-santos',
    name: 'Pietro Gabriel dos Santos',
    age: 16,
    team: 'Zych Jiu Jitsu',
    coach: 'Ricardo Zych',
    belt: 'Branca',
    weight: '72,00 kg',
  },
  {
    id: 'rebeca-klaus',
    name: 'Rebeca Andrettta Klaus',
    age: 15,
    team: 'Zych Jiu Jitsu',
    coach: 'Ricardo Zych',
    belt: 'Branca',
    weight: '46,00 kg',
  },
  {
    id: 'theo-fernandes',
    name: 'Theo Henrique Fernandes',
    age: 9,
    team: 'Zych Jiu Jitsu',
    coach: 'Ricardo Zych',
    belt: 'Branca',
    weight: '29,00 kg',
  },
  {
    id: 'valentino-bernardi',
    name: 'Valentino G. V. Bernardi',
    age: 10,
    team: 'Zych Jiu Jitsu',
    coach: 'Ricardo Zych',
    belt: 'Branca',
    weight: '27,00 kg',
  },
]

export default function MeusAtletasPage() {
  const [openModal, setOpenModal] = useState(false)
  const [editingAthlete, setEditingAthlete] = useState<any>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  return (
    <div className="container mx-auto px-6 pt-6 pb-12">
      <section className="rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#0C3049] via-blue-800 to-[#0C3049] px-6 py-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="relative">
            <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wide mb-2">Meus Atletas</h1>
            <p className="text-base text-blue-100">Gerencie seus atletas, inscrições e filiações</p>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-8 lg:grid-cols-[220px,1fr]">
          {/* Menu Lateral */}
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
            <button className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition w-full">
              Sair da conta
              <FiChevronRight size={14} />
            </button>
          </aside>

          <div className="space-y-6">
            {/* Header com busca e botão */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">Meus Atletas</h2>
                <p className="text-base text-gray-500 mt-1">
                  <span className="font-semibold text-primary-blue">{athletes.length}</span> atletas cadastrados
                </p>
              </div>
              <button
                onClick={() => setOpenModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-blue px-5 py-3 text-base font-semibold text-white shadow-md hover:bg-blue-700 transition"
              >
                <FiPlus size={18} />
                Novo Atleta
              </button>
            </div>

            {/* Busca */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <form className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Buscar Atleta</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Nome do atleta"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary-blue px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-blue-700 transition"
                  >
                    <FiSearch size={18} />
                    Pesquisar
                  </button>
                </div>
              </form>
            </div>

            {/* Lista de Atletas */}
            <div className="space-y-3">
              {athletes.map((athlete) => (
                <div key={athlete.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-4">
                      <div className="w-14 h-14 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 flex">
                        <FiUsers size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {athlete.name}
                          <span className="ml-2 text-base text-gray-500 font-normal">{athlete.age} anos</span>
                        </h3>
                        <div className="mt-1 text-sm text-gray-600">
                          <p>Equipe: <span className="font-medium">{athlete.team}</span></p>
                          <p>Professor: <span className="font-medium">{athlete.coach}</span></p>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm font-medium text-gray-500">
                          <span>Faixa <span className="font-semibold">{athlete.belt}</span></span>
                          <span>Peso {athlete.weight}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setEditingAthlete(athlete)
                          setIsEditModalOpen(true)
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border-2 border-primary-blue px-4 py-2 text-sm font-semibold text-primary-blue transition hover:bg-primary-blue hover:text-white"
                      >
                        <FiEdit size={16} />
                        Editar
                      </button>
                      <Link
                        href={`/dashboard/meus-atletas/${athlete.id}/inscricoes`}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        <FiCalendar size={16} />
                        Inscrições
                      </Link>
                      <button className="inline-flex items-center gap-2 rounded-lg border-2 border-primary-blue px-4 py-2 text-sm font-semibold text-primary-blue transition hover:bg-primary-blue hover:text-white">
                        <FiAward size={16} />
                        Filiações
                      </button>
                      <button className="inline-flex items-center gap-2 rounded-lg border-2 border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                        <FiTrash2 size={16} />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <NewAthleteModal 
        open={openModal} 
        onClose={() => setOpenModal(false)}
        mode="create"
        showPasswordFields={true}
        registerType="atleta"
        onSubmit={(data) => {
          console.log('Novo atleta cadastrado:', data)
          setOpenModal(false)
          // Aqui você pode adicionar lógica para salvar o novo atleta
        }}
      />

      {/* Modal de Edição */}
      {editingAthlete && (
        <NewAthleteModal
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingAthlete(null)
          }}
          mode="edit"
          showPasswordFields={false}
          registerType="atleta"
          initialData={{
            nomeCompleto: editingAthlete.name,
            equipe: editingAthlete.team,
            professor: editingAthlete.coach,
            graduacao: editingAthlete.belt,
            peso: editingAthlete.weight.replace(' kg', '').replace(',', '.'),
            // Adicione outros campos conforme necessário
          }}
          onSubmit={(data) => {
            console.log('Atleta editado:', data)
            setIsEditModalOpen(false)
            setEditingAthlete(null)
            // Aqui você pode adicionar lógica para atualizar o atleta
          }}
        />
      )}
    </div>
  )
}

