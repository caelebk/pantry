export interface RecipeIngredientDTO {
  recipeId?: string;
  ingredientId: string;
  quantity: number;
  unitId?: number | null;
  ingredientOrder?: number;
}

export interface RecipeStepDTO {
  id?: string;
  recipeId?: string;
  stepNumber: number;
  instructionText: string;
  imageUrl?: string;
  timerSeconds?: number;
  textareaHeight?: number;
}

import { UserAudit } from '@models/audit.model';

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
  createdBy?: UserAudit;
  updatedBy?: UserAudit;
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
