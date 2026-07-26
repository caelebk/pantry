import { getDB } from '../db/client.ts';
import { NutrientTypeMessages } from '../messages/nutrient-type.messages.ts';
import type { NutrientGroupDTO } from '../models/data-models/nutrient-group.model.ts';
import type { NutrientGroupRow } from '../models/schema-models/nutrient-group.model.ts';

export class NutrientGroupService {
  /**
   * Retrieves all nutrient groups from the database.
   */
  async getAllNutrientGroups(): Promise<NutrientGroupDTO[]> {
    try {
      const db = getDB();
      const rows = db.prepare('SELECT * FROM nutrient_groups ORDER BY id').all() as NutrientGroupRow[];
      return rows.map(this.mapRowToDTO);
    } catch (error: unknown) {
      console.error('Error fetching nutrient groups:', error);
      throw new Error(NutrientTypeMessages.DB_RETRIEVE_NUTRIENT_TYPES_ERROR);
    }
  }

  /**
   * Retrieves a single nutrient group by its ID.
   */
  async getNutrientGroupById(id: number): Promise<NutrientGroupDTO | null> {
    try {
      const db = getDB();
      const row = db.prepare('SELECT * FROM nutrient_groups WHERE id = ?').get(id) as NutrientGroupRow | undefined;
      return row ? this.mapRowToDTO(row) : null;
    } catch (error: unknown) {
      console.error('Error fetching nutrient group by ID:', error);
      throw new Error(NutrientTypeMessages.DB_RETRIEVE_NUTRIENT_TYPE_ERROR);
    }
  }

  private mapRowToDTO(row: NutrientGroupRow): NutrientGroupDTO {
    return {
      id: row.id,
      name: row.name,
      icon: row.icon ?? undefined,
      color: row.color ?? undefined,
      description: row.description ?? undefined,
    };
  }
}

export const nutrientGroupService = new NutrientGroupService();
