import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ShoppingItem } from '@models/shopping-list.model';
import { MealPlannerService } from '@services/meal-planner.service';
import { ShoppingListService } from '@services/shopping-list.service';
import { afterEach, vi } from 'vitest';

import translations from '../../../../public/i18n/en.json';
import { ShoppingListComponent } from './shopping-list.component';

const item = (
  overrides: Partial<ShoppingItem> & Pick<ShoppingItem, 'id' | 'name'>,
): ShoppingItem => ({
  category: 'Dairy',
  quantity: 1,
  unit: 'pcs',
  checked: false,
  source: 'manual',
  ...overrides,
});

describe('ShoppingListComponent', () => {
  let items: ReturnType<typeof signal<ShoppingItem[]>>;
  let toggleItem: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  let fixture: ComponentFixture<ShoppingListComponent>;
  let component: ShoppingListComponent;

  const setup = (initial: ShoppingItem[], isLoading = false, wide = false) => {
    items = signal(initial);
    toggleItem = vi.fn();
    navigate = vi.fn();
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: wide,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    TestBed.configureTestingModule({
      imports: [
        ShoppingListComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: translations },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        provideRouter([]),
        {
          provide: ShoppingListService,
          useValue: { items, isLoading: signal(isLoading), toggleItem },
        },
        { provide: MealPlannerService, useValue: { addAllMissingToShoppingList: vi.fn() } },
      ],
    });
    fixture = TestBed.createComponent(ShoppingListComponent);
    component = fixture.componentInstance;
    vi.spyOn(TestBed.inject(Router), 'navigate').mockImplementation(navigate);
    fixture.detectChanges();
  };

  const stocked = [
    item({ id: '1', name: 'Yogurt', storeName: 'Trader Joes' }),
    item({ id: '2', name: 'Bananas', storeName: 'Trader Joes', recipeName: 'Banana bread' }),
    item({ id: '3', name: 'Pasta', storeName: 'Costco', estimatedPrice: 3.5 }),
    item({ id: '4', name: 'Salt' }),
    item({ id: '5', name: 'Milk', storeName: 'Costco', checked: true }),
    item({ id: '6', name: 'Eggs', storeName: 'Trader Joes', checked: true }),
  ];

  afterEach(() => vi.unstubAllGlobals());

  it('groups unchecked items by store A-Z with no-store last and items A-Z', () => {
    setup(stocked);
    const groups = component.toBuyGroups();
    expect(groups.map((g) => g.name)).toEqual(['Costco', 'Trader Joes', null]);
    expect(groups[1].items.map((i) => i.name)).toEqual(['Bananas', 'Yogurt']);
  });

  it('lists every store, sorted, with no store last', () => {
    setup(stocked);
    expect(component.storeOptions().map((o) => o.label)).toEqual([
      'All stores',
      'Costco',
      'Trader Joes',
      'No store',
    ]);
  });

  it('omits the no-store option when every item has a store', () => {
    setup([item({ id: '1', name: 'Yogurt', storeName: 'Costco' })]);
    expect(component.storeOptions().map((o) => o.label)).toEqual(['All stores', 'Costco']);
  });

  it('shows only the selected store group', () => {
    setup(stocked);
    component.storeFilter.set('Costco');
    expect(component.toBuyGroups().map((g) => g.name)).toEqual(['Costco']);
    expect(component.cartItems().map((i) => i.name)).toEqual(['Milk']);
  });

  it('falls back to all stores when the selected store disappears', () => {
    setup(stocked);
    component.storeFilter.set('Costco');
    items.set(stocked.filter((i) => i.storeName !== 'Costco'));
    fixture.detectChanges();
    expect(component.storeFilter()).toBe('all');
  });

  it('keeps checked items out of the groups and in the cart tray', () => {
    setup(stocked);
    const el: HTMLElement = fixture.nativeElement;
    expect(
      component
        .toBuyGroups()
        .flatMap((g) => g.items)
        .some((i) => i.checked),
    ).toBe(false);
    expect(el.textContent).toContain('2 in cart');
    expect(el.textContent).toContain('Eggs, Milk');
    expect(el.querySelectorAll('section[aria-labelledby]').length).toBe(3);
  });

  it('expands the cart tray to show checked rows that can be unchecked', () => {
    setup(stocked);
    const el: HTMLElement = fixture.nativeElement;
    const toggle = el.querySelector(
      'button[aria-controls="shopping-cart-items"]',
    ) as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelector<HTMLElement>('#shopping-cart-items')?.hidden).toBe(true);
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const box = el.querySelector(
      '#shopping-cart-items input[aria-label="Move Milk back to the list"]',
    ) as HTMLInputElement;
    box.click();
    expect(toggleItem).toHaveBeenCalledWith('5');
  });

  it('hides the tray when nothing is in the cart', () => {
    setup([item({ id: '1', name: 'Yogurt', storeName: 'Costco' })]);
    expect(fixture.nativeElement.querySelector('button[aria-controls]')).toBeNull();
  });

  it('moves the cart into a sticky rail beside the list on wide screens', () => {
    setup(stocked, false, true);
    const el: HTMLElement = fixture.nativeElement;
    const rail = el.querySelector('aside.shopping-rail');
    expect(rail).not.toBeNull();
    expect(rail?.textContent).toContain('2 in cart');
    expect(rail?.textContent).toContain('Eggs');
    expect(rail?.textContent).toContain('Milk');
    expect(rail?.querySelector('button')?.textContent).toContain('Restock');
    expect(el.querySelector('button[aria-controls="shopping-cart-items"]')).toBeNull();
  });

  it('shows a quiet rail before anything is checked on wide screens', () => {
    setup([item({ id: '1', name: 'Yogurt', storeName: 'Costco' })], false, true);
    const rail = fixture.nativeElement.querySelector('aside.shopping-rail') as HTMLElement | null;
    expect(rail?.textContent).toContain('Nothing in the cart yet');
    expect(rail?.textContent).toContain('Tick items off as you pick them up.');
    expect(rail?.querySelector('button')).toBeNull();
  });

  it('restocks everything without ids when all stores are shown', () => {
    setup(stocked);
    component.goToRestock();
    expect(navigate).toHaveBeenCalledWith(['/shopping-list/restock']);
  });

  it('restocks only the in-cart ids of the selected store', () => {
    setup(stocked);
    component.storeFilter.set('Trader Joes');
    component.goToRestock();
    expect(navigate).toHaveBeenCalledWith(['/shopping-list/restock'], {
      queryParams: { ids: '6' },
    });
  });

  it('marks an item bought from the row checkbox', () => {
    setup(stocked);
    const box = fixture.nativeElement.querySelector(
      'input[aria-label="Mark Pasta as bought"]',
    ) as HTMLInputElement;
    box.click();
    expect(toggleItem).toHaveBeenCalledWith('3');
  });

  it('opens an item through a real link with recipe and price meta', () => {
    setup(stocked);
    const el: HTMLElement = fixture.nativeElement;
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('ul a'));
    expect(links.find((a) => a.textContent?.includes('Pasta'))?.getAttribute('href')).toBe(
      '/shopping-list/3/edit',
    );
    expect(el.textContent).toContain('For Banana bread');
    expect(el.textContent).toContain('$3.50');
  });

  it('says everything is in the cart when nothing is left to buy', () => {
    setup([item({ id: '1', name: 'Milk', storeName: 'Costco', checked: true })]);
    expect(fixture.nativeElement.textContent).toContain('Everything is in the cart');
    component.storeFilter.set('Costco');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Everything from Costco is in the cart');
  });

  it('shows the empty state when there are no items', () => {
    setup([]);
    expect(fixture.nativeElement.querySelector('pantry-empty-state')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Your shopping list is empty');
  });

  it('shows a busy skeleton while loading', () => {
    setup(stocked, true);
    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).not.toBeNull();
  });
});
