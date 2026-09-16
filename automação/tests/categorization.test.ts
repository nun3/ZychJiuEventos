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
