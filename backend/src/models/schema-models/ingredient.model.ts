/**
 * Ingredient Database Schema
 */
export interface IngredientRow {
  id: string; // UUID
  name: string;
  category_id: number | null;
  default_unit_id: number | null;
  created_at: Date;
  updated_at: Date;
}
