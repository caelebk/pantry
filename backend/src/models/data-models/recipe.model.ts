/**
 * Recipe Models
 */

export interface RecipeIngredientDTO {
  recipeId: string;
  ingredientId: string;
  quantity: number;
  unitId: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RecipeStepDTO {
  id: string; // UUID
  recipeId: string;
  stepNumber: number;
  instructionText: string;
  imageUrl?: string;
  timerSeconds?: number;
}

export interface RecipeDTO {
  id: string; // UUID
  name: string;
  description?: string;
  difficultyId?: number;
  difficulty?: string; // 'Easy', 'Medium', 'Hard'
  servings?: number;
  prepTime?: number; // minutes
  cookTime?: number; // minutes
  imageUrl?: string;
  ingredients?: RecipeIngredientDTO[];
  steps?: RecipeStepDTO[];
  createdAt: Date;
  updatedAt: Date;
}

// Alias Recipe to RecipeDTO for compatibility
export type Recipe = RecipeDTO;

// DTOs for API interaction
export interface CreateRecipeDTO {
  name: string;
  description?: string;
  difficultyId?: number;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  imageUrl?: string;
  ingredients?: {
    ingredientId: string;
    quantity: number;
    unitId?: number;
  }[];
  steps?: {
    stepNumber?: number;
    step_number?: number;
    instructionText?: string;
    instruction_text?: string;
    timerSeconds?: number;
    imageUrl?: string;
  }[];
}

export interface UpdateRecipeDTO {
  name?: string;
  description?: string;
  difficultyId?: number;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  imageUrl?: string;
  ingredients?: {
    ingredientId: string;
    quantity: number;
    unitId?: number;
  }[];
  steps?: {
    stepNumber?: number;
    step_number?: number;
    instructionText?: string;
    instruction_text?: string;
    timerSeconds?: number;
    imageUrl?: string;
  }[];
}
