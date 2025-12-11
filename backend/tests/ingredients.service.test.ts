import { assert, assertEquals, assertRejects } from '@std/assert';
import { Pool } from 'postgres';
import { setPool } from '../src/db/client.ts';
import { IngredientDTO } from '../src/models/data-models/ingredient.model.ts';
import { IngredientRow } from '../src/models/schema-models/ingredient.model.ts';
import { ingredientService } from '../src/services/ingredients.service.ts';

// Mock Types
type QueryCallback = (query: string, args?: unknown[]) => Promise<{ rows: unknown[] }>;

class MockClient {
  constructor(private queryCallback: QueryCallback) {}

  async queryObject<T>(query: string, args: unknown[] = []): Promise<{ rows: T[] }> {
    return (await this.queryCallback(query, args)) as { rows: T[] };
  }

  release() {}
}

class MockPool {
  constructor(private queryCallback: QueryCallback) {}

  connect() {
    return new MockClient(this.queryCallback);
  }
}

// Helpers
const mockDate = new Date();
const mockIngredientRow: IngredientRow = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Ingredient',
  category_id: 1,
  default_unit_id: 1,
  created_at: mockDate,
  updated_at: mockDate,
};

Deno.test('IngredientsService - getAllIngredients - success', async () => {
  const mockPool = new MockPool((_query, _args) => {
    return Promise.resolve({ rows: [mockIngredientRow] });
  });
  setPool(mockPool as unknown as Pool);

  const ingredients = await ingredientService.getAllIngredients();
  assertEquals(ingredients.length, 1);
  assertEquals(ingredients[0].id, mockIngredientRow.id);
});

Deno.test('IngredientsService - getAllIngredients - db error', async () => {
  const mockPool = new MockPool((_query, _args) => {
    return Promise.reject(new Error('Connection failed'));
  });
  setPool(mockPool as unknown as Pool);

  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    await assertRejects(
      async () => await ingredientService.getAllIngredients(),
      Error,
      'Failed to retrieve ingredients',
    );
  } finally {
    console.error = originalConsoleError;
  }
});

Deno.test('IngredientsService - getIngredientById - success', async () => {
  const mockPool = new MockPool((query, args) => {
    assert(query.includes('WHERE id = $1'));
    assert(args && args[0] === mockIngredientRow.id);
    return Promise.resolve({ rows: [mockIngredientRow] });
  });
  setPool(mockPool as unknown as Pool);

  const ingredient = await ingredientService.getIngredientById(mockIngredientRow.id);
  assert(ingredient !== null);
  assertEquals(ingredient?.id, mockIngredientRow.id);
});

Deno.test('IngredientsService - getIngredientById - not found', async () => {
  const mockPool = new MockPool((_query, _args) => {
    return Promise.resolve({ rows: [] });
  });
  setPool(mockPool as unknown as Pool);

  const ingredient = await ingredientService.getIngredientById(mockIngredientRow.id);
  assertEquals(ingredient, null);
});

Deno.test('IngredientsService - createIngredient - success', async () => {
  const newIngredient: IngredientDTO = {
    id: '123e4567-e89b-12d3-a456-426614174111',
    name: 'New Ingredient',
    categoryId: 1,
    defaultUnitId: 1,
  };

  const mockPool = new MockPool((query, _args) => {
    assert(query.includes('INSERT INTO ingredients'));
    const returnedRow: IngredientRow = {
      ...mockIngredientRow,
      id: newIngredient.id,
      name: newIngredient.name,
      category_id: newIngredient.categoryId ?? null,
      default_unit_id: newIngredient.defaultUnitId ?? null,
    };
    return Promise.resolve({ rows: [returnedRow] });
  });
  setPool(mockPool as unknown as Pool);

  const ingredient = await ingredientService.createIngredient(newIngredient);
  assertEquals(ingredient.name, newIngredient.name);
});

Deno.test('IngredientsService - createIngredient - db error', async () => {
  const newIngredient: IngredientDTO = {
    id: '123e4567-e89b-12d3-a456-426614174111',
    name: 'New Ingredient',
    categoryId: 1,
    defaultUnitId: 1,
  };
  const mockPool = new MockPool((_query, _args) => {
    return Promise.reject(new Error('Fail'));
  });
  setPool(mockPool as unknown as Pool);

  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    await assertRejects(
      async () => await ingredientService.createIngredient(newIngredient),
      Error,
      'Failed to create ingredient',
    );
  } finally {
    console.error = originalConsoleError;
  }
});

Deno.test('IngredientsService - updateIngredient - success', async () => {
  const updateData: IngredientDTO = {
    id: mockIngredientRow.id,
    name: 'Updated Ingredient',
    categoryId: 2,
    defaultUnitId: 2,
  };

  const mockPool = new MockPool((query, args) => {
    assert(query.includes('UPDATE ingredients'));
    assert(args && args.includes(mockIngredientRow.id));
    const returnedRow: IngredientRow = {
      ...mockIngredientRow,
      name: updateData.name,
      category_id: updateData.categoryId ?? null,
      default_unit_id: updateData.defaultUnitId ?? null,
    };
    return Promise.resolve({ rows: [returnedRow] });
  });
  setPool(mockPool as unknown as Pool);

  const ingredient = await ingredientService.updateIngredient(mockIngredientRow.id, updateData);
  assert(ingredient !== null);
  assertEquals(ingredient?.name, updateData.name);
});

Deno.test('IngredientsService - updateIngredient - not found', async () => {
  const updateData: IngredientDTO = { id: '999', name: 'Ghost', categoryId: 1, defaultUnitId: 1 };
  const mockPool = new MockPool((_query, _args) => {
    return Promise.resolve({ rows: [] });
  });
  setPool(mockPool as unknown as Pool);

  const ingredient = await ingredientService.updateIngredient(
    '123e4567-e89b-12d3-a456-426614174999',
    updateData,
  );
  assertEquals(ingredient, null);
});

Deno.test('IngredientsService - updateIngredient - db error', async () => {
  const updateData: IngredientDTO = {
    id: mockIngredientRow.id,
    name: 'Error',
    categoryId: 1,
    defaultUnitId: 1,
  };
  const mockPool = new MockPool((_query, _args) => {
    return Promise.reject(new Error('Fail'));
  });
  setPool(mockPool as unknown as Pool);

  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    await assertRejects(
      async () => await ingredientService.updateIngredient(mockIngredientRow.id, updateData),
      Error,
      'Failed to update ingredient',
    );
  } finally {
    console.error = originalConsoleError;
  }
});

Deno.test('IngredientsService - deleteIngredient - success', async () => {
  const mockPool = new MockPool((query, args) => {
    assert(query.includes('DELETE FROM ingredients'));
    assert(args && args[0] === mockIngredientRow.id);
    return Promise.resolve({ rows: [] });
  });
  setPool(mockPool as unknown as Pool);

  const result = await ingredientService.deleteIngredient(mockIngredientRow.id);
  assertEquals(result, true);
});
