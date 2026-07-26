/**
 * Ingredient Category Data Models
 */

export interface IngredientCategoryDTO {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
}

// Legacy Aliases
export type NutrientGroupDTO = IngredientCategoryDTO;
export type NutrientTypeDTO = IngredientCategoryDTO;
