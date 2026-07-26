import { getDB } from '../db/client.ts';
import { CategoryMessages } from '../messages/category.messages.ts';
import {
  CreateIngredientGroupDTO,
  IngredientGroupDTO,
  UpdateIngredientGroupDTO,
} from '../models/data-models/ingredient-group.model.ts';

interface IngredientGroupJoinRow {
  id: number;
  name: string;
  nutrient_group_id: number | null;
  nutrient_group_name: string | null;
}

export class IngredientGroupService {
  /**
   * Retrieves all ingredient groups from the database, including nutrient group info.
   */
  async getAllIngredientGroups(): Promise<IngredientGroupDTO[]> {
    try {
      const db = getDB();
      const rows = db.prepare(`
        SELECT ig.*, ng.name as nutrient_group_name
        FROM ingredient_groups ig
        LEFT JOIN nutrient_groups ng ON ig.nutrient_group_id = ng.id
        ORDER BY ig.name
      `).all() as IngredientGroupJoinRow[];
      return rows.map(this.mapRowToDTO);
    } catch (error: unknown) {
      console.error('Error finding ingredient groups:', error);
      throw new Error(CategoryMessages.DB_RETRIEVE_CATEGORIES_ERROR);
    }
  }

  /**
   * Retrieves an ingredient group by its ID.
   */
  async getIngredientGroupById(id: number): Promise<IngredientGroupDTO | null> {
    try {
      const db = getDB();
      const row = db.prepare(`
        SELECT ig.*, ng.name as nutrient_group_name
        FROM ingredient_groups ig
        LEFT JOIN nutrient_groups ng ON ig.nutrient_group_id = ng.id
        WHERE ig.id = ?
      `).get(id) as IngredientGroupJoinRow | undefined;
      return row ? this.mapRowToDTO(row) : null;
    } catch (error: unknown) {
      console.error('Error finding ingredient group by ID:', error);
      throw new Error(CategoryMessages.DB_RETRIEVE_CATEGORY_ERROR);
    }
  }

  /**
   * Creates a new ingredient group.
   */
  async createIngredientGroup(dto: CreateIngredientGroupDTO): Promise<IngredientGroupDTO> {
    try {
      const db = getDB();
      const nutrientGroupId = dto.nutrientGroupId ?? dto.nutrientTypeId ?? null;
      const lastInsertId = db.prepare(`
        INSERT INTO ingredient_groups (name, nutrient_group_id)
        VALUES (?, ?)
      `).run(dto.name, nutrientGroupId);

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
      const nutrientGroupId =
        dto.nutrientGroupId !== undefined
          ? dto.nutrientGroupId
          : dto.nutrientTypeId !== undefined
          ? dto.nutrientTypeId
          : existing.nutrientGroupId ?? null;

      db.prepare(`
        UPDATE ingredient_groups
        SET name = ?, nutrient_group_id = ?
        WHERE id = ?
      `).run(name, nutrientGroupId, id);

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
      nutrientGroupId: row.nutrient_group_id ?? undefined,
      nutrientGroupName: row.nutrient_group_name ?? undefined,

      // Legacy Aliases
      nutrientTypeId: row.nutrient_group_id ?? undefined,
      nutrientTypeName: row.nutrient_group_name ?? undefined,
    };
  }
}

export const ingredientGroupService = new IngredientGroupService();
