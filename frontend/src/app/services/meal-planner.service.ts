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
      mealType: 'Breakfast',
      recipeId: 'rec-2',
      recipeName: 'Avocado Egg Toast',
      prepTimeMinutes: 10,
      calories: 380,
      servings: 1,
      cooked: true,
      missingIngredients: [],
      tags: ['Quick', 'Breakfast'],
    },
    {
      id: 'meal-2',
      day: 'Monday',
      mealType: 'Dinner',
      recipeId: 'rec-1',
      recipeName: 'Simple Tomato Basil Pasta',
      prepTimeMinutes: 20,
      calories: 520,
      servings: 2,
      cooked: false,
      missingIngredients: ['Fresh Basil', 'Parmesan Cheese'],
      tags: ['Italian', 'Pasta'],
    },
    {
      id: 'meal-3',
      day: 'Tuesday',
      mealType: 'Lunch',
      recipeId: 'rec-4',
      recipeName: 'Quinoa Veggie Power Bowl',
      prepTimeMinutes: 15,
      calories: 410,
      servings: 1,
      cooked: false,
      missingIngredients: ['Quinoa', 'Feta Cheese'],
      tags: ['Healthy', 'Vegetarian'],
    },
    {
      id: 'meal-4',
      day: 'Wednesday',
      mealType: 'Lunch',
      recipeId: 'rec-2',
      recipeName: 'Classic Egg Omelette',
      prepTimeMinutes: 10,
      calories: 320,
      servings: 1,
      cooked: true,
      missingIngredients: [],
      tags: ['Protein', 'Keto'],
    },
    {
      id: 'meal-5',
      day: 'Thursday',
      mealType: 'Dinner',
      recipeId: 'rec-5',
      recipeName: 'Honey Garlic Salmon & Asparagus',
      prepTimeMinutes: 25,
      calories: 580,
      servings: 2,
      cooked: false,
      missingIngredients: ['Salmon Fillet', 'Asparagus Speared'],
      tags: ['Seafood', 'High Protein'],
    },
    {
      id: 'meal-6',
      day: 'Friday',
      mealType: 'Dinner',
      recipeId: 'rec-3',
      recipeName: 'Grilled Chicken Caesar Salad',
      prepTimeMinutes: 25,
      calories: 460,
      servings: 3,
      cooked: false,
      missingIngredients: ['Caesar Dressing', 'Croutons'],
      tags: ['Low Carb', 'Salad'],
    },
    {
      id: 'meal-7',
      day: 'Saturday',
      mealType: 'Snacks',
      recipeId: 'rec-6',
      recipeName: 'Berry Protein Smoothie',
      prepTimeMinutes: 5,
      calories: 240,
      servings: 1,
      cooked: false,
      missingIngredients: ['Almond Milk'],
      tags: ['Smoothie', 'Snack'],
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
      calories: 450,
      servings: recipe.servings || 2,
      cooked: false,
      missingIngredients: missing,
      tags: recipe.tags || ['Custom'],
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

  addAllMissingToShoppingList(): void {
    const allMeals = this.mealsSignal().filter((m) => !m.cooked);
    const missingItems: { name: string; category: string; quantity: number; unit: string; source: 'recipe_plan'; recipeName: string }[] = [];

    allMeals.forEach((meal) => {
      if (meal.missingIngredients && meal.missingIngredients.length > 0) {
        meal.missingIngredients.forEach((ing) => {
          missingItems.push({
            name: ing,
            category: 'Produce',
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
