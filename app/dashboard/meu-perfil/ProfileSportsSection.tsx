import type { ReactNode } from 'react'

export default function ProfileSportsSection({
  faixa,
  pesoKg,
  teamName,
  professorName,
}: {
  faixa: string | null
  pesoKg: number | null
  teamName: string | null
  professorName: string | null
}) {
  const rows: Array<{ label: string; value: ReactNode }> = [
    { label: 'Modalidade', value: 'Jiu-Jitsu' },
  ]
  if (faixa) rows.push({ label: 'Faixa', value: faixa })
  if (pesoKg != null && Number.isFinite(pesoKg)) rows.push({ label: 'Peso', value: `${pesoKg} kg` })
  if (teamName) rows.push({ label: 'Equipe', value: teamName })
  if (professorName) rows.push({ label: 'Professor', value: professorName })

  if (rows.length <= 1 && !faixa && !teamName) return null

  return (
    <section aria-labelledby="sports-profile-title" className="rounded-mc-large border border-mc-border bg-mc-surface p-mc-16 sm:p-mc-24">
      <h2 id="sports-profile-title" className="font-mc-display text-mc-h3 text-mc-text-primary">
        Perfil esportivo
      </h2>
      <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">
        Dados esportivos já vinculados à sua conta. A edição segue os fluxos existentes de atleta e equipe.
      </p>
      <dl className="mt-mc-16 grid gap-mc-12 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-mc-medium bg-mc-surface-secondary px-mc-16 py-mc-12">
            <dt className="font-mc-interface text-xs font-semibold uppercase tracking-[0.12em] text-mc-text-secondary">
              {row.label}
            </dt>
            <dd className="mt-mc-4 font-mc-interface text-sm font-semibold text-mc-text-primary">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
