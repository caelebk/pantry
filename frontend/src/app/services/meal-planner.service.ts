import { inject, Injectable, signal } from '@angular/core';
import { DayOfWeek, MealType, PlannedMeal } from '@models/meal-planner.model';
import { Recipe } from '@models/recipe.model';
import { ShoppingListService } from './shopping-list.service';
import { ToastService } from './toast.service';

const MEAL_PLANNER_STORAGE_KEY = 'pantry_meal_planner_meals';

const SEEDED_MEALS: PlannedMeal[] = [
  {
    id: 'meal-1',
    day: 'Monday',
    mealType: 'Breakfast',
    recipeId: 'rec-pancakes',
    recipeName: 'Classic Pancakes',
    prepTimeMinutes: 25,
    calories: 480,
    servings: 4,
    cooked: true,
    missingIngredients: [],
    tags: ['Easy', 'Breakfast'],
  },
  {
    id: 'meal-2',
    day: 'Monday',
    mealType: 'Dinner',
    recipeId: 'rec-spaghetti',
    recipeName: 'Spaghetti with Marinara',
    prepTimeMinutes: 20,
    calories: 520,
    servings: 2,
    cooked: false,
    missingIngredients: ['Spaghetti', 'Marinara Sauce', 'Parmesan Cheese'],
    tags: ['Italian', 'Pasta'],
  },
  {
    id: 'meal-3',
    day: 'Tuesday',
    mealType: 'Lunch',
    recipeId: 'rec-greek-salad',
    recipeName: 'Greek Salad',
    prepTimeMinutes: 15,
    calories: 340,
    servings: 2,
    cooked: false,
    missingIngredients: ['Feta Cheese', 'Avocados'],
    tags: ['Healthy', 'Vegetarian'],
  },
  {
    id: 'meal-4',
    day: 'Wednesday',
    mealType: 'Lunch',
    recipeId: 'rec-fried-rice',
    recipeName: 'Simple Egg Fried Rice',
    prepTimeMinutes: 15,
    calories: 420,
    servings: 2,
    cooked: true,
    missingIngredients: [],
    tags: ['Quick', 'Asian'],
  },
  {
    id: 'meal-5',
    day: 'Thursday',
    mealType: 'Dinner',
    recipeId: 'rec-curry',
    recipeName: 'Chicken Curry',
    prepTimeMinutes: 50,
    calories: 650,
    servings: 4,
    cooked: false,
    missingIngredients: ['Chicken Breast', 'Coconut Milk'],
    tags: ['High Protein', 'Curry'],
  },
  {
    id: 'meal-6',
    day: 'Friday',
    mealType: 'Snacks',
    recipeId: 'rec-fruit-salad',
    recipeName: 'Fresh Fruit Salad',
    prepTimeMinutes: 5,
    calories: 180,
    servings: 2,
    cooked: false,
    missingIngredients: [],
    tags: ['Fresh', 'Fruit'],
  },
  {
    id: 'meal-7',
    day: 'Saturday',
    mealType: 'Snacks',
    recipeId: 'rec-banana-bread',
    recipeName: 'Banana Bread',
    prepTimeMinutes: 75,
    calories: 310,
    servings: 8,
    cooked: false,
    missingIngredients: ['Cinnamon', 'Vanilla Extract'],
    tags: ['Baking', 'Dessert'],
  },
];

function loadMealsFromStorage(): PlannedMeal[] {
  try {
    const raw = localStorage.getItem(MEAL_PLANNER_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load meal plan from localStorage:', err);
  }
  return SEEDED_MEALS;
}

@Injectable({
  providedIn: 'root',
})
export class MealPlannerService {
  private readonly shoppingListService = inject(ShoppingListService);
  private readonly toastService = inject(ToastService);

  readonly days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  private readonly mealsSignal = signal<PlannedMeal[]>(loadMealsFromStorage());

  readonly meals = this.mealsSignal.asReadonly();

  private persistMeals(meals: PlannedMeal[]): void {
    try {
      localStorage.setItem(MEAL_PLANNER_STORAGE_KEY, JSON.stringify(meals));
    } catch (err) {
      console.error('Failed to save meal plan to localStorage:', err);
    }
  }

  getMealsForDay(day: DayOfWeek): PlannedMeal[] {
    return this.mealsSignal().filter((m) => m.day === day);
  }

  addMealPlan(day: DayOfWeek, mealType: MealType, recipe: Recipe): void {
    const missing = recipe.ingredients
      ? recipe.ingredients.map((i: any) => i.ingredientName || i.name || i.ingredient || 'Ingredient').slice(0, 3)
      : [];

    const newMeal: PlannedMeal = {
      id: 'plan-' + Date.now(),
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

    this.mealsSignal.update((curr) => {
      const next = [...curr, newMeal];
      this.persistMeals(next);
      return next;
    });

    this.toastService.showSuccess(`Planned "${newMeal.recipeName}" for ${day} ${mealType}`, 'Meal Planner');
  }

  removeMealPlan(id: string): void {
    const meal = this.mealsSignal().find((m) => m.id === id);
    this.mealsSignal.update((curr) => {
      const next = curr.filter((m) => m.id !== id);
      this.persistMeals(next);
      return next;
    });
    if (meal) {
      this.toastService.showInfo(`Removed ${meal.recipeName} from plan`);
    }
  }

  toggleCooked(id: string): void {
    this.mealsSignal.update((curr) => {
      const next = curr.map((meal) => {
        if (meal.id === id) {
          const nextCooked = !meal.cooked;
          if (nextCooked) {
            this.toastService.showSuccess(`Bon Appétit! Marked "${meal.recipeName}" as cooked.`, 'Meal Completed');
          }
          return { ...meal, cooked: nextCooked };
        }
        return meal;
      });
      this.persistMeals(next);
      return next;
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
    const missingItems: { name: string; category: string; quantity: number; unit: string; source: 'recipe_plan'; recipeName: string }[] = [];

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
