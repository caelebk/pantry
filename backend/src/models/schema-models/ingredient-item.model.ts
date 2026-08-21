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
  expiration_date: string | null;

  opened_date: string | null;
  purchase_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// Legacy Alias
export type ItemRow = IngredientItemRow;
