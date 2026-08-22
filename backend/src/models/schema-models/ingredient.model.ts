/**
 * Ingredient Database Schema (SQLite returns dates as strings)
 */
export interface IngredientRow {
  id: string; // UUID
  name: string;
  ingredient_group_id: number | null;
  default_unit_id: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}
