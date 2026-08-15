import { getDB } from '../db/client.ts';
import { CreateStoreDTO, StoreDTO, UpdateStoreDTO } from '../models/data-models/store.model.ts';

export class StoreService {
  list(kitchenId: string): Promise<StoreDTO[]> {
    const rows = getDB().prepare(
      'SELECT id, name, archived FROM stores WHERE kitchen_id = ? ORDER BY archived, name COLLATE NOCASE',
    ).all(kitchenId) as { id: string; name: string; archived: number }[];
    return Promise.resolve(
      rows.map((row) => ({ id: row.id, name: row.name, archived: Boolean(row.archived) })),
    );
  }

  create(data: CreateStoreDTO, kitchenId: string): Promise<StoreDTO> {
    const name = data.name.trim().replace(/\s+/g, ' ');
    if (!name) throw new Error('Store name is required');
    const id = crypto.randomUUID();
    getDB().prepare(
      'INSERT INTO stores (id, name, name_normalized, kitchen_id) VALUES (?, ?, ?, ?)',
    ).run(
      id,
      name,
      name.toLocaleLowerCase(),
      kitchenId,
    );
    return Promise.resolve({ id, name, archived: false });
  }

  update(id: string, data: UpdateStoreDTO, kitchenId: string): Promise<StoreDTO | null> {
    const existing = getDB().prepare(
      'SELECT id, name, archived FROM stores WHERE id = ? AND kitchen_id = ?',
    ).get(id, kitchenId) as { id: string; name: string; archived: number } | undefined;
    if (!existing) return Promise.resolve(null);
    const name = data.name === undefined ? existing.name : data.name.trim().replace(/\s+/g, ' ');
    const archived = data.archived === undefined ? existing.archived : data.archived ? 1 : 0;
    getDB().prepare(
      "UPDATE stores SET name = ?, name_normalized = ?, archived = ?, updated_at = datetime('now') WHERE id = ? AND kitchen_id = ?",
    ).run(
      name,
      name.toLocaleLowerCase(),
      archived,
      id,
      kitchenId,
    );
    return Promise.resolve({ id, name, archived: Boolean(archived) });
  }
}

export const storeService = new StoreService();
