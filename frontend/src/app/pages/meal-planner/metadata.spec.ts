import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { PlannedMeal } from '@models/meal-planner.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { RecipeService } from '@services/recipe.service';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { DailyFocusComponent } from './daily-focus/daily-focus.component';
import { PlanMealPageComponent } from './plan-meal-page/plan-meal-page.component';
import { WeeklyViewComponent } from './weekly-view/weekly-view.component';

const meal: PlannedMeal = {
  id: 'meal',
  day: 'Monday',
  mealType: 'Dinner',
  recipeId: 'recipe',
  recipeName: 'Dinner',
  cooked: false,
  missingIngredients: [],
  servings: 2,
};

describe('Planner metadata honesty', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MealPlannerService,
          useValue: { days: ['Monday'], missingFor: () => null, missingByMealId: () => null },
        },
      ],
    });
  });

  it('keeps empty and incomplete daily totals unknown', () => {
    const component = TestBed.runInInjectionContext(() => new DailyFocusComponent());
    expect(component.totalCalories()).toBeUndefined();
    expect(component.totalPrepTime()).toBeUndefined();
    component.meals = [
      { ...meal, calories: 200, prepTimeMinutes: 12 },
      { ...meal, id: 'unknown' },
    ];
    expect(component.totalCalories()).toBeUndefined();
    expect(component.totalPrepTime()).toBeUndefined();
    component.meals = [{ ...meal, calories: null, prepTimeMinutes: null }];
    expect(component.totalCalories()).toBeUndefined();
    expect(component.totalPrepTime()).toBeUndefined();
    component.meals = [{ ...meal, calories: 0, prepTimeMinutes: 0 }];
    expect(component.totalCalories()).toBe(0);
    expect(component.totalPrepTime()).toBe(0);
  });

  it('keeps incomplete weekly totals unknown and preserves zero', () => {
    const component = TestBed.runInInjectionContext(() => new WeeklyViewComponent());
    expect(component.getDayCalories('Monday')).toBeUndefined();
    component.meals = [
      { ...meal, calories: 200 },
      { ...meal, id: 'unknown' },
    ];
    expect(component.getDayCalories('Monday')).toBeUndefined();
    component.meals = [{ ...meal, calories: 0 }];
    expect(component.getDayCalories('Monday')).toBe(0);
  });

  it('omits unknown facts and daily totals from the rendered day', () => {
    const fixture = TestBed.createComponent(DailyFocusComponent);
    fixture.componentInstance.meals = [meal];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Total Planned Calories');
    expect(fixture.nativeElement.textContent).not.toContain('Estimated Kitchen Time');
    expect(fixture.nativeElement.textContent).not.toContain('15 mins');
    expect(fixture.nativeElement.textContent).not.toContain('400 kcal');
    fixture.componentInstance.meals = [{ ...meal, calories: 0, prepTimeMinutes: 0 }];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Total Planned Calories');
    expect(fixture.nativeElement.textContent).toContain('0 mins');
    expect(fixture.nativeElement.textContent).toContain('0 kcal');
  });

  it('omits unknown recipe facts in the picker while keeping explicit planned portions', () => {
    const addMealPlan = vi.fn();
    TestBed.overrideProvider(MealPlannerService, { useValue: { addMealPlan } });
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: RecipeService,
          useValue: { getRecipes: () => of([{ id: 'recipe', name: 'Unknown meal' }]) },
        },
      ],
    });
    const fixture = TestBed.createComponent(PlanMealPageComponent);
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('h4').parentElement;
    expect(card.textContent).not.toContain('15m prep');
    expect(card.textContent).not.toContain('2 servings');
    fixture.componentInstance.selectRecipe({ id: 'recipe', name: 'Unknown meal' });
    fixture.componentInstance.servings.set(3);
    fixture.componentInstance.saveMealPlan();
    expect(addMealPlan).toHaveBeenCalledWith(
      'Monday',
      'Dinner',
      { id: 'recipe', name: 'Unknown meal', servings: 3 },
      expect.any(Object),
    );
    fixture.componentInstance.availableRecipes.set([
      { id: 'recipe', name: 'Zero prep', prepTime: 0, servings: 0 },
    ]);
    fixture.detectChanges();
    expect(card.textContent).toContain('0m prep');
    expect(card.textContent).toContain('0 servings');
  });

  for (const mode of ['grid', 'timeline'] as const) {
    it(`omits unknown facts and renders zero in weekly ${mode}`, () => {
      const fixture = TestBed.createComponent(WeeklyViewComponent);
      fixture.componentInstance.layoutMode.set(mode);
      fixture.componentInstance.meals = [meal];
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).not.toContain('15m');
      expect(fixture.nativeElement.textContent).not.toContain('400 kcal');
      fixture.componentInstance.meals = [{ ...meal, calories: 0, prepTimeMinutes: 0 }];
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('0m');
      expect(fixture.nativeElement.textContent).toContain('0 kcal');
    });
  }
});
