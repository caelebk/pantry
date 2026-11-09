import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { Item } from '@models/items.model';
import { UnitType } from '@models/unit.model';
import { IngredientCategoryService } from '@services/inventory/ingredient-category.service';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { of, Subject, throwError } from 'rxjs';
import en from '../../../../../public/i18n/en.json';
import { InventoryOverviewPageComponent } from './inventory-overview-page.component';

describe('InventoryOverviewPageComponent', () => {
  let component: InventoryOverviewPageComponent;
  let fixture: ComponentFixture<InventoryOverviewPageComponent>;

  const mockCategoryService = {
    getIngredientCategories: () => of([]),
  };

  const mockGroupService = {
    getIngredientGroups: () => of([]),
  };

  const mockIngredientService = {
    getIngredients: () => of([]),
  };

  const mockItemService = {
    getItems: () => of([]),
  };

  const mockLocationService = {
    getLocations: () => of([]),
  };

  const createSyntheticItem = (overrides: Partial<Item> = {}): Item => ({
    id: 'test-item-1',
    name: 'Test Item',
    quantity: 1,
    unit: {
      id: 1,
      name: 'Grams',
      shortName: 'g',
      type: UnitType.Weight,
      toBaseFactor: 1,
    },
    purchaseDate: new Date('2026-10-01T00:00:00Z'),
    expirationDate: new Date('2026-10-15T00:00:00Z'),
    location: {
      id: 1,
      name: 'Fridge',
    },
    notes: '',
    ...overrides,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InventoryOverviewPageComponent,
        TranslocoTestingModule.forRoot({
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
          langs: { en },
        }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: IngredientCategoryService, useValue: mockCategoryService },
        { provide: IngredientGroupService, useValue: mockGroupService },
        { provide: IngredientService, useValue: mockIngredientService },
        { provide: ItemService, useValue: mockItemService },
        { provide: LocationService, useValue: mockLocationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryOverviewPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the InventoryOverviewPageComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should compute metrics correctly when initialized', () => {
    expect(component.categoriesCount()).toBe(0);
    expect(component.groupsCount()).toBe(0);
    expect(component.ingredientsCount()).toBe(0);
    expect(component.itemsCount()).toBe(0);
  });

  it('counts available ingredients once and excludes empty batches from locations', () => {
    component.ingredients.set([
      { id: 'spinach', name: 'Spinach' },
      { id: 'rice', name: 'Rice' },
    ]);
    component.locations.set([{ id: 1, name: 'Fridge' }]);
    component.items.set([
      {
        id: 'a',
        name: 'Spinach',
        ingredientId: 'spinach',
        quantity: 2,
        location: { id: 1, name: 'Fridge' },
      },
      {
        id: 'b',
        name: 'Spinach',
        ingredientId: 'spinach',
        quantity: 1,
        location: { id: 1, name: 'Fridge' },
      },
      {
        id: 'c',
        name: 'Rice',
        ingredientId: 'rice',
        quantity: 0,
        location: { id: 1, name: 'Fridge' },
      },
    ] as import('@models/items.model').Item[]);
    expect(component.stockedIngredientsCount()).toBe(1);
    expect(component.stockedItemsCount()).toBe(2);
    expect(component.locationStats()[0].count).toBe(2);
  });

  it('retains catalog data when stock loading fails', () => {
    const ingredients = vi
      .spyOn(mockIngredientService, 'getIngredients')
      .mockReturnValue(
        of([{ id: 'a', name: 'Rice' }] as import('@models/ingredient.model').Ingredient[]),
      );
    const items = vi
      .spyOn(mockItemService, 'getItems')
      .mockReturnValue(throwError(() => new Error('Offline')));
    component.fetchInventoryData();
    expect(component.ingredientsCount()).toBe(1);
    expect(component.sectionStates().items).toBe('error');
    expect(component.sectionStates().ingredients).toBe('ready');
    ingredients.mockRestore();
    items.mockRestore();
  });

  it('keeps examples above the closed definitions disclosure and destinations available with an empty catalog', () => {
    component.fetchInventoryData();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    const guide = root.querySelector('#inventory-guide')?.closest('section');
    expect(guide).toBeTruthy();
    expect(guide?.textContent).toContain('How inventory is organized');

    const details = guide?.querySelector('details');
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);

    const summary = details?.querySelector('summary');
    expect(summary?.textContent?.trim()).toContain('Explain these terms');

    expect(guide?.textContent).toContain('200 g in the fridge');
    expect(details?.textContent).not.toContain('200 g in the fridge');
    expect(details?.querySelectorAll('dl dt').length).toBe(4);

    for (const href of ['/inventory/ingredients', '/inventory/items', '/inventory/groups']) {
      expect(root.querySelector(`nav a[href="${href}"]`)).toBeTruthy();
    }
  });

  it('keeps the guide disclosure and all three destinations available when data is unavailable', () => {
    const ingSpy = vi
      .spyOn(mockIngredientService, 'getIngredients')
      .mockReturnValue(throwError(() => new Error('Offline')));
    const itemSpy = vi
      .spyOn(mockItemService, 'getItems')
      .mockReturnValue(throwError(() => new Error('Offline')));

    component.fetchInventoryData();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    const guide = root.querySelector('#inventory-guide')?.closest('section');
    expect(guide).toBeTruthy();
    expect(guide?.textContent).toContain('200 g in the fridge');

    for (const href of ['/inventory/ingredients', '/inventory/items', '/inventory/groups']) {
      expect(root.querySelector(`nav a[href="${href}"]`)).toBeTruthy();
    }

    ingSpy.mockRestore();
    itemSpy.mockRestore();
  });

  it('places the terminology guide before current stock and exploration', () => {
    component.items.set([createSyntheticItem()]);
    component.sectionStates.update((states) => ({ ...states, items: 'ready', locations: 'ready' }));
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const attention = root.querySelector('section[aria-labelledby="inventory-attention"]')!;
    const explore = root.querySelector('section[aria-labelledby="inventory-explore"]')!;
    const guide = root.querySelector('section[aria-labelledby="inventory-guide"]')!;
    expect(
      guide.compareDocumentPosition(attention) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      attention.compareDocumentPosition(explore) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('projects the add-stock action inside the empty state', () => {
    component.fetchInventoryData();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const add = root.querySelector('pantry-empty-state a[href="/inventory/items/new"]');
    expect(add).toBeTruthy();
    expect(add?.textContent?.trim()).toBe(en.inventoryOverview.add);
  });

  it('keeps usable attention rows and reports a location failure beside locations', () => {
    component.now.set(new Date(2026, 9, 9, 12).getTime());
    component.items.set([createSyntheticItem({ expirationDate: new Date(2026, 9, 10) })]);
    component.sectionStates.update((states) => ({ ...states, items: 'ready', locations: 'error' }));
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(
      root.querySelector('section[aria-labelledby="inventory-attention"] a[href*="/edit"]'),
    ).toBeTruthy();
    const locations = root.querySelector('section[aria-labelledby="inventory-locations"]');
    expect(locations?.textContent).toContain('Location summary unavailable');
    const retry = locations?.querySelector('button');
    expect(retry).toBeTruthy();
    const refresh = vi.spyOn(component, 'fetchInventoryData');
    retry?.click();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('reports a failed stock summary locally without presenting missing stock as empty', () => {
    component.sectionStates.update((states) => ({ ...states, items: 'error', locations: 'ready' }));
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('Stock summary unavailable');
    expect(root.querySelector('pantry-empty-state')).toBeNull();
    expect(root.querySelector('nav')).toBeTruthy();
  });

  it('renders exactly three destination anchors with approved hrefs and no nested interactive elements in navigation', () => {
    component.fetchInventoryData();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const nav = root.querySelector('nav');
    expect(nav).toBeTruthy();

    const anchors = Array.from(nav!.querySelectorAll('a'));
    expect(anchors.length).toBe(3);

    const hrefs = anchors.map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/inventory/ingredients', '/inventory/items', '/inventory/groups']);

    for (const anchor of anchors) {
      expect(anchor.querySelector('a, button, input, select, textarea')).toBeNull();
    }
  });

  it('renders positive expired and upcoming counts as links in attention region and excludes them from navigation', () => {
    const now = Date.now();
    component.now.set(now);
    const expiredItem = createSyntheticItem({
      id: 'exp-1',
      name: 'Yogurt',
      quantity: 1,
      expirationDate: new Date(now - 86400000),
    });
    const upcomingItem = createSyntheticItem({
      id: 'soon-1',
      name: 'Milk',
      quantity: 2,
      expirationDate: new Date(now + 86400000 * 3),
    });

    component.items.set([expiredItem, upcomingItem]);
    component.sectionStates.update((s) => ({ ...s, items: 'ready' }));
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    const nav = root.querySelector('nav');
    expect(nav).toBeTruthy();
    expect(nav?.querySelector('a[href*="status=expired"]')).toBeNull();
    expect(nav?.querySelector('a[href*="status=expiring"]')).toBeNull();

    const attentionSection = root.querySelector('section[aria-labelledby="inventory-attention"]');
    expect(attentionSection).toBeTruthy();

    const expiredLink = attentionSection?.querySelector('a[href*="status=expired"]');
    const upcomingLink = attentionSection?.querySelector('a[href*="status=expiring"]');

    expect(expiredLink).toBeTruthy();
    expect(expiredLink?.textContent).toContain('1 expired');
    expect(upcomingLink).toBeTruthy();
    expect(upcomingLink?.textContent).toContain('1 due within 7 days');
  });

  it('does not render warning links in attention region when counts are zero', () => {
    const now = Date.now();
    component.now.set(now);
    const freshItem = createSyntheticItem({
      id: 'fresh-1',
      name: 'Canned Beans',
      quantity: 5,
      expirationDate: new Date(now + 86400000 * 30),
    });

    component.items.set([freshItem]);
    component.sectionStates.update((s) => ({ ...s, items: 'ready' }));
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    const attentionSection = root.querySelector('section[aria-labelledby="inventory-attention"]');
    expect(attentionSection).toBeTruthy();

    expect(attentionSection?.querySelector('a[href*="status=expired"]')).toBeNull();
    expect(attentionSection?.querySelector('a[href*="status=expiring"]')).toBeNull();
  });

  it('limits attention preview to three rows in expiry ordering while summary links retain full counts', () => {
    const now = Date.now();
    component.now.set(now);

    const items: Item[] = [
      createSyntheticItem({
        id: 'exp-3',
        name: 'Carrots',
        quantity: 1,
        expirationDate: new Date(now - 86400000 * 5),
      }),
      createSyntheticItem({
        id: 'exp-1',
        name: 'Apples',
        quantity: 1,
        expirationDate: new Date(now - 86400000 * 3),
      }),
      createSyntheticItem({
        id: 'exp-2',
        name: 'Beef',
        quantity: 1,
        expirationDate: new Date(now - 86400000),
      }),
      createSyntheticItem({
        id: 'soon-1',
        name: 'Dairy Milk',
        quantity: 1,
        expirationDate: new Date(now + 86400000 * 2),
      }),
      createSyntheticItem({
        id: 'soon-2',
        name: 'Eggs',
        quantity: 1,
        expirationDate: new Date(now + 86400000 * 5),
      }),
      createSyntheticItem({
        id: 'soon-3',
        name: 'Fish',
        quantity: 1,
        expirationDate: new Date(now + 86400000 * 6),
      }),
    ];

    component.items.set(items);
    component.sectionStates.update((s) => ({ ...s, items: 'ready' }));
    fixture.detectChanges();

    expect(component.attentionItems().length).toBe(3);
    expect(component.attentionItems().map((item) => item.id)).toEqual(['exp-3', 'exp-1', 'exp-2']);

    const root: HTMLElement = fixture.nativeElement;
    const attentionSection = root.querySelector('section[aria-labelledby="inventory-attention"]');
    expect(attentionSection).toBeTruthy();

    const previewLinks = attentionSection?.querySelectorAll('ul li a[href*="/edit"]');
    expect(previewLinks?.length).toBe(3);

    const expiredLink = attentionSection?.querySelector('a[href*="status=expired"]');
    const upcomingLink = attentionSection?.querySelector('a[href*="status=expiring"]');
    expect(expiredLink?.textContent).toContain('3 expired');
    expect(upcomingLink?.textContent).toContain('3 due within 7 days');
  });

  it('does not label a failed summary as loading when another collection is pending, and keeps available ingredient totals visible when stock fails', () => {
    component.ingredients.set([
      { id: '1', name: 'Flour' },
      { id: '2', name: 'Sugar' },
    ]);
    component.sectionStates.set({
      categories: 'ready',
      groups: 'ready',
      ingredients: 'ready',
      items: 'error',
      locations: 'ready',
    });
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    const ingredientsAnchor = root.querySelector('nav a[href="/inventory/ingredients"]');
    expect(ingredientsAnchor).toBeTruthy();
    expect(ingredientsAnchor?.textContent).toContain('2 ingredients');

    component.sectionStates.set({
      categories: 'error',
      groups: 'ready',
      ingredients: 'ready',
      items: 'loading',
      locations: 'ready',
    });
    fixture.detectChanges();

    const orgAnchor = root.querySelector('nav a[href="/inventory/groups"]');
    expect(orgAnchor).toBeTruthy();
    expect(orgAnchor?.textContent).toContain('Summary unavailable');
    expect(orgAnchor?.textContent).not.toContain('Loading summary…');
    expect(orgAnchor?.textContent).not.toContain('Loading inventory');
  });

  it('ignores a stale stock response after a new refresh', () => {
    const stale = new Subject<Item[]>();
    const spy = vi
      .spyOn(mockItemService, 'getItems')
      .mockReturnValueOnce(stale as never)
      .mockReturnValueOnce(of([]));
    component.fetchInventoryData();
    component.fetchInventoryData();
    stale.next([{ id: 'old', quantity: 2 }] as Item[]);
    expect(component.itemsCount()).toBe(0);
    spy.mockRestore();
  });

  it('orders expired batches before upcoming batches and excludes empty stock', () => {
    const now = Date.now();
    component.now.set(now);
    component.items.set([
      { id: 'soon', name: 'Spinach', quantity: 1, expirationDate: new Date(now + 100000) },
      { id: 'empty', name: 'Rice', quantity: 0, expirationDate: new Date(now - 100000) },
      { id: 'expired', name: 'Milk', quantity: 1, expirationDate: new Date(now - 100000) },
    ] as Item[]);
    expect(component.attentionItems().map((item) => item.id)).toEqual(['expired', 'soon']);
  });

  it.each([
    [new Date(2026, 9, 9, 0), 'expiredToday', undefined],
    [new Date(2026, 9, 9, 12), 'expiredToday', undefined],
    [new Date(2026, 9, 9, 23), 'dueToday', undefined],
    [new Date(2026, 9, 8, 23), 'expiredYesterday', undefined],
    [new Date(2026, 9, 10, 0), 'dueTomorrow', undefined],
    [new Date(2026, 9, 6, 23), 'expiredDays', 3],
    [new Date(2026, 9, 12, 0), 'dueDays', 3],
  ])(
    'describes expiration %s relative to the displayed local calendar date',
    (date, key, count) => {
      component.now.set(new Date(2026, 9, 9, 12).getTime());
      const timing = component.expiryTiming(createSyntheticItem({ expirationDate: date }));
      expect(timing.key).toBe(key);
      if (count !== undefined) expect(timing.count).toBe(count);
    },
  );

  it('keeps tomorrow as one calendar day across a daylight-saving boundary', () => {
    component.now.set(new Date(2026, 9, 31, 12).getTime());
    expect(
      component.expiryTiming(createSyntheticItem({ expirationDate: new Date(2026, 10, 1, 23) }))
        .key,
    ).toBe('dueTomorrow');
  });

  it('distinguishes failed loading and retries', () => {
    const spy = vi
      .spyOn(mockItemService, 'getItems')
      .mockReturnValue(throwError(() => new Error('Offline')));
    component.fetchInventoryData();
    expect(component.loadError()).toBe(true);
    spy.mockReturnValue(of([]));
    component.fetchInventoryData();
    expect(component.loadError()).toBe(false);
    spy.mockRestore();
  });
});
