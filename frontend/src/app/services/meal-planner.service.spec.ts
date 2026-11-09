import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Ingredient } from '@models/ingredient.model';
import { IngredientItem } from '@models/items.model';
import { PlannedMeal } from '@models/meal-planner.model';
import { Recipe } from '@models/recipe.model';
import { Unit } from '@models/unit.model';
import { of, throwError } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { IngredientService } from './inventory/ingredient.service';
import { ItemService } from './inventory/item.service';
import { UnitService } from './inventory/unit.service';
import { MealPlannerService } from './meal-planner.service';
import { RecipeService } from './recipe.service';
import { ShoppingListService } from './shopping-list.service';
import { ToastService } from './toast.service';

describe('MealPlannerService', () => {
  let service: MealPlannerService;
  let httpMock: HttpTestingController;
  let mockShoppingListService: jasmine.SpyObj<ShoppingListService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let ingredients: Ingredient[];
  let recipes: Recipe[];
  let items: IngredientItem[];
  let stockError: boolean;
  let recipeLoads: number;

  const gram = { id: 1, toBaseFactor: 1 } as Unit;
  const tuscanRecipe: Recipe = {
    id: 'rec-1',
    name: 'Tuscan Chicken',
    ingredients: [
      { ingredientId: 'ing-garlic', quantity: 2, unitId: 1 },
      { ingredientId: 'ing-cream', quantity: 100, unitId: 1 },
      { ingredientId: 'ing-salt', quantity: 5, unitId: 1 },
    ],
  };

  const mockMeal: PlannedMeal = {
    id: 'mp-1',
    day: 'Monday',
    mealType: 'Dinner',
    recipeId: 'rec-1',
    recipeName: 'Tuscan Chicken',
    prepTimeMinutes: 30,
    calories: 500,
    servings: 2,
    cooked: false,
    missingIngredients: ['Garlic', 'Cream'],
    tags: ['Easy'],
  };

  beforeEach(() => {
    mockShoppingListService = jasmine.createSpyObj('ShoppingListService', ['addMultipleItems']);
    Object.assign(mockShoppingListService, { items: signal([]) });
    ingredients = [
      { id: 'ing-garlic', name: 'Garlic' } as Ingredient,
      { id: 'ing-cream', name: 'Cream' } as Ingredient,
      { id: 'ing-salt', name: 'Salt' } as Ingredient,
    ];
    recipes = [tuscanRecipe];
    stockError = false;
    recipeLoads = 0;
    items = [
      { ingredientId: 'ing-garlic', quantity: 5, unit: gram } as IngredientItem,
      { ingredientId: 'ing-cream', quantity: 40, unit: gram } as IngredientItem,
      {
        ingredientId: 'ing-salt',
        quantity: 50,
        unit: gram,
        expirationDate: new Date('2000-01-01'),
      } as IngredientItem,
    ];
    mockToastService = jasmine.createSpyObj('ToastService', [
      'showSuccess',
      'showError',
      'showInfo',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MealPlannerService,
        { provide: ShoppingListService, useValue: mockShoppingListService },
        { provide: ToastService, useValue: mockToastService },
        { provide: IngredientService, useValue: { getIngredients: () => of(ingredients) } },
        {
          provide: RecipeService,
          useValue: {
            getRecipes: () => {
              recipeLoads++;
              return of(recipes);
            },
          },
        },
        {
          provide: ItemService,
          useValue: { getItems: () => (stockError ? throwError(() => new Error('x')) : of(items)) },
        },
        { provide: UnitService, useValue: { getUnits: () => of([gram]) } },
        {
          provide: AuthService,
          useValue: { activeKitchen: jasmine.createSpy().and.returnValue('kitchen-1') },
        },
      ],
    });

    service = TestBed.inject(MealPlannerService);
    httpMock = TestBed.inject(HttpTestingController);

    // Handle constructor GET request
    TestBed.flushEffects();
    const initReq = httpMock.expectOne('/api/v1/meal-plans');
    initReq.flush({ status: 'success', data: [mockMeal] });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created and load initial meals', () => {
    expect(service).toBeTruthy();
    expect(service.meals().length).toBe(1);
    expect(service.meals()[0].recipeName).toBe('Tuscan Chicken');
  });

  it('should filter meals by day', () => {
    const mondayMeals = service.getMealsForDay('Monday');
    expect(mondayMeals.length).toBe(1);

    const tuesdayMeals = service.getMealsForDay('Tuesday');
    expect(tuesdayMeals.length).toBe(0);
  });

  it('omits unknown recipe facts from the create request', () => {
    service.addMealPlan('Tuesday', 'Lunch', { id: 'unknown', name: 'Unknown meal' });
    const request = httpMock.expectOne('/api/v1/meal-plans');
    expect(request.request.body).not.toHaveProperty('prepTimeMinutes');
    expect(request.request.body).not.toHaveProperty('calories');
    expect(request.request.body).not.toHaveProperty('servings');
    request.flush({ status: 'success', data: { ...mockMeal, id: 'new' } });
  });

  it.each([
    [{ prepTime: 0, cookTime: 0, servings: 0 }, 0],
    [{ prepTime: 0, cookTime: 12, servings: 3 }, 12],
    [{ prepTime: 12 }, undefined],
    [{ cookTime: 12 }, undefined],
  ])('only reports a complete total time and preserves zero values: %j', (metadata, time) => {
    service.addMealPlan('Tuesday', 'Lunch', { id: 'recipe', name: 'Meal', ...metadata } as Recipe);
    const request = httpMock.expectOne('/api/v1/meal-plans');
    expect(request.request.body.prepTimeMinutes).toBe(time);
    expect(request.request.body.servings).toBe(metadata.servings);
    request.flush({ status: 'success', data: { ...mockMeal, id: 'new' } });
  });

  it('should toggle cooked status', () => {
    service.toggleCooked('mp-1');

    const req = httpMock.expectOne('/api/v1/meal-plans/mp-1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ cooked: true });
    req.flush({ status: 'success', data: { ...mockMeal, cooked: true } });

    expect(service.meals()[0].cooked).toBeTrue();
    expect(mockToastService.showSuccess).toHaveBeenCalled();
  });

  it('computes missing ingredients from stock, including insufficient and expired', () => {
    expect(service.missingFor(mockMeal)).toEqual(['Cream', 'Salt']);
  });

  it('returns null when the recipe of a meal is unknown', () => {
    recipes = [];
    service.loadStock();
    expect(service.missingFor(mockMeal)).toBeNull();
  });

  it('reloads stock once when a planned recipe is missing from the loaded recipes', () => {
    TestBed.flushEffects();
    recipes = [];
    const before = recipeLoads;
    service.loadStock();
    TestBed.flushEffects();
    expect(recipeLoads).toBe(before + 2);
    TestBed.flushEffects();
    service.loadStock();
    TestBed.flushEffects();
    expect(recipeLoads).toBe(before + 3);
  });

  it('reports a stock load failure and shows no missing ingredients', () => {
    stockError = true;
    service.loadStock();
    expect(service.stockFailed()).toBeTrue();
    expect(service.missingFor(mockMeal)).toBeNull();
    expect(service.uniqueMissingIngredients()).toEqual([]);
  });

  it('should add missing ingredients to shopping list', () => {
    service.addMissingToShoppingList(mockMeal);

    expect(mockShoppingListService.addMultipleItems).toHaveBeenCalledWith([
      {
        name: 'Cream',
        category: 'General',
        quantity: 1,
        unit: 'pcs',
        source: 'recipe_plan',
        recipeName: 'Tuscan Chicken',
        ingredientId: 'ing-cream',
      },
      {
        name: 'Salt',
        category: 'General',
        quantity: 1,
        unit: 'pcs',
        source: 'recipe_plan',
        recipeName: 'Tuscan Chicken',
        ingredientId: 'ing-salt',
      },
    ]);
  });

  it('should skip ingredients already on the shopping list when syncing meals', () => {
    Object.assign(mockShoppingListService, {
      items: signal([{ id: 'sl-1', ingredientId: 'ing-salt', name: 'Salt' }]),
    });

    service.addAllMissingToShoppingList();

    expect(mockShoppingListService.addMultipleItems).toHaveBeenCalledWith([
      {
        name: 'Cream',
        category: 'General',
        quantity: 1,
        unit: 'pcs',
        source: 'recipe_plan',
        recipeName: 'Tuscan Chicken',
        ingredientId: 'ing-cream',
      },
    ]);
  });

  it('counts each missing ingredient once and ignores cooked meals', () => {
    service['mealsSignal'].set([
      mockMeal,
      { ...mockMeal, id: 'mp-2', day: 'Tuesday' },
      { ...mockMeal, id: 'mp-3', cooked: true },
    ]);
    expect(service.uniqueMissingIngredients().map((i) => i.ingredientId)).toEqual([
      'ing-cream',
      'ing-salt',
    ]);
    service['mealsSignal'].set([{ ...mockMeal, cooked: true }]);
    expect(service.uniqueMissingIngredients()).toEqual([]);
  });

  it('calls onSuccess only after the create request succeeds', () => {
    const onSuccess = jasmine.createSpy('onSuccess');
    const onError = jasmine.createSpy('onError');
    service.addMealPlan('Tuesday', 'Lunch', tuscanRecipe, { onSuccess, onError });
    expect(onSuccess).not.toHaveBeenCalled();
    httpMock
      .expectOne('/api/v1/meal-plans')
      .flush({ status: 'success', data: { ...mockMeal, id: 'new' } });
    expect(onSuccess).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('calls onError and keeps meals when the create request fails', () => {
    const onSuccess = jasmine.createSpy('onSuccess');
    const onError = jasmine.createSpy('onError');
    service.addMealPlan('Tuesday', 'Lunch', tuscanRecipe, { onSuccess, onError });
    httpMock
      .expectOne('/api/v1/meal-plans')
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    expect(onError).toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(service.meals().length).toBe(1);
  });
});
