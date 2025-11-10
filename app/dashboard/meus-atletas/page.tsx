 'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FiEdit, FiUsers, FiCalendar, FiAward, FiTrash2, FiSearch, FiPlus } from 'react-icons/fi'
import dynamic from 'next/dynamic'

const NewAthleteModal = dynamic(() => import('@/components/Modals/NewAthleteModal'), { ssr: false })
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

  return (
    <main className="container mx-auto px-4">
      <section className="rounded-2xl bg-white shadow">
        <header className="border-b border-gray-200 bg-[#0C3049] px-6 py-6 text-white">
          <h1 className="text-2xl font-bold uppercase tracking-wide">Bem-vindo, Ricardo!</h1>
          <p className="text-sm text-blue-100">Gerencie seus atletas, inscrições e filiações.</p>
        </header>

        <div className="grid gap-6 px-6 py-8 lg:grid-cols-[220px,1fr]">
          <aside className="space-y-3">
            <Link
              href="/dashboard/meu-perfil"
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:border-primary-red hover:text-primary-red transition"
            >
              Meu Perfil
            </Link>
            <Link
              href="/dashboard/alterar-cadastro"
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:border-primary-red hover:text-primary-red transition"
            >
              Alterar Meu Cadastro
            </Link>
            <Link
              href="/dashboard/meus-atletas"
              className="flex items-center gap-3 rounded-lg border border-primary-red bg-primary-red px-4 py-3 text-sm font-semibold text-white shadow"
            >
              Meus Atletas
            </Link>
            <Link
              href="/dashboard/inscricoes"
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:border-primary-red hover:text-primary-red transition"
            >
              Inscrições Realizadas
            </Link>
            <Link
              href="/dashboard/minhas-filiacoes"
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:border-primary-red hover:text-primary-red transition"
            >
              Minhas Filiações
            </Link>
            <Link
              href="/dashboard/meus-ingressos"
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:border-primary-red hover:text-primary-red transition"
            >
              Meus Ingressos
            </Link>
          </aside>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-lg font-semibold uppercase tracking-wide text-primary-red">Meus Atletas</h2>
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-primary-red">{athletes.length}</span> atletas cadastrados
                </p>
              </div>
              <button
                onClick={() => setOpenModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-orange px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow hover:bg-orange-600 transition"
              >
                <FiPlus size={16} />
                Novo Atleta
              </button>
            </div>

            <ul className="space-y-4">
              {athletes.map((athlete) => (
                <li key={athlete.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-4">
                      <div className="hidden h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 md:inline-flex">
                        <FiUsers size={24} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 uppercase tracking-wide">
                          {athlete.name}
                          <span className="ml-2 text-xs text-gray-500">{athlete.age} anos</span>
                        </h3>
                        <div className="mt-1 text-xs text-gray-600">
                          <p>Equipe: {athlete.team}</p>
                          <p>Professor: {athlete.coach}</p>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs font-medium text-gray-500">
                          <span>Faixa {athlete.belt}</span>
                          <span>Peso {athlete.weight}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                      <button className="inline-flex items-center gap-2 rounded-lg border border-primary-red px-4 py-2 text-sm font-semibold text-primary-red transition hover:bg-primary-red hover:text-white">
                        <FiEdit size={16} />
                        Alterar Cadastro
                      </button>
                      <button className="inline-flex items-center gap-2 rounded-lg bg-primary-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">
                        <FiCalendar size={16} />
                        Inscrições
                      </button>
                      <button className="inline-flex items-center gap-2 rounded-lg border border-primary-red px-4 py-2 text-sm font-semibold text-primary-red transition hover:bg-primary-red hover:text-white">
                        <FiAward size={16} />
                        Filiações
                      </button>
                      <button className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                        <FiTrash2 size={16} />
                        Excluir Atleta
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="mt-8 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
              <form className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-gray-600 md:flex-row md:items-center md:gap-3">
                  <span>Atletas cadastrados</span>
                  <input
                    type="text"
                    placeholder="Nome do atleta"
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30 md:mt-0 md:min-w-[280px]"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-red px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-red-700"
                >
                  <FiSearch size={16} />
                  Pesquisar
                </button>
                <button
                  type="button"
                  onClick={() => setOpenModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-orange px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-orange-600"
                >
                  <FiPlus size={16} />
                  Novo Atleta
                </button>
              </form>
            </footer>
          </div>
        </div>
      </section>

      <NewAthleteModal open={openModal} onClose={() => setOpenModal(false)} />
    </main>
  )
}

