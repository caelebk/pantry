/**
 * Recipe Models
 */

export interface RecipeIngredientDTO {
  recipeId: string;
  ingredientId: string;
  quantity: number;
  unitId: number | null;
  ingredientOrder?: number;
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
  textareaHeight?: number | null;
}

import { UserAuditDTO } from './audit.model.ts';

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
  createdBy?: UserAuditDTO;
  updatedBy?: UserAuditDTO;
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
    ingredientOrder?: number;
    ingredient_order?: number;
  }[];
  steps?: {
    stepNumber?: number;
    step_number?: number;
    instructionText?: string;
    instruction_text?: string;
    timerSeconds?: number;
    imageUrl?: string;
    textareaHeight?: number;
    textarea_height?: number;
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
    ingredientOrder?: number;
    ingredient_order?: number;
  }[];
  steps?: {
    stepNumber?: number;
    step_number?: number;
    instructionText?: string;
    instruction_text?: string;
    timerSeconds?: number;
    imageUrl?: string;
    textareaHeight?: number;
    textarea_height?: number;
  }[];
}
