import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Ingredient } from '@models/ingredient.model';
import { PlannedMeal } from '@models/meal-planner.model';
import { of } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { IngredientService } from './inventory/ingredient.service';
import { MealPlannerService } from './meal-planner.service';
import { ShoppingListService } from './shopping-list.service';
import { ToastService } from './toast.service';

describe('MealPlannerService', () => {
  let service: MealPlannerService;
  let httpMock: HttpTestingController;
  let mockShoppingListService: jasmine.SpyObj<ShoppingListService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let ingredients: Ingredient[];

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
    ingredients = [];
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
          provide: AuthService,
          useValue: { activeKitchen: jasmine.createSpy().and.returnValue('kitchen-1') },
        },
      ],
    });

    service = TestBed.inject(MealPlannerService);
    httpMock = TestBed.inject(HttpTestingController);

    // Handle constructor GET request
    TestBed.flushEffects();
    const initReq = httpMock.expectOne('/api/meal-plans');
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

  it('should toggle cooked status', () => {
    service.toggleCooked('mp-1');

    const req = httpMock.expectOne('/api/meal-plans/mp-1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ cooked: true });
    req.flush({ status: 'success', data: { ...mockMeal, cooked: true } });

    expect(service.meals()[0].cooked).toBeTrue();
    expect(mockToastService.showSuccess).toHaveBeenCalled();
  });

  it('should add missing ingredients to shopping list', () => {
    service.addMissingToShoppingList(mockMeal);

    expect(mockShoppingListService.addMultipleItems).toHaveBeenCalledWith([
      {
        name: 'Garlic',
        category: 'General',
        quantity: 1,
        unit: 'pcs',
        source: 'recipe_plan',
        recipeName: 'Tuscan Chicken',
      },
      {
        name: 'Cream',
        category: 'General',
        quantity: 1,
        unit: 'pcs',
        source: 'recipe_plan',
        recipeName: 'Tuscan Chicken',
      },
    ]);
  });

  it('should skip ingredients already on the shopping list when syncing meals', () => {
    Object.assign(mockShoppingListService, {
      items: signal([{ id: 'sl-1', ingredientId: 'ing-garlic', name: 'Garlic' }]),
    });
    ingredients = [
      { id: 'ing-garlic', name: 'Garlic' } as Ingredient,
      { id: 'ing-cream', name: 'Cream' } as Ingredient,
    ];

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
});
