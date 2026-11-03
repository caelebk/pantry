import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { ApiResponse } from '@models/http.model';
import { Ingredient } from '@models/ingredient.model';
import { IngredientItem } from '@models/items.model';
import { DayOfWeek, MealType, PlannedMeal } from '@models/meal-planner.model';
import { Recipe } from '@models/recipe.model';
import { Unit } from '@models/unit.model';
import { mapResponseData } from '@utility/httpUtility/HttpResponse.operator';
import { recipeTotalTime } from '@utility/recipe-metadata';
import { buildAvailableBaseMap, recipeShortages } from '@utility/recipe-stock';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { IngredientService } from './inventory/ingredient.service';
import { ItemService } from './inventory/item.service';
import { UnitService } from './inventory/unit.service';
import { RecipeService } from './recipe.service';
import { ShoppingListService } from './shopping-list.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class MealPlannerService {
  private readonly http = inject(HttpClient);
  private readonly shoppingListService = inject(ShoppingListService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly ingredientService = inject(IngredientService, { optional: true });
  private readonly recipeService = inject(RecipeService);
  private readonly itemService = inject(ItemService);
  private readonly unitService = inject(UnitService);
  private readonly apiUrl = '/api/v1/meal-plans';

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
  readonly isLoading = signal(false);
  readonly hasLoaded = signal(false);

  private readonly stockSignal = signal<{
    recipes: Recipe[];
    items: IngredientItem[];
    units: Unit[];
    ingredients: Ingredient[];
  } | null>(null);
  readonly stockFailed = signal(false);
  /** Sorted missing recipe ids that already triggered a stock reload, to avoid reload loops. */
  private reloadedForMissingKey = '';

  /**
   * Missing ingredients per planned meal id, computed from the recipe and current stock.
   * `null` until recipes and stock are loaded; a meal is absent when its recipe is unknown.
   */
  readonly missingByMealId = computed(() => {
    const stock = this.stockSignal();
    if (!stock) return null;
    const unitMap = new Map(stock.units.map((u) => [u.id, u]));
    const ingredientMap = new Map(stock.ingredients.map((i) => [i.id, i]));
    const recipeMap = new Map(stock.recipes.map((r) => [r.id, r]));
    const availableBaseMap = buildAvailableBaseMap(stock.items);

    const result = new Map<string, { ingredientId: string; name: string }[]>();
    for (const meal of this.mealsSignal()) {
      const recipe = recipeMap.get(meal.recipeId);
      if (!recipe) continue;
      const missing = recipeShortages(
        recipe.ingredients || [],
        stock.items,
        unitMap,
        ingredientMap,
        availableBaseMap,
      ).map(({ ingredientId, name }) => ({ ingredientId, name }));
      result.set(meal.id, missing);
    }
    return result;
  });

  constructor() {
    effect(() => {
      const activeKitchen = this.authService.activeKitchen();
      if (activeKitchen) {
        this.loadMealsFromBackend();
        this.loadStock();
      }
    });

    // A planned meal whose recipe is not in the loaded stock means the recipes are stale.
    // Reload once per set of missing recipe ids.
    effect(() => {
      const stock = this.stockSignal();
      const meals = this.mealsSignal();
      if (!stock) return;
      const known = new Set(stock.recipes.map((r) => r.id));
      const key = [...new Set(meals.map((m) => m.recipeId).filter((id) => !known.has(id)))]
        .sort()
        .join(',');
      if (key === this.reloadedForMissingKey) return;
      this.reloadedForMissingKey = key;
      if (key) untracked(() => this.loadStock());
    });
  }

  /** Loads recipes and current stock used to compute missing ingredients. */
  public loadStock(): void {
    this.stockFailed.set(false);
    forkJoin({
      recipes: this.recipeService.getRecipes(),
      items: this.itemService.getItems(),
      units: this.unitService.getUnits(),
      ingredients: this.ingredientService?.getIngredients() ?? of([] as Ingredient[]),
    }).subscribe({
      next: (stock) => this.stockSignal.set(stock),
      error: (err) => {
        console.error('Failed to load stock for meal planner:', err);
        this.stockSignal.set(null);
        this.stockFailed.set(true);
      },
    });
  }

  /** Missing ingredient names for a meal, or `null` when they cannot be determined. */
  missingFor(meal: PlannedMeal): string[] | null {
    const missing = this.missingByMealId()?.get(meal.id);
    return missing ? missing.map((m) => m.name) : null;
  }

  /** Unique missing ingredients across meals that are not cooked yet. */
  uniqueMissingIngredients(): { ingredientId: string; name: string }[] {
    const byId = new Map<string, { ingredientId: string; name: string }>();
    for (const meal of this.mealsSignal()) {
      if (meal.cooked) continue;
      for (const ing of this.missingByMealId()?.get(meal.id) ?? []) {
        byId.set(ing.ingredientId, ing);
      }
    }
    return [...byId.values()];
  }

  public loadMealsFromBackend(): void {
    this.isLoading.set(true);
    this.http
      .get<ApiResponse<PlannedMeal[]>>(this.apiUrl)
      .pipe(mapResponseData<PlannedMeal[]>())
      .subscribe({
        next: (data) => {
          this.mealsSignal.set(data || []);
          this.isLoading.set(false);
          this.hasLoaded.set(true);
        },
        error: (err) => {
          console.error('Failed to load meal plans from backend:', err);
          this.isLoading.set(false);
          this.hasLoaded.set(true);
        },
      });
  }

  getMealsForDay(day: DayOfWeek): PlannedMeal[] {
    return this.mealsSignal().filter((m) => m.day === day);
  }

  addMealPlan(
    day: DayOfWeek,
    mealType: MealType,
    recipe: Recipe,
    callbacks?: { onSuccess?: () => void; onError?: () => void },
  ): void {
    const newMealPayload = {
      day,
      mealType,
      recipeId: recipe.id,
      recipeName: recipe.name || 'Custom Meal',
      ...(recipeTotalTime(recipe) != null ? { prepTimeMinutes: recipeTotalTime(recipe) } : {}),
      ...(recipe.servings != null ? { servings: recipe.servings } : {}),
      cooked: false,
      missingIngredients: [],
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
          callbacks?.onSuccess?.();
        },
        error: (err) => {
          console.error('Failed to add meal plan:', err);
          this.toastService.showError('Failed to save meal plan to server.');
          callbacks?.onError?.();
        },
      });
  }

  removeMealPlan(id: string): void {
    const meal = this.mealsSignal().find((m) => m.id === id);
    this.http
      .delete<ApiResponse<unknown>>(`${this.apiUrl}/${id}`)
      .pipe(mapResponseData<unknown>())
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
    const missing = this.missingFor(meal);
    if (missing === null) {
      this.toastService.showError('Could not check stock for this recipe.');
      return;
    }
    if (missing.length === 0) {
      this.toastService.showInfo('All ingredients are in stock for this recipe!');
      return;
    }

    const itemsToAdd = missing.map((ing) => ({
      name: ing,
      category: 'General',
      quantity: 1,
      unit: 'pcs',
      source: 'recipe_plan' as const,
      recipeName: meal.recipeName,
    }));

    this.addResolvedItems(itemsToAdd);
  }

  addAllMissingToShoppingList(): void {
    const missingItems = this.mealsSignal()
      .filter((m) => !m.cooked)
      .flatMap((meal) =>
        (this.missingByMealId()?.get(meal.id) ?? []).map((ing) => ({
          name: ing.name,
          category: 'General',
          quantity: 1,
          unit: 'pcs',
          source: 'recipe_plan' as const,
          recipeName: meal.recipeName,
        })),
      );

    if (missingItems.length === 0) {
      this.toastService.showInfo('All planned meals are fully stocked!');
      return;
    }

    this.addResolvedItems(missingItems);
  }

  private addResolvedItems(
    items: {
      name: string;
      category: string;
      quantity: number;
      unit: string;
      source: 'recipe_plan';
      recipeName: string;
    }[],
  ): void {
    if (!this.ingredientService) {
      this.shoppingListService.addMultipleItems(items);
      return;
    }
    this.ingredientService
      .getIngredients()
      .pipe(catchError(() => of([] as Ingredient[])))
      .subscribe((ingredients) => {
        const existingIngredientIds = new Set(
          this.shoppingListService
            .items()
            .map((item) => item.ingredientId)
            .filter(Boolean),
        );
        const existingNames = new Set(
          this.shoppingListService.items().map((item) => item.name.toLocaleLowerCase()),
        );
        const seen = new Set<string>();
        const resolved = items
          .map((item) => ({
            ...item,
            ingredientId: ingredients.find(
              (ingredient) => ingredient.name.toLocaleLowerCase() === item.name.toLocaleLowerCase(),
            )?.id,
          }))
          .filter((item) => {
            const key = item.ingredientId || item.name.toLocaleLowerCase();
            if (
              seen.has(key) ||
              (item.ingredientId && existingIngredientIds.has(item.ingredientId)) ||
              existingNames.has(item.name.toLocaleLowerCase())
            ) {
              return false;
            }
            seen.add(key);
            return true;
          });

        if (resolved.length === 0) {
          this.toastService.showInfo('All missing ingredients are already on your shopping list.');
          return;
        }
        this.shoppingListService.addMultipleItems(resolved);
      });
  }
}
