export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

export interface PlannedMeal {
  id: string;
  day: DayOfWeek;
  mealType: MealType;
  recipeId: string;
  recipeName: string;
  recipeImage?: string;
  prepTimeMinutes?: number;
  servings: number;
  cooked: boolean;
  missingIngredients: string[];
}

export interface MealPlanDay {
  day: DayOfWeek;
  dateStr: string;
  meals: PlannedMeal[];
}
