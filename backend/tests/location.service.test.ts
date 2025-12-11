import { assert, assertEquals, assertRejects } from '@std/assert';
import { Pool } from 'postgres';
import { setPool } from '../src/db/client.ts';
import { LocationRow } from '../src/models/schema-models/location.model.ts';
import { locationService } from '../src/services/location.service.ts';

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

const mockLocation: LocationRow = {
  id: 1,
  name: 'Pantry',
};

Deno.test('LocationService - getAllLocations - success', async () => {
  const mockPool = new MockPool((_query, _args) => {
    return Promise.resolve({ rows: [mockLocation] });
  });
  setPool(mockPool as unknown as Pool);

  const locs = await locationService.getAllLocations();
  assertEquals(locs.length, 1);
  assertEquals(locs[0].name, 'Pantry');
});

Deno.test('LocationService - getAllLocations - db error', async () => {
  const mockPool = new MockPool((_query, _args) => {
    return Promise.reject(new Error('Connection failed'));
  });
  setPool(mockPool as unknown as Pool);

  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    await assertRejects(
      async () => await locationService.getAllLocations(),
      Error,
      'Failed to retrieve locations',
    );
  } finally {
    console.error = originalConsoleError;
  }
});

Deno.test('LocationService - getLocationById - success', async () => {
  const mockPool = new MockPool((query, _args) => {
    assert(query.includes('WHERE id = $1'));
    return Promise.resolve({ rows: [mockLocation] });
  });
  setPool(mockPool as unknown as Pool);

  const loc = await locationService.getLocationById(1);
  assertEquals(loc?.id, 1);
});

Deno.test('LocationService - getLocationById - not found', async () => {
  const mockPool = new MockPool((_query, _args) => {
    return Promise.resolve({ rows: [] });
  });
  setPool(mockPool as unknown as Pool);

  const loc = await locationService.getLocationById(999);
  assertEquals(loc, null);
});

Deno.test('LocationService - getLocationById - db error', async () => {
  const mockPool = new MockPool((_query, _args) => {
    return Promise.reject(new Error('Fail'));
  });
  setPool(mockPool as unknown as Pool);

  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    await assertRejects(
      async () => await locationService.getLocationById(1),
      Error,
      'Failed to retrieve location',
    );
  } finally {
    console.error = originalConsoleError;
  }
});
