import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DayOfWeek, MealType } from '@models/meal-planner.model';
import { Recipe } from '@models/recipe.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { RecipeService } from '@services/recipe.service';

@Component({
  selector: 'pantry-plan-meal-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plan-meal-page.component.html',
  styleUrl: './plan-meal-page.component.scss',
})
export class PlanMealPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mealPlannerService = inject(MealPlannerService);
  private readonly recipeService = inject(RecipeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly days: DayOfWeek[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  readonly mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  selectedDay = signal<DayOfWeek>('Monday');
  selectedMealType = signal<MealType>('Dinner');
  selectedRecipe = signal<Recipe | null>(null);
  searchQuery = signal<string>('');
  servings = signal<number>(2);

  availableRecipes = signal<Recipe[]>([]);
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    // Read query params if provided (e.g. ?day=Tuesday&type=Lunch)
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params['day'] && this.days.includes(params['day'])) {
        this.selectedDay.set(params['day']);
      }
      if (params['type'] && this.mealTypes.includes(params['type'])) {
        this.selectedMealType.set(params['type']);
      }
    });

    this.loadRecipes();
  }

  loadRecipes(): void {
    this.isLoading.set(true);
    this.recipeService.getRecipes().subscribe({
      next: (recipes) => {
        this.availableRecipes.set(recipes);
        if (recipes.length > 0) {
          this.selectedRecipe.set(recipes[0]);
        }
        this.isLoading.set(false);
      },
      error: () => {
        const mockRecipes: Recipe[] = [
          {
            id: 'rec-1',
            name: 'Simple Tomato Basil Pasta',
            description: 'Classic Italian pasta with fresh basil and tomatoes.',
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
            description: 'Fluffy 3-egg omelette with butter and herbs.',
            prepTime: 10,
            servings: 1,
            ingredients: [{ ingredientId: 'ing-3', quantity: 3, unitId: 3 }],
          },
          {
            id: 'rec-3',
            name: 'Grilled Chicken Salad',
            description: 'Healthy chicken salad with light dressing.',
            prepTime: 25,
            servings: 3,
            ingredients: [{ ingredientId: 'ing-5', quantity: 400, unitId: 1 }],
          },
          {
            id: 'rec-4',
            name: 'Honey Garlic Salmon',
            description: 'Pan-seared salmon glaze with garlic honey sauce.',
            prepTime: 25,
            servings: 2,
            ingredients: [{ ingredientId: 'ing-7', quantity: 300, unitId: 1 }],
          },
        ];
        this.availableRecipes.set(mockRecipes);
        this.selectedRecipe.set(mockRecipes[0]);
        this.isLoading.set(false);
      },
    });
  }

  filteredRecipes(): Recipe[] {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.availableRecipes();
    return this.availableRecipes().filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)),
    );
  }

  selectDay(day: DayOfWeek): void {
    this.selectedDay.set(day);
  }

  selectMealType(type: MealType): void {
    this.selectedMealType.set(type);
  }

  selectRecipe(recipe: Recipe): void {
    this.selectedRecipe.set(recipe);
    if (recipe.servings) {
      this.servings.set(recipe.servings);
    }
  }

  incrementServings(): void {
    this.servings.update((s) => s + 1);
  }

  decrementServings(): void {
    if (this.servings() > 1) {
      this.servings.update((s) => s - 1);
    }
  }

  saveMealPlan(): void {
    const recipe = this.selectedRecipe();
    if (!recipe) return;

    // Create recipe copy with updated servings if modified
    const recipeToSave: Recipe = {
      ...recipe,
      servings: this.servings(),
    };

    this.mealPlannerService.addMealPlan(this.selectedDay(), this.selectedMealType(), recipeToSave);
    this.goBack();
  }

  goBack(): void {
    this.router.navigate(['/meal-planner']);
  }
}
