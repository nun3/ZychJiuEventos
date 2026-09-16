export type Category = { id: string; nome: string; ativa: boolean; ordem: number; genero: string; idade_min: number; idade_max: number; faixa_min_ordem: number; faixa_max_ordem: number; peso_min_kg: number; peso_max_kg: number }
export type Competitor = { data_nascimento: string; genero: string; faixa: string; peso_kg: number }
export function ageOnDate(birth: string, date: string): number {
  const [by, bm, bd] = birth.split('-').map(Number)
  const [y, m, d] = date.split('-').map(Number)
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0)
}
export function categorize(athlete: Competitor, eventDate: string, categories: Category[]) {
  const belt = ['branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'preta'].indexOf(athlete.faixa.trim().toLowerCase()) + 1
  const age = ageOnDate(athlete.data_nascimento, eventDate)
  if (!belt) return { category: null, reason: 'Faixa não reconhecida.' }
  const matches = categories.filter(c => c.ativa && c.genero.toUpperCase() === athlete.genero.toUpperCase() && age >= c.idade_min && age <= c.idade_max && belt >= c.faixa_min_ordem && belt <= c.faixa_max_ordem && athlete.peso_kg >= c.peso_min_kg && athlete.peso_kg <= c.peso_max_kg).sort((a, b) => a.ordem - b.ordem)
  if (!matches.length) return { category: null, reason: 'Nenhuma categoria elegível para idade, gênero, faixa e peso informados.' }
  if (matches[1]?.ordem === matches[0].ordem) return { category: null, reason: 'Categorização ambígua. Contate a organização.' }
  return { category: matches[0], reason: '' }
}
