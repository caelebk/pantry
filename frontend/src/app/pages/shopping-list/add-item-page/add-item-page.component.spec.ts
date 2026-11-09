import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { UnitService } from '@services/inventory/unit.service';
import { ShoppingListService } from '@services/shopping-list.service';
import { StoreService } from '@services/store.service';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import translations from '../../../../../public/i18n/en.json';
import { AddShoppingItemPageComponent } from './add-item-page.component';

describe('AddShoppingItemPageComponent', () => {
  const ingredient = { id: 'ing-1', name: 'Rice', defaultUnit: { shortName: 'kg' } };
  const store = { id: 's1', name: 'Market', archived: false };
  const item = {
    id: 'item-1',
    name: 'Rice',
    quantity: 2.5,
    ingredientId: 'ing-1',
    storeId: 's1',
    storeName: 'Market',
  };

  const setup = (id: string | null, overrides: Record<string, unknown> = {}) => {
    const ingredients$ = new Subject<unknown[]>();
    const stores$ = new Subject<unknown[]>();
    const item$ = new Subject<unknown>();
    const shoppingList = {
      getItem: vi.fn().mockReturnValue(item$),
      createItem: vi.fn().mockReturnValue(of({})),
      updateItem: vi.fn().mockReturnValue(of({})),
      getItems: vi.fn().mockReturnValue([]),
    };
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: translations },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => id } } } },
        { provide: ShoppingListService, useValue: shoppingList },
        { provide: IngredientService, useValue: { getIngredients: () => ingredients$ } },
        { provide: IngredientGroupService, useValue: { getIngredientGroups: () => of([]) } },
        { provide: UnitService, useValue: { getUnits: () => of([]) } },
        { provide: StoreService, useValue: { getStores: () => stores$ }, ...overrides },
      ],
    });
    const component = TestBed.createComponent(AddShoppingItemPageComponent).componentInstance;
    component.ngOnInit();
    return { component, shoppingList, ingredients$, stores$, item$ };
  };

  describe('quantity validation', () => {
    it('rejects an empty quantity instead of coercing it to 1', () => {
      const { component, shoppingList } = setup(null);
      component.selectIngredient(ingredient as never);
      component.quantity.set(null);
      component.saveItem();
      expect(component.error()).toBe('Quantity must be greater than zero.');
      expect(shoppingList.createItem).not.toHaveBeenCalled();
    });

    it('rejects zero', () => {
      const { component, shoppingList } = setup(null);
      component.selectIngredient(ingredient as never);
      component.quantity.set(0);
      component.saveItem();
      expect(shoppingList.createItem).not.toHaveBeenCalled();
    });

    it('accepts a decimal quantity below 1', () => {
      const { component, shoppingList } = setup(null);
      component.selectIngredient(ingredient as never);
      component.quantity.set(0.5);
      component.saveItem();
      expect(shoppingList.createItem).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 0.5 }),
      );
    });
  });

  describe('edit population', () => {
    it('does not populate until the item and both option lists have arrived', () => {
      const { component, ingredients$, stores$, item$ } = setup('item-1');
      item$.next(item);
      item$.complete();
      ingredients$.next([ingredient]);
      ingredients$.complete();
      expect(component.selectedIngredient()).toBeNull();
      stores$.next([store]);
      stores$.complete();
      expect(component.selectedIngredient()).toEqual(ingredient);
      expect(component.selectedStore()).toEqual(store);
      expect(component.quantity()).toBe(2.5);
    });

    it('populates when the lists arrive before the item', () => {
      const { component, ingredients$, stores$, item$ } = setup('item-1');
      ingredients$.next([ingredient]);
      ingredients$.complete();
      stores$.next([store]);
      stores$.complete();
      expect(component.selectedIngredient()).toBeNull();
      item$.next(item);
      item$.complete();
      expect(component.selectedIngredient()).toEqual(ingredient);
      expect(component.selectedStore()).toEqual(store);
    });
  });
});
