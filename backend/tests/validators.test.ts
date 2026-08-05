import { assertEquals } from '@std/assert';
import {
  isValidCreateIngredientDTO,
  isValidReconcileUnitsDTO,
  isValidUpdateIngredientDTO,
} from '../src/validators/ingredient.validator.ts';
import {
  isValidBulkIdsDTO,
  isValidCreateItemDTO,
  isValidUpdateItemDTO,
} from '../src/validators/item.validator.ts';

Deno.test('Ingredient Validator - isValidCreateIngredientDTO', () => {
  assertEquals(isValidCreateIngredientDTO({ name: 'Salt', defaultUnitId: 1 }), true);
  assertEquals(isValidCreateIngredientDTO({ name: '', defaultUnitId: 1 }), false);
  assertEquals(isValidCreateIngredientDTO({ name: 'Salt', defaultUnitId: 0 }), false);
  assertEquals(
    isValidCreateIngredientDTO({ name: 'Salt', defaultUnitId: 1, categoryId: -5 }),
    false,
  );
});

Deno.test('Ingredient Validator - isValidUpdateIngredientDTO', () => {
  assertEquals(isValidUpdateIngredientDTO({ name: 'Pepper' }), true);
  assertEquals(isValidUpdateIngredientDTO({ name: '' }), false);
  assertEquals(isValidUpdateIngredientDTO({ defaultUnitId: -1 }), false);
});

Deno.test('Ingredient Validator - isValidReconcileUnitsDTO', () => {
  const valid = {
    newDefaultUnitId: 2,
    items: [
      { id: '123e4567-e89b-12d3-a456-426614174000', quantity: 5 },
    ],
  };
  assertEquals(isValidReconcileUnitsDTO(valid), true);
  assertEquals(isValidReconcileUnitsDTO({ newDefaultUnitId: 0, items: [] }), false);
  assertEquals(isValidReconcileUnitsDTO({ newDefaultUnitId: 2, items: 'invalid' }), false);
});

Deno.test('Item Validator - isValidCreateItemDTO', () => {
  const validItem = {
    label: 'Chicken Breast',
    quantity: 500,
    purchaseDate: '2026-08-01',
    expirationDate: '2026-08-10',
    ingredientId: '123e4567-e89b-12d3-a456-426614174000',
  };
  assertEquals(isValidCreateItemDTO(validItem), true);
  assertEquals(isValidCreateItemDTO({ ...validItem, label: '' }), false);
  assertEquals(isValidCreateItemDTO({ ...validItem, quantity: -10 }), false);
  assertEquals(isValidCreateItemDTO({ ...validItem, purchaseDate: 'invalid-date' }), false);
});

Deno.test('Item Validator - isValidUpdateItemDTO', () => {
  assertEquals(isValidUpdateItemDTO({ label: 'Updated Label' }), true);
  assertEquals(isValidUpdateItemDTO({ label: '' }), false);
  assertEquals(isValidUpdateItemDTO({ quantity: -5 }), false);
  assertEquals(isValidUpdateItemDTO({ ingredientId: 'invalid-uuid' }), false);
});

Deno.test('Item Validator - isValidBulkIdsDTO', () => {
  assertEquals(
    isValidBulkIdsDTO({ ids: ['123e4567-e89b-12d3-a456-426614174000'] }),
    true,
  );
  assertEquals(isValidBulkIdsDTO({ ids: [] }), false);
  assertEquals(isValidBulkIdsDTO({ ids: ['invalid-uuid'] }), false);
  assertEquals(isValidBulkIdsDTO(null), false);
});
