import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { DayOfWeek, MealType } from '@models/meal-planner.model';
import { Recipe } from '@models/recipe.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { RecipeService } from '@services/recipe.service';
import { AuthService } from '../../core/services/auth.service';
import { DailyFocusComponent } from './daily-focus/daily-focus.component';
import { WeeklyViewComponent } from './weekly-view/weekly-view.component';

export type PlannerSubTab = 'calendar' | 'daily';

@Component({
  selector: 'pantry-meal-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, WeeklyViewComponent, DailyFocusComponent],
  templateUrl: './meal-planner.component.html',
  styleUrl: './meal-planner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealPlannerComponent {
  private readonly router = inject(Router);
  readonly mealPlannerService = inject(MealPlannerService);
  readonly recipeService = inject(RecipeService);
  private readonly authService = inject(AuthService);

  constructor() {
    effect(() => {
      const activeKitchen = this.authService.activeKitchen();
      if (activeKitchen) {
        this.loadRecipes();
      }
    });
  }

  readonly days = this.mealPlannerService.days;
  readonly mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  // Active Sub-Page View Tab
  activeSubTab = signal<PlannerSubTab>('calendar');

  availableRecipes = signal<Recipe[]>([]);
  isLoadingRecipes = signal<boolean>(false);

  // Modal / Add Plan State
  isAddModalOpen = signal<boolean>(false);
  selectedDay = signal<DayOfWeek>('Monday');
  selectedMealType = signal<MealType>('Dinner');
  selectedRecipeId = signal<string>('');

  readonly plannedMeals = computed(() => this.mealPlannerService.meals());
  readonly cookedCount = computed(() => this.plannedMeals().filter((m) => m.cooked).length);
  readonly totalPlannedCount = computed(() => this.plannedMeals().length);
  readonly missingItemsCount = computed(() =>
    this.plannedMeals().reduce(
      (acc, m) => acc + (m.missingIngredients ? m.missingIngredients.length : 0),
      0,
    ),
  );

  setSubTab(tab: PlannerSubTab): void {
    this.activeSubTab.set(tab);
  }

  loadRecipes(): void {
    this.isLoadingRecipes.set(true);
    this.recipeService.getRecipes().subscribe({
      next: (recipes) => {
        this.availableRecipes.set(recipes);
        if (recipes.length > 0) {
          this.selectedRecipeId.set(recipes[0].id);
        }
        this.isLoadingRecipes.set(false);
      },
      error: () => {
        const mockRecipes: Recipe[] = [
          {
            id: 'rec-1',
            name: 'Simple Tomato Basil Pasta',
            prepTime: 20,
            servings: 2,
            ingredients: [
              { ingredientId: 'ing-1', quantity: 200, unitId: 1 },
              { ingredientId: 'ing-2', quantity: 1, unitId: 2 },
            ],
          },
          {
            id: 'rec-2',
            name: 'Classic Egg Omelette',
            prepTime: 10,
            servings: 1,
            ingredients: [
              { ingredientId: 'ing-3', quantity: 3, unitId: 3 },
              { ingredientId: 'ing-4', quantity: 1, unitId: 4 },
            ],
          },
          {
            id: 'rec-3',
            name: 'Grilled Chicken Salad',
            prepTime: 25,
            servings: 3,
            ingredients: [
              { ingredientId: 'ing-5', quantity: 400, unitId: 1 },
              { ingredientId: 'ing-6', quantity: 100, unitId: 5 },
            ],
          },
          {
            id: 'rec-4',
            name: 'Honey Garlic Salmon',
            prepTime: 25,
            servings: 2,
            ingredients: [{ ingredientId: 'ing-7', quantity: 300, unitId: 1 }],
          },
        ];
        this.availableRecipes.set(mockRecipes);
        this.selectedRecipeId.set(mockRecipes[0].id);
        this.isLoadingRecipes.set(false);
      },
    });
  }

  openAddModal(eventPayload?: { day: DayOfWeek; mealType: MealType }): void {
    if (eventPayload) {
      this.router.navigate(['/meal-planner/new'], {
        queryParams: { day: eventPayload.day, type: eventPayload.mealType },
      });
    } else {
      this.router.navigate(['/meal-planner/new']);
    }
  }

  closeAddModal(): void {
    this.isAddModalOpen.set(false);
  }

  saveMealPlan(): void {
    const recipeId = this.selectedRecipeId();
    const recipe = this.availableRecipes().find((r) => r.id === recipeId);

    if (!recipe) return;

    this.mealPlannerService.addMealPlan(this.selectedDay(), this.selectedMealType(), recipe);
    this.closeAddModal();
  }

  syncAllMissingToShoppingList(): void {
    this.mealPlannerService.addAllMissingToShoppingList();
  }
}
