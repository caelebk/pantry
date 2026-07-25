export interface RecipeIngredientDTO {
  recipeId?: string;
  ingredientId: string;
  quantity: number;
  unitId?: number | null;
}

export interface RecipeStepDTO {
  id?: string;
  recipeId?: string;
  stepNumber: number;
  instructionText: string;
  imageUrl?: string;
  timerSeconds?: number;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  difficultyId?: number;
  difficulty?: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  imageUrl?: string;
  tags?: string[];
  ingredients?: RecipeIngredientDTO[];
  steps?: RecipeStepDTO[];
  createdAt?: Date;
  updatedAt?: Date;
}

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
    stepNumber: number;
    instructionText: string;
    timerSeconds?: number;
  }[];
}
