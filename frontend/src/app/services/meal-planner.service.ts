import { inject, Injectable, signal } from '@angular/core';
import { DayOfWeek, MealType, PlannedMeal } from '@models/meal-planner.model';
import { Recipe } from '@models/recipe.model';
import { ShoppingListService } from './shopping-list.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class MealPlannerService {
  private readonly shoppingListService = inject(ShoppingListService);
  private readonly toastService = inject(ToastService);

  readonly days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  private readonly mealsSignal = signal<PlannedMeal[]>([
    {
      id: 'meal-1',
      day: 'Monday',
      mealType: 'Dinner',
      recipeId: 'rec-1',
      recipeName: 'Simple Pasta with Tomato Basil',
      prepTimeMinutes: 20,
      servings: 2,
      cooked: false,
      missingIngredients: ['Fresh Basil', 'Parmesan Cheese'],
    },
    {
      id: 'meal-2',
      day: 'Wednesday',
      mealType: 'Lunch',
      recipeId: 'rec-2',
      recipeName: 'Classic Egg Omelette',
      prepTimeMinutes: 10,
      servings: 1,
      cooked: true,
      missingIngredients: [],
    },
    {
      id: 'meal-3',
      day: 'Friday',
      mealType: 'Dinner',
      recipeId: 'rec-3',
      recipeName: 'Grilled Chicken Salad',
      prepTimeMinutes: 25,
      servings: 3,
      cooked: false,
      missingIngredients: ['Heavy Cream'],
    },
  ]);

  readonly meals = this.mealsSignal.asReadonly();

  getMealsForDay(day: DayOfWeek): PlannedMeal[] {
    return this.mealsSignal().filter((m) => m.day === day);
  }

  addMealPlan(day: DayOfWeek, mealType: MealType, recipe: Recipe): void {
    const missing = recipe.ingredients
      ? recipe.ingredients.map((i: any) => i.ingredientName || i.name || i.ingredientId || 'Ingredient').slice(0, 2)
      : [];

    const newMeal: PlannedMeal = {
      id: 'plan-' + Date.now(),
      day,
      mealType,
      recipeId: recipe.id,
      recipeName: recipe.name || 'Custom Meal',
      prepTimeMinutes: recipe.prepTime || 15,
      servings: recipe.servings || 2,
      cooked: false,
      missingIngredients: missing,
    };

    this.mealsSignal.update((curr) => [...curr, newMeal]);
    this.toastService.showSuccess(`Planned "${newMeal.recipeName}" for ${day} ${mealType}`, 'Meal Planner');
  }

  removeMealPlan(id: string): void {
    const meal = this.mealsSignal().find((m) => m.id === id);
    this.mealsSignal.update((curr) => curr.filter((m) => m.id !== id));
    if (meal) {
      this.toastService.showInfo(`Removed ${meal.recipeName} from plan`);
    }
  }

  toggleCooked(id: string): void {
    this.mealsSignal.update((curr) =>
      curr.map((meal) => {
        if (meal.id === id) {
          const nextCooked = !meal.cooked;
          if (nextCooked) {
            this.toastService.showSuccess(`Bon Appétit! Marked "${meal.recipeName}" as cooked.`, 'Meal Completed');
          }
          return { ...meal, cooked: nextCooked };
        }
        return meal;
      })
    );
  }

  addMissingToShoppingList(meal: PlannedMeal): void {
    if (!meal.missingIngredients || meal.missingIngredients.length === 0) {
      this.toastService.showInfo('All ingredients are in stock for this recipe!');
      return;
    }

    const itemsToAdd = meal.missingIngredients.map((ing) => ({
      name: ing,
      category: 'Produce',
      quantity: 1,
      unit: 'pcs',
      source: 'recipe_plan' as const,
      recipeName: meal.recipeName,
    }));

    this.shoppingListService.addMultipleItems(itemsToAdd);
  }
}
