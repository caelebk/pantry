/**
 * Ingredient Item service - Business logic for ingredient item operations
 */

import { getDB } from '../db/client.ts';
import { ItemMessages } from '../messages/item.messages.ts';
import {
  CreateIngredientItemDTO,
  IngredientItemDTO,
  ItemSimilarityCandidateDTO,
  UpdateIngredientItemDTO,
} from '../models/data-models/ingredient-item.model.ts';
import { IngredientItemRow } from '../models/schema-models/ingredient-item.model.ts';
import { toDate } from '../utils/dates.ts';
import { calculateStringSimilarity } from '../utils/similarity.ts';
import { isValidUUID } from '../utils/validators.ts';

export class IngredientItemService {
  private readonly secondsInDay: number = 24 * 60 * 60 * 1000;
  private readonly soonExpiryDays: number = 7;

  /**
   * Retrieves all ingredient items from the database.
   */
  getAllIngredientItems(): Promise<IngredientItemDTO[]> {
    try {
      const db = getDB();
      const rows = db.prepare('SELECT * FROM ingredient_items ORDER BY created_at DESC')
        .all() as IngredientItemRow[];
      return Promise.resolve(rows.map(this.mapItemRowToItem));
    } catch (error: unknown) {
      console.error('Error fetching all ingredient items:', error);
      throw new Error(ItemMessages.DB_RETRIEVE_ITEMS_ERROR);
    }
  }

  /**
   * Retrieves a single ingredient item by its ID.
   */
  getIngredientItemById(id: string): Promise<IngredientItemDTO | null> {
    if (!isValidUUID(id)) {
      throw new Error(ItemMessages.INVALID_ID_FORMAT_LOG(id));
    }
    try {
      const db = getDB();
      const row = db.prepare('SELECT * FROM ingredient_items WHERE id = ?').get(id) as
        | IngredientItemRow
        | undefined;
      return Promise.resolve(row ? this.mapItemRowToItem(row) : null);
    } catch (error: unknown) {
      console.error('Error fetching ingredient item by ID:', error);
      throw new Error(ItemMessages.DB_RETRIEVE_ITEM_ERROR);
    }
  }

  /**
   * Creates a new ingredient item in the database.
   */
  createIngredientItem(data: CreateIngredientItemDTO): Promise<IngredientItemDTO> {
    try {
      const db = getDB();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      let effectiveUnitId = data.unitId;
      if (data.ingredientId) {
        const ingRow = db.prepare('SELECT default_unit_id FROM ingredients WHERE id = ?').get(
          data.ingredientId,
        ) as { default_unit_id: number | null } | undefined;
        if (ingRow && ingRow.default_unit_id) {
          effectiveUnitId = ingRow.default_unit_id;
        }
      }

      db.prepare(
        'INSERT INTO ingredient_items (id, ingredient_id, label, quantity, unit_id, location_id, expiration_date, opened_date, purchase_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(
        id,
        data.ingredientId ?? null,
        data.label,
        data.quantity,
        effectiveUnitId,
        data.locationId,
        data.expirationDate ? toDate(data.expirationDate).toISOString() : null,
        data.openedDate ? toDate(data.openedDate).toISOString() : null,
        toDate(data.purchaseDate).toISOString(),
        data.notes ?? null,
        now,
        now,
      );

      const row = db.prepare('SELECT * FROM ingredient_items WHERE id = ?').get(
        id,
      ) as IngredientItemRow;
      return Promise.resolve(this.mapItemRowToItem(row));
    } catch (error: unknown) {
      console.error('Error creating ingredient item:', error);
      throw new Error(ItemMessages.DB_CREATE_ERROR);
    }
  }

  /**
   * Updates an existing ingredient item in the database.
   */
  updateIngredientItem(
    id: string,
    data: UpdateIngredientItemDTO,
  ): Promise<IngredientItemDTO | null> {
    if (!isValidUUID(id)) {
      throw new Error(ItemMessages.INVALID_ID_FORMAT_LOG(id));
    }
    try {
      const db = getDB();

      db.prepare(
        `UPDATE ingredient_items SET 
          label = COALESCE(?, label), 
          quantity = COALESCE(?, quantity), 
          unit_id = COALESCE(?, unit_id), 
          location_id = COALESCE(?, location_id), 
          expiration_date = CASE WHEN ? = 1 THEN ? ELSE expiration_date END, 
          opened_date = CASE WHEN ? = 1 THEN ? ELSE opened_date END, 
          purchase_date = COALESCE(?, purchase_date), 
          notes = COALESCE(?, notes),
          ingredient_id = CASE WHEN ? = 1 THEN ? ELSE ingredient_id END,
          updated_at = ?
        WHERE id = ?`,
      ).run(
        data.label ?? null,
        data.quantity ?? null,
        data.unitId ?? null,
        data.locationId ?? null,
        data.expirationDate !== undefined ? 1 : 0,
        data.expirationDate ? toDate(data.expirationDate).toISOString() : null,
        data.openedDate !== undefined ? 1 : 0,
        data.openedDate ? toDate(data.openedDate).toISOString() : null,
        data.purchaseDate !== undefined ? toDate(data.purchaseDate).toISOString() : null,
        data.notes ?? null,
        data.ingredientId !== undefined ? 1 : 0,
        data.ingredientId ?? null,
        new Date().toISOString(),
        id,
      );

      const row = db.prepare('SELECT * FROM ingredient_items WHERE id = ?').get(id) as
        | IngredientItemRow
        | undefined;
      return Promise.resolve(row ? this.mapItemRowToItem(row) : null);
    } catch (error: unknown) {
      console.error('Error updating ingredient item:', error);
      throw new Error(ItemMessages.DB_UPDATE_ERROR);
    }
  }

