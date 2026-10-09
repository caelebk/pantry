import { describe, expect, it } from 'vitest';
import { ingredientDetailReturnTo } from './ingredient-detail-return';

describe('ingredientDetailReturnTo', () => {
  it.each([
    '/inventory/ingredients/ing-99',
    '/inventory/ingredients/28',
    '/inventory/ingredients/64b67ff7-5b3e-4eba-8857-2a2e2652b725',
  ])('accepts the local ingredient detail destination %s', (destination) => {
    expect(ingredientDetailReturnTo(destination)).toBe(destination);
  });

  it.each([
    null,
    undefined,
    ['/inventory/ingredients/ing-99'],
    'https://example.com/inventory/ingredients/ing-99',
    '//example.com/inventory/ingredients/ing-99',
    '/inventory/ingredients',
    '/inventory/ingredients/new',
    '/inventory/ingredients/ing-99/edit',
    '/inventory/ingredients/ing-99/unit-reconciliation',
    '/inventory/ingredients/../items',
    '/inventory/ingredients/%2e%2e',
    '/inventory/ingredients/ing-99?redirect=elsewhere',
    '/inventory/ingredients/ing-99#section',
    '/inventory/ingredients/ing-99\n',
  ])('rejects destinations outside the exact detail path: %s', (destination) => {
    expect(ingredientDetailReturnTo(destination)).toBeNull();
  });
});
