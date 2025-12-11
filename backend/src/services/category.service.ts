import { getPool } from '../db/client.ts';
import { CategoryMessages } from '../messages/category.messages.ts';
import { CategoryDTO } from '../models/data-models/category.model.ts';
import { CategoryRow } from '../models/schema-models/category.model.ts';

export class CategoryService {
  /**
   * Retrieves all categories from the database.
   * @returns {Promise<CategoryDTO[]>} A promise that resolves to an array of Category objects.
   */
  async getAllCategories(): Promise<CategoryDTO[]> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.queryObject<CategoryRow>('SELECT * FROM categories');
      client.release();
      return result.rows.map(this.mapCategoryRowToCategory);
    } catch (error: unknown) {
      console.error('Error finding categories:', error);
      throw new Error(CategoryMessages.DB_RETRIEVE_CATEGORIES_ERROR);
    }
  }

  /**
   * Retrieves a category by its ID.
   * @param {number} id - The ID of the category to retrieve.
   * @returns {Promise<CategoryDTO | null>} A promise that resolves to the Category object if found, or null if not found.
   */
  async getCategoryById(id: number): Promise<CategoryDTO | null> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.queryObject<CategoryRow>(
        'SELECT * FROM categories WHERE id = $1',
        [id],
      );
      client.release();
      const results = result.rows.map(this.mapCategoryRowToCategory);
      return results[0] || null;
    } catch (error: unknown) {
      console.error('Error finding category by ID:', error);
      throw new Error(CategoryMessages.DB_RETRIEVE_CATEGORY_ERROR);
    }
  }

  private mapCategoryRowToCategory(row: CategoryRow): CategoryDTO {
    return {
      id: row.id,
      name: row.name,
    };
  }
}

export const categoryService = new CategoryService();
