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
  let mockShoppingListService: any;
  let mockMealPlannerService: any;
  let mockRouter: any;

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
    expect(component.totalEstimatedCost()).toBe(5.0);
  });

  it('should filter items by status', () => {
    component.activeFilter.set('unchecked');
    expect(component.filteredItems().length).toBe(1);

    component.activeFilter.set('checked');
    expect(component.filteredItems().length).toBe(0);
  });

  it('should navigate to restock review page', () => {
    component.restockChecked();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/shopping-list/restock']);
  });
});
