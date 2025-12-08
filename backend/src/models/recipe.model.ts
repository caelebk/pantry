/**
 * Recipe model
 */

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime?: number; // in minutes
  cookTime?: number; // in minutes
  servings?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Ingredient {
  itemId?: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface CreateRecipeDTO {
  name: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  tags?: string[];
}

export interface UpdateRecipeDTO {
  name?: string;
  description?: string;
  ingredients?: Ingredient[];
  instructions?: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  tags?: string[];
}
