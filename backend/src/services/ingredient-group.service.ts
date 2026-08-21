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
  created_at?: string;
  updated_at?: string;
  created_by_username?: string | null;
  created_by_full_name?: string | null;
  updated_by_username?: string | null;
  updated_by_full_name?: string | null;
}

export class IngredientGroupService {
  /**
   * Retrieves all ingredient groups from the database, including ingredient category info.
   */
  getAllIngredientGroups(kitchenId: string): Promise<IngredientGroupDTO[]> {
    try {
      const db = getDB();
      const rows = db.prepare(`
        SELECT ig.*, ic.name as ingredient_category_name,
               u_c.username as created_by_username, p_c.full_name as created_by_full_name,
               u_u.username as updated_by_username, p_u.full_name as updated_by_full_name
        FROM ingredient_groups ig
        LEFT JOIN ingredient_categories ic ON ig.ingredient_category_id = ic.id
        LEFT JOIN users u_c ON ig.created_by = u_c.id
        LEFT JOIN profiles p_c ON u_c.id = p_c.user_id
        LEFT JOIN users u_u ON ig.updated_by = u_u.id
        LEFT JOIN profiles p_u ON u_u.id = p_u.user_id
        WHERE ig.kitchen_id = ?
        ORDER BY ig.name
      `).all(kitchenId) as IngredientGroupJoinRow[];
      return Promise.resolve(rows.map(this.mapRowToDTO));
    } catch (error: unknown) {
      console.error('Error finding ingredient groups:', error);
      throw new Error(IngredientGroupMessages.DB_RETRIEVE_CATEGORIES_ERROR);
    }
  }

  /**
   * Retrieves an ingredient group by its ID.
   */
  getIngredientGroupById(id: number, kitchenId: string): Promise<IngredientGroupDTO | null> {
    try {
      const db = getDB();
      const row = db.prepare(`
        SELECT ig.*, ic.name as ingredient_category_name,
               u_c.username as created_by_username, p_c.full_name as created_by_full_name,
               u_u.username as updated_by_username, p_u.full_name as updated_by_full_name
        FROM ingredient_groups ig
        LEFT JOIN ingredient_categories ic ON ig.ingredient_category_id = ic.id
        LEFT JOIN users u_c ON ig.created_by = u_c.id
        LEFT JOIN profiles p_c ON u_c.id = p_c.user_id
        LEFT JOIN users u_u ON ig.updated_by = u_u.id
        LEFT JOIN profiles p_u ON u_u.id = p_u.user_id
        WHERE ig.id = ? AND ig.kitchen_id = ?
      `).get(id, kitchenId) as IngredientGroupJoinRow | undefined;
      return Promise.resolve(row ? this.mapRowToDTO(row) : null);
    } catch (error: unknown) {
      console.error('Error finding ingredient group by ID:', error);
      throw new Error(IngredientGroupMessages.DB_RETRIEVE_CATEGORY_ERROR);
    }
  }

  /**
   * Creates a new ingredient group.
   */
  async createIngredientGroup(
    dto: CreateIngredientGroupDTO,
    kitchenId: string,
    userId: string,
  ): Promise<IngredientGroupDTO> {
    try {
      const db = getDB();
      const categoryId = dto.ingredientCategoryId ?? dto.nutrientGroupId ?? dto.nutrientTypeId ??
        null;
      db.prepare(`
        INSERT INTO ingredient_groups (name, ingredient_category_id, kitchen_id, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(dto.name, categoryId, kitchenId, userId, userId);
      const lastInsertId = db.lastInsertRowId;

      const created = await this.getIngredientGroupById(Number(lastInsertId), kitchenId);
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
    kitchenId: string,
    dto: UpdateIngredientGroupDTO,
    userId: string,
  ): Promise<IngredientGroupDTO | null> {
    try {
      const db = getDB();
      const existing = await this.getIngredientGroupById(id, kitchenId);
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
        SET name = ?, ingredient_category_id = ?, updated_by = ?
        WHERE id = ? AND kitchen_id = ?
      `).run(name, categoryId, userId, id, kitchenId);

      return await this.getIngredientGroupById(id, kitchenId);
    } catch (error: unknown) {
      console.error('Error updating ingredient group:', error);
      throw new Error('Failed to update ingredient group');
    }
  }

  /**
   * Deletes an ingredient group by ID.
   */
  async deleteIngredientGroup(id: number, kitchenId: string): Promise<boolean> {
    try {
      const db = getDB();
      const existing = await this.getIngredientGroupById(id, kitchenId);
      if (!existing) return false;

      db.prepare('DELETE FROM ingredient_groups WHERE id = ? AND kitchen_id = ?').run(
        id,
        kitchenId,
      );
      return true;
    } catch (error: unknown) {
      console.error('Error deleting ingredient group:', error);
      throw new Error('Failed to delete ingredient group');
    }
  }

  private mapRowToDTO(
    row: IngredientGroupJoinRow & { created_by?: string | null; updated_by?: string | null },
  ): IngredientGroupDTO {
    return {
      id: row.id,
      name: row.name,
      ingredientCategoryId: row.ingredient_category_id ?? undefined,
      ingredientCategoryName: row.ingredient_category_name ?? undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      createdBy: row.created_by
        ? {
          id: row.created_by,
          username: row.created_by_username || undefined,
          fullName: row.created_by_full_name || undefined,
        }
        : undefined,
      updatedBy: row.updated_by
        ? {
          id: row.updated_by,
          username: row.updated_by_username || undefined,
          fullName: row.updated_by_full_name || undefined,
        }
        : undefined,

      // Legacy Aliases
      nutrientGroupId: row.ingredient_category_id ?? undefined,
      nutrientGroupName: row.ingredient_category_name ?? undefined,
      nutrientTypeId: row.ingredient_category_id ?? undefined,
      nutrientTypeName: row.ingredient_category_name ?? undefined,
    };
  }
}

export const ingredientGroupService = new IngredientGroupService();
