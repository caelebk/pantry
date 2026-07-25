/**
 * Nutrient Type service - Business logic for nutrient type operations
 */

import { getDB } from '../db/client.ts';
import { NutrientTypeMessages } from '../messages/nutrient-type.messages.ts';
import type { NutrientTypeDTO } from '../models/data-models/nutrient-type.model.ts';
import type { NutrientTypeRow } from '../models/schema-models/nutrient-type.model.ts';

export class NutrientTypeService {
  /**
   * Retrieves all nutrient types from the database.
   */
  async getAllNutrientTypes(): Promise<NutrientTypeDTO[]> {
    try {
      const db = getDB();
      const rows = db.prepare('SELECT * FROM nutrient_types ORDER BY id').all() as NutrientTypeRow[];
      return rows.map(this.mapRowToDTO);
    } catch (error: unknown) {
      console.error('Error fetching nutrient types:', error);
      throw new Error(NutrientTypeMessages.DB_RETRIEVE_NUTRIENT_TYPES_ERROR);
    }
  }

  /**
   * Retrieves a single nutrient type by its ID.
   */
  async getNutrientTypeById(id: number): Promise<NutrientTypeDTO | null> {
    try {
      const db = getDB();
      const row = db.prepare('SELECT * FROM nutrient_types WHERE id = ?').get(id) as NutrientTypeRow | undefined;
      return row ? this.mapRowToDTO(row) : null;
    } catch (error: unknown) {
      console.error('Error fetching nutrient type by ID:', error);
      throw new Error(NutrientTypeMessages.DB_RETRIEVE_NUTRIENT_TYPE_ERROR);
    }
  }

  private mapRowToDTO(row: NutrientTypeRow): NutrientTypeDTO {
    return {
      id: row.id,
      name: row.name,
      icon: row.icon ?? undefined,
      color: row.color ?? undefined,
      description: row.description ?? undefined,
    };
  }
}

export const nutrientTypeService = new NutrientTypeService();
