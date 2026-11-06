export type CatalogCategoryDefinition = {
  id: string
  codigo?: string
  nome: string
  divisao_etaria: string
  idade_min: number
  idade_max: number | null
  genero: string
  faixa_min_ordem: number
  faixa_max_ordem: number
  peso_min_kg: number
  peso_max_kg: number | null
  ordem?: number
}

export type CategoryFormState = {
  catalogCategoryId: string
  categoryName: string
  genero: string
  idadeMin: string
  idadeMax: string
  faixaMin: string
  faixaMax: string
  pesoMin: string
  pesoMax: string
}

export const INITIAL_CUSTOM_CATEGORY_STATE: CategoryFormState = {
  catalogCategoryId: '',
  categoryName: '',
  genero: 'M',
  idadeMin: '18',
  idadeMax: '29',
  faixaMin: '1',
  faixaMax: '1',
  pesoMin: '0',
  pesoMax: '76',
}

export function formatCatalogCategoryDefaultName(definition: CatalogCategoryDefinition): string {
  const genderPart =
    definition.genero === 'M'
      ? 'Masculino'
      : definition.genero === 'F'
        ? 'Feminino'
        : ''
  return [definition.divisao_etaria, genderPart, definition.nome]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')
}

export function deriveCategoryFormStateFromCatalog(
  definition: CatalogCategoryDefinition,
  currentCategoryName = '',
  previousAutoName = '',
): CategoryFormState {
  const autoName = formatCatalogCategoryDefaultName(definition)
  const trimmedCurrent = currentCategoryName.trim()
  const shouldSetAutoName = !trimmedCurrent || trimmedCurrent === previousAutoName.trim()

  return {
    catalogCategoryId: definition.id,
    categoryName: shouldSetAutoName ? autoName : currentCategoryName,
    genero: definition.genero === 'U' ? '' : definition.genero,
    idadeMin: String(definition.idade_min),
    idadeMax: definition.idade_max == null ? '' : String(definition.idade_max),
    faixaMin: String(definition.faixa_min_ordem),
    faixaMax: String(definition.faixa_max_ordem),
    pesoMin: String(Number(definition.peso_min_kg)),
    pesoMax: definition.peso_max_kg == null ? '' : String(Number(definition.peso_max_kg)),
  }
}

export type CategoryValidationInput = {
  categoryName: string
  genero: string
  idadeMinRaw: string
  idadeMaxRaw: string
  faixaMinRaw: string
  faixaMaxRaw: string
  pesoMinRaw: string
  pesoMaxRaw: string
}

export type ValidatedCategoryPayload = {
  nome: string
  genero: 'M' | 'F'
  idade_min: number
  idade_max: number
  faixa_min_ordem: number
  faixa_max_ordem: number
  peso_min_kg: number
  peso_max_kg: number
}

export type CategoryVersionRow = ValidatedCategoryPayload & {
  catalog_category_id: string | null
  ordem: number
  fight_duration_minutes: number | null
}

/** Uma definição compartilhada vira um único lote. O insert desse lote é uma sentença só. */
export function buildCategoryVersionRows(
  values: ValidatedCategoryPayload[],
  catalogCategoryId: string | null,
  fightDurationMinutes: number | null,
): CategoryVersionRow[] {
  return values.map((value) => ({
    ...value,
    ordem: 1,
    fight_duration_minutes: fightDurationMinutes,
    catalog_category_id: catalogCategoryId,
  }))
}

export function categoryInsertCompensation(deleteFailed: boolean) {
  if (deleteFailed) {
    return {
      compensated: false,
      message: 'Não foi possível cadastrar as categorias. A versão vazia pode ter permanecido inativa.',
    }
  }
  return {
    compensated: true,
    message: 'Não foi possível cadastrar as categorias.',
  }
}

export function competitiveGenderLabel(genero: string) {
  if (genero === 'M') return 'Masculino'
  if (genero === 'F') return 'Feminino'
  if (genero === 'U') return 'Parâmetros compartilhados'
  return genero
}

function effectiveCategoryName(base: string, genero: 'M' | 'F') {
  const label = competitiveGenderLabel(genero)
  return base.toLocaleLowerCase('pt-BR').includes(label.toLocaleLowerCase('pt-BR')) ? base : `${base} ${label}`
}