  /**
   * Deletes an ingredient item from the database by its ID.
   */
  deleteIngredientItemById(id: string): Promise<boolean> {
    if (!isValidUUID(id)) {
      throw new Error(ItemMessages.INVALID_ID_FORMAT_LOG(id));
    }
    try {
      const db = getDB();
      db.prepare('DELETE FROM ingredient_items WHERE id = ?').run(id);
      return Promise.resolve(true);
    } catch (error: unknown) {
      console.error('Error deleting ingredient item:', error);
      throw new Error(ItemMessages.DB_DELETE_ERROR);
    }
  }

  /**
   * Bulk clears stock (sets quantity to 0 and clears expiration date) for multiple ingredient items.
   */
  bulkClearStock(ids: string[]): Promise<number> {
    for (const id of ids) {
      if (!isValidUUID(id)) {
        throw new Error(ItemMessages.INVALID_ID_FORMAT_LOG(id));
      }
    }
    const db = getDB();
    try {
      db.exec('BEGIN');
      const now = new Date().toISOString();
      const stmt = db.prepare(
        'UPDATE ingredient_items SET quantity = 0, expiration_date = NULL, updated_at = ? WHERE id = ?',
      );
      let count = 0;
      for (const id of ids) {
        const changes = stmt.run(now, id);
        if (typeof changes === 'number') count += changes;
      }
      db.exec('COMMIT');
      return Promise.resolve(count);
    } catch (error: unknown) {
      db.exec('ROLLBACK');
      console.error('Error bulk clearing stock:', error);
      throw new Error(ItemMessages.DB_UPDATE_ERROR);
    }
  }

  /**
   * Bulk deletes multiple ingredient items by their IDs.
   */
  bulkDeleteIngredientItems(ids: string[]): Promise<number> {
    for (const id of ids) {
      if (!isValidUUID(id)) {
        throw new Error(ItemMessages.INVALID_ID_FORMAT_LOG(id));
      }
    }
    const db = getDB();
    try {
      db.exec('BEGIN');
      const stmt = db.prepare('DELETE FROM ingredient_items WHERE id = ?');
      let count = 0;
      for (const id of ids) {
        const changes = stmt.run(id);
        if (typeof changes === 'number') count += changes;
      }
      db.exec('COMMIT');
      return Promise.resolve(count);
    } catch (error: unknown) {
      db.exec('ROLLBACK');
      console.error('Error bulk deleting ingredient items:', error);
      throw new Error(ItemMessages.DB_DELETE_ERROR);
    }
  }

  /**
   * Finds ingredient items that are expiring within a specified number of days.
   */
  findExpiringSoon(days: number = this.soonExpiryDays): Promise<IngredientItemDTO[]> {
    try {
      const db = getDB();
      const futureDate = new Date(Date.now() + days * this.secondsInDay).toISOString();
      const rows = db.prepare(
        'SELECT * FROM ingredient_items WHERE quantity > 0 AND expiration_date IS NOT NULL AND expiration_date <= ? ORDER BY expiration_date ASC',
      ).all(futureDate) as IngredientItemRow[];
      return Promise.resolve(rows.map(this.mapItemRowToItem));
    } catch (error: unknown) {
      console.error('Error finding expiring soon ingredient items:', error);
      throw new Error(ItemMessages.DB_FIND_EXPIRING_ERROR);
    }
  }

  /**
   * Finds ingredient items matching a query name by string similarity.
   */
  findSimilarItems(
    queryName: string,
    minScore: number = 0.45,
  ): Promise<ItemSimilarityCandidateDTO[]> {
    if (!queryName || !queryName.trim()) {
      return Promise.resolve([]);
    }
    const db = getDB();
    const rows = db.prepare(`
      SELECT item.*, ing.name as ingredient_name
      FROM ingredient_items item
      LEFT JOIN ingredients ing ON item.ingredient_id = ing.id
      ORDER BY item.created_at DESC
    `).all() as (IngredientItemRow & { ingredient_name?: string })[];

    const candidates: ItemSimilarityCandidateDTO[] = [];

    for (const row of rows) {
      const item = this.mapItemRowToItem(row);
      const labelScore = calculateStringSimilarity(queryName, item.label);
      const ingScore = row.ingredient_name
        ? calculateStringSimilarity(queryName, row.ingredient_name)
        : 0;
      const score = Math.max(labelScore, ingScore);

      if (score >= minScore) {
        const tier: 'exact' | 'similar' = score >= 0.99 ? 'exact' : 'similar';
        candidates.push({ item, score, tier });
      }
    }

    return Promise.resolve(candidates.sort((a, b) => b.score - a.score));
  }

  private mapItemRowToItem(row: IngredientItemRow): IngredientItemDTO {
    return {
      id: row.id,
      ingredientId: row.ingredient_id ? row.ingredient_id : undefined,
      label: row.label,
      quantity: row.quantity,
      unitId: row.unit_id,
      locationId: row.location_id,
      expirationDate: row.expiration_date ? new Date(row.expiration_date) : undefined,
      openedDate: row.opened_date ? new Date(row.opened_date) : undefined,
      purchaseDate: new Date(row.purchase_date),
      notes: row.notes ? row.notes : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const ingredientItemService = new IngredientItemService();
