import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ageOnDate, categorize, type Category } from '../../lib/categorization';
const athlete = { data_nascimento: '2000-09-05', genero: 'M', faixa: 'Branca', peso_kg: 76 };
const category: Category = { id: '1', nome: 'Adulto', ativa: true, ordem: 1, genero: 'M', idade_min: 18, idade_max: 30, faixa_min_ordem: 1, faixa_max_ordem: 1, peso_min_kg: 60, peso_max_kg: 76 };
test('idade antes, no dia e depois do aniversário, inclusive ano bissexto', () => {
  assert.equal(ageOnDate('2000-09-05', '2026-09-04'), 25);
  assert.equal(ageOnDate('2000-09-05', '2026-09-05'), 26);
  assert.equal(ageOnDate('2000-09-05', '2026-09-06'), 26);
  assert.equal(ageOnDate('2000-02-29', '2025-02-28'), 24);
  assert.equal(ageOnDate('2000-02-29', '2025-03-01'), 25);
});
test('limites inclusivos de peso, idade e faixa', () => {
  for (const peso_kg of [60, 76]) for (const data_evento of ['2018-09-05', '2030-09-05'])
    assert.equal(categorize({ ...athlete, peso_kg }, data_evento, [category]).category?.id, '1');
});
test('bloqueia valores fora dos limites e gênero diferente', () => {
  for (const change of [{ peso_kg: 59.99 }, { peso_kg: 76.01 }, { genero: 'F' }, { faixa: 'Azul' }, { faixa: 'inexistente' }])
    assert.equal(categorize({ ...athlete, ...change }, '2026-09-05', [category]).category, null);
  for (const date of ['2018-09-04', '2031-09-05'])
    assert.equal(categorize(athlete, date, [category]).category, null);
});
test('ordem resolve sobreposição; empate bloqueia; inativa ignorada', () => {
  assert.equal(categorize(athlete, '2026-09-05', [category, { ...category, id: '2', ordem: 2 }]).category?.id, '1');
  assert.match(categorize(athlete, '2026-09-05', [category, { ...category, id: '2' }]).reason, /ambígua/);
  assert.equal(categorize(athlete, '2026-09-05', [{ ...category, ativa: false }]).category, null);
});

function childPair(id: string, idadeMin: number, idadeMax: number, pesoMax: number): Category[] {
  const shared = { ativa: true, ordem: 1, idade_min: idadeMin, idade_max: idadeMax, faixa_min_ordem: 1, faixa_max_ordem: 9, peso_min_kg: 0, peso_max_kg: pesoMax };
  return [
    { ...shared, id: `${id}-m`, nome: `${id} Masculino`, genero: 'M' },
    { ...shared, id: `${id}-f`, nome: `${id} Feminino`, genero: 'F' },
  ];
}

test('categorias efetivas separam meninos e meninas, inclusive dos 4 aos 13 anos', () => {
  const cases = [
    { birth: '2021-05-01', ageBand: [4, 5, 14.7], label: '5 anos' },
    { birth: '2018-03-01', ageBand: [8, 9, 30.2], label: '8 anos' },
    { birth: '2014-03-01', ageBand: [12, 13, 36.2], label: '12 anos' },
    { birth: '2013-03-01', ageBand: [12, 13, 36.2], label: '13 anos' },
  ] as const;
  for (const item of cases) {
    const [idadeMin, idadeMax, pesoMax] = item.ageBand;
    const categories = childPair(item.label, idadeMin, idadeMax, pesoMax);
    const boy = categorize({ data_nascimento: item.birth, genero: 'M', faixa: 'Branca', peso_kg: 14 }, '2026-09-05', categories);
    const girl = categorize({ data_nascimento: item.birth, genero: 'F', faixa: 'Branca', peso_kg: 14 }, '2026-09-05', categories);
    assert.equal(boy.category?.genero, 'M', item.label);
    assert.equal(girl.category?.genero, 'F', item.label);
    assert.notEqual(boy.category?.id, girl.category?.id);
    assert.equal(categorize({ data_nascimento: item.birth, genero: 'O', faixa: 'Branca', peso_kg: 14 }, '2026-09-05', categories).category, null);
  }
});

test('definição U gravada como categoria única não aceita M nem F', () => {
  const shared: Category = { id: 'u', nome: 'PRÉ-MIRIM Galo', ativa: true, ordem: 1, genero: 'U', idade_min: 4, idade_max: 5, faixa_min_ordem: 1, faixa_max_ordem: 9, peso_min_kg: 0, peso_max_kg: 14.7 };
  assert.equal(categorize({ data_nascimento: '2021-05-01', genero: 'M', faixa: 'Branca', peso_kg: 14 }, '2026-09-05', [shared]).category, null);
  assert.equal(categorize({ data_nascimento: '2021-05-01', genero: 'F', faixa: 'Branca', peso_kg: 14 }, '2026-09-05', [shared]).category, null);
});

test('a partir de 14 anos a categoria masculina não recebe atleta feminina', () => {
  const juvenil: Category[] = [
    { id: 'jm', nome: 'INFANTO Masculino', ativa: true, ordem: 1, genero: 'M', idade_min: 14, idade_max: 15, faixa_min_ordem: 1, faixa_max_ordem: 9, peso_min_kg: 0, peso_max_kg: 44.3 },
    { id: 'jf', nome: 'INFANTO Feminino', ativa: true, ordem: 1, genero: 'F', idade_min: 14, idade_max: 15, faixa_min_ordem: 1, faixa_max_ordem: 9, peso_min_kg: 0, peso_max_kg: 40.3 },
  ];
  assert.equal(categorize({ data_nascimento: '2012-01-01', genero: 'M', faixa: 'Branca', peso_kg: 40 }, '2026-09-05', juvenil).category?.id, 'jm');
  assert.equal(categorize({ data_nascimento: '2012-01-01', genero: 'F', faixa: 'Branca', peso_kg: 40 }, '2026-09-05', juvenil).category?.id, 'jf');
  assert.equal(categorize({ data_nascimento: '2012-01-01', genero: 'F', faixa: 'Branca', peso_kg: 44 }, '2026-09-05', juvenil).category, null);
});

test('um único competidor permanece na própria categoria', () => {
  const alone = childPair('sozinho', 4, 5, 14.7);
  const result = categorize({ data_nascimento: '2021-05-01', genero: 'M', faixa: 'Branca', peso_kg: 14 }, '2026-09-05', alone);
  assert.equal(result.category?.id, 'sozinho-m');
  assert.equal(result.category?.genero, 'M');
});
