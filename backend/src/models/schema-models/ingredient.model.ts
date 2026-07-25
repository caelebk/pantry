/**
 * Ingredient Database Schema (SQLite returns dates as strings)
 */
export interface IngredientRow {
  id: string; // UUID
  name: string;
  category_id: number | null;
  default_unit_id: number | null;
  created_at: string;
  updated_at: string;
}
