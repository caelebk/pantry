/**
 * Ingredient Group Data Models
 */

export interface IngredientGroupDTO {
  id: number;
  name: string;
  nutrientGroupId?: number;
  nutrientGroupName?: string;

  // Legacy Alias Compatibility
  nutrientTypeId?: number;
  nutrientTypeName?: string;
}

export interface CreateIngredientGroupDTO {
  name: string;
  nutrientGroupId?: number;
  nutrientTypeId?: number; // Legacy alias
}

export interface UpdateIngredientGroupDTO {
  name?: string;
  nutrientGroupId?: number;
  nutrientTypeId?: number; // Legacy alias
}

// Legacy Aliases
export type CategoryDTO = IngredientGroupDTO;
export type CreateCategoryDTO = CreateIngredientGroupDTO;
export type UpdateCategoryDTO = UpdateIngredientGroupDTO;
