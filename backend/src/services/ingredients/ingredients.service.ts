import { getPool } from '../../db/client.ts';
import { IngredientMessages } from '../../messages/ingredient.messages.ts';
import { IngredientDTO } from '../../models/data-models/ingredient.model.ts';
import { IngredientRow } from '../../models/schema-models/inventory-schema.model.ts';

export class IngredientsService {
  /**
   * Retrieves all ingredients from the database.
   * @returns {Promise<IngredientDTO[]>} A promise that resolves to an array of Ingredient objects.
   */
  async getAllIngredients(): Promise<IngredientDTO[]> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.queryObject<IngredientRow>('SELECT * FROM ingredients');
      client.release();
      return result.rows.map(this.mapIngredientRowToIngredient);
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
    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.queryObject<IngredientRow>(
        'SELECT * FROM ingredients WHERE id = $1',
        [id],
      );
      client.release();

      const results = result.rows.map(this.mapIngredientRowToIngredient);
      const firstResult = results[0];
      return firstResult || null;
    } catch (error: unknown) {
      console.error('Error finding ingredient by ID:', error);
      throw new Error(IngredientMessages.DB_RETRIEVE_ITEM_ERROR);
    }
  }

  /**
   * Creates a new ingredient in the database.
   * @param {IngredientDTO} ingredient - The ingredient to create.
   * @returns {Promise<IngredientDTO>} A promise that resolves to the created Ingredient object.
   */
  async createIngredient(ingredient: IngredientDTO): Promise<IngredientDTO> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.queryObject<IngredientRow>(
        'INSERT INTO ingredients (name, category_id, default_unit_id) VALUES ($1, $2, $3) RETURNING *',
        [ingredient.name, ingredient.categoryId, ingredient.defaultUnitId],
      );
      client.release();
      const results = result.rows.map(this.mapIngredientRowToIngredient);
      const createdResult = results[0];
      return createdResult;
    } catch (error: unknown) {
      console.error('Error creating ingredient:', error);
      throw new Error(IngredientMessages.DB_CREATE_ITEM_ERROR);
    }
  }

  /**
   * Updates an existing ingredient in the database.
   * @param {string} id - The ID of the ingredient to update.
   * @param {IngredientDTO} ingredient - The ingredient to update.
   * @returns {Promise<IngredientDTO | null>} A promise that resolves to the updated Ingredient object if found, or null if not found.
   */
  async updateIngredient(id: string, ingredient: IngredientDTO): Promise<IngredientDTO | null> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.queryObject<IngredientRow>(
        'UPDATE ingredients SET name = $2, category_id = $3, default_unit_id = $4 WHERE id = $1 RETURNING *',
        [id, ingredient.name, ingredient.categoryId, ingredient.defaultUnitId],
      );
      client.release();
      const results = result.rows.map(this.mapIngredientRowToIngredient);
      const updatedResult = results[0];
      return updatedResult;
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
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.queryObject<IngredientRow>(
        'DELETE FROM ingredients WHERE id = $1',
        [id],
      );
      client.release();
      return true;
    } catch (error: unknown) {
      console.error('Error deleting ingredient:', error);
      throw new Error(IngredientMessages.DB_DELETE_ITEM_ERROR);
    }
  }

  private mapIngredientRowToIngredient(row: IngredientRow): IngredientDTO {
    return {
      id: row.id,
      name: row.name,
      categoryId: row.category_id ? row.category_id : undefined,
      defaultUnitId: row.default_unit_id ? row.default_unit_id : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const ingredientService = new IngredientsService();
