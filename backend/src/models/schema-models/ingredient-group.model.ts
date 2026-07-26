/**
 * Ingredient Group Database Schema
 */
export interface IngredientGroupRow {
  id: number;
  name: string;
  nutrient_group_id: number | null;
}

// Legacy Alias
export type CategoryRow = IngredientGroupRow;
