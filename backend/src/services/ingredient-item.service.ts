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
  async getAllIngredientItems(): Promise<IngredientItemDTO[]> {
    try {
      const db = getDB();
      const rows = db.prepare('SELECT * FROM ingredient_items ORDER BY created_at DESC')
        .all() as IngredientItemRow[];
      return rows.map(this.mapItemRowToItem);
    } catch (error: unknown) {
      console.error('Error fetching all ingredient items:', error);
      throw new Error(ItemMessages.DB_RETRIEVE_ITEMS_ERROR);
    }
  }

  /**
   * Retrieves a single ingredient item by its ID.
   */
  async getIngredientItemById(id: string): Promise<IngredientItemDTO | null> {
    if (!isValidUUID(id)) {
      throw new Error(ItemMessages.INVALID_ID_FORMAT_LOG(id));
    }
    try {
      const db = getDB();
      const row = db.prepare('SELECT * FROM ingredient_items WHERE id = ?').get(id) as
        | IngredientItemRow
        | undefined;
      return row ? this.mapItemRowToItem(row) : null;
    } catch (error: unknown) {
      console.error('Error fetching ingredient item by ID:', error);
      throw new Error(ItemMessages.DB_RETRIEVE_ITEM_ERROR);
    }
  }

  /**
   * Creates a new ingredient item in the database.
   */
  async createIngredientItem(data: CreateIngredientItemDTO): Promise<IngredientItemDTO> {
    try {
      const db = getDB();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      db.prepare(
        'INSERT INTO ingredient_items (id, ingredient_id, label, quantity, unit_id, location_id, expiration_date, opened_date, purchase_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(
        id,
        data.ingredientId ?? null,
        data.label,
        data.quantity,
        data.unitId,
        data.locationId,
        toDate(data.expirationDate).toISOString(),
        data.openedDate ? toDate(data.openedDate).toISOString() : null,
        toDate(data.purchaseDate).toISOString(),
        data.notes ?? null,
        now,
        now,
      );

      const row = db.prepare('SELECT * FROM ingredient_items WHERE id = ?').get(
        id,
      ) as IngredientItemRow;
      return this.mapItemRowToItem(row);
    } catch (error: unknown) {
      console.error('Error creating ingredient item:', error);
      throw new Error(ItemMessages.DB_CREATE_ERROR);
    }
  }

  /**
   * Updates an existing ingredient item in the database.
   */
  async updateIngredientItem(
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
          expiration_date = COALESCE(?, expiration_date), 
          opened_date = COALESCE(?, opened_date), 
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
        data.expirationDate !== undefined ? toDate(data.expirationDate).toISOString() : null,
        data.openedDate !== undefined ? toDate(data.openedDate).toISOString() : null,
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
      return row ? this.mapItemRowToItem(row) : null;
    } catch (error: unknown) {
      console.error('Error updating ingredient item:', error);
      throw new Error(ItemMessages.DB_UPDATE_ERROR);
    }
  }

  /**
   * Deletes an ingredient item from the database by its ID.
   */
  async deleteIngredientItemById(id: string): Promise<boolean> {
    if (!isValidUUID(id)) {
      throw new Error(ItemMessages.INVALID_ID_FORMAT_LOG(id));
    }
    try {
      const db = getDB();
      db.prepare('DELETE FROM ingredient_items WHERE id = ?').run(id);
      return true;
    } catch (error: unknown) {
      console.error('Error deleting ingredient item:', error);
      throw new Error(ItemMessages.DB_DELETE_ERROR);
    }
  }

  /**
   * Finds ingredient items that are expiring within a specified number of days.
   */
  async findExpiringSoon(days: number = this.soonExpiryDays): Promise<IngredientItemDTO[]> {
    try {
      const db = getDB();
      const futureDate = new Date(Date.now() + days * this.secondsInDay).toISOString();
      const rows = db.prepare(
        'SELECT * FROM ingredient_items WHERE expiration_date <= ? ORDER BY expiration_date ASC',
      ).all(futureDate) as IngredientItemRow[];
      return rows.map(this.mapItemRowToItem);
    } catch (error: unknown) {
      console.error('Error finding expiring soon ingredient items:', error);
      throw new Error(ItemMessages.DB_FIND_EXPIRING_ERROR);
    }
  }

  /**
   * Finds ingredient items matching a query name by string similarity.
   */
  async findSimilarItems(
    queryName: string,
    minScore: number = 0.45,
  ): Promise<ItemSimilarityCandidateDTO[]> {
    if (!queryName || !queryName.trim()) {
      return [];
    }
    const allItems = await this.getAllIngredientItems();
    const candidates: ItemSimilarityCandidateDTO[] = [];

    for (const item of allItems) {
      const score = calculateStringSimilarity(queryName, item.label);
      if (score >= minScore) {
        const tier: 'exact' | 'similar' = score >= 0.99 ? 'exact' : 'similar';
        candidates.push({ item, score, tier });
      }
    }

    return candidates.sort((a, b) => b.score - a.score);
  }

  private mapItemRowToItem(row: IngredientItemRow): IngredientItemDTO {
    return {
      id: row.id,
      ingredientId: row.ingredient_id ? row.ingredient_id : undefined,
      label: row.label,
      quantity: row.quantity,
      unitId: row.unit_id,
      locationId: row.location_id,
      expirationDate: new Date(row.expiration_date),
      openedDate: row.opened_date ? new Date(row.opened_date) : undefined,
      purchaseDate: new Date(row.purchase_date),
      notes: row.notes ? row.notes : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const ingredientItemService = new IngredientItemService();
