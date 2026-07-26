/**
 * Ingredient Group Data Models
 */

export interface IngredientGroupDTO {
  id: number;
  name: string;
  ingredientCategoryId?: number;
  ingredientCategoryName?: string;

  // Legacy Aliases
  nutrientGroupId?: number;
  nutrientGroupName?: string;
  nutrientTypeId?: number;
  nutrientTypeName?: string;
}

export interface CreateIngredientGroupDTO {
  name: string;
  ingredientCategoryId?: number;
  nutrientGroupId?: number;
  nutrientTypeId?: number;
}

export interface UpdateIngredientGroupDTO {
  name?: string;
  ingredientCategoryId?: number;
  nutrientGroupId?: number;
  nutrientTypeId?: number;
}
