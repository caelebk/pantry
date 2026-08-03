import { assert, assertEquals } from '@std/assert';
import { calculateStringSimilarity } from '../src/utils/similarity.ts';

Deno.test('calculateStringSimilarity - empty or whitespace strings', () => {
  assertEquals(calculateStringSimilarity('', 'Olive Oil'), 0);
  assertEquals(calculateStringSimilarity('  ', '  '), 0);
  assertEquals(calculateStringSimilarity('Olive Oil', ''), 0);
});

Deno.test('calculateStringSimilarity - exact matches with casing and special chars', () => {
  assertEquals(calculateStringSimilarity('Olive Oil', 'olive oil'), 1.0);
  assertEquals(calculateStringSimilarity('  Olive  Oil!! ', 'olive oil'), 1.0);
  assertEquals(calculateStringSimilarity('Whole Milk (Organic)', 'whole milk organic'), 1.0);
});

Deno.test('calculateStringSimilarity - substring and partial token matches', () => {
  const score1 = calculateStringSimilarity('Olive Oil', 'Olive Oil (Extra Virgin)');
  assert(score1 >= 0.75, `Expected score >= 0.75, got ${score1}`);

  const score2 = calculateStringSimilarity('Chicken Breast', 'Chicken Thigh');
  assert(score2 >= 0.4, `Expected score >= 0.4, got ${score2}`);
  assert(score2 < 1.0, `Expected score < 1.0, got ${score2}`);
});

Deno.test('calculateStringSimilarity - completely unrelated strings', () => {
  const score = calculateStringSimilarity('Olive Oil', 'Fresh Bananas');
  assert(score < 0.3, `Expected score < 0.3, got ${score}`);
});
