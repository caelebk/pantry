// Ingredient (Base definition of food)
export interface IngredientDTO {
  id: string; // UUID
  name: string;
  categoryId?: number;
  defaultUnitId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CategoryDTO {
  id: number;
  name: string;
}
