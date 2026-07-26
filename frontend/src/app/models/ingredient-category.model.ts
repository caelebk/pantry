export interface IngredientCategory {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
}

// Legacy Aliases
export type NutrientGroup = IngredientCategory;
export type NutrientType = IngredientCategory;
