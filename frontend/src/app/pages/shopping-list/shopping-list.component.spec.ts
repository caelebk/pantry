import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ShoppingItem } from '@models/shopping-list.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { ShoppingListService } from '@services/shopping-list.service';
import { vi } from 'vitest';
import { ShoppingListComponent } from './shopping-list.component';

describe('ShoppingListComponent', () => {
  let component: ShoppingListComponent;
  let mockShoppingListService: unknown;
  let mockMealPlannerService: unknown;
  let mockRouter: unknown;

  const mockItem: ShoppingItem = {
    id: 'sl-1',
    name: 'Butter',
    category: 'Dairy',
    quantity: 2,
    unit: 'sticks',
    checked: false,
    estimatedPrice: 2.5,
    storeName: 'Market',
    source: 'manual',
  };

  beforeEach(() => {
    mockShoppingListService = {
      items: signal([mockItem]),
      addItem: vi.fn(),
      toggleItem: vi.fn(),
      removeItem: vi.fn(),
      clearChecked: vi.fn(),
      restockCheckedItems: vi.fn(),
    };

    mockMealPlannerService = {
      addAllMissingToShoppingList: vi.fn(),
    };

    mockRouter = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: ShoppingListService, useValue: mockShoppingListService },
        { provide: MealPlannerService, useValue: mockMealPlannerService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    component = TestBed.runInInjectionContext(() => new ShoppingListComponent());
  });

  it('should create shopping list component', () => {
    expect(component).toBeTruthy();
    expect(component.totalCount()).toBe(1);
    expect(component.totalEstimatedCost()).toBe(2.5);
  });

  it('should filter items by status', () => {
    component.activeFilter.set('unchecked');
    expect(component.filteredItems().length).toBe(1);

    component.activeFilter.set('checked');
    expect(component.filteredItems().length).toBe(0);
  });

  it('should sort items by column and toggle direction', () => {
    const itemA: ShoppingItem = {
      id: 'sl-1',
      name: 'Apples',
      category: 'Produce',
      quantity: 5,
      unit: 'pcs',
      checked: false,
      estimatedPrice: 1.0,
      storeName: 'Costco',
      source: 'manual',
    };
    const itemB: ShoppingItem = {
      id: 'sl-2',
      name: 'Zucchini',
      category: 'Produce',
      quantity: 2,
      unit: 'pcs',
      checked: true,
      estimatedPrice: 3.5,
      storeName: 'Aldi',
      source: 'manual',
    };

    (mockShoppingListService as { items: ReturnType<typeof signal<ShoppingItem[]>> }).items =
      signal([itemB, itemA]);
    component = TestBed.runInInjectionContext(() => new ShoppingListComponent());

    // Default sort is 'name' asc -> Apples then Zucchini
    expect(component.filteredItems()[0].name).toBe('Apples');
    expect(component.filteredItems()[1].name).toBe('Zucchini');

    // Toggle to name desc -> Zucchini then Apples
    component.toggleSort('name');
    expect(component.sortDirection()).toBe('desc');
    expect(component.filteredItems()[0].name).toBe('Zucchini');
    expect(component.filteredItems()[1].name).toBe('Apples');

    // Sort by quantity asc -> 2 (Zucchini) then 5 (Apples)
    component.toggleSort('quantity');
    expect(component.sortBy()).toBe('quantity');
    expect(component.sortDirection()).toBe('asc');
    expect(component.filteredItems()[0].quantity).toBe(2);
    expect(component.filteredItems()[1].quantity).toBe(5);

    // Sort by price desc -> 3.5 (Zucchini) then 1.0 (Apples)
    component.toggleSort('price');
    component.toggleSort('price');
    expect(component.sortBy()).toBe('price');
    expect(component.sortDirection()).toBe('desc');
    expect(component.filteredItems()[0].estimatedPrice).toBe(3.5);
  });
});
