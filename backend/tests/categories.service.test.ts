import { assert, assertEquals } from '@std/assert';
import { Pool } from 'postgres';
import { setPool } from '../src/db/client.ts';
import { CategoryRow } from '../src/models/schema-models/category.model.ts';
import { categoryService } from '../src/services/category.service.ts';

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
const mockCategoryRow: CategoryRow = {
  id: 1,
  name: 'Test Category',
};

Deno.test('CategoryService - getAllCategories - success', async () => {
  const mockPool = new MockPool((_query, _args) => {
    return Promise.resolve({ rows: [mockCategoryRow] });
  });
  setPool(mockPool as unknown as Pool);

  const categories = await categoryService.getAllCategories();
  assertEquals(categories.length, 1);
  assertEquals(categories[0].id, mockCategoryRow.id);
});

Deno.test('CategoryService - getCategoryById - success', async () => {
  const mockPool = new MockPool((query, args) => {
    assert(query.includes('WHERE id = $1'));
    assert(args && args[0] === mockCategoryRow.id);
    return Promise.resolve({ rows: [mockCategoryRow] });
  });
  setPool(mockPool as unknown as Pool);

  const category = await categoryService.getCategoryById(mockCategoryRow.id);
  assert(category !== null);
  assertEquals(category?.id, mockCategoryRow.id);
});

Deno.test('CategoryService - getCategoryById - not found', async () => {
  const mockPool = new MockPool((_query, _args) => {
    return Promise.resolve({ rows: [] });
  });
  setPool(mockPool as unknown as Pool);

  const category = await categoryService.getCategoryById(999);
  assertEquals(category, null);
});
