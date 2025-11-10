'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import { FiInfo } from 'react-icons/fi'

const registrationTabs = [
  {
    id: 'cpf',
    label: 'Por CPF',
    placeholder: 'Digite o seu CPF',
    mask: '123.456.789-00',
    description:
      'Informe o CPF do atleta ou responsável. Será utilizado para validar o cadastro e vínculos com eventos.',
  },
  {
    id: 'email',
    label: 'Por E-mail',
    placeholder: 'Digite o seu e-mail',
    mask: 'nome@exemplo.com',
    description:
      'Caso prefira, utilize um endereço de e-mail. Enviaremos um link de confirmação para ativar sua conta.',
  },
]

type UserProfile = 'atleta' | 'responsavel'

export default function RegistrationPage() {
  const [activeTab, setActiveTab] = useState<'cpf' | 'email'>('cpf')
  const [profile, setProfile] = useState<UserProfile>('atleta')
  const [documentValue, setDocumentValue] = useState('')

  const current = registrationTabs.find((tab) => tab.id === activeTab)!

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <section className="container mx-auto px-4 pt-28 pb-16">
        <div className="flex flex-col items-center">
          <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-gray-200 bg-[#0C3049] px-6 py-4 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-orange-300">Portal do atleta</p>
                <h1 className="mt-1 text-2xl font-bold">Novo cadastro</h1>
              </div>
              <div className="text-right text-xs text-orange-100">
                Já possui cadastro?
                <br />
                <Link
                  href="/login"
                  className="mt-1 inline-flex items-center rounded-full bg-primary-orange px-4 py-1 text-sm font-semibold text-white shadow hover:bg-orange-600"
                >
                  Voltar para login
                </Link>
              </div>
            </header>

            <div className="px-8 py-8">
              <div className="mb-6 inline-flex rounded-full border border-gray-200 bg-gray-100 p-1 text-sm font-semibold text-gray-500">
                {registrationTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'cpf' | 'email')}
                    className={`rounded-full px-4 py-2 transition ${
                      tab.id === activeTab ? 'bg-white text-primary-orange shadow' : 'hover:text-primary-red'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mb-6 flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                <FiInfo className="mt-1 flex-shrink-0" size={16} />
                <p>{current.description}</p>
              </div>

              <form className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600">
                    {current.placeholder}
                  </label>
                  <input
                    type={activeTab === 'cpf' ? 'text' : 'email'}
                    placeholder={current.mask}
                    value={documentValue}
                    onChange={(event) => setDocumentValue(event.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 shadow-sm focus:border-primary-orange focus:outline-none focus:ring-2 focus:ring-primary-orange/40"
                  />
                </div>

                <fieldset className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
                  <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Você é:
                  </legend>
                  <div className="mt-3 space-y-3 text-sm text-gray-700">
                    <label className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="profile"
                        value="atleta"
                        checked={profile === 'atleta'}
                        onChange={() => setProfile('atleta')}
                        className="mt-1 h-4 w-4 border-gray-300 text-primary-orange focus:ring-primary-orange/60"
                      />
                      <div>
                        <span className="font-semibold text-gray-900">Sou atleta maior de 18 anos ou professor</span>
                        <p className="text-xs text-gray-500">
                          Cadastro destinado a atletas ou professores responsáveis por sua própria inscrição.
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="profile"
                        value="responsavel"
                        checked={profile === 'responsavel'}
                        onChange={() => setProfile('responsavel')}
                        className="mt-1 h-4 w-4 border-gray-300 text-primary-orange focus:ring-primary-orange/60"
                      />
                      <div>
                        <span className="font-semibold text-gray-900">Sou apenas responsável por atleta</span>
                        <p className="text-xs text-gray-500">
                          Use esta opção para inscrever atletas menores de idade ou terceiros.
                        </p>
                      </div>
                    </label>
                    {profile === 'responsavel' && (
                      <div className="mt-6 space-y-8">
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          <p className="font-semibold uppercase tracking-wide">Atenção</p>
                          <p className="mt-1">
                            Após finalizar o seu cadastro, acesse o menu <em>Meus Atletas</em>, botão{' '}
                            <em>Novo Cadastro</em>, para cadastrar o(s) atleta(s) sob sua responsabilidade.
                          </p>
                        </div>

                        <section className="space-y-4">
                          <header>
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-red">
                              Dados básicos
                            </h2>
                            <p className="text-xs text-gray-500">
                              Informe seus dados pessoais. O CPF/E-mail informado na etapa anterior já está associado ao
                              cadastro.
                            </p>
                          </header>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Nome completo</label>
                              <input
                                type="text"
                                placeholder="Digite seu nome completo"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Data de nascimento</label>
                              <input
                                type="date"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">
                                {activeTab === 'cpf' ? 'Seu CPF' : 'Seu e-mail'}
                              </label>
                              <input
                                type={activeTab === 'cpf' ? 'text' : 'email'}
                                value={documentValue}
                                readOnly
                                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Sexo</label>
                              <select className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30">
                                <option>Selecione</option>
                                <option>Feminino</option>
                                <option>Masculino</option>
                                <option>Outro</option>
                              </select>
                            </div>
                          </div>
                        </section>

                        <section className="space-y-4">
                          <header>
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-red">
                              Informações de endereço
                            </h2>
                          </header>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">País</label>
                              <input
                                type="text"
                                placeholder="Brasil"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Estado</label>
                              <input
                                type="text"
                                placeholder="Ex.: ES"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Cidade</label>
                              <input
                                type="text"
                                placeholder="Vitória"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Bairro</label>
                              <input
                                type="text"
                                placeholder="Centro"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1 lg:col-span-2">
                              <label className="text-xs font-semibold uppercase text-gray-600">Endereço</label>
                              <input
                                type="text"
                                placeholder="Rua, avenida, número"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Nº/Complemento</label>
                              <input
                                type="text"
                                placeholder="Apto, bloco..."
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">CEP</label>
                              <input
                                type="text"
                                placeholder="00000-000"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                          </div>
                        </section>

                        <section className="space-y-4">
                          <header>
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-red">
                              Informações de contato
                            </h2>
                          </header>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">E-mail</label>
                              <input
                                type="email"
                                placeholder="nome@exemplo.com"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Celular</label>
                              <input
                                type="tel"
                                placeholder="(00) 00000-0000"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                          </div>
                        </section>

                        <section className="space-y-4">
                          <header>
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-red">
                              Informações de acesso
                            </h2>
                          </header>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Senha</label>
                              <input
                                type="password"
                                placeholder="Crie uma senha forte"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Confirme a senha</label>
                              <input
                                type="password"
                                placeholder="Repita a senha"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                          </div>
                        </section>
                      </div>
                    )}
                    {profile === 'atleta' && (
                      <div className="mt-6 space-y-8">
                        <section className="space-y-4">
                          <header>
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-red">
                              Dados básicos
                            </h2>
                            <p className="text-xs text-gray-500">
                              Preencha conforme documento oficial. O CPF/e-mail informado anteriormente já está associado ao cadastro.
                            </p>
                          </header>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Nome completo</label>
                              <input
                                type="text"
                                placeholder="Digite seu nome completo"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Data de nascimento</label>
                              <input
                                type="date"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">
                                {activeTab === 'cpf' ? 'CPF' : 'E-mail'}
                              </label>
                              <input
                                type={activeTab === 'cpf' ? 'text' : 'email'}
                                value={documentValue}
                                readOnly
                                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Sexo</label>
                              <select className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30">
                                <option>Selecione</option>
                                <option>Feminino</option>
                                <option>Masculino</option>
                                <option>Outro</option>
                              </select>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <label className="text-xs font-semibold uppercase text-gray-600">
                                Possui necessidade especial?
                              </label>
                              <select className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30">
                                <option>Não</option>
                                <option>Sim</option>
                              </select>
                            </div>
                          </div>
                        </section>

                        <section className="space-y-4">
                          <header>
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-red">
                              Informações de endereço
                            </h2>
                            <p className="text-xs text-gray-500">Informe o endereço completo do atleta.</p>
                          </header>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">País</label>
                              <input
                                type="text"
                                placeholder="Brasil"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Estado</label>
                              <input
                                type="text"
                                placeholder="Ex.: ES"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Cidade</label>
                              <input
                                type="text"
                                placeholder="Vitória"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Bairro</label>
                              <input
                                type="text"
                                placeholder="Centro"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1 lg:col-span-2">
                              <label className="text-xs font-semibold uppercase text-gray-600">Endereço</label>
                              <input
                                type="text"
                                placeholder="Rua, avenida, número"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Nº/Complemento</label>
                              <input
                                type="text"
                                placeholder="Apto, bloco..."
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">CEP</label>
                              <input
                                type="text"
                                placeholder="00000-000"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                          </div>
                        </section>

                        <section className="space-y-4">
                          <header>
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-red">
                              Informações de contato
                            </h2>
                          </header>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">E-mail</label>
                              <input
                                type="email"
                                placeholder="nome@exemplo.com"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Celular</label>
                              <input
                                type="tel"
                                placeholder="(00) 00000-0000"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                          </div>
                        </section>

                        <section className="space-y-4">
                          <header>
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-red">
                              Informações do esporte
                            </h2>
                          </header>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Equipe</label>
                              <input
                                type="text"
                                placeholder="Selecione ou digite"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Professor</label>
                              <input
                                type="text"
                                placeholder="Nome do professor"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Esporte</label>
                              <select className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30">
                                <option>Jiu-Jitsu</option>
                                <option>Grappling</option>
                                <option>No-Gi</option>
                                <option>Outros</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Graduação</label>
                              <select className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30">
                                <option>Faixa branca</option>
                                <option>Faixa azul</option>
                                <option>Faixa roxa</option>
                                <option>Faixa marrom</option>
                                <option>Faixa preta</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Peso (kg)</label>
                              <input
                                type="number"
                                placeholder="Ex.: 75"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                          </div>
                        </section>

                        <section className="space-y-4">
                          <header>
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-red">
                              Informações de acesso
                            </h2>
                          </header>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Senha</label>
                              <input
                                type="password"
                                placeholder="Crie uma senha forte"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold uppercase text-gray-600">Confirme a senha</label>
                              <input
                                type="password"
                                placeholder="Repita a senha"
                                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                              />
                            </div>
                          </div>
                        </section>

                        <section className="space-y-4">
                          <header>
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-red">
                              Inscrição em evento
                            </h2>
                          </header>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Deseja realizar a inscrição em um evento agora?</p>
                            <div className="flex items-center gap-6">
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="inscricao-evento"
                                  className="h-4 w-4 border-gray-300 text-primary-orange focus:ring-primary-orange/60"
                                />
                                Sim
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="inscricao-evento"
                                  defaultChecked
                                  className="h-4 w-4 border-gray-300 text-primary-orange focus:ring-primary-orange/60"
                                />
                                Não
                              </label>
                            </div>
                          </div>
                        </section>
                      </div>
                    )}
                  </div>
                </fieldset>

                <div className="flex items-center justify-between">
                  <Link href="/login" className="text-sm font-semibold text-primary-red hover:text-primary-orange">
                    &larr; Voltar para tela de login
                  </Link>
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-lg bg-primary-red px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-md hover:bg-red-700 transition"
                  >
                    Avançar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppWidget />
    </main>
  )
}

