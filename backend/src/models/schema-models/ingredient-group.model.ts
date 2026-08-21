/**
 * Ingredient Group Database Schema
 */
export interface IngredientGroupRow {
  id: number;
  name: string;
  ingredient_category_id: number | null;
  nutrient_group_id?: number | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}
