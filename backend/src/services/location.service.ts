import { getPool } from '../db/client.ts';
import { LocationMessages } from '../messages/location.messages.ts';
import { LocationDTO } from '../models/data-models/location.model.ts';
import { LocationRow } from '../models/schema-models/location.model.ts';

export class LocationService {
  /**
   * Retrieves all locations from the database.
   * @returns {Promise<LocationDTO[]>}
   */
  async getAllLocations(): Promise<LocationDTO[]> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.queryObject<LocationRow>('SELECT * FROM locations');
      client.release();
      return result.rows.map(this.mapRowToDTO);
    } catch (error: unknown) {
      console.error('Error finding locations:', error);
      throw new Error(LocationMessages.DB_RETRIEVE_LOCATIONS_ERROR);
    }
  }

  /**
   * Retrieves a location by its ID.
   * @param {number} id
   * @returns {Promise<LocationDTO | null>}
   */
  async getLocationById(id: number): Promise<LocationDTO | null> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      const result = await client.queryObject<LocationRow>(
        'SELECT * FROM locations WHERE id = $1',
        [id],
      );
      client.release();
      const results = result.rows.map(this.mapRowToDTO);
      return results[0] || null;
    } catch (error: unknown) {
      console.error('Error finding location by ID:', error);
      throw new Error(LocationMessages.DB_RETRIEVE_LOCATION_ERROR);
    }
  }

  private mapRowToDTO(row: LocationRow): LocationDTO {
    return {
      id: row.id,
      name: row.name,
    };
  }
}

export const locationService = new LocationService();
