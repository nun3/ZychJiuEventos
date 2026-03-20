'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiUser, FiEdit, FiUsers, FiClipboard, FiAward, FiCreditCard, FiChevronRight, FiCamera, FiSave, FiX } from 'react-icons/fi'

const menuItems = [
  { href: '/dashboard/meu-perfil', label: 'Meu Perfil', icon: FiUser },
  { href: '/dashboard/alterar-cadastro', label: 'Alterar Meu Cadastro', icon: FiEdit, active: true },
  { href: '/dashboard/meus-atletas', label: 'Meus Atletas', icon: FiUsers },
  { href: '/dashboard/inscricoes', label: 'Inscrições Realizadas', icon: FiClipboard },
  { href: '/dashboard/minhas-filiacoes', label: 'Minhas Filiações', icon: FiAward },
  { href: '/dashboard/meus-ingressos', label: 'Meus Ingressos', icon: FiCreditCard },
]

export default function AlterarCadastroPage() {
  const [formData, setFormData] = useState({
    // Informações Pessoais
    perfil: 'Atleta maior de 18 anos ou Professor',
    nomeCompleto: 'Ricardo Zych',
    cpf: '035.619.349-78',
    sexo: 'Masculino',
    dataNascimento: '26/11/1982',
    necessidadeEspecial: true,
    
    // Informações do Atleta
    equipe: 'ZYCH JIU JITSU',
    professor: 'RICARDO ZYCH',
    esporte: 'Jiu-Jitsu',
    graduacao: 'Preta',
    peso: '77.00',
    
    // Informações de Endereço
    pais: 'BRASIL',
    estado: 'PARANÁ',
    cidade: 'PATO BRANCO',
    bairro: 'PINHEIRINHO',
    endereco: 'RUA LUPICINIO RODRIGUES',
    numero: '797',
    cep: '85506-150',
    
    // Informações de Contato
    email: 'ricardoweb@gmail.com',
    telefone: '(46) 98406-4666',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Dados atualizados:', formData)
    // Aqui você faria a chamada à API para salvar os dados
  }

  return (
    <div className="container mx-auto px-6 pt-6 pb-12">
      <section className="rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#0C3049] via-blue-800 to-[#0C3049] px-6 py-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="relative">
            <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wide mb-2">Alterar Cadastro</h1>
            <p className="text-base text-blue-100">Atualize suas informações pessoais e de contato</p>
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

          {/* Formulário Principal */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seção: Informações Pessoais */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-6 uppercase tracking-wide flex items-center gap-2">
                  <FiUser size={20} className="text-primary-blue" />
                  Informações Pessoais
                </h2>

                {/* Foto */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Foto</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center overflow-hidden">
                      <FiUser size={40} className="text-gray-400" />
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      <FiCamera size={18} />
                      Alterar Foto
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Perfil */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Perfil</label>
                    <select
                      name="perfil"
                      value={formData.perfil}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                    >
                      <option>Atleta maior de 18 anos ou Professor</option>
                      <option>Atleta menor de 18 anos</option>
                      <option>Responsável</option>
                    </select>
                  </div>

                  {/* Nome Completo */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Nome Completo</label>
                    <input
                      type="text"
                      name="nomeCompleto"
                      value={formData.nomeCompleto}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                    />
                  </div>

                  {/* CPF */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">CPF</label>
                    <input
                      type="text"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleChange}
                      placeholder="000.000.000-00"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                    />
                  </div>

                  {/* Sexo */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Sexo</label>
                    <select
                      name="sexo"
                      value={formData.sexo}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                    >
                      <option>Masculino</option>
                      <option>Feminino</option>
                    </select>
                  </div>

                  {/* Data de Nascimento */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Data de Nascimento</label>
                    <input
                      type="text"
                      name="dataNascimento"
                      value={formData.dataNascimento}
                      onChange={handleChange}
                      placeholder="DD/MM/AAAA"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                    />
                  </div>

                  {/* Necessidade Especial */}
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="necessidadeEspecial"
                        checked={formData.necessidadeEspecial}
                        onChange={handleChange}
                        className="w-5 h-5 text-primary-blue border-gray-300 rounded focus:ring-primary-blue"
                      />
                      <span className="text-sm font-semibold text-gray-700 uppercase">
                        Possui Alguma Necessidade Especial?
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Seção: Informações do Atleta */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-6 uppercase tracking-wide flex items-center gap-2">
                  <FiUsers size={20} className="text-primary-blue" />
                  Informações do Atleta
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Equipe */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Equipe</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="equipe"
                        value={formData.equipe}
                        onChange={handleChange}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Caso não localize a equipe,{' '}
                      <a href="#" className="text-primary-blue hover:underline">cadastre-a aqui</a>.
                    </p>
                  </div>

                  {/* Professor */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Professor</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="professor"
                        value={formData.professor}
                        onChange={handleChange}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Caso não localize o professor,{' '}
                      <a href="#" className="text-primary-blue hover:underline">cadastre-o aqui</a>.
                    </p>
                  </div>

                  {/* Esporte */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Esporte</label>
                    <select
                      name="esporte"
                      value={formData.esporte}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                    >
                      <option>Jiu-Jitsu</option>
                      <option>Judô</option>
                      <option>Karate</option>
                      <option>Taekwondo</option>
                    </select>
                  </div>

                  {/* Graduação */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Graduação</label>
                    <select
                      name="graduacao"
                      value={formData.graduacao}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                    >
                      <option>Branca</option>
                      <option>Cinza</option>
                      <option>Amarela</option>
                      <option>Laranja</option>
                      <option>Verde</option>
                      <option>Azul</option>
                      <option>Roxa</option>
                      <option>Marrom</option>
                      <option>Preta</option>
                    </select>
                  </div>

                  {/* Peso */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                      Peso (com kimono trançado)
                    </label>
                    <input
                      type="text"
                      name="peso"
                      value={formData.peso}
                      onChange={handleChange}
                      placeholder="Exemplo: 74,8... ou 81,2..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Informações de Endereço */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-6 uppercase tracking-wide flex items-center gap-2">
                  <FiEdit size={20} className="text-primary-blue" />
                  Informações de Endereço
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* País */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">País</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="pais"
                        value={formData.pais}
                        onChange={handleChange}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Caso não localize o país,{' '}
                      <a href="#" className="text-primary-blue hover:underline">cadastre-o aqui</a>.
                    </p>
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Estado</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Caso não localize o estado,{' '}
                      <a href="#" className="text-primary-blue hover:underline">cadastre-o aqui</a>.
                    </p>
                  </div>

                  {/* Cidade */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Cidade</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="cidade"
                        value={formData.cidade}
                        onChange={handleChange}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Caso não localize a cidade,{' '}
                      <a href="#" className="text-primary-blue hover:underline">cadastre-a aqui</a>.
                    </p>
                  </div>

                  {/* Bairro */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Bairro</label>
                    <input
                      type="text"
                      name="bairro"
                      value={formData.bairro}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                    />
                  </div>

                  {/* Endereço */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Endereço</label>
                    <input
                      type="text"
                      name="endereco"
                      value={formData.endereco}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                    />
                  </div>

                  {/* Nº/Complemento */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Nº/Complemento</label>
                    <input
                      type="text"
                      name="numero"
                      value={formData.numero}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                    />
                  </div>

                  {/* CEP */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">CEP</label>
                    <input
                      type="text"
                      name="cep"
                      value={formData.cep}
                      onChange={handleChange}
                      placeholder="00000-000"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Informações de Contato */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-6 uppercase tracking-wide flex items-center gap-2">
                  <FiEdit size={20} className="text-primary-blue" />
                  Informações de Contato
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* E-mail */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                      E-mail
                      <span className="text-red-600 ml-1">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">(Importante para contato)</p>
                  </div>

                  {/* Telefone Celular */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">Telefone Celular</label>
                    <input
                      type="text"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">DDD + Nº</p>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <Link
                  href="/dashboard/meu-perfil"
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <FiX size={18} />
                  Cancelar
                </Link>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-blue text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <FiSave size={18} />
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

