import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MealPlannerService } from '@services/meal-planner.service';
import { RecipeService } from '@services/recipe.service';
import { of } from 'rxjs';
import { vi } from 'vitest';
import translations from '../../../../public/i18n/en.json';
import { PlanMealPageComponent } from './plan-meal-page/plan-meal-page.component';

describe('Planner metadata honesty', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: translations },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        {
          provide: MealPlannerService,
          useValue: { days: ['Monday'], missingFor: () => null, missingByMealId: () => null },
        },
      ],
    });
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
});
