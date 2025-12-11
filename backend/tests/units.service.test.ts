import { assert, assertEquals, assertRejects } from '@std/assert';
import { Pool } from 'postgres';
import { setPool } from '../src/db/client.ts';
import { UnitRow } from '../src/models/schema-models/unit.model.ts';
import { unitService } from '../src/services/units.service.ts';

// Mock DB
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
const mockGram: UnitRow = {
  id: 1,
  name: 'Gram',
  type: 'weight',
  to_base_factor: 1,
};

const mockKg: UnitRow = {
  id: 2,
  name: 'Kilogram',
  type: 'weight',
  to_base_factor: 1000,
};

const mockLiter: UnitRow = {
  id: 3,
  name: 'Liter',
  type: 'volume',
  to_base_factor: 1000,
};

Deno.test('UnitService - getAllUnits - success', async () => {
  const mockPool = new MockPool((_query, _args) => {
    return Promise.resolve({ rows: [mockGram, mockKg] });
  });
  setPool(mockPool as unknown as Pool);

  const units = await unitService.getAllUnits();
  assertEquals(units.length, 2);
  assertEquals(units[0].id, mockGram.id);
});

Deno.test('UnitService - convert - success (Base to Derived)', async () => {
  // 1000g -> 1kg
  const mockPool = new MockPool((query, args) => {
    assert(query.includes('FROM units WHERE id = $1'));
    // Mock returning requested unit
    const id = args?.[0] as number;
    const unit = [mockGram, mockKg].find((u) => u.id === id);
    return Promise.resolve({ rows: unit ? [unit] : [] });
  });
  setPool(mockPool as unknown as Pool);

  const result = await unitService.convert(1000, mockGram.id, mockKg.id);
  // 1000 * (1 / 1000) = 1
  assertEquals(result, 1);
});

Deno.test('UnitService - convert - success (Derived to Base)', async () => {
  // 2kg -> 2000g
  const mockPool = new MockPool((_query, args) => {
    const id = args?.[0] as number;
    const unit = [mockGram, mockKg].find((u) => u.id === id);
    return Promise.resolve({ rows: unit ? [unit] : [] });
  });
  setPool(mockPool as unknown as Pool);

  const result = await unitService.convert(2, mockKg.id, mockGram.id);
  // 2 * (1000 / 1) = 2000
  assertEquals(result, 2000);
});

Deno.test('UnitService - convert - fail (Type Mismatch)', async () => {
  // 1kg -> Liter (Weight to Volume)
  const mockPool = new MockPool((_query, args) => {
    const id = args?.[0] as number;
    const unit = [mockKg, mockLiter].find((u) => u.id === id);
    return Promise.resolve({ rows: unit ? [unit] : [] });
  });
  setPool(mockPool as unknown as Pool);

  await assertRejects(
    async () => await unitService.convert(1, mockKg.id, mockLiter.id),
    Error,
    'Cannot convert',
  );
});
