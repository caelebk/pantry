import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { Item } from '@models/items.model';
import { Unit } from '@models/unit.model';
import { vi } from 'vitest';
import { RecipeCardComponent } from './recipe-card.component';

describe('RecipeCardComponent browse summaries', () => {
  let component: RecipeCardComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: TranslocoService, useValue: { translate: vi.fn() } }],
    });
    component = TestBed.runInInjectionContext(() => new RecipeCardComponent());
    component.recipe = {
      id: 'recipe',
      name: 'Soup',
      ingredients: [
        { ingredientId: 'tomato', quantity: 0.5, unitId: 1 },
        { ingredientId: 'onion', quantity: 2 },
      ],
    };
    component.ingredientMap.set('tomato', { name: 'Tomatoes' } as Ingredient);
    component.ingredientMap.set('onion', { name: 'Onions' } as Ingredient);
  });

  afterEach(() => vi.useRealTimers());

  it('does not imply a complete cooking time from partial or invalid time data', () => {
    expect(component.totalTime).toBeNull();
    expect(component.timeSummary).toEqual({ key: 'recipes.browse.timeNotSet', count: null });
    component.recipe.prepTime = 0;
    expect(component.totalTime).toBeNull();
    expect(component.timeSummary).toEqual({ key: 'recipes.browse.prepMinutes', count: 0 });
    component.recipe.cookTime = 15;
    expect(component.totalTime).toBe(15);
    expect(component.timeSummary).toEqual({ key: 'recipes.browse.totalMinutes', count: 15 });
    component.recipe.prepTime = -1;
    expect(component.totalTime).toBeNull();
    expect(component.timeSummary).toEqual({ key: 'recipes.browse.cookMinutes', count: 15 });
    component.recipe.prepTime = NaN;
    component.recipe.cookTime = Infinity;
    expect(component.timeSummary).toEqual({ key: 'recipes.browse.timeNotSet', count: null });
    component.recipe.prepTime = 0;
    component.recipe.cookTime = 0;
    expect(component.totalTime).toBe(0);
    expect(component.timeSummary).toEqual({ key: 'recipes.browse.totalMinutes', count: 0 });
  });

  it('leaves unknown difficulty unset and falls back to known IDs', () => {
    expect(component.difficultyKey).toBeNull();
    component.recipe.difficulty = 'Unknown';
    expect(component.difficultyKey).toBeNull();
    component.recipe.difficultyId = 2;
    expect(component.difficultyKey).toBe('recipes.browse.difficultyMedium');
    component.recipe.difficulty = ' Easy ';
    expect(component.difficultyKey).toBe('recipes.browse.difficultyEasy');
    component.recipe.difficulty = '';
    component.recipe.difficultyId = 99;
    expect(component.difficultyKey).toBeNull();
  });

  it('distinguishes absent, insufficient and expired shortages with base-unit quantities', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 9, 10));
    component.unitMap.set(1, { toBaseFactor: 1000 } as Unit);
    component.availableBaseMap.set('tomato', 450);
    component.recipe.ingredients!.push({ ingredientId: 'salt', quantity: 1 });
    component.pantryItems = [
      { ingredientId: 'onion', name: 'Onion', quantity: 1, expirationDate: new Date(2026, 9, 8) },
    ] as Item[];
    expect(component.shortages).toEqual([
      { ingredientId: 'tomato', name: 'Tomatoes', reason: 'insufficient' },
      { ingredientId: 'onion', name: 'Onions', reason: 'expired' },
      { ingredientId: 'salt', name: 'salt', reason: 'absent' },
    ]);
    component.availableBaseMap.set('tomato', 500);
    component.availableBaseMap.set('onion', 2);
    component.availableBaseMap.set('salt', 1);
    expect(component.shortages).toEqual([]);
    expect(component.ingredientStats.isFullyMakeable).toBe(true);
  });

  it('reports stock counts and a bounded percentage for the progress bar', () => {
    component.unitMap.set(1, { toBaseFactor: 1000 } as Unit);
    component.availableBaseMap.set('tomato', 500);
    expect(component.ingredientStats).toEqual({
      availableCount: 1,
      totalCount: 2,
      percentage: 50,
      isFullyMakeable: false,
    });
    component.availableBaseMap.set('onion', 1);
    expect(component.ingredientStats).toEqual({
      availableCount: 1,
      totalCount: 2,
      percentage: 50,
      isFullyMakeable: false,
    });
    component.availableBaseMap.set('onion', 2);
    expect(component.ingredientStats).toEqual({
      availableCount: 2,
      totalCount: 2,
      percentage: 100,
      isFullyMakeable: true,
    });
    component.recipe.ingredients!.push({ ingredientId: 'salt', quantity: 1 });
    component.availableBaseMap.set('salt', 1);
    expect(component.ingredientStats).toEqual({
      availableCount: 3,
      totalCount: 3,
      percentage: 100,
      isFullyMakeable: true,
    });
    component.availableBaseMap.delete('onion');
    expect(component.ingredientStats).toEqual({
      availableCount: 2,
      totalCount: 3,
      percentage: 67,
      isFullyMakeable: false,
    });
    component.recipe.ingredients = [];
    expect(component.ingredientStats).toEqual({
      availableCount: 0,
      totalCount: 0,
      percentage: 100,
      isFullyMakeable: true,
    });
  });
});
