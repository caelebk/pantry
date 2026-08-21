import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { Item } from '@models/items.model';
import { IngredientCategoryService } from '@services/inventory/ingredient-category.service';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ShoppingListService } from '@services/shopping-list.service';
import { ToastService } from '@services/toast.service';
import { of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { InventoryComponent } from './inventory.component';

import { UnitType } from '@models/unit.model';

describe('InventoryComponent', () => {
  let component: InventoryComponent;
  let fixture: ComponentFixture<InventoryComponent>;
  let mockItemService: jasmine.SpyObj<ItemService>;
  let mockShoppingListService: jasmine.SpyObj<ShoppingListService>;

  const mockItem1: Item = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Milk',
    quantity: 2,
    unit: { id: 1, name: 'Liters', shortName: 'L', type: UnitType.Volume, toBaseFactor: 1 },
    purchaseDate: new Date('2026-08-01'),
    expirationDate: new Date('2026-12-31'),
    location: { id: 1, name: 'Fridge' },
    notes: '',
  };

  const mockItem2: Item = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'Expired Cheese',
    quantity: 1,
    unit: { id: 2, name: 'Pounds', shortName: 'lbs', type: UnitType.Weight, toBaseFactor: 1 },
    purchaseDate: new Date('2026-07-01'),
    expirationDate: new Date('2026-07-15'),
    location: { id: 1, name: 'Fridge' },
    notes: '',
  };

  const mockItemEmpty: Item = {
    id: '123e4567-e89b-12d3-a456-426614174003',
    name: 'Empty Eggs',
    quantity: 0,
    unit: { id: 3, name: 'Pieces', shortName: 'pcs', type: UnitType.Count, toBaseFactor: 1 },
    purchaseDate: new Date('2026-07-01'),
    expirationDate: new Date('2026-08-20'),
    location: { id: 1, name: 'Fridge' },
    notes: '',
  };

  beforeEach(async () => {
    mockItemService = jasmine.createSpyObj('ItemService', [
      'getItems',
      'addItem',
      'updateItem',
      'removeItem',
      'bulkClearStock',
      'bulkDeleteItems',
    ]);
    mockShoppingListService = jasmine.createSpyObj('ShoppingListService', [
      'addItem',
      'addMultipleItems',
    ]);

    mockItemService.getItems.and.returnValue(of([mockItem1, mockItem2, mockItemEmpty]));
    mockItemService.bulkClearStock.and.returnValue(of({ clearedCount: 1 }));
    mockItemService.bulkDeleteItems.and.returnValue(of({ deletedCount: 1 }));

    await TestBed.configureTestingModule({
      imports: [
        InventoryComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ItemService, useValue: mockItemService },
        { provide: ShoppingListService, useValue: mockShoppingListService },
        { provide: IngredientService, useValue: { getIngredients: () => of([]) } },
        { provide: IngredientGroupService, useValue: { getIngredientGroups: () => of([]) } },
        { provide: IngredientCategoryService, useValue: { getIngredientCategories: () => of([]) } },
        { provide: LocationService, useValue: { getLocations: () => of([]) } },
        { provide: UnitService, useValue: { getUnits: () => of([]) } },
        {
          provide: ToastService,
          useValue: { showSuccess: () => undefined, showError: () => undefined },
        },

        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        {
          provide: AuthService,
          useValue: { activeKitchen: jasmine.createSpy().and.returnValue('kitchen-1') },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryComponent);
    component = fixture.componentInstance;
    TestBed.flushEffects();
    fixture.detectChanges();
  });

  it('should create and load inventory items with status counts', () => {
    expect(component).toBeTruthy();
    expect(component.totalItemsCount).toBe(3);
    expect(component.outOfStockItemsCount).toBe(1);
    expect(component.expiredItemsCount).toBe(1);
  });

  it('should toggle item row selection correctly', () => {
    expect(component.isItemSelected(mockItem1.id)).toBeFalse();
    component.toggleSelectItem(mockItem1.id);
    expect(component.isItemSelected(mockItem1.id)).toBeTrue();

    component.clearSelection();
    expect(component.selectedItemIds().size).toBe(0);
  });

  it('should toggle select all visible items', () => {
    component.toggleSelectAllVisible();
    expect(component.isAllVisibleSelected()).toBeTrue();
    expect(component.selectedItemIds().size).toBe(3);

    component.toggleSelectAllVisible();
    expect(component.selectedItemIds().size).toBe(0);
  });

  it('should filter items by out_of_stock status filter', () => {
    component.setStatusFilter('out_of_stock');
    expect(component.filteredItems.length).toBe(1);
    expect(component.filteredItems[0].name).toBe('Empty Eggs');
  });

  it('should correctly identify out of stock items', () => {
    expect(component.isOutOfStockItem(mockItemEmpty)).toBeTrue();
    expect(component.isOutOfStockItem(mockItem1)).toBeFalse();
  });

  it('should naturally sort out of stock items to the bottom of the table', () => {
    component.setStatusFilter('all');
    component.toggleSort('name');
    const items = component.filteredItems;

    expect(items.length).toBe(3);
    const lastItem = items[items.length - 1];
    expect(lastItem.id).toBe(mockItemEmpty.id);
    expect(lastItem.quantity).toBe(0);
  });

  it('should open restock dialog on quick restock and update quantity and purchaseDate on confirm', () => {
    mockItemService.updateItem.and.returnValue(of({} as IngredientItemDTO));
    component.toggleSelectItem(mockItemEmpty.id);
    component.onBulkRestock();

    expect(component.displayRestockModal()).toBeTrue();
    expect(component.restockItem()).toEqual(mockItemEmpty);
    expect(component.restockAmount()).toBe(1);

    component.onConfirmRestock();

    expect(mockItemService.updateItem).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: mockItemEmpty.id,
        quantity: 1,
        purchaseDate: jasmine.any(Date),
      }),
    );
    expect(component.displayRestockModal()).toBeFalse();
  });

  it('should open restock dialog on multi-item bulk restock and update all selected items', () => {
    mockItemService.updateItem.and.returnValue(of({} as IngredientItemDTO));
    component.toggleSelectItem(mockItem1.id);
    component.toggleSelectItem(mockItem2.id);
    component.onBulkRestock();

    expect(component.displayRestockModal()).toBeTrue();
    expect(component.restockItem()).toBeNull();
    expect(component.restockItems().length).toBe(2);

    component.onConfirmRestock();

    expect(mockItemService.updateItem).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: mockItem1.id,
        purchaseDate: jasmine.any(Date),
      }),
    );
    expect(mockItemService.updateItem).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: mockItem2.id,
        purchaseDate: jasmine.any(Date),
      }),
    );
    expect(component.displayRestockModal()).toBeFalse();
  });

  it('should support quick expiry presets in restock dialog', () => {
    component.setRestockExpiryDays(7);
    expect(component.restockExpirationDate()).toBeTruthy();

    component.clearRestockExpiry();
    expect(component.restockExpirationDate()).toBe('');
  });

  it('should add single item to shopping list', () => {
    component.onAddToShoppingList(mockItem1);
    expect(mockShoppingListService.addItem).toHaveBeenCalledWith({
      name: 'Milk',
      category: 'Pantry Restock',
      quantity: 1,
      unit: 'L',
      source: 'low_stock',
    });
  });

  it('should execute bulk add to shopping list for selected items', () => {
    component.toggleSelectItem(mockItem1.id);
    component.toggleSelectItem(mockItem2.id);

    component.onBulkAddToShoppingList();

    expect(mockShoppingListService.addMultipleItems).toHaveBeenCalledWith(
      jasmine.arrayContaining([
        jasmine.objectContaining({ name: 'Milk' }),
        jasmine.objectContaining({ name: 'Expired Cheese' }),
      ]),
    );
    expect(component.selectedItemIds().size).toBe(0);
  });

  it('should toggle showScrollTopButton based on scroll threshold (300px)', () => {
    expect(component.showScrollTopButton).toBeFalse();

    Object.defineProperty(window, 'scrollY', { value: 350, writable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(component.showScrollTopButton).toBeTrue();

    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(component.showScrollTopButton).toBeFalse();
  });
});
