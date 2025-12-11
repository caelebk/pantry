import { assert, assertEquals } from '@std/assert';
import { Pool } from 'postgres';
import { setPool } from '../src/db/client.ts';
import { CreateItemDTO, UpdateItemDTO } from '../src/models/data-models/item.model.ts';
import { ItemRow } from '../src/models/schema-models/inventory-schema.model.ts';
import { itemService } from '../src/services/item.service.ts';

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
const mockItemRow: ItemRow = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  ingredient_id: null,
  label: 'Test Item',
  quantity: 5,
  unit_id: 1,
  location_id: 1,
  expiration_date: mockDate,
  opened_date: null,
  purchase_date: mockDate,
  notes: 'Test notes',
  created_at: mockDate,
  updated_at: mockDate,
};

Deno.test('ItemService - getAllItems - success', async () => {
  const mockPool = new MockPool((_query, _args) => {
    return Promise.resolve({ rows: [mockItemRow] });
  });
  setPool(mockPool as unknown as Pool);

  const items = await itemService.getAllItems();
  assertEquals(items.length, 1);
  assertEquals(items[0].id, mockItemRow.id);
});

Deno.test('ItemService - getItemById - success', async () => {
  const mockPool = new MockPool((query, args) => {
    assert(query.includes('WHERE id = $1'));
    assert(args && args[0] === mockItemRow.id);
    return Promise.resolve({ rows: [mockItemRow] });
  });
  setPool(mockPool as unknown as Pool);

  const item = await itemService.getItemById(mockItemRow.id);
  assert(item !== null);
  assertEquals(item?.id, mockItemRow.id);
});

Deno.test('ItemService - getItemById - not found', async () => {
  const mockPool = new MockPool((_query, _args) => {
    return Promise.resolve({ rows: [] });
  });
  setPool(mockPool as unknown as Pool);

  const item = await itemService.getItemById(mockItemRow.id);
  assertEquals(item, null);
});

Deno.test('ItemService - createItem - success', async () => {
  const newItem: CreateItemDTO = {
    label: 'New Item',
    quantity: 10,
    unitId: 1,
    locationId: 1,
    expirationDate: mockDate.toISOString(),
    purchaseDate: mockDate.toISOString(),
    notes: 'New notes',
    openedDate: undefined,
  };

  const mockPool = new MockPool((query, _args) => {
    assert(query.includes('INSERT INTO items'));
    const returnedRow = {
      ...mockItemRow,
      ...newItem,
      expiration_date: new Date(newItem.expirationDate),
      purchase_date: new Date(newItem.purchaseDate),
      // openedDate is undefined/null
    };
    return Promise.resolve({ rows: [returnedRow] });
  });
  setPool(mockPool as unknown as Pool);

  const item = await itemService.createItem(newItem);
  assertEquals(item.label, newItem.label);
});

Deno.test('ItemService - updateItem - success', async () => {
  const updateData: UpdateItemDTO = {
    label: 'Updated Item',
    quantity: 20,
    unitId: 1,
    locationId: 1,
    expirationDate: mockDate.toISOString(),
    purchaseDate: mockDate.toISOString(),
    notes: 'Updated notes',
    openedDate: undefined,
  };

  const mockPool = new MockPool((query, args) => {
    assert(query.includes('UPDATE items'));
    assert(args && args.includes(mockItemRow.id));
    const returnedRow = {
      ...mockItemRow,
      ...updateData,
      expiration_date: new Date(updateData.expirationDate),
      purchase_date: new Date(updateData.purchaseDate),
    };
    return Promise.resolve({ rows: [returnedRow] });
  });
  setPool(mockPool as unknown as Pool);

  const item = await itemService.updateItem(mockItemRow.id, updateData);
  assert(item !== null);
  assertEquals(item?.label, updateData.label);
});

Deno.test('ItemService - deleteItemById - success', async () => {
  const mockPool = new MockPool((query, args) => {
    assert(query.includes('DELETE FROM items'));
    assert(args && args[0] === mockItemRow.id);
    return Promise.resolve({ rows: [] });
  });
  setPool(mockPool as unknown as Pool);

  const result = await itemService.deleteItemById(mockItemRow.id);
  assertEquals(result, true);
});
