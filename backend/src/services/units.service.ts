import { getPool } from '../db/client.ts';
import { UnitMessages } from '../messages/unit.messages.ts';
import { UnitDTO } from '../models/data-models/unit.model.ts';
import { UnitRow } from '../models/schema-models/unit.model.ts';

export class UnitService {
  /**
   * Retrieves all units from the database.
   * @returns {Promise<UnitDTO[]>}
   */
  async getAllUnits(): Promise<UnitDTO[]> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.queryObject<UnitRow>('SELECT * FROM units');
      client.release();
      return result.rows.map(this.mapRowToDTO);
    } catch (error: unknown) {
      console.error('Error finding units:', error);
      throw new Error(UnitMessages.DB_RETRIEVE_UNITS_ERROR);
    }
  }

  /**
   * Retrieves a unit by its ID.
   * @param {number} id
   * @returns {Promise<UnitDTO | null>}
   */
  async getUnitById(id: number): Promise<UnitDTO | null> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.queryObject<UnitRow>(
        'SELECT * FROM units WHERE id = $1',
        [id],
      );
      client.release();
      const results = result.rows.map(this.mapRowToDTO);
      return results[0] || null;
    } catch (error: unknown) {
      console.error('Error finding unit by ID:', error);
      throw new Error(UnitMessages.DB_RETRIEVE_UNIT_ERROR);
    }
  }

  /**
   * Converts a quantity from one unit to another.
   * @param {number} quantity - Quantity to convert
   * @param {number} fromUnitId - Source unit ID
   * @param {number} toUnitId - Target unit ID
   * @returns {Promise<number>} Converted quantity
   * @throws Error if unit types don't match or units not found.
   */
  async convert(quantity: number, fromUnitId: number, toUnitId: number): Promise<number> {
    const fromUnit = await this.getUnitById(fromUnitId);
    const toUnit = await this.getUnitById(toUnitId);

    if (!fromUnit || !toUnit) {
      throw new Error(UnitMessages.NOT_FOUND);
    }

    if (fromUnit.type !== toUnit.type) {
      throw new Error(UnitMessages.INVALID_CONVERSION_TYPE);
    }

    // Formula: Target = Source * (SourceFactor / TargetFactor)
    // e.g. 1000g (factor 1) -> kg (factor 1000)
    // 1000 * (1 / 1000) = 1
    const sourceFactor = fromUnit.toBaseFactor;
    const targetFactor = toUnit.toBaseFactor;

    return quantity * (sourceFactor / targetFactor);
  }

  private mapRowToDTO(row: UnitRow): UnitDTO {
    return {
      id: row.id,
      name: row.name,
      shortName: row.short_name,
      type: row.type,
      toBaseFactor: row.to_base_factor,
    };
  }
}

export const unitService = new UnitService();
