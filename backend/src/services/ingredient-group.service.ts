import { getDB } from '../db/client.ts';
import { IngredientGroupMessages } from '../messages/ingredient-group.messages.ts';
import {
  CreateIngredientGroupDTO,
  IngredientGroupDTO,
  UpdateIngredientGroupDTO,
} from '../models/data-models/ingredient-group.model.ts';

interface IngredientGroupJoinRow {
  id: number;
  name: string;
  ingredient_category_id: number | null;
  ingredient_category_name: string | null;
}

export class IngredientGroupService {
  /**
   * Retrieves all ingredient groups from the database, including ingredient category info.
   */
  async getAllIngredientGroups(): Promise<IngredientGroupDTO[]> {
    try {
      const db = getDB();
      const rows = db.prepare(`
        SELECT ig.*, ic.name as ingredient_category_name
        FROM ingredient_groups ig
        LEFT JOIN ingredient_categories ic ON ig.ingredient_category_id = ic.id
        ORDER BY ig.name
      `).all() as IngredientGroupJoinRow[];
      return rows.map(this.mapRowToDTO);
    } catch (error: unknown) {
      console.error('Error finding ingredient groups:', error);
      throw new Error(IngredientGroupMessages.DB_RETRIEVE_CATEGORIES_ERROR);
    }
  }

  /**
   * Retrieves an ingredient group by its ID.
   */
  async getIngredientGroupById(id: number): Promise<IngredientGroupDTO | null> {
    try {
      const db = getDB();
      const row = db.prepare(`
        SELECT ig.*, ic.name as ingredient_category_name
        FROM ingredient_groups ig
        LEFT JOIN ingredient_categories ic ON ig.ingredient_category_id = ic.id
        WHERE ig.id = ?
      `).get(id) as IngredientGroupJoinRow | undefined;
      return row ? this.mapRowToDTO(row) : null;
    } catch (error: unknown) {
      console.error('Error finding ingredient group by ID:', error);
      throw new Error(IngredientGroupMessages.DB_RETRIEVE_CATEGORY_ERROR);
    }
  }

  /**
   * Creates a new ingredient group.
   */
  async createIngredientGroup(dto: CreateIngredientGroupDTO): Promise<IngredientGroupDTO> {
    try {
      const db = getDB();
      const categoryId = dto.ingredientCategoryId ?? dto.nutrientGroupId ?? dto.nutrientTypeId ?? null;
      const lastInsertId = db.prepare(`
        INSERT INTO ingredient_groups (name, ingredient_category_id)
        VALUES (?, ?)
      `).run(dto.name, categoryId);

      const created = await this.getIngredientGroupById(Number(lastInsertId));
      if (!created) {
        throw new Error('Failed to retrieve newly created ingredient group');
      }
      return created;
    } catch (error: unknown) {
      console.error('Error creating ingredient group:', error);
      throw new Error('Failed to create ingredient group');
    }
  }

  /**
   * Updates an existing ingredient group.
   */
  async updateIngredientGroup(
    id: number,
    dto: UpdateIngredientGroupDTO,
  ): Promise<IngredientGroupDTO | null> {
    try {
      const db = getDB();
      const existing = await this.getIngredientGroupById(id);
      if (!existing) return null;

      const name = dto.name !== undefined ? dto.name : existing.name;
      const categoryId = dto.ingredientCategoryId !== undefined
        ? dto.ingredientCategoryId
        : dto.nutrientGroupId !== undefined
        ? dto.nutrientGroupId
        : dto.nutrientTypeId !== undefined
        ? dto.nutrientTypeId
        : existing.ingredientCategoryId ?? null;

      db.prepare(`
        UPDATE ingredient_groups
        SET name = ?, ingredient_category_id = ?
        WHERE id = ?
      `).run(name, categoryId, id);

      return await this.getIngredientGroupById(id);
    } catch (error: unknown) {
      console.error('Error updating ingredient group:', error);
      throw new Error('Failed to update ingredient group');
    }
  }

  /**
   * Deletes an ingredient group by ID.
   */
  async deleteIngredientGroup(id: number): Promise<boolean> {
    try {
      const db = getDB();
      const existing = await this.getIngredientGroupById(id);
      if (!existing) return false;

      db.prepare('DELETE FROM ingredient_groups WHERE id = ?').run(id);
      return true;
    } catch (error: unknown) {
      console.error('Error deleting ingredient group:', error);
      throw new Error('Failed to delete ingredient group');
    }
  }

  private mapRowToDTO(row: IngredientGroupJoinRow): IngredientGroupDTO {
    return {
      id: row.id,
      name: row.name,
      ingredientCategoryId: row.ingredient_category_id ?? undefined,
      ingredientCategoryName: row.ingredient_category_name ?? undefined,

      // Legacy Aliases
      nutrientGroupId: row.ingredient_category_id ?? undefined,
      nutrientGroupName: row.ingredient_category_name ?? undefined,
      nutrientTypeId: row.ingredient_category_id ?? undefined,
      nutrientTypeName: row.ingredient_category_name ?? undefined,
    };
  }
}

export const ingredientGroupService = new IngredientGroupService();
