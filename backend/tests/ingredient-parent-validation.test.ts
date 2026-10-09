import { assertEquals } from '@std/assert';
import { isValidUpdateIngredientDTO } from '../src/validators/ingredient.validator.ts';
import { isValidUpdateIngredientGroupDTO } from '../src/validators/ingredient-group.validator.ts';
Deno.test('parent updates accept explicit null and reject malformed identifiers', () => {
  assertEquals(isValidUpdateIngredientDTO({ ingredientGroupId: null }), true);
  assertEquals(isValidUpdateIngredientGroupDTO({ ingredientCategoryId: null }), true);
  for (const value of [0, -1, 1.5, '1', {}, NaN, Infinity]) {
    assertEquals(isValidUpdateIngredientDTO({ ingredientGroupId: value } as never), false);
    assertEquals(isValidUpdateIngredientGroupDTO({ ingredientCategoryId: value }), false);
  }
  assertEquals(isValidUpdateIngredientGroupDTO({ name: ' ' }), false);
  assertEquals(isValidUpdateIngredientGroupDTO({ name: 'Vegetables' }), true);
});
