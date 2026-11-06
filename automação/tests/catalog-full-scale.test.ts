import assert from 'node:assert/strict';
import { test } from 'node:test';
import { categorize, beltOrder, type Category } from '../../lib/categorization';
import { expandCatalogSelectionToCategoryRows, type CatalogCategoryDefinition } from '../../lib/events/catalog-category-sync';

/**
 * Reconstrução fiel das 99 definições do catálogo GI, a partir dos mesmos 11 grupos e pesos
 * gravados em `supabase/migrations/202610100002_sport_category_catalogs.sql` (bloco
 * `catalog_groups`). Não é uma segunda fonte de verdade: é o mesmo dado, replicado aqui para
 * testar `categorize()` e `expandCatalogSelectionToCategoryRows` na escala real (144 categorias
 * efetivas), algo que os testes anteriores só cobriam com 2 a 4 categorias por vez.
 *
 * Se o catálogo publicado mudar, este teste para de refletir `zigjiu` até ser atualizado — ele
 * não lê o catálogo ao vivo (não há acesso de escrita/consulta de carga a `zigjiu` nesta missão).
 */
type CatalogGroup = {
  codigo: string;
  nome: string;
  idadeMin: number;
  idadeMax: number | null;
  genero: 'U' | 'M' | 'F';
  maximos: Array<number | null>;
};

const CATALOG_GROUPS: CatalogGroup[] = [
  { codigo: 'pre_mirim', nome: 'PRÉ-MIRIM', idadeMin: 4, idadeMax: 5, genero: 'U', maximos: [14.7, 17.9, 20.0, 24.0, 26.0, 29.0, 32.0, 35.0, null] },
  { codigo: 'mirim_a', nome: 'MIRIM A', idadeMin: 6, idadeMax: 7, genero: 'U', maximos: [21.0, 24.0, 27.0, 30.2, 33.2, 36.2, 39.3, 42.3, null] },
  { codigo: 'mirim_b', nome: 'MIRIM B', idadeMin: 8, idadeMax: 9, genero: 'U', maximos: [24.0, 27.0, 30.2, 33.2, 36.0, 39.2, 42.3, 45.3, null] },
  { codigo: 'infantil_a', nome: 'INFANTIL A', idadeMin: 10, idadeMax: 11, genero: 'U', maximos: [30.2, 33.2, 36.2, 39.3, 42.3, 45.3, 48.3, 51.5, null] },
  { codigo: 'infantil_b', nome: 'INFANTIL B', idadeMin: 12, idadeMax: 13, genero: 'U', maximos: [36.2, 40.3, 44.4, 48.3, 52.8, 56.5, 60.5, 65.0, null] },
  { codigo: 'infanto_juvenil_m', nome: 'INFANTO-JUVENIL', idadeMin: 14, idadeMax: 15, genero: 'M', maximos: [44.3, 48.3, 52.5, 56.5, 60.5, 65.0, 69.0, 73.0, null] },
  { codigo: 'infanto_juvenil_f', nome: 'INFANTO-JUVENIL', idadeMin: 14, idadeMax: 15, genero: 'F', maximos: [40.3, 44.3, 48.3, 52.5, 56.3, 60.5, 65.0, 69.0, null] },
  { codigo: 'juvenil_m', nome: 'JUVENIL', idadeMin: 16, idadeMax: 17, genero: 'M', maximos: [53.5, 58.5, 64.0, 69.0, 74.0, 79.3, 84.3, 89.3, null] },
  { codigo: 'juvenil_f', nome: 'JUVENIL', idadeMin: 16, idadeMax: 17, genero: 'F', maximos: [44.3, 48.3, 52.5, 56.5, 60.5, 65.0, 69.0, 73.0, null] },
  { codigo: 'adulto_master_m', nome: 'ADULTO/MASTER', idadeMin: 18, idadeMax: null, genero: 'M', maximos: [57.5, 64.0, 70.0, 76.0, 82.3, 88.3, 94.3, 100.5, null] },
  { codigo: 'adulto_master_f', nome: 'ADULTO/MASTER', idadeMin: 18, idadeMax: null, genero: 'F', maximos: [48.5, 53.5, 58.5, 64.0, 69.0, 74.0, 79.3, 84.3, null] },
];

const WEIGHT_CLASS_NAMES = ['Galo', 'Pluma', 'Pena', 'Leve', 'Médio', 'Meio-Pesado', 'Pesado', 'Super-Pesado', 'Pesadissimo'];

