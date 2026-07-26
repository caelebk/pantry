export interface MealPlanDTO {
  id: string;
  day: string;
  mealType: string;
  recipeId?: string;
  recipeName: string;
  prepTimeMinutes: number;
  calories: number;
  servings: number;
  cooked: boolean;
  missingIngredients: string[];
  tags: string[];
  createdAt?: string;
}

export interface CreateMealPlanDTO {
  day: string;
  mealType: string;
  recipeId?: string;
  recipeName: string;
  prepTimeMinutes?: number;
  calories?: number;
  servings?: number;
  cooked?: boolean;
  missingIngredients?: string[];
  tags?: string[];
}

export interface UpdateMealPlanDTO {
  day?: string;
  mealType?: string;
  recipeId?: string;
  recipeName?: string;
  prepTimeMinutes?: number;
  calories?: number;
  servings?: number;
  cooked?: boolean;
  missingIngredients?: string[];
  tags?: string[];
}
