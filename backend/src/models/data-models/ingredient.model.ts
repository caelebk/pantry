/**
 * Ingredient Data Models
 */

// Full response object
export interface IngredientDTO {
  id: string; // UUID
  name: string;
  categoryId?: number;
  defaultUnitId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Creation DTO - omit system fields
export interface CreateIngredientDTO {
  name: string;
  categoryId?: number;
  defaultUnitId?: number;
}

// Update DTO - all create fields are optional
export interface UpdateIngredientDTO extends Partial<CreateIngredientDTO> {}
