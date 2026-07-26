import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { DayOfWeek, MealType, PlannedMeal } from '@models/meal-planner.model';
import { Recipe } from '@models/recipe.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { RecipeService } from '@services/recipe.service';

@Component({
  selector: 'pantry-meal-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  templateUrl: './meal-planner.component.html',
  styleUrl: './meal-planner.component.scss',
})
export class MealPlannerComponent implements OnInit {
  readonly mealPlannerService = inject(MealPlannerService);
  readonly recipeService = inject(RecipeService);

  readonly days = this.mealPlannerService.days;
  readonly mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner'];

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
    this.plannedMeals().reduce((acc, m) => acc + (m.missingIngredients ? m.missingIngredients.length : 0), 0)
  );

  ngOnInit(): void {
    this.loadRecipes();
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
        // Fallback mock recipes if backend offline
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
        ];
        this.availableRecipes.set(mockRecipes);
        this.selectedRecipeId.set(mockRecipes[0].id);
        this.isLoadingRecipes.set(false);
      },
    });
  }

  getMealsForSlot(day: DayOfWeek, mealType: MealType): PlannedMeal[] {
    return this.plannedMeals().filter((m) => m.day === day && m.mealType === mealType);
  }

  openAddModal(day: DayOfWeek, mealType: MealType): void {
    this.selectedDay.set(day);
    this.selectedMealType.set(mealType);
    this.isAddModalOpen.set(true);
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

  toggleCooked(id: string): void {
    this.mealPlannerService.toggleCooked(id);
  }

  removeMeal(id: string): void {
    this.mealPlannerService.removeMealPlan(id);
  }

  addMissingToShoppingList(meal: PlannedMeal): void {
    this.mealPlannerService.addMissingToShoppingList(meal);
  }
}
