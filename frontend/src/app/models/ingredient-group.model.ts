export interface IngredientGroup {
  id: number;
  name: string;
  nutrientGroupId?: number;
  nutrientGroupName?: string;
  nutrientTypeId?: number;
  nutrientTypeName?: string;
}

// Legacy Alias
export type Category = IngredientGroup;
