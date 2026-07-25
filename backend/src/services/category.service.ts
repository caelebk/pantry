import { getDB } from '../db/client.ts';
import { CategoryMessages } from '../messages/category.messages.ts';
import { CategoryDTO } from '../models/data-models/category.model.ts';

interface CategoryJoinRow {
  id: number;
  name: string;
  nutrient_type_id: number | null;
  nutrient_type_name: string | null;
}

export class CategoryService {
  /**
   * Retrieves all categories from the database, including nutrient type info.
   * @returns {Promise<CategoryDTO[]>} A promise that resolves to an array of Category objects.
   */
  async getAllCategories(): Promise<CategoryDTO[]> {
    try {
      const db = getDB();
      const rows = db.prepare(`
        SELECT c.*, nt.name as nutrient_type_name
        FROM categories c
        LEFT JOIN nutrient_types nt ON c.nutrient_type_id = nt.id
        ORDER BY c.name
      `).all() as CategoryJoinRow[];
      return rows.map(this.mapRowToDTO);
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
      const row = db.prepare(`
        SELECT c.*, nt.name as nutrient_type_name
        FROM categories c
        LEFT JOIN nutrient_types nt ON c.nutrient_type_id = nt.id
        WHERE c.id = ?
      `).get(id) as CategoryJoinRow | undefined;
      return row ? this.mapRowToDTO(row) : null;
    } catch (error: unknown) {
      console.error('Error finding category by ID:', error);
      throw new Error(CategoryMessages.DB_RETRIEVE_CATEGORY_ERROR);
    }
  }

  private mapRowToDTO(row: CategoryJoinRow): CategoryDTO {
    return {
      id: row.id,
      name: row.name,
      nutrientTypeId: row.nutrient_type_id ?? undefined,
      nutrientTypeName: row.nutrient_type_name ?? undefined,
    };
  }
}

export const categoryService = new CategoryService();
