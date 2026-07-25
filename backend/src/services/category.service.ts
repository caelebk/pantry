import { getDB } from '../db/client.ts';
import { CategoryMessages } from '../messages/category.messages.ts';
import { CategoryDTO } from '../models/data-models/category.model.ts';
import { CategoryRow } from '../models/schema-models/category.model.ts';

export class CategoryService {
  /**
   * Retrieves all categories from the database.
   * @returns {Promise<CategoryDTO[]>} A promise that resolves to an array of Category objects.
   */
  async getAllCategories(): Promise<CategoryDTO[]> {
    try {
      const db = getDB();
      const rows = db.prepare('SELECT * FROM categories').all() as CategoryRow[];
      return rows.map(this.mapCategoryRowToCategory);
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
    try {
      const db = getDB();
      const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow | undefined;
      return row ? this.mapCategoryRowToCategory(row) : null;
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
