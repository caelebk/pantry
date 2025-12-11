/**
 * Item service - Business logic for item operations
 */

import { getPool } from '../db/client.ts';
import { ItemMessages } from '../messages/item.messages.ts';
import { CreateItemDTO, ItemDTO, UpdateItemDTO } from '../models/data-models/item.model.ts';
import { ItemRow } from '../models/schema-models/inventory-schema.model.ts';
import { isValidUUID } from '../utils/validators.ts';

export class ItemService {
  private readonly secondsInDay: number = 24 * 60 * 60 * 1000;
  private readonly soonExpiryDays: number = 7;

  /**
   * Retrieves all items from the database.
   * @returns {Promise<ItemDTO[]>} A promise that resolves to an array of Item objects.
   */
  async getAllItems(): Promise<ItemDTO[]> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.queryObject<ItemRow>(
        'SELECT * FROM items ORDER BY created_at DESC',
      );
      client.release();
      return result.rows.map(this.mapItemRowToItem);
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
    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.queryObject<ItemRow>(
        'SELECT * FROM items WHERE id = $1',
        [id],
      );

      const results = result.rows.map(this.mapItemRowToItem);
      const firstResult = results[0];
      client.release();
      return firstResult || null;
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
    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.queryObject<ItemRow>(
        'INSERT INTO items (label, quantity, unit_id, location_id, expiration_date, opened_date, purchase_date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          data.label,
          data.quantity,
          data.unitId,
          data.locationId,
          data.expirationDate,
          data.openedDate,
          data.purchaseDate,
          data.notes,
        ],
      );

      const results = result.rows.map(this.mapItemRowToItem);
      const firstResult = results[0];
      client.release();
      return firstResult;
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
    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.queryObject<ItemRow>(
        'UPDATE items SET label = $1, quantity = $2, unit_id = $3, location_id = $4, expiration_date = $5, opened_date = $6, purchase_date = $7, notes = $8 WHERE id = $9 RETURNING *',
        [
          data.label,
          data.quantity,
          data.unitId,
          data.locationId,
          data.expirationDate,
          data.openedDate,
          data.purchaseDate,
          data.notes,
          id,
        ],
      );

      const results = result.rows.map(this.mapItemRowToItem);
      const firstResult = results[0];
      client.release();
      return firstResult || null;
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
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.queryObject<ItemRow>(
        'DELETE FROM items WHERE id = $1',
        [id],
      );
      client.release();
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
    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.queryObject<ItemRow>(
        'SELECT * FROM items WHERE expiration_date <= $1 ORDER BY expiration_date ASC',
        [new Date(Date.now() + days * this.secondsInDay)],
      );
      client.release();
      return result.rows.map(this.mapItemRowToItem);
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
      expirationDate: row.expiration_date,
      openedDate: row.opened_date ? row.opened_date : undefined,
      purchaseDate: row.purchase_date,
      notes: row.notes ? row.notes : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const itemService = new ItemService();
