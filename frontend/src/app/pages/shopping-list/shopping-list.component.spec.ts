import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ShoppingItem } from '@models/shopping-list.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { ShoppingListService } from '@services/shopping-list.service';
import { ConfirmDialogService } from '@ui';
import { of } from 'rxjs';
import { vi } from 'vitest';
import translations from '../../../../public/i18n/en.json';
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
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: translations },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
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

  describe('deleteSelected', () => {
    let confirm: ReturnType<typeof vi.fn>;
    let deleteItems: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      confirm = vi.fn();
      deleteItems = vi.fn().mockReturnValue(of(undefined));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          TranslocoTestingModule.forRoot({
            langs: { en: translations },
            translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
            preloadLangs: true,
          }),
        ],
        providers: [
          {
            provide: ShoppingListService,
            useValue: {
              items: signal([mockItem]),
              deleteItems,
              loadItemsFromBackend: vi.fn(),
            },
          },
          { provide: MealPlannerService, useValue: mockMealPlannerService },
          { provide: Router, useValue: mockRouter },
          { provide: ConfirmDialogService, useValue: { confirm } },
        ],
      });
      component = TestBed.runInInjectionContext(() => new ShoppingListComponent());
      component.selectedIds.set(new Set(['sl-1']));
    });

    it('deletes after a destructive confirmation', async () => {
      confirm.mockResolvedValue(true);
      await component.deleteSelected();
      expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ destructive: true }));
      expect(deleteItems).toHaveBeenCalledWith(['sl-1']);
    });

    it('keeps the items when the confirmation is cancelled', async () => {
      confirm.mockResolvedValue(false);
      await component.deleteSelected();
      expect(deleteItems).not.toHaveBeenCalled();
    });
  });

  describe('rendered template', () => {
    const langs = {
      en: {
        shoppingList: {
          table: {
            item: 'Item Name',
            category: 'Category',
            store: 'Store',
            quantity: 'Quantity',
            price: 'Est. Price',
            markItemBought: 'Mark {{name}} as bought',
            selectItem: 'Select {{name}}',
            selectAll: 'Select all items',
            editQuantity: 'Edit quantity for {{name}}',
            editPrice: 'Edit estimated price for {{name}}',
          },
        },
      },
    };
    let toggleItem: ReturnType<typeof vi.fn>;
    let fixture: ComponentFixture<ShoppingListComponent>;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      toggleItem = vi.fn();
      await TestBed.configureTestingModule({
        imports: [
          ShoppingListComponent,
          TranslocoTestingModule.forRoot({
            langs,
            translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          }),
        ],
        providers: [
          provideRouter([]),
          {
            provide: ShoppingListService,
            useValue: {
              items: signal([mockItem]),
              isLoading: signal(false),
              toggleItem,
              updateItemQuantity: vi.fn(),
              updateItemPrice: vi.fn(),
            },
          },
          { provide: MealPlannerService, useValue: { addAllMissingToShoppingList: vi.fn() } },
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(ShoppingListComponent);
      fixture.detectChanges();
    });

    it('exposes aria-sort on sortable headers and sorts from the header button', () => {
      const el: HTMLElement = fixture.nativeElement;
      const headers = el.querySelectorAll('th[aria-sort]');
      expect(headers.length).toBe(5);
      expect(headers[0].getAttribute('aria-sort')).toBe('ascending');
      expect(headers[1].getAttribute('aria-sort')).toBe('none');

      (headers[0].querySelector('button') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(el.querySelectorAll('th[aria-sort]')[0].getAttribute('aria-sort')).toBe('descending');
    });

    it('opens an item through a real link', () => {
      const link = fixture.nativeElement.querySelector('tbody a') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe('/shopping-list/sl-1/edit');
      const mobileLink = fixture.nativeElement.querySelector('ul a') as HTMLAnchorElement;
      expect(mobileLink.getAttribute('href')).toBe('/shopping-list/sl-1/edit');
    });

    it('marks an item bought from the per-row control', () => {
      const box = fixture.nativeElement.querySelector(
        'input[aria-label="Mark Butter as bought"]',
      ) as HTMLInputElement;
      box.click();
      expect(toggleItem).toHaveBeenCalledWith('sl-1');
    });

    it('keeps bulk selection behind select mode', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('input[aria-label="Select Butter"]')).toBeNull();
      fixture.componentInstance.toggleSelectMode();
      fixture.detectChanges();
      expect(el.querySelector('input[aria-label="Select Butter"]')).not.toBeNull();
    });

    it('edits quantity through a keyboard-reachable button', () => {
      const el: HTMLElement = fixture.nativeElement;
      const trigger = el.querySelector(
        'button[aria-label="Edit quantity for Butter"]',
      ) as HTMLButtonElement;
      trigger.click();
      fixture.detectChanges();
      const input = el.querySelector('input[data-inline-input]') as HTMLInputElement;
      expect(input.getAttribute('aria-label')).toBe('Edit quantity for Butter');
      input.value = '4';
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      fixture.detectChanges();
      expect(fixture.componentInstance.editingQuantityId()).toBeNull();
    });
  });
});
