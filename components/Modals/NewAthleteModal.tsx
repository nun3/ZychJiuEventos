'use client'

import { FiAlertTriangle, FiUpload } from 'react-icons/fi'

interface NewAthleteModalProps {
  open: boolean
  onClose: () => void
}

export default function NewAthleteModal({ open, onClose }: NewAthleteModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold uppercase tracking-wide text-primary-red">Editar Cadastro</h2>
          <button
            onClick={onClose}
            className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500 transition hover:border-primary-red hover:text-primary-red"
          >
            Fechar
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-6">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-red">Informações do atleta</h3>

            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-400">
                <FiUpload size={32} />
              </div>
              <button className="text-sm font-semibold text-primary-orange hover:text-orange-600">
                Alterar foto
              </button>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <FiAlertTriangle className="mt-1 flex-shrink-0" size={18} />
              <div>
                <strong className="uppercase tracking-wide">Atenção</strong>
                <p className="text-xs text-red-600">
                  Essa ficha é apenas do cadastro do atleta. Após o cadastro será necessário fazer a inscrição do atleta.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Nome completo</label>
                <input
                  type="text"
                  placeholder="Digite o nome completo"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  CPF <span className="lowercase text-gray-400">(não obrigatório)</span>
                </label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Sexo</label>
                <select className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30">
                  <option>Selecione</option>
                  <option>Feminino</option>
                  <option>Masculino</option>
                  <option>Outro</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Data de nascimento</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
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
                      className="h-4 w-4 border-gray-300 text-primary-orange focus:ring-primary-orange/60"
                    />
                    Sim
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="necessidade"
                      defaultChecked
                      className="h-4 w-4 border-gray-300 text-primary-orange focus:ring-primary-orange/60"
                    />
                    Não
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Equipe</label>
                <input
                  type="text"
                  placeholder="Digite, aguarde e selecione..."
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                />
                <p className="text-xs text-primary-orange">
                  Caso não localize, cadastre-a <a href="#" className="underline">aqui</a>.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Professor</label>
                  <input
                    type="text"
                    placeholder="Digite o nome do professor"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                  />
                  <p className="text-xs text-primary-orange">
                    Caso não localize, cadastre-o <a href="#" className="underline">aqui</a>.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Esporte</label>
                  <select className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30">
                    <option>Jiu-Jitsu</option>
                    <option>No-Gi</option>
                    <option>Grappling</option>
                    <option>Outra modalidade</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Graduação</label>
                  <select className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30">
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
                    placeholder="Ex.: 74,8 ou 81,2"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/30"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Atleta</h4>
              <label className="mt-3 inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-orange focus:ring-primary-orange/60"
                />
                Irá cadastrar outro atleta?
              </label>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Evento</h4>
              <label className="mt-3 inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-orange focus:ring-primary-orange/60"
                />
                Iniciar inscrição após cadastro?
              </label>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-between border-t bg-white px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-gray-500 hover:border-primary-red hover:text-primary-red transition"
          >
            Cancelar
          </button>
          <button className="rounded-lg bg-primary-red px-6 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow hover:bg-red-700 transition">
            Salvar
          </button>
        </footer>
      </div>
    </div>
  )
}

