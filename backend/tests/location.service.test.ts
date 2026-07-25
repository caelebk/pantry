import { assert, assertEquals } from '@std/assert';
import { Database } from '@db/sqlite';
import { setDB } from '../src/db/client.ts';
import { LocationRow } from '../src/models/schema-models/location.model.ts';
import { locationService } from '../src/services/location.service.ts';

function createTestDB(): Database {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);
  return db;
}

function seedMockLocation(db: Database): LocationRow {
  db.prepare('INSERT INTO locations (name) VALUES (?)').run('Pantry');
  const row = db.prepare('SELECT * FROM locations WHERE name = ?').get('Pantry') as LocationRow;
  return row;
}

Deno.test('LocationService - getAllLocations - success', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockLocation(db);

  const locs = await locationService.getAllLocations();
  assertEquals(locs.length, 1);
  assertEquals(locs[0].name, 'Pantry');
  db.close();
});

Deno.test('LocationService - getAllLocations - empty', async () => {
  const db = createTestDB();
  setDB(db);

  const locs = await locationService.getAllLocations();
  assertEquals(locs.length, 0);
  db.close();
});

Deno.test('LocationService - getLocationById - success', async () => {
  const db = createTestDB();
  setDB(db);
  const mockRow = seedMockLocation(db);

  const loc = await locationService.getLocationById(mockRow.id);
  assert(loc !== null);
  assertEquals(loc?.id, mockRow.id);
  assertEquals(loc?.name, 'Pantry');
  db.close();
});

Deno.test('LocationService - getLocationById - not found', async () => {
  const db = createTestDB();
  setDB(db);

  const loc = await locationService.getLocationById(999);
  assertEquals(loc, null);
  db.close();
});
