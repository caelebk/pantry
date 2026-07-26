/**
 * Ingredient Category Database Schema
 */
export interface IngredientCategoryRow {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
}

// Legacy Aliases
export type NutrientGroupRow = IngredientCategoryRow;
export type NutrientTypeRow = IngredientCategoryRow;
