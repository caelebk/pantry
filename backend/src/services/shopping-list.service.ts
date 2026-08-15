import { getDB } from '../db/client.ts';
import {
  CreateShoppingListItemDTO,
  ShoppingListItemDTO,
  UpdateShoppingListItemDTO,
} from '../models/data-models/shopping-list.model.ts';

export interface ShoppingListItemRow {
  id: string;
  ingredient_id: string | null;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  checked: number;
  estimated_price: number;
  store_name: string;
  store_id: string | null;
  source: string;
  recipe_name: string | null;
  created_at: string;
  ingredient_name?: string | null;
  ingredient_group_name?: string | null;
  ingredient_category_name?: string | null;
  ingredient_unit_short_name?: string | null;
  canonical_store_name?: string | null;
}

export class ShoppingListDuplicateError extends Error {
  constructor(public readonly existingId: string) {
    super('Ingredient is already on the shopping list');
    this.name = 'ShoppingListDuplicateError';
  }
}

export class ShoppingListBackendService {
  getAllItems(kitchenId: string): Promise<ShoppingListItemDTO[]> {
    const db = getDB();
    const rows = db.prepare(this.selectSql('WHERE sli.kitchen_id = ? ORDER BY sli.created_at DESC'))
      .all(
        kitchenId,
      ) as ShoppingListItemRow[];
    return Promise.resolve(rows.map(this.mapRowToDTO));
  }

  getItemById(id: string, kitchenId: string): Promise<ShoppingListItemDTO | null> {
    const db = getDB();
    const row = db.prepare(this.selectSql('WHERE sli.id = ? AND sli.kitchen_id = ?')).get(
      id,
      kitchenId,
    ) as
      | ShoppingListItemRow
      | undefined;
    return Promise.resolve(row ? this.mapRowToDTO(row) : null);
  }

