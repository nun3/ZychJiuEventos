'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiUpload, FiAlertTriangle } from 'react-icons/fi'

// Dados mockados do atleta
const mockAthlete = {
  id: 'agata-gordiani',
  name: 'Ágata Gordiani',
  age: 9,
  cpf: '123.456.789-00',
  gender: 'F',
  birthDate: '2015-05-15',
  team: 'Zych Jiu Jitsu',
  coach: 'Ricardo Zych',
  sport: 'Jiu-Jitsu',
  belt: 'Branca',
  weight: '35,00',
  specialNeeds: false,
}

export default function EditAthletePage({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState(mockAthlete)

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container mx-auto px-6 pb-12">
      <section className="rounded-2xl bg-white shadow">
        <header className="border-b border-gray-200 bg-[#0C3049] px-6 py-6 text-white">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/dashboard/meus-atletas"
              className="text-white hover:text-blue-300 transition"
            >
              <FiArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold uppercase tracking-wide">
              Editar Cadastro do Atleta
            </h1>
          </div>
          <p className="text-sm text-blue-100">Atualize as informações do atleta</p>
        </header>

        <div className="px-6 py-8">
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-blue">
                Informações do atleta
              </h3>

              {/* Upload de Foto */}
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-400">
                  <FiUpload size={32} />
                </div>
                <button className="text-sm font-semibold text-primary-blue hover:text-blue-600">
                  Alterar foto
                </button>
              </div>

              {/* Alerta */}
              <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <FiAlertTriangle className="mt-1 flex-shrink-0" size={18} />
                <div>
                  <strong className="uppercase tracking-wide">Atenção</strong>
                  <p className="text-xs text-blue-600">
                    Essa ficha é apenas do cadastro do atleta. Após o cadastro será necessário fazer a inscrição do atleta.
                  </p>
                </div>
              </div>

              {/* Formulário */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Digite o nome completo"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    CPF <span className="lowercase text-gray-400">(não obrigatório)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => handleChange('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Sexo
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/30"
                  >
                    <option value="F">Feminino</option>
                    <option value="M">Masculino</option>
                    <option value="O">Outro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Data de nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleChange('birthDate', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/30"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Possui alguma necessidade especial?
                  </label>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="necessidade"
                        checked={formData.specialNeeds}
                        onChange={() => handleChange('specialNeeds', true)}
                        className="h-4 w-4 border-gray-300 text-primary-blue focus:ring-primary-blue/60"
                      />
                      Sim
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="necessidade"
                        checked={!formData.specialNeeds}
                        onChange={() => handleChange('specialNeeds', false)}
                        className="h-4 w-4 border-gray-300 text-primary-blue focus:ring-primary-blue/60"
                      />
                      Não
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Equipe
                </label>
                <input
                  type="text"
                  value={formData.team}
                  onChange={(e) => handleChange('team', e.target.value)}
                  placeholder="Digite, aguarde e selecione..."
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/30"
                />
                <p className="text-xs text-primary-blue">
                  Caso não localize, cadastre-a <a href="#" className="underline">aqui</a>.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Professor
                  </label>
                  <input
                    type="text"
                    value={formData.coach}
                    onChange={(e) => handleChange('coach', e.target.value)}
                    placeholder="Digite o nome do professor"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/30"
                  />
                  <p className="text-xs text-primary-blue">
                    Caso não localize, cadastre-o <a href="#" className="underline">aqui</a>.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Esporte
                  </label>
                  <select
                    value={formData.sport}
                    onChange={(e) => handleChange('sport', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/30"
                  >
                    <option>Jiu-Jitsu</option>
                    <option>No-Gi</option>
                    <option>Grappling</option>
                    <option>Outra modalidade</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Graduação
                  </label>
                  <select
                    value={formData.belt}
                    onChange={(e) => handleChange('belt', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/30"
                  >
                    <option>Faixa branca</option>
                    <option>Faixa cinza</option>
                    <option>Faixa amarela</option>
                    <option>Faixa laranja</option>
                    <option>Faixa verde</option>
                    <option>Faixa azul</option>
                    <option>Faixa roxa</option>
                    <option>Faixa marrom</option>
                    <option>Faixa preta</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Peso (com kimono trançado)
                  </label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => handleChange('weight', e.target.value)}
                    placeholder="Ex.: 74,8 ou 81,2"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/30"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Botões de Ação */}
          <footer className="mt-8 flex items-center justify-between border-t pt-6">
            <Link
              href="/dashboard/meus-atletas"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-gray-500 hover:border-primary-blue hover:text-primary-blue transition"
            >
              Cancelar
            </Link>
            <button className="rounded-lg bg-primary-blue px-6 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow hover:bg-blue-700 transition">
              Salvar Alterações
            </button>
          </footer>
        </div>
      </section>
    </div>
  )
}

