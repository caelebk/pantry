import { assert, assertEquals } from '@std/assert';
import { Database } from '@db/sqlite';

Deno.test('Migrations - 0006_allow_nullable_expiration_date - removes NOT NULL constraint', () => {
  const db = new Database(':memory:');

  // 1. Setup initial schema from 0001 with NOT NULL expiration_date
  db.exec(`
    CREATE TABLE units (id INTEGER PRIMARY KEY, name TEXT, short_name TEXT, type TEXT, to_base_factor REAL);
    CREATE TABLE locations (id INTEGER PRIMARY KEY, name TEXT);
    CREATE TABLE ingredients (id TEXT PRIMARY KEY, name TEXT);
    
    CREATE TABLE ingredient_items (
      id TEXT PRIMARY KEY,
      ingredient_id TEXT,
      label TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_id INTEGER NOT NULL,
      expiration_date TEXT NOT NULL,
      opened_date TEXT,
      purchase_date TEXT NOT NULL,
      location_id INTEGER NOT NULL,
      notes TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    INSERT INTO units VALUES (1, 'g', 'g', 'weight', 1);
    INSERT INTO locations VALUES (1, 'Fridge');
    INSERT INTO ingredients VALUES ('ing-1', 'Milk');
    INSERT INTO ingredient_items VALUES ('item-1', 'ing-1', 'Milk Batch', 2, 1, '2026-08-10', NULL, '2026-08-01', 1, NULL, '2026-08-01', '2026-08-01');
  `);

  // 2. Read and apply Migration 0006
  const migrationSql = Deno.readTextFileSync(
    './migrations/0006_allow_nullable_expiration_date.sql',
  );
  db.exec(migrationSql);

  // 3. Execute bulk clear stock (setting expiration_date = NULL)
  db.prepare('UPDATE ingredient_items SET quantity = 0, expiration_date = NULL WHERE id = ?').run(
    'item-1',
  );

  // 4. Assert update succeeded and expiration_date is NULL
  const row = db.prepare('SELECT quantity, expiration_date FROM ingredient_items WHERE id = ?').get(
    'item-1',
  ) as {
    quantity: number;
    expiration_date: string | null;
  };

  assert(row !== undefined);
  assertEquals(row.quantity, 0);
  assertEquals(row.expiration_date, null);

  db.close();
});
