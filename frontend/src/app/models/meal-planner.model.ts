export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export interface PlannedMeal {
  id: string;
  day: DayOfWeek;
  mealType: MealType;
  recipeId: string;
  recipeName: string;
  recipeImage?: string;
  prepTimeMinutes?: number | null;
  calories?: number | null;
  servings?: number | null;
  cooked: boolean;
  missingIngredients: string[];
  tags?: string[];
}

export interface MealPlanDay {
  day: DayOfWeek;
  dateStr: string;
  meals: PlannedMeal[];
  totalCalories?: number;
}
