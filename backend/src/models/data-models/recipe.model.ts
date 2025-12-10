/**
 * Recipe Models
 */

export interface Recipe {
  id: string; // UUID
  name: string;
  description?: string;
  difficulty?: string; // 'Easy', 'Medium', 'Hard'
  servings?: number;
  prepTime?: number; // minutes
  cookTime?: number; // minutes
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeIngredient {
  recipeId: string;
  ingredientId: string;
  quantity: number;
  unitId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RecipeStep {
  id: string; // UUID
  recipeId: string;
  stepNumber: number;
  instructionText: string;
  imageUrl?: string;
  timerSeconds?: number;
}

// DTOs for API interaction
export interface CreateRecipeDTO {
  name: string;
  description?: string;
  difficulty?: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  imageUrl?: string;
  ingredients: {
    ingredientId: string;
    quantity: number;
    unitId: number;
  }[];
  steps: {
    stepNumber: number;
    instructionText: string;
    timerSeconds?: number;
    imageUrl?: string;
  }[];
}

export interface UpdateRecipeDTO {
  name?: string;
  description?: string;
  difficulty?: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  imageUrl?: string;
  // Deep updates might be handled separately or require full replacement arrays
}
