export interface IngredientGroup {
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

// Legacy Alias
export type Category = IngredientGroup;
