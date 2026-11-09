import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { Ingredient } from '@models/ingredient.model';
import { Item } from '@models/items.model';
import { IngredientCategoryService } from '@services/inventory/ingredient-category.service';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ShoppingListService } from '@services/shopping-list.service';
import { ToastService } from '@services/toast.service';
import { ConfirmDialogService } from '@ui';
import { ConfirmationService } from 'primeng/api';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/services/auth.service';
import { InventoryComponent } from './inventory.component';

import { UnitType } from '@models/unit.model';

describe('InventoryComponent', () => {
  let component: InventoryComponent;
  let fixture: ComponentFixture<InventoryComponent>;
  let mockItemService: jasmine.SpyObj<ItemService>;
  let mockShoppingListService: jasmine.SpyObj<ShoppingListService>;
  let ingredients$: Subject<Ingredient[]>;
  let confirmSpy: jasmine.Spy;

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
    ingredients$ = new Subject<Ingredient[]>();
    confirmSpy = jasmine.createSpy('confirm').and.returnValue(Promise.resolve(true));
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
        {
          provide: ConfirmDialogService,
          useValue: { confirm: confirmSpy, confirmationService: new ConfirmationService() },
        },
        { provide: IngredientService, useValue: { getIngredients: () => ingredients$ } },
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

  it('marks the view for check when ingredients arrive after the items', () => {
    const markForCheck = vi.spyOn(component['cdr'], 'markForCheck');
    ingredients$.next([{ id: 'ing-1', name: 'Milk' } as Ingredient]);
    expect(markForCheck).toHaveBeenCalled();
    expect(component.getIngredientName('ing-1')).toBe('Milk');
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
    expect(component.restockExpirationDate()).toBeNull();
  });

  it('computes expiry presets from the local date near midnight', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(2026, 5, 30, 23, 30));
      component.setRestockExpiryDays(3);
      expect(component.restockExpirationDate()).toEqual(new Date(2026, 6, 3));
    } finally {
      vi.useRealTimers();
    }
  });

  it('parses date-only strings as local calendar days and full timestamps via local getters', () => {
    const toLocalDate = (value: string) =>
      (component as unknown as { toLocalDate(v: string): Date }).toLocalDate(value);
    expect(toLocalDate('2026-07-03')).toEqual(new Date(2026, 6, 3));
    const timestamp = '2026-07-03T23:30:00.000Z';
    const local = new Date(timestamp);
    expect(toLocalDate(timestamp)).toEqual(
      new Date(local.getFullYear(), local.getMonth(), local.getDate()),
    );
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

  it('should show inventory items in the table without a view toggle', () => {
    expect(fixture.nativeElement.querySelector('table')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(3);
    expect(fixture.nativeElement.querySelector('pantry-item-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('[title="Grid Cards View"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[title="Table View"]')).toBeNull();
  });

  it('should confirm destructively before bulk deleting selected items', async () => {
    component.toggleSelectItem(mockItem1.id);
    await component.onBulkDelete();

    expect(confirmSpy).toHaveBeenCalledWith(jasmine.objectContaining({ destructive: true }));
    expect(mockItemService.bulkDeleteItems).toHaveBeenCalledWith([mockItem1.id]);
  });

  it('should not bulk delete when the confirmation is declined', async () => {
    confirmSpy.and.returnValue(Promise.resolve(false));
    component.toggleSelectItem(mockItem1.id);
    await component.onBulkDelete();

    expect(mockItemService.bulkDeleteItems).not.toHaveBeenCalled();
    expect(component.selectedItemIds().size).toBe(1);
  });

  it('should show an error state with retry when items fail to load', () => {
    mockItemService.getItems.and.returnValue(throwError(() => new Error('offline')));
    component.retryLoad();
    fixture.detectChanges();

    expect(component.loadFailed()).toBeTrue();
    expect(fixture.nativeElement.querySelector('pantry-empty-state')).toBeTruthy();

    mockItemService.getItems.and.returnValue(of([mockItem1]));
    component.retryLoad();
    fixture.detectChanges();

    expect(component.loadFailed()).toBeFalse();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('should keep the exact Date emitted by the datepicker as the bound model', () => {
    const picked = new Date(2026, 8, 5);
    component.onRestockExpirationChange(picked);
    expect(component.restockExpirationDate()).toBe(picked);
    expect(component.restockExpirationDate()).toBe(component.restockExpirationDate());
    component.onRestockExpirationChange(null);
    expect(component.restockExpirationDate()).toBeNull();
  });

  it('should send the local date of the picked expiry on confirm', () => {
    mockItemService.updateItem.and.returnValue(of({} as IngredientItemDTO));
    component.openRestockDialog(mockItem1);
    component.onRestockExpirationChange(new Date(2026, 8, 5, 23, 30));
    component.onConfirmRestock();
    expect(mockItemService.updateItem).toHaveBeenCalledWith(
      jasmine.objectContaining({ expirationDate: new Date(2026, 8, 5) }),
    );
  });
});
