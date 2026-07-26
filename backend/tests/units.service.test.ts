import { assert, assertEquals, assertRejects } from '@std/assert';
import { Database } from '@db/sqlite';
import { setDB } from '../src/db/client.ts';
import { UnitRow } from '../src/models/schema-models/unit.model.ts';
import { unitService } from '../src/services/units.service.ts';

function createTestDB(): Database {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      type TEXT NOT NULL,
      to_base_factor REAL NOT NULL
    )
  `);
  return db;
}

function seedUnits(db: Database): { gram: UnitRow; kg: UnitRow; liter: UnitRow } {
  db.prepare('INSERT INTO units (name, short_name, type, to_base_factor) VALUES (?, ?, ?, ?)').run(
    'Gram',
    'g',
    'weight',
    1,
  );
  db.prepare('INSERT INTO units (name, short_name, type, to_base_factor) VALUES (?, ?, ?, ?)').run(
    'Kilogram',
    'kg',
    'weight',
    1000,
  );
  db.prepare('INSERT INTO units (name, short_name, type, to_base_factor) VALUES (?, ?, ?, ?)').run(
    'Liter',
    'l',
    'volume',
    1000,
  );

  const gram = db.prepare('SELECT * FROM units WHERE name = ?').get('Gram') as UnitRow;
  const kg = db.prepare('SELECT * FROM units WHERE name = ?').get('Kilogram') as UnitRow;
  const liter = db.prepare('SELECT * FROM units WHERE name = ?').get('Liter') as UnitRow;

  return { gram, kg, liter };
}

Deno.test('UnitService - getAllUnits - success', async () => {
  const db = createTestDB();
  setDB(db);
  seedUnits(db);

  const units = await unitService.getAllUnits();
  assertEquals(units.length, 3);
  db.close();
});

Deno.test('UnitService - getAllUnits - empty', async () => {
  const db = createTestDB();
  setDB(db);

  const units = await unitService.getAllUnits();
  assertEquals(units.length, 0);
  db.close();
});

Deno.test('UnitService - getUnitById - success', async () => {
  const db = createTestDB();
  setDB(db);
  const { gram } = seedUnits(db);

  const unit = await unitService.getUnitById(gram.id);
  assert(unit !== null);
  assertEquals(unit?.id, gram.id);
  assertEquals(unit?.name, 'Gram');
  db.close();
});

Deno.test('UnitService - getUnitById - not found', async () => {
  const db = createTestDB();
  setDB(db);

  const unit = await unitService.getUnitById(999);
  assertEquals(unit, null);
  db.close();
});

Deno.test('UnitService - convert - success (Base to Derived)', async () => {
  // 1000g -> 1kg
  const db = createTestDB();
  setDB(db);
  const { gram, kg } = seedUnits(db);

  const result = await unitService.convert(1000, gram.id, kg.id);
  assertEquals(result, 1);
  db.close();
});

Deno.test('UnitService - convert - success (Derived to Base)', async () => {
  // 2kg -> 2000g
  const db = createTestDB();
  setDB(db);
  const { gram, kg } = seedUnits(db);

  const result = await unitService.convert(2, kg.id, gram.id);
  assertEquals(result, 2000);
  db.close();
});

Deno.test('UnitService - convert - fail (Type Mismatch)', async () => {
  // kg -> Liter (Weight to Volume)
  const db = createTestDB();
  setDB(db);
  const { kg, liter } = seedUnits(db);

  await assertRejects(
    async () => await unitService.convert(1, kg.id, liter.id),
    Error,
    'Cannot convert',
  );
  db.close();
});

Deno.test('UnitService - convert - fail (Unit Not Found)', async () => {
  const db = createTestDB();
  setDB(db);
  const { gram } = seedUnits(db);

  await assertRejects(
    async () => await unitService.convert(10, gram.id, 999),
    Error,
    'Resource not found',
  );
  db.close();
});
