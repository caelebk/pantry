import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { PlannedMeal } from '@models/meal-planner.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { RecipeService } from '@services/recipe.service';
import { of } from 'rxjs';
import { vi } from 'vitest';
import translations from '../../../../public/i18n/en.json';
import { MealPlannerComponent } from './meal-planner.component';

describe('MealPlannerComponent', () => {
  let component: MealPlannerComponent;
  let mockMealPlannerService: unknown;
  let mockRecipeService: unknown;
  let mockRouter: Router;
  let meals: PlannedMeal[];
  let stock: Map<string, { ingredientId: string; name: string }[]> | null;

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
    meals = [mockMeal, { ...mockMeal, id: 'mp-2', day: 'Tuesday' }];
    stock = new Map([
      ['mp-1', [{ ingredientId: 'ing-lettuce', name: 'Lettuce' }]],
      ['mp-2', []],
    ]);
    mockMealPlannerService = {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      meals: () => meals,
      uniqueMissingIngredients: () => [{ ingredientId: 'ing-lettuce', name: 'Lettuce' }],
      stockFailed: () => false,
      isLoading: () => false,
      missingByMealId: () => stock,
      missingFor: (meal: PlannedMeal) => stock?.get(meal.id)?.map((m) => m.name) ?? null,
      loadStock: vi.fn(),
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

    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: translations },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MealPlannerService, useValue: mockMealPlannerService },
        { provide: RecipeService, useValue: mockRecipeService },
        provideRouter([]),
      ],
    });

    mockRouter = TestBed.inject(Router);
    vi.spyOn(mockRouter, 'navigate').mockResolvedValue(true);

    component = TestBed.runInInjectionContext(() => new MealPlannerComponent());
  });

  it('should create meal planner component', () => {
    expect(component).toBeTruthy();
    expect(component.totalPlannedCount()).toBe(2);
    expect(component.missingItemsCount()).toBe(1);
  });

  it('counts unique missing ingredients from the service, not per meal', () => {
    expect(component.missingItemsCount()).toBe(1);
  });

  it('refreshes stock when the page is entered', () => {
    component.ngOnInit();
    expect(mockMealPlannerService.loadStock).toHaveBeenCalledTimes(1);
  });

  it('should navigate to plan meal page when opening add modal', () => {
    component.openAddModal({ day: 'Tuesday', mealType: 'Lunch' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/meal-planner/new'], {
      queryParams: { day: 'Tuesday', type: 'Lunch' },
    });
  });

  it('omits the type query param when no meal type is given', () => {
    component.openAddModal({ day: 'Friday' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/meal-planner/new'], {
      queryParams: { day: 'Friday' },
    });
  });

  it('counts non-cooked meals with missing ingredients', () => {
    expect(component.missingMealsCount()).toBe(1);
  });

  it('ignores cooked meals when counting meals with missing ingredients', () => {
    meals = [{ ...mockMeal, cooked: true }];
    const fresh = TestBed.runInInjectionContext(() => new MealPlannerComponent());
    expect(fresh.missingMealsCount()).toBe(0);
  });

  describe('rendering', () => {
    const render = () => {
      const fixture = TestBed.createComponent(MealPlannerComponent);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    };

    it('shows the meal count and the shopping list footer when ingredients are missing', () => {
      const el = render();
      expect(el.querySelector('h1')?.textContent).toContain('Meal planner');
      expect(el.textContent).toContain('2 meals planned');
      expect(el.textContent).toContain('1 ingredient missing across 1 meal');
      expect(el.textContent).toContain('Add to shopping list');
      el.querySelectorAll('button').forEach((button) => {
        if (button.textContent?.includes('Add to shopping list')) button.click();
      });
      expect(mockMealPlannerService.addAllMissingToShoppingList).toHaveBeenCalledTimes(1);
    });

    it('shows a quiet in-stock line when nothing is missing', () => {
      stock = new Map([
        ['mp-1', []],
        ['mp-2', []],
      ]);
      const el = render();
      expect(el.textContent).toContain('Everything planned is in stock');
      expect(el.textContent).not.toContain('Add to shopping list');
    });

    it('hides the footer when stock is unknown', () => {
      stock = null;
      const el = render();
      expect(el.textContent).not.toContain('Add to shopping list');
      expect(el.textContent).not.toContain('Everything planned is in stock');
    });

    it('describes an empty week', () => {
      meals = [];
      stock = new Map();
      const el = render();
      expect(el.textContent).toContain('Nothing planned this week');
      expect(el.textContent).not.toContain('Everything planned is in stock');
    });
  });
});