  async createItem(
    data: CreateShoppingListItemDTO,
    kitchenId: string,
    userId: string,
  ): Promise<ShoppingListItemDTO> {
    const db = getDB();
    const id = crypto.randomUUID();

    if (data.ingredientId) {
      const ingredient = db.prepare('SELECT id FROM ingredients WHERE id = ? AND kitchen_id = ?')
        .get(
          data.ingredientId,
          kitchenId,
        );
      if (!ingredient) throw new Error('Ingredient not found');

      const duplicate = db.prepare(
        'SELECT id FROM shopping_list_items WHERE ingredient_id = ? AND kitchen_id = ? LIMIT 1',
      ).get(data.ingredientId, kitchenId) as { id: string } | undefined;
      if (duplicate) {
        if (data.duplicateMode === 'merge') {
          const quantity = data.quantity !== undefined ? data.quantity : 1;
          db.prepare(
            'UPDATE shopping_list_items SET quantity = quantity + ?, checked = 0, updated_by = ? WHERE id = ? AND kitchen_id = ?',
          ).run(quantity, userId, duplicate.id, kitchenId);
          return (await this.getItemById(duplicate.id, kitchenId))!;
        }
        throw new ShoppingListDuplicateError(duplicate.id);
      }
    }

    if (this.supportsLinkColumns()) {
      db.prepare(`
        INSERT INTO shopping_list_items (id, ingredient_id, name, category, quantity, unit, checked, estimated_price, store_name, store_id, source, recipe_name, kitchen_id, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.ingredientId || null,
        data.name,
        data.category || 'General',
        data.quantity !== undefined ? data.quantity : 1,
        data.unit || 'pcs',
        data.checked ? 1 : 0,
        data.estimatedPrice || 0,
        data.storeName || '',
        data.storeId || null,
        data.source || 'manual',
        data.recipeName || null,
        kitchenId,
        userId,
        userId,
      );
    } else {
      db.prepare(`
        INSERT INTO shopping_list_items (id, name, category, quantity, unit, checked, estimated_price, store_name, source, recipe_name, kitchen_id, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        data.recipeName || null,
        kitchenId,
        userId,
        userId,
      );
    }

    const row = db.prepare(this.selectSql('WHERE sli.id = ? AND sli.kitchen_id = ?')).get(
      id,
      kitchenId,
    ) as ShoppingListItemRow;
    return Promise.resolve(this.mapRowToDTO(row));
  }

  async createMultipleItems(
    items: CreateShoppingListItemDTO[],
    kitchenId: string,
    userId: string,
  ): Promise<ShoppingListItemDTO[]> {
    const db = getDB();
    try {
      db.exec('BEGIN');
      const created: ShoppingListItemDTO[] = [];
      for (const item of items) {
        const dto = await this.createItem(item, kitchenId, userId);
        created.push(dto);
      }
      db.exec('COMMIT');
      return created;
    } catch (error) {
      db.exec('ROLLBACK');
      console.error('Error creating multiple shopping list items:', error);
      throw error;
    }
  }

  async updateItem(
    id: string,
    kitchenId: string,
    data: UpdateShoppingListItemDTO,
    userId: string,
  ): Promise<ShoppingListItemDTO | null> {
    const db = getDB();
    const existing = await this.getItemById(id, kitchenId);
    if (!existing) return null;

    const name = data.name !== undefined ? data.name : existing.name;
    const category = data.category !== undefined ? data.category : existing.category;
    const quantity = data.quantity !== undefined ? data.quantity : existing.quantity;
    const unit = data.unit !== undefined ? data.unit : existing.unit;
    const checked = data.checked !== undefined
      ? (data.checked ? 1 : 0)
      : (existing.checked ? 1 : 0);
    const estimatedPrice = data.estimatedPrice !== undefined
      ? data.estimatedPrice
      : existing.estimatedPrice;
    const storeName = data.storeName !== undefined ? data.storeName : existing.storeName;
    const source = data.source !== undefined ? data.source : existing.source;
    const recipeName = data.recipeName !== undefined ? data.recipeName : existing.recipeName;

    db.prepare(`
      UPDATE shopping_list_items
      SET name = ?, category = ?, quantity = ?, unit = ?, checked = ?, estimated_price = ?, store_name = ?, source = ?, recipe_name = ?, updated_by = ?
      WHERE id = ? AND kitchen_id = ?
    `).run(
      name,
      category,
      quantity,
      unit,
      checked,
      estimatedPrice,
      storeName,
      source,
      recipeName || null,
      userId,
      id,
      kitchenId,
    );

    const row = db.prepare(this.selectSql('WHERE sli.id = ? AND sli.kitchen_id = ?')).get(
      id,
      kitchenId,
    ) as ShoppingListItemRow;
    return this.mapRowToDTO(row);
  }

  deleteItem(id: string, kitchenId: string): Promise<boolean> {
    const db = getDB();
    db.prepare('DELETE FROM shopping_list_items WHERE id = ? AND kitchen_id = ?').run(
      id,
      kitchenId,
    );
    return Promise.resolve(true);
  }

  deleteCheckedItems(kitchenId: string): Promise<number> {
    const db = getDB();
    const result = db.prepare(
      'DELETE FROM shopping_list_items WHERE checked = 1 AND kitchen_id = ?',
    ).run(kitchenId);
    return Promise.resolve(typeof result === 'number' ? result : 0);
  }

  markBought(ids: string[], kitchenId: string, userId: string): Promise<number> {
    const db = getDB();
    const statement = db.prepare(
      'UPDATE shopping_list_items SET checked = 1, updated_by = ? WHERE id = ? AND kitchen_id = ?',
    );
    let count = 0;
    db.transaction(() =>
      ids.forEach((id) => {
        count += Number(statement.run(userId, id, kitchenId));
      })
    )();
    return Promise.resolve(count);
  }

  deleteItems(ids: string[], kitchenId: string): Promise<number> {
    const db = getDB();
    const statement = db.prepare('DELETE FROM shopping_list_items WHERE id = ? AND kitchen_id = ?');
    let count = 0;
    db.transaction(() =>
      ids.forEach((id) => {
        count += Number(statement.run(id, kitchenId));
      })
    )();
    return Promise.resolve(count);
  }

  private mapRowToDTO(row: ShoppingListItemRow): ShoppingListItemDTO {
    return {
      id: row.id,
      ingredientId: row.ingredient_id || undefined,
      name: row.ingredient_name || row.name,
      category: row.ingredient_category_name || row.ingredient_group_name || row.category,
      quantity: row.quantity,
      unit: row.ingredient_unit_short_name || row.unit,
      checked: Boolean(row.checked),
      estimatedPrice: row.estimated_price,
      storeName: row.canonical_store_name || row.store_name,
      storeId: row.store_id || undefined,
      source: (row.source as 'low_stock' | 'recipe_plan' | 'manual') || 'manual',
      recipeName: row.recipe_name || undefined,
      createdAt: row.created_at,
    };
  }

  private selectSql(predicate: string): string {
    if (!this.supportsLinkColumns()) {
      return `SELECT sli.* FROM shopping_list_items sli ${predicate}`;
    }
    return `SELECT sli.*, i.name AS ingredient_name, ig.name AS ingredient_group_name,
      ic.name AS ingredient_category_name, u.short_name AS ingredient_unit_short_name,
      s.name AS canonical_store_name
      FROM shopping_list_items sli
      LEFT JOIN ingredients i ON i.id = sli.ingredient_id
      LEFT JOIN ingredient_groups ig ON ig.id = i.ingredient_group_id
      LEFT JOIN ingredient_categories ic ON ic.id = ig.ingredient_category_id
      LEFT JOIN units u ON u.id = i.default_unit_id
      LEFT JOIN stores s ON s.id = sli.store_id
      ${predicate}`;
  }

  private supportsLinkColumns(): boolean {
    const columns = getDB().prepare('PRAGMA table_info(shopping_list_items)').all() as {
      name: string;
    }[];
    return columns.some((column) => column.name === 'ingredient_id') &&
      columns.some((column) => column.name === 'store_id');
  }
}

export const shoppingListBackendService = new ShoppingListBackendService();
