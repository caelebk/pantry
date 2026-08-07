import { getDB } from '../db/client.ts';
import type { IngredientCategoryDTO } from '../models/data-models/ingredient-category.model.ts';
import type { IngredientCategoryRow } from '../models/schema-models/ingredient-category.model.ts';

export class IngredientCategoryService {
  /**
   * Retrieves all ingredient categories from the database.
   */
  getAllIngredientCategories(): Promise<IngredientCategoryDTO[]> {
    try {
      const db = getDB();
      const rows = db.prepare('SELECT * FROM ingredient_categories ORDER BY id')
        .all() as IngredientCategoryRow[];
      return Promise.resolve(rows.map(this.mapRowToDTO));
    } catch (error: unknown) {
      console.error('Error fetching ingredient categories:', error);
      throw new Error('Failed to retrieve ingredient categories from the database.');
    }
  }

  /**
   * Retrieves a single ingredient category by its ID.
   */
  getIngredientCategoryById(id: number): Promise<IngredientCategoryDTO | null> {
    try {
      const db = getDB();
      const row = db.prepare('SELECT * FROM ingredient_categories WHERE id = ?').get(id) as
        | IngredientCategoryRow
        | undefined;
      return Promise.resolve(row ? this.mapRowToDTO(row) : null);
    } catch (error: unknown) {
      console.error('Error fetching ingredient category by ID:', error);
      throw new Error('Failed to retrieve ingredient category from the database.');
    }
  }

  private mapRowToDTO(row: IngredientCategoryRow): IngredientCategoryDTO {
    return {
      id: row.id,
      name: row.name,
      icon: row.icon ?? undefined,
      color: row.color ?? undefined,
      description: row.description ?? undefined,
    };
  }
}

export const ingredientCategoryService = new IngredientCategoryService();

// Legacy Aliases
export {
  IngredientCategoryService as NutrientGroupService,
  ingredientCategoryService as nutrientGroupService,
};
