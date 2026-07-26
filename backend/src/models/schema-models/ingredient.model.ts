/**
 * Ingredient Database Schema (SQLite returns dates as strings)
 */
export interface IngredientRow {
  id: string; // UUID
  name: string;
  ingredient_group_id: number | null;
  category_id?: number | null; // Legacy alias fallback
  default_unit_id: number | null;
  created_at: string;
  updated_at: string;
}
