import { IngredientGroup } from '@models/ingredient-group.model';
import { Unit } from '@models/unit.model';

export interface Ingredient {
  id: string;
  name: string;
  ingredientGroup?: IngredientGroup;
  category?: IngredientGroup;
  defaultUnit?: Unit;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IngredientDTO {
  id: string;
  name: string;
  ingredientGroupId?: number;
  defaultUnitId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateIngredientDTO {
  name: string;
  ingredientGroupId?: number;
  defaultUnitId?: number;
}

export interface UpdateIngredientDTO {
  name?: string;
  ingredientGroupId?: number;
  defaultUnitId?: number;
}
