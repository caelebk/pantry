/**
 * Item service - Business logic for item operations
 */

import { getDB } from '../db/client.ts';
import { ItemMessages } from '../messages/item.messages.ts';
import { CreateItemDTO, ItemDTO, UpdateItemDTO } from '../models/data-models/item.model.ts';
import { ItemRow } from '../models/schema-models/item.model.ts';
import { toDate } from '../utils/dates.ts';
import { isValidUUID } from '../utils/validators.ts';

export class ItemService {
  private readonly secondsInDay: number = 24 * 60 * 60 * 1000;
  private readonly soonExpiryDays: number = 7;

  /**
   * Retrieves all items from the database.
   * @returns {Promise<ItemDTO[]>} A promise that resolves to an array of Item objects.
   */
  async getAllItems(): Promise<ItemDTO[]> {
    try {
      const db = getDB();
      const rows = db.prepare('SELECT * FROM items ORDER BY created_at DESC').all() as ItemRow[];
      return rows.map(this.mapItemRowToItem);
    } catch (error: unknown) {
      console.error('Error fetching all items:', error);
      throw new Error(ItemMessages.DB_RETRIEVE_ITEMS_ERROR);
    }
  }

  /**
   * Retrieves a single item by its ID.
   * @param {string} id The unique identifier of the item.
   * @returns {Promise<ItemDTO | null>} A promise that resolves to the Item object if found, otherwise null.
   */
  async getItemById(id: string): Promise<ItemDTO | null> {
    if (!isValidUUID(id)) {
      throw new Error(ItemMessages.INVALID_ID_FORMAT_LOG(id));
    }
    try {
      const db = getDB();
      const row = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as ItemRow | undefined;
      return row ? this.mapItemRowToItem(row) : null;
    } catch (error: unknown) {
      console.error('Error fetching item by ID:', error);
      throw new Error(ItemMessages.DB_RETRIEVE_ITEM_ERROR);
    }
  }

  /**
   * Creates a new item in the database.
   * @param {CreateItemDTO} data The data transfer object containing the new item's details.
   * @returns {Promise<ItemDTO>} A promise that resolves to the newly created Item object.
   */
  async createItem(data: CreateItemDTO): Promise<ItemDTO> {
    try {
      const db = getDB();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      db.prepare(
        'INSERT INTO items (id, label, quantity, unit_id, location_id, expiration_date, opened_date, purchase_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(
        id,
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

      const row = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as ItemRow;
      return this.mapItemRowToItem(row);
    } catch (error: unknown) {
      console.error('Error creating item:', error);
      throw new Error(ItemMessages.DB_CREATE_ERROR);
    }
  }

  /**
   * Updates an existing item in the database.
   * @param {string} id The unique identifier of the item to update.
   * @param {UpdateItemDTO} data The data transfer object containing the updated item's details.
   * @returns {Promise<ItemDTO | null>} A promise that resolves to the updated Item object if found, otherwise null.
   */
  async updateItem(id: string, data: UpdateItemDTO): Promise<ItemDTO | null> {
    if (!isValidUUID(id)) {
      throw new Error(ItemMessages.INVALID_ID_FORMAT_LOG(id));
    }
    try {
      const db = getDB();

      db.prepare(
        'UPDATE items SET label = COALESCE(?, label), quantity = COALESCE(?, quantity), unit_id = COALESCE(?, unit_id), location_id = COALESCE(?, location_id), expiration_date = COALESCE(?, expiration_date), opened_date = COALESCE(?, opened_date), purchase_date = COALESCE(?, purchase_date), notes = COALESCE(?, notes) WHERE id = ?',
      ).run(
        data.label ?? null,
        data.quantity ?? null,
        data.unitId ?? null,
        data.locationId ?? null,
        data.expirationDate !== undefined ? toDate(data.expirationDate).toISOString() : null,
        data.openedDate !== undefined ? toDate(data.openedDate).toISOString() : null,
        data.purchaseDate !== undefined ? toDate(data.purchaseDate).toISOString() : null,
        data.notes ?? null,
        id,
      );

      const row = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as ItemRow | undefined;
      return row ? this.mapItemRowToItem(row) : null;
    } catch (error: unknown) {
      console.error('Error updating item:', error);
      throw new Error(ItemMessages.DB_UPDATE_ERROR);
    }
  }

  /**
   * Deletes an item from the database by its ID.
   * @param {string} id The unique identifier of the item to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the item was successfully deleted, false otherwise.
   */
  async deleteItemById(id: string): Promise<boolean> {
    if (!isValidUUID(id)) {
      throw new Error(ItemMessages.INVALID_ID_FORMAT_LOG(id));
    }
    try {
      const db = getDB();
      db.prepare('DELETE FROM items WHERE id = ?').run(id);
      return true;
    } catch (error: unknown) {
      console.error('Error deleting item:', error);
      throw new Error(ItemMessages.DB_DELETE_ERROR);
    }
  }

  /**
   * Finds items that are expiring within a specified number of days.
   * @param {number} [days=7] The number of days within which items are considered expiring soon. Defaults to 7 days.
   * @returns {Promise<ItemDTO[]>} A promise that resolves to an array of Item objects expiring soon.
   */
  async findExpiringSoon(days: number = this.soonExpiryDays): Promise<ItemDTO[]> {
    try {
      const db = getDB();
      const futureDate = new Date(Date.now() + days * this.secondsInDay).toISOString();
      const rows = db.prepare(
        'SELECT * FROM items WHERE expiration_date <= ? ORDER BY expiration_date ASC',
      ).all(futureDate) as ItemRow[];
      return rows.map(this.mapItemRowToItem);
    } catch (error: unknown) {
      console.error('Error finding expiring soon items:', error);
      throw new Error(ItemMessages.DB_FIND_EXPIRING_ERROR);
    }
  }

  private mapItemRowToItem(row: ItemRow): ItemDTO {
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

export const itemService = new ItemService();
