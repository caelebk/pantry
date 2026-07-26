/**
 * Ingredient Item Database Schema (SQLite returns dates as strings)
 */
export interface IngredientItemRow {
  id: string; // UUID
  ingredient_id: string | null;
  label: string;
  quantity: number;
  unit_id: number;
  location_id: number;
  expiration_date: string;
  opened_date: string | null;
  purchase_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Legacy Alias
export type ItemRow = IngredientItemRow;
