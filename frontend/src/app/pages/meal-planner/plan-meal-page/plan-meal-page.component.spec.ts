import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MealPlannerService } from '@services/meal-planner.service';
import { RecipeService } from '@services/recipe.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PlanMealPageComponent } from './plan-meal-page.component';

describe('PlanMealPageComponent', () => {
  const recipes = [
    { id: 'r1', name: 'Pasta', servings: 4 },
    { id: 'r2', name: 'Omelette', servings: 1 },
  ];
  let navigate: ReturnType<typeof vi.fn>;
  let addMealPlan: ReturnType<typeof vi.fn>;

  function create(getRecipes: () => unknown) {
    navigate = vi.fn();
    addMealPlan = vi.fn();
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: Router, useValue: { navigate } },
        { provide: MealPlannerService, useValue: { addMealPlan } },
        { provide: RecipeService, useValue: { getRecipes } },
      ],
    });
    const fixture = TestBed.createComponent(PlanMealPageComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('does not preselect a recipe and ignores save until one is chosen', () => {
    const component = create(() => of(recipes));
    expect(component.selectedRecipe()).toBeNull();
    component.saveMealPlan();
    expect(addMealPlan).not.toHaveBeenCalled();
  });

  it('defaults servings from the selected recipe', () => {
    const component = create(() => of(recipes));
    component.selectRecipe(recipes[0]);
    expect(component.servings()).toBe(4);
    component.selectRecipe(recipes[1]);
    expect(component.servings()).toBe(1);
  });

  it('shows an error state without mock recipes when loading fails and blocks saving', () => {
    const component = create(() => throwError(() => new Error('offline')));
    expect(component.loadFailed()).toBe(true);
    expect(component.availableRecipes()).toEqual([]);
    expect(component.selectedRecipe()).toBeNull();
    component.saveMealPlan();
    expect(addMealPlan).not.toHaveBeenCalled();
  });

  it('retries loading recipes', () => {
    let fail = true;
    const component = create(() => (fail ? throwError(() => new Error('x')) : of(recipes)));
    fail = false;
    component.loadRecipes();
    expect(component.loadFailed()).toBe(false);
    expect(component.availableRecipes()).toEqual(recipes);
  });

  it('navigates only after a successful save', () => {
    const component = create(() => of(recipes));
    component.selectRecipe(recipes[0]);
    component.saveMealPlan();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.isSaving()).toBe(true);
    addMealPlan.mock.calls[0][3].onSuccess();
    expect(navigate).toHaveBeenCalledWith(['/meal-planner']);
  });

  it('stays on the page and keeps the selection when the save fails', () => {
    const component = create(() => of(recipes));
    component.selectRecipe(recipes[0]);
    component.saveMealPlan();
    addMealPlan.mock.calls[0][3].onError();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.saveFailed()).toBe(true);
    expect(component.isSaving()).toBe(false);
    expect(component.selectedRecipe()).toEqual(recipes[0]);
  });
});
