import { assertEquals } from '@std/assert';
import { Database } from '@db/sqlite';
import { setDB } from '../src/db/client.ts';
import { storeService } from '../src/services/store.service.ts';

Deno.test('StoreService - creates and lists a store for its kitchen', async () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_normalized TEXT NOT NULL,
      kitchen_id TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(kitchen_id, name_normalized)
    )
  `);
  setDB(db);

  const created = await storeService.create({ name: "  Trader   Joe's  " }, 'test-kitchen-id');

  assertEquals(created.name, "Trader Joe's");
  assertEquals(created.archived, false);
  assertEquals(await storeService.list('test-kitchen-id'), [created]);
  db.close();
});
