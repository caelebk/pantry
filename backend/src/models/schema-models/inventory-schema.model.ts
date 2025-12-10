
/**
 * Database Schema Definitions
 * These interfaces match the actual database table structures (snake_case)
 */

export interface IngredientRow {
  id: string; // UUID
  name: string;
  category_id: number | null;
  default_unit_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ItemRow {
  id: string; // UUID
  ingredient_id: string | null;
  label: string;
  quantity: number;
  unit_id: number;
  location_id: number;
  expiration_date: Date;
  opened_date: Date | null;
  purchase_date: Date;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface LocationRow {
  id: number;
  name: string;
}

export interface CategoryRow {
  id: number;
  name: string;
}

export interface UnitRow {
  id: number;
  name: string;
  type: string;
  to_base_factor: number;
}