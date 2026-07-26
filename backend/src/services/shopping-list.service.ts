import { getDB } from '../db/client.ts';
import { CreateShoppingListItemDTO, ShoppingListItemDTO, UpdateShoppingListItemDTO } from '../models/data-models/shopping-list.model.ts';

export interface ShoppingListItemRow {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  checked: number;
  estimated_price: number;
  store_name: string;
  source: string;
  recipe_name: string | null;
  created_at: string;
}

export class ShoppingListBackendService {
  async getAllItems(): Promise<ShoppingListItemDTO[]> {
    const db = getDB();
    const rows = db.prepare('SELECT * FROM shopping_list_items ORDER BY created_at DESC').all() as ShoppingListItemRow[];
    return rows.map(this.mapRowToDTO);
  }

  async getItemById(id: string): Promise<ShoppingListItemDTO | null> {
    const db = getDB();
    const row = db.prepare('SELECT * FROM shopping_list_items WHERE id = ?').get(id) as ShoppingListItemRow | undefined;
    return row ? this.mapRowToDTO(row) : null;
  }

  async createItem(data: CreateShoppingListItemDTO): Promise<ShoppingListItemDTO> {
    const db = getDB();
    const id = crypto.randomUUID();

    db.prepare(`
      INSERT INTO shopping_list_items (id, name, category, quantity, unit, checked, estimated_price, store_name, source, recipe_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name,
      data.category || 'General',
      data.quantity !== undefined ? data.quantity : 1,
      data.unit || 'pcs',
      data.checked ? 1 : 0,
      data.estimatedPrice || 0,
      data.storeName || '',
      data.source || 'manual',
      data.recipeName || null
    );

    const row = db.prepare('SELECT * FROM shopping_list_items WHERE id = ?').get(id) as ShoppingListItemRow;
    return this.mapRowToDTO(row);
  }

  async createMultipleItems(items: CreateShoppingListItemDTO[]): Promise<ShoppingListItemDTO[]> {
    const created: ShoppingListItemDTO[] = [];
    for (const item of items) {
      const dto = await this.createItem(item);
      created.push(dto);
    }
    return created;
  }

  async updateItem(id: string, data: UpdateShoppingListItemDTO): Promise<ShoppingListItemDTO | null> {
    const db = getDB();
    const existing = await this.getItemById(id);
    if (!existing) return null;

    const name = data.name !== undefined ? data.name : existing.name;
    const category = data.category !== undefined ? data.category : existing.category;
    const quantity = data.quantity !== undefined ? data.quantity : existing.quantity;
    const unit = data.unit !== undefined ? data.unit : existing.unit;
    const checked = data.checked !== undefined ? (data.checked ? 1 : 0) : (existing.checked ? 1 : 0);
    const estimatedPrice = data.estimatedPrice !== undefined ? data.estimatedPrice : existing.estimatedPrice;
    const storeName = data.storeName !== undefined ? data.storeName : existing.storeName;
    const source = data.source !== undefined ? data.source : existing.source;
    const recipeName = data.recipeName !== undefined ? data.recipeName : existing.recipeName;

    db.prepare(`
      UPDATE shopping_list_items
      SET name = ?, category = ?, quantity = ?, unit = ?, checked = ?, estimated_price = ?, store_name = ?, source = ?, recipe_name = ?
      WHERE id = ?
    `).run(name, category, quantity, unit, checked, estimatedPrice, storeName, source, recipeName || null, id);

    const row = db.prepare('SELECT * FROM shopping_list_items WHERE id = ?').get(id) as ShoppingListItemRow;
    return this.mapRowToDTO(row);
  }

  async deleteItem(id: string): Promise<boolean> {
    const db = getDB();
    db.prepare('DELETE FROM shopping_list_items WHERE id = ?').run(id);
    return true;
  }

  async deleteCheckedItems(): Promise<number> {
    const db = getDB();
    const result = db.prepare('DELETE FROM shopping_list_items WHERE checked = 1').run();
    return result.changes || 0;
  }

  private mapRowToDTO(row: ShoppingListItemRow): ShoppingListItemDTO {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      quantity: row.quantity,
      unit: row.unit,
      checked: Boolean(row.checked),
      estimatedPrice: row.estimated_price,
      storeName: row.store_name,
      source: (row.source as any) || 'manual',
      recipeName: row.recipe_name || undefined,
      createdAt: row.created_at,
    };
  }
}

export const shoppingListBackendService = new ShoppingListBackendService();
