import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PlannedMeal } from '@models/meal-planner.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { RecipeService } from '@services/recipe.service';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { MealPlannerComponent } from './meal-planner.component';

describe('MealPlannerComponent', () => {
  let component: MealPlannerComponent;
  let mockMealPlannerService: unknown;
  let mockRecipeService: unknown;
  let mockRouter: unknown;

  const mockMeal: PlannedMeal = {
    id: 'mp-1',
    day: 'Monday',
    mealType: 'Dinner',
    recipeId: 'rec-1',
    recipeName: 'Salad',
    prepTimeMinutes: 15,
    calories: 250,
    servings: 2,
    cooked: false,
    missingIngredients: ['Lettuce'],
    tags: ['Fresh'],
  };

  beforeEach(() => {
    mockMealPlannerService = {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      meals: () => [mockMeal],
      loadMealsFromBackend: vi.fn(),
      addMealPlan: vi.fn(),
      removeMealPlan: vi.fn(),
      toggleCooked: vi.fn(),
      addMissingToShoppingList: vi.fn(),
      addAllMissingToShoppingList: vi.fn(),
    };

    mockRecipeService = {
      getRecipes: vi.fn().mockReturnValue(of([])),
      getAvailableRecipes: vi.fn().mockReturnValue(of([])),
    };
    mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: MealPlannerService, useValue: mockMealPlannerService },
        { provide: RecipeService, useValue: mockRecipeService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    component = TestBed.runInInjectionContext(() => new MealPlannerComponent());
    component.ngOnInit();
  });

  it('should create meal planner component', () => {
    expect(component).toBeTruthy();
    expect(component.totalPlannedCount()).toBe(1);
    expect(component.missingItemsCount()).toBe(1);
  });

  it('should switch sub tabs', () => {
    expect(component.activeSubTab()).toBe('calendar');
    component.setSubTab('daily');
    expect(component.activeSubTab()).toBe('daily');
  });

  it('should navigate to plan meal page when opening add modal', () => {
    component.openAddModal({ day: 'Tuesday', mealType: 'Lunch' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/meal-planner/new'], {
      queryParams: { day: 'Tuesday', type: 'Lunch' },
    });
  });
});