export function validateCategoryInputAgainstCatalog(
  input: CategoryValidationInput,
  definition: CatalogCategoryDefinition | null,
): { ok: true; values: ValidatedCategoryPayload[] } | { ok: false; message: string } {
  const nome = input.categoryName.trim()
  const genero = input.genero.trim().toUpperCase()
  const sharedDefinition = definition?.genero.trim().toUpperCase() === 'U'
  if (!nome) {
    return { ok: false, message: 'Informe o nome da categoria.' }
  }
  if (!sharedDefinition && genero !== 'M' && genero !== 'F') {
    return { ok: false, message: 'Selecione masculino ou feminino. Uma definição compartilhada não vira categoria mista.' }
  }

  const rawFields = [
    input.idadeMinRaw,
    input.idadeMaxRaw,
    input.faixaMinRaw,
    input.faixaMaxRaw,
    input.pesoMinRaw,
    input.pesoMaxRaw,
  ]
  if (rawFields.some((field) => field.trim() === '')) {
    return { ok: false, message: 'Preencha todos os limites de idade, faixa e peso da categoria.' }
  }

  const idadeMin = Number(input.idadeMinRaw)
  const idadeMax = Number(input.idadeMaxRaw)
  const faixaMin = Number(input.faixaMinRaw)
  const faixaMax = Number(input.faixaMaxRaw)
  const pesoMin = Number(input.pesoMinRaw.replace(',', '.'))
  const pesoMax = Number(input.pesoMaxRaw.replace(',', '.'))

  if (
    !Number.isInteger(idadeMin) ||
    !Number.isInteger(idadeMax) ||
    idadeMin < 0 ||
    idadeMax < idadeMin ||
    !Number.isInteger(faixaMin) ||
    !Number.isInteger(faixaMax) ||
    faixaMin < 1 ||
    faixaMax > 9 ||
    faixaMax < faixaMin ||
    !Number.isFinite(pesoMin) ||
    !Number.isFinite(pesoMax) ||
    pesoMin < 0 ||
    pesoMax <= 0 ||
    pesoMax < pesoMin
  ) {
    return { ok: false, message: 'Limites da categoria inválidos.' }
  }

  if (definition) {
    const defGender = definition.genero.trim().toUpperCase()
    if (!sharedDefinition && genero !== defGender) {
      return {
        ok: false,
        message: 'O gênero informado não corresponde à categoria do catálogo selecionada.',
      }
    }

    if (definition.idade_max != null) {
      if (idadeMin !== definition.idade_min || idadeMax !== definition.idade_max) {
        return {
          ok: false,
          message: `A divisão ${definition.divisao_etaria} exige idade entre ${definition.idade_min} e ${definition.idade_max} anos.`,
        }
      }
    } else if (idadeMin < definition.idade_min) {
      return {
        ok: false,
        message: `A divisão ${definition.divisao_etaria} exige idade mínima a partir de ${definition.idade_min} anos.`,
      }
    }

    if (faixaMin < definition.faixa_min_ordem || faixaMax > definition.faixa_max_ordem) {
      return {
        ok: false,
        message: 'A faixa informada está fora dos limites permitidos pela categoria do catálogo.',
      }
    }

    const defPesoMin = Math.round(Number(definition.peso_min_kg) * 100) / 100
    const defPesoMax = definition.peso_max_kg == null ? null : Math.round(Number(definition.peso_max_kg) * 100) / 100
    const roundedPesoMin = Math.round(pesoMin * 100) / 100
    const roundedPesoMax = Math.round(pesoMax * 100) / 100

    if (defPesoMax != null) {
      if (roundedPesoMax !== defPesoMax || roundedPesoMin > defPesoMin) {
        return {
          ok: false,
          message: `A categoria ${definition.nome} (${definition.divisao_etaria}) exige peso máximo de ${defPesoMax} kg e mínimo de até ${defPesoMin} kg.`,
        }
      }
    } else if (roundedPesoMin < defPesoMin) {
      return {
        ok: false,
        message: `A categoria ${definition.nome} (${definition.divisao_etaria}) exige peso mínimo a partir de ${defPesoMin} kg.`,
      }
    }
  }

  const limits = {
    idade_min: idadeMin,
    idade_max: idadeMax,
    faixa_min_ordem: faixaMin,
    faixa_max_ordem: faixaMax,
    peso_min_kg: Math.round(pesoMin * 100) / 100,
    peso_max_kg: Math.round(pesoMax * 100) / 100,
  }
  if (sharedDefinition) {
    const values: ValidatedCategoryPayload[] = (['M', 'F'] as const).map((effectiveGender) => ({
      nome: effectiveCategoryName(nome, effectiveGender),
      genero: effectiveGender,
      ...limits,
    }))
    if (values[0].nome === values[1].nome) {
      return { ok: false, message: 'Informe um nome que distinga as categorias masculina e feminina.' }
    }
    return { ok: true, values }
  }

  return {
    ok: true,
    values: [{ nome, genero: genero as 'M' | 'F', ...limits }],
  }
}
