import { getDB } from '../db/client.ts';
import { IngredientMessages } from '../messages/ingredient.messages.ts';
import {
  CreateIngredientDTO,
  IngredientDTO,
  UpdateIngredientDTO,
} from '../models/data-models/ingredient.model.ts';
import { IngredientRow } from '../models/schema-models/ingredient.model.ts';

export class IngredientsService {
  /**
   * Retrieves all ingredients from the database.
   * @returns {Promise<IngredientDTO[]>} A promise that resolves to an array of Ingredient objects.
   */
  async getAllIngredients(): Promise<IngredientDTO[]> {
    try {
      const db = getDB();
      const rows = db.prepare('SELECT * FROM ingredients').all() as IngredientRow[];
      return rows.map(this.mapIngredientRowToIngredient);
    } catch (error: unknown) {
      console.error('Error finding ingredients:', error);
      throw new Error(IngredientMessages.DB_RETRIEVE_ITEMS_ERROR);
    }
  }

  /**
   * Retrieves an ingredient by its ID.
   * @param {string} id - The ID of the ingredient to retrieve.
   * @returns {Promise<IngredientDTO | null>} A promise that resolves to the Ingredient object if found, or null if not found.
   */
  async getIngredientById(id: string): Promise<IngredientDTO | null> {
    try {
      const db = getDB();
      const row = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id) as
        | IngredientRow
        | undefined;
      return row ? this.mapIngredientRowToIngredient(row) : null;
    } catch (error: unknown) {
      console.error('Error finding ingredient by ID:', error);
      throw new Error(IngredientMessages.DB_RETRIEVE_ITEM_ERROR);
    }
  }

  /**
   * Creates a new ingredient in the database.
   * @param {CreateIngredientDTO} ingredient - The ingredient to create.
   * @returns {Promise<IngredientDTO>} A promise that resolves to the created Ingredient object.
   */
  async createIngredient(ingredient: CreateIngredientDTO): Promise<IngredientDTO> {
    try {
      const db = getDB();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const groupId = ingredient.ingredientGroupId ?? ingredient.categoryId ?? null;

      db.prepare(
        'INSERT INTO ingredients (id, name, ingredient_group_id, default_unit_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(id, ingredient.name, groupId, ingredient.defaultUnitId ?? null, now, now);

      const row = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id) as IngredientRow;
      return this.mapIngredientRowToIngredient(row);
    } catch (error: unknown) {
      console.error('Error creating ingredient:', error);
      throw new Error(IngredientMessages.DB_CREATE_ITEM_ERROR);
    }
  }

  /**
   * Updates an existing ingredient in the database.
   * @param {string} id - The ID of the ingredient to update.
   * @param {UpdateIngredientDTO} ingredient - The ingredient to update.
   * @returns {Promise<IngredientDTO | null>} A promise that resolves to the updated Ingredient object if found, or null if not found.
   */
  async updateIngredient(
    id: string,
    ingredient: UpdateIngredientDTO,
  ): Promise<IngredientDTO | null> {
    try {
      const db = getDB();
      const groupId = ingredient.ingredientGroupId ?? ingredient.categoryId ?? null;

      db.prepare(
        'UPDATE ingredients SET name = COALESCE(?, name), ingredient_group_id = COALESCE(?, ingredient_group_id), default_unit_id = COALESCE(?, default_unit_id) WHERE id = ?',
      ).run(
        ingredient.name ?? null,
        groupId,
        ingredient.defaultUnitId ?? null,
        id,
      );

      const row = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id) as
        | IngredientRow
        | undefined;
      return row ? this.mapIngredientRowToIngredient(row) : null;
    } catch (error: unknown) {
      console.error('Error updating ingredient:', error);
      throw new Error(IngredientMessages.DB_UPDATE_ITEM_ERROR);
    }
  }

  /**
   * Deletes an ingredient from the database.
   * @param {string} id - The ID of the ingredient to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the ingredient was successfully deleted, false otherwise.
   */
  async deleteIngredient(id: string): Promise<boolean> {
    try {
      const db = getDB();
      db.prepare('DELETE FROM ingredients WHERE id = ?').run(id);
      return true;
    } catch (error: unknown) {
      console.error('Error deleting ingredient:', error);
      throw new Error(IngredientMessages.DB_DELETE_ITEM_ERROR);
    }
  }

  /**
   * Retrieves all ingredients by ingredient group from the database.
   * @param {number} groupId - The ID of the group to retrieve ingredients from.
   * @returns {Promise<IngredientDTO[]>} A promise that resolves to an array of Ingredient objects.
   */
  async getIngredientsByGroup(groupId: number): Promise<IngredientDTO[]> {
    try {
      const db = getDB();
      const rows = db.prepare('SELECT * FROM ingredients WHERE ingredient_group_id = ?').all(
        groupId,
      ) as IngredientRow[];
      return rows.map(this.mapIngredientRowToIngredient);
    } catch (error: unknown) {
      console.error('Error finding ingredients by group:', error);
      throw new Error(IngredientMessages.DB_RETRIEVE_ITEMS_ERROR);
    }
  }

  private mapIngredientRowToIngredient(row: IngredientRow): IngredientDTO {
    const groupId = row.ingredient_group_id ?? row.category_id ?? undefined;
    return {
      id: row.id,
      name: row.name,
      ingredientGroupId: groupId,
      categoryId: groupId,
      defaultUnitId: row.default_unit_id ? row.default_unit_id : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const ingredientService = new IngredientsService();