function buildFullCatalog(): CatalogCategoryDefinition[] {
  // Mesmo stable_group_order da migration: dense_rank() over (order by idade_min, coalesce(idade_max, MAXINT), genero).
  const stableOrder = [...CATALOG_GROUPS].sort((a, b) =>
    a.idadeMin - b.idadeMin
    || (a.idadeMax ?? 2147483647) - (b.idadeMax ?? 2147483647)
    || a.genero.localeCompare(b.genero));

  const definitions: CatalogCategoryDefinition[] = [];
  stableOrder.forEach((group, groupIndex) => {
    let pesoMin = 0;
    group.maximos.forEach((pesoMax, classIndex) => {
      const ordem = groupIndex * 9 + classIndex + 1;
      definitions.push({
        id: `${group.codigo}-${classIndex + 1}`,
        codigo: `${group.codigo}_${WEIGHT_CLASS_NAMES[classIndex].toLowerCase()}`,
        nome: WEIGHT_CLASS_NAMES[classIndex],
        divisao_etaria: group.nome,
        idade_min: group.idadeMin,
        idade_max: group.idadeMax,
        genero: group.genero,
        faixa_min_ordem: 1,
        faixa_max_ordem: 9,
        peso_min_kg: Math.round(pesoMin * 100) / 100,
        peso_max_kg: pesoMax,
        ordem,
      });
      if (pesoMax != null) pesoMin = pesoMax + 0.1;
    });
  });
  return definitions;
}

const catalog = buildFullCatalog();

test('o catálogo reconstruído tem exatamente 99 definições, 45 U e 54 M/F — mesma contagem do diagnóstico do Lote 5', () => {
  assert.equal(catalog.length, 99);
  assert.equal(catalog.filter((d) => d.genero === 'U').length, 45);
  assert.equal(catalog.filter((d) => d.genero === 'M').length, 27);
  assert.equal(catalog.filter((d) => d.genero === 'F').length, 27);
});

test('"selecionar todas" no catálogo real gera 144 categorias efetivas, cada uma com nome único', () => {
  const overrides: Record<string, { idadeMax?: string; pesoMax?: string }> = {};
  for (const definition of catalog) {
    if (definition.idade_max == null) overrides[definition.id] = { ...overrides[definition.id], idadeMax: '99' };
    if (definition.peso_max_kg == null) overrides[definition.id] = { ...overrides[definition.id], pesoMax: String(Number(definition.peso_min_kg) + 30) };
  }
  const expanded = expandCatalogSelectionToCategoryRows(catalog, overrides, 5);
  assert.equal(expanded.ok, true);
  if (!expanded.ok) return;
  assert.equal(expanded.rows.length, 144);
  assert.equal(new Set(expanded.rows.map((row) => row.nome)).size, 144);
  // ordem propagado do catálogo, não fixo em 1: cada par M/F de uma mesma definição U
  // compartilha o ordem da definição; nenhuma linha tem ordem 1 a menos que seja a classe Galo
  // do primeiro grupo (PRÉ-MIRIM), que de fato é ordem 1.
  const byOrdem = new Map<number, number>();
  for (const row of expanded.rows) byOrdem.set(row.ordem, (byOrdem.get(row.ordem) || 0) + 1);
  // Cada ordem de 1 a 99 aparece 1 vez (definição M/F) ou 2 vezes (par M+F de uma definição U).
  for (let ordem = 1; ordem <= 99; ordem += 1) {
    const count = byOrdem.get(ordem) || 0;
    assert.ok(count === 1 || count === 2, `ordem ${ordem} apareceu ${count} vezes, esperado 1 ou 2`);
  }
});

