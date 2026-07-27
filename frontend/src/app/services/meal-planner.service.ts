import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ApiResponse } from '@models/http.model';
import { DayOfWeek, MealType, PlannedMeal } from '@models/meal-planner.model';
import { Recipe } from '@models/recipe.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';
import { ShoppingListService } from './shopping-list.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class MealPlannerService {
  private readonly http = inject(HttpClient);
  private readonly shoppingListService = inject(ShoppingListService);
  private readonly toastService = inject(ToastService);
  private readonly apiUrl = '/api/meal-plans';

  readonly days: DayOfWeek[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  private readonly mealsSignal = signal<PlannedMeal[]>([]);
  readonly meals = this.mealsSignal.asReadonly();

  constructor() {
    this.loadMealsFromBackend();
  }

  public loadMealsFromBackend(): void {
    this.http
      .get<ApiResponse<PlannedMeal[]>>(this.apiUrl)
      .pipe(mapResponseData<PlannedMeal[]>())
      .subscribe({
        next: (data) => {
          this.mealsSignal.set(data || []);
        },
        error: (err) => {
          console.error('Failed to load meal plans from backend:', err);
        },
      });
  }

  getMealsForDay(day: DayOfWeek): PlannedMeal[] {
    return this.mealsSignal().filter((m) => m.day === day);
  }

  addMealPlan(day: DayOfWeek, mealType: MealType, recipe: Recipe): void {
    const missing = recipe.ingredients
      ? recipe.ingredients
          .map((i: any) => i.ingredientName || i.name || i.ingredient || 'Ingredient')
          .slice(0, 3)
      : [];

    const newMealPayload = {
      day,
      mealType,
      recipeId: recipe.id,
      recipeName: recipe.name || 'Custom Meal',
      prepTimeMinutes: (recipe.prepTime || 15) + (recipe.cookTime || 0),
      calories: 450,
      servings: recipe.servings || 2,
      cooked: false,
      missingIngredients: missing,
      tags: recipe.difficulty ? [recipe.difficulty] : ['Custom'],
    };

    this.http
      .post<ApiResponse<PlannedMeal>>(this.apiUrl, newMealPayload)
      .pipe(mapResponseData<PlannedMeal>())
      .subscribe({
        next: (created) => {
          this.mealsSignal.update((curr) => [...curr, created]);
          this.toastService.showSuccess(
            `Planned "${created.recipeName}" for ${day} ${mealType}`,
            'Meal Planner',
          );
        },
        error: (err) => {
          console.error('Failed to add meal plan:', err);
          this.toastService.showError('Failed to save meal plan to server.');
        },
      });
  }

  removeMealPlan(id: string): void {
    const meal = this.mealsSignal().find((m) => m.id === id);
    this.http
      .delete<ApiResponse<any>>(`${this.apiUrl}/${id}`)
      .pipe(mapResponseData<any>())
      .subscribe({
        next: () => {
          this.mealsSignal.update((curr) => curr.filter((m) => m.id !== id));
          if (meal) {
            this.toastService.showInfo(`Removed ${meal.recipeName} from plan`);
          }
        },
        error: (err) => {
          console.error('Failed to remove meal plan:', err);
          this.toastService.showError('Failed to remove meal plan from server.');
        },
      });
  }

  toggleCooked(id: string): void {
    const meal = this.mealsSignal().find((m) => m.id === id);
    if (!meal) return;

    const nextCooked = !meal.cooked;
    this.http
      .put<ApiResponse<PlannedMeal>>(`${this.apiUrl}/${id}`, { cooked: nextCooked })
      .pipe(mapResponseData<PlannedMeal>())
      .subscribe({
        next: (updated) => {
          this.mealsSignal.update((curr) => curr.map((m) => (m.id === id ? updated : m)));
          if (nextCooked) {
            this.toastService.showSuccess(
              `Bon Appétit! Marked "${meal.recipeName}" as cooked.`,
              'Meal Completed',
            );
          }
        },
        error: (err) => {
          console.error('Failed to toggle cooked state:', err);
          this.toastService.showError('Failed to update meal status.');
        },
      });
  }

  addMissingToShoppingList(meal: PlannedMeal): void {
    if (!meal.missingIngredients || meal.missingIngredients.length === 0) {
      this.toastService.showInfo('All ingredients are in stock for this recipe!');
      return;
    }

    const itemsToAdd = meal.missingIngredients.map((ing) => ({
      name: ing,
      category: 'General',
      quantity: 1,
      unit: 'pcs',
      source: 'recipe_plan' as const,
      recipeName: meal.recipeName,
    }));

    this.shoppingListService.addMultipleItems(itemsToAdd);
  }

  addAllMissingToShoppingList(): void {
    const allMeals = this.mealsSignal().filter((m) => !m.cooked);
    const missingItems: {
      name: string;
      category: string;
      quantity: number;
      unit: string;
      source: 'recipe_plan';
      recipeName: string;
    }[] = [];

    allMeals.forEach((meal) => {
      if (meal.missingIngredients && meal.missingIngredients.length > 0) {
        meal.missingIngredients.forEach((ing) => {
          missingItems.push({
            name: ing,
            category: 'General',
            quantity: 1,
            unit: 'pcs',
            source: 'recipe_plan',
            recipeName: meal.recipeName,
          });
        });
      }
    });

    if (missingItems.length === 0) {
      this.toastService.showInfo('All planned meals are fully stocked!');
      return;
    }

    this.shoppingListService.addMultipleItems(missingItems);
  }
}
