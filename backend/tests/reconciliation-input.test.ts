import { assertEquals } from '@std/assert';
import { isValidReconcileUnitsDTO } from '../src/validators/ingredient.validator.ts';

Deno.test('reconciliation accepts depleted stock and rejects invalid quantities', () => {
  const body = (quantity: number) => ({
    newDefaultUnitId: 2,
    items: [{ id: '123e4567-e89b-12d3-a456-426614174001', quantity }],
  });
  assertEquals(isValidReconcileUnitsDTO(body(0)), true);
  for (const quantity of [-1, NaN, Infinity, -Infinity]) {
    assertEquals(isValidReconcileUnitsDTO(body(quantity)), false);
  }
});