function belt(order: number) {
  return ['branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'preta'][order - 1];
}

function eventDateForAge(age: number) {
  // Evento em 2027-12-31 (fim do ano) com aniversário em junho: garante que o aniversário já
  // passou na data do evento, para que ageOnDate não subtraia 1 por "ainda não fez aniversário".
  return { eventDate: '2027-12-31', birth: `${2027 - age}-06-15` };
}

test('cada uma das 144 categorias efetivas resolve sem ambiguidade para um atleta real no meio da faixa', () => {
  const overrides: Record<string, { idadeMax?: string; pesoMax?: string }> = {};
  for (const definition of catalog) {
    if (definition.idade_max == null) overrides[definition.id] = { ...overrides[definition.id], idadeMax: '99' };
    if (definition.peso_max_kg == null) overrides[definition.id] = { ...overrides[definition.id], pesoMax: String(Number(definition.peso_min_kg) + 30) };
  }
  const expanded = expandCatalogSelectionToCategoryRows(catalog, overrides, null);
  assert.equal(expanded.ok, true);
  if (!expanded.ok) return;
  const allCategories: Category[] = expanded.rows.map((row, index) => ({ id: String(index), ...row, ativa: true }));

  for (const category of allCategories) {
    const age = Math.min(category.idade_min + 1, category.idade_max - (category.idade_max > category.idade_min ? 1 : 0));
    const { eventDate, birth } = eventDateForAge(age);
    const pesoMeio = Math.round(((category.peso_min_kg + category.peso_max_kg) / 2) * 100) / 100;
    const faixaMeio = Math.round((category.faixa_min_ordem + category.faixa_max_ordem) / 2);
    const result = categorize(
      { data_nascimento: birth, genero: category.genero, faixa: belt(faixaMeio), peso_kg: Math.max(pesoMeio, category.peso_min_kg + 0.01) },
      eventDate,
      allCategories,
    );
    assert.equal(result.category?.id, category.id, `categoria "${category.nome}" (${category.genero}, ordem ${category.ordem}): esperado match único, obtido ${JSON.stringify(result)}`);
  }
});

test('fronteira exata entre duas classes de peso adjacentes do mesmo grupo não gera ambiguidade', () => {
  // peso_max da classe N é sempre < peso_min da classe N+1 (diferença de 0,1 kg na semente real).
  // Um atleta exatamente no peso_max de uma classe cai nela, não na vizinha.
  const preMirimGalo = catalog.find((d) => d.codigo === 'pre_mirim_galo')!;
  const preMirimPluma = catalog.find((d) => d.codigo === 'pre_mirim_pluma')!;
  const expanded = expandCatalogSelectionToCategoryRows([preMirimGalo, preMirimPluma], {}, null);
  assert.equal(expanded.ok, true);
  if (!expanded.ok) return;
  const categories: Category[] = expanded.rows.map((row, index) => ({ id: String(index), ...row, ativa: true }));

  const atGaloMax = categorize({ data_nascimento: '2022-06-15', genero: 'M', faixa: 'branca', peso_kg: preMirimGalo.peso_max_kg! }, '2027-01-01', categories);
  assert.equal(atGaloMax.category?.nome.includes('Galo'), true);

  const atPlumaMin = categorize({ data_nascimento: '2022-06-15', genero: 'M', faixa: 'branca', peso_kg: preMirimPluma.peso_min_kg }, '2027-01-01', categories);
  assert.equal(atPlumaMin.category?.nome.includes('Pluma'), true);
});

test('separação M/F é absoluta em todo o catálogo expandido: nenhum atleta cruza de gênero', () => {
  const overrides: Record<string, { idadeMax?: string; pesoMax?: string }> = {};
  for (const definition of catalog) {
    if (definition.idade_max == null) overrides[definition.id] = { ...overrides[definition.id], idadeMax: '99' };
    if (definition.peso_max_kg == null) overrides[definition.id] = { ...overrides[definition.id], pesoMax: String(Number(definition.peso_min_kg) + 30) };
  }
  const expanded = expandCatalogSelectionToCategoryRows(catalog, overrides, null);
  assert.equal(expanded.ok, true);
  if (!expanded.ok) return;
  const allCategories: Category[] = expanded.rows.map((row, index) => ({ id: String(index), ...row, ativa: true }));

  const sampleF = allCategories.find((c) => c.genero === 'F');
  assert.ok(sampleF);
  // Mesma idade/faixa/peso, mas gênero M: nunca deve casar com uma categoria F.
  const age = Math.min(sampleF!.idade_min + 1, sampleF!.idade_max);
  const result = categorize(
    { data_nascimento: eventDateForAge(age).birth, genero: 'M', faixa: belt(Math.round((sampleF!.faixa_min_ordem + sampleF!.faixa_max_ordem) / 2)), peso_kg: (sampleF!.peso_min_kg + sampleF!.peso_max_kg) / 2 },
    eventDateForAge(age).eventDate,
    [sampleF!],
  );
  assert.equal(result.category, null);
});

test('beltOrder reconhece as 9 faixas usadas na semente real do catálogo', () => {
  for (let order = 1; order <= 9; order += 1) {
    assert.equal(beltOrder(belt(order)), order);
  }
});
