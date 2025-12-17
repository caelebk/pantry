/**
 * Unit Database Schema
 */
export interface UnitRow {
  id: number;
  name: string;
  short_name: string;
  type: string;
  to_base_factor: number;
}
