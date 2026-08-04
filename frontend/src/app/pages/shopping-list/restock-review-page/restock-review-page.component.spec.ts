import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { IngredientItem, IngredientItemDTO } from '@models/items.model';
import { Location } from '@models/location.model';
import { ShoppingItem } from '@models/shopping-list.model';
import { Unit, UnitType } from '@models/unit.model';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService, ItemSimilarityCandidate } from '@services/inventory/item.service';

import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ShoppingListService } from '@services/shopping-list.service';
import { ToastService } from '@services/toast.service';
import { of } from 'rxjs';
import { RestockReviewPageComponent } from './restock-review-page.component';

describe('RestockReviewPageComponent', () => {
  let component: RestockReviewPageComponent;
  let fixture: ComponentFixture<RestockReviewPageComponent>;

  let mockRouter: jasmine.SpyObj<Router>;
  let mockShoppingListService: jasmine.SpyObj<ShoppingListService>;
  let mockItemService: jasmine.SpyObj<ItemService>;
  let mockUnitService: jasmine.SpyObj<UnitService>;
  let mockLocationService: jasmine.SpyObj<LocationService>;
  let mockIngredientService: jasmine.SpyObj<IngredientService>;

  const mockUnits: Unit[] = [
    { id: 1, name: 'pcs', shortName: 'pcs', type: UnitType.Count, toBaseFactor: 1 },
    { id: 2, name: 'kg', shortName: 'kg', type: UnitType.Weight, toBaseFactor: 1000 },
  ];

  const mockLocations: Location[] = [
    { id: 1, name: 'Fridge' },
    { id: 2, name: 'Pantry Shelf' },
  ];

  const mockPantryItems: IngredientItem[] = [
    {
      id: 'existing-milk-123',
      ingredientId: 'ing-uuid-milk-123',
      name: 'Whole Milk',
      quantity: 0,
      unit: mockUnits[0],
      purchaseDate: new Date('2026-08-01'),
      expirationDate: undefined,
      location: mockLocations[0],
      notes: 'Out of stock milk',
    },
    {
      id: 'existing-eggs-456',
      ingredientId: 'ing-uuid-eggs-456',
      name: 'Eggs',
      quantity: 6,
      unit: mockUnits[0],
      purchaseDate: new Date('2026-08-01'),
      expirationDate: new Date('2026-08-15'),
      location: mockLocations[0],
      notes: 'Large eggs',
    },
  ];

  const mockShoppingItems: ShoppingItem[] = [
    {
      id: 'shop-1',
      name: 'Whole Milk',
      category: 'Protein & Dairy',
      quantity: 3,
      unit: 'pcs',
      checked: true,
    },
    {
      id: 'shop-2',
      name: 'Avocado',
      category: 'Fiber & Produce',
      quantity: 4,
      unit: 'pcs',
      checked: true,
    },
  ];

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockShoppingListService = jasmine.createSpyObj(
      'ShoppingListService',
      ['loadItemsFromBackend', 'removeItem'],
      {
        items: jasmine.createSpy('items').and.returnValue(mockShoppingItems),
      },
    );

    mockIngredientService = jasmine.createSpyObj('IngredientService', ['getIngredients']);
    mockIngredientService.getIngredients.and.returnValue(
      of([
        {
          id: 'ing-uuid-milk-123',
          name: 'Whole Milk',
          defaultUnit: mockUnits[0],
        } as any,
      ]),
    );

    mockItemService = jasmine.createSpyObj('ItemService', [
      'getIngredientItems',
      'getSimilarIngredientItems',
      'addIngredientItem',
      'updateIngredientItem',
      'addItem',
      'updateItem',
    ]);
    mockItemService.getIngredientItems.and.returnValue(of(mockPantryItems));
    mockItemService.addIngredientItem.and.returnValue(of({} as IngredientItemDTO));
    mockItemService.updateIngredientItem.and.returnValue(of({} as IngredientItemDTO));
    mockItemService.addItem.and.returnValue(of({} as IngredientItemDTO));
    mockItemService.updateItem.and.returnValue(of({} as IngredientItemDTO));

    mockItemService.getSimilarIngredientItems.and.callFake((name: string) => {
      if (name.toLowerCase().includes('milk')) {
        return of([
          { item: mockPantryItems[0], score: 1.0, tier: 'exact' } as ItemSimilarityCandidate,
        ]);
      }
      if (name.toLowerCase().includes('eggs')) {
        return of([
          { item: mockPantryItems[1], score: 1.0, tier: 'exact' } as ItemSimilarityCandidate,
        ]);
      }
      if (name.toLowerCase().includes('oil')) {
        return of([
          {
            item: {
              id: 'existing-olive-oil-789',
              name: 'Olive Oil (Extra Virgin)',
              quantity: 1,
              unit: mockUnits[0],
              purchaseDate: new Date('2026-08-01'),
              expirationDate: new Date('2026-08-20'),
              location: mockLocations[1],
              notes: 'Cold pressed',
            },
            score: 0.85,
            tier: 'similar',
          } as ItemSimilarityCandidate,
        ]);
      }
      return of([]);
    });

    mockUnitService = jasmine.createSpyObj('UnitService', ['getUnits']);
    mockUnitService.getUnits.and.returnValue(of(mockUnits));

    mockLocationService = jasmine.createSpyObj('LocationService', ['getLocations']);
    mockLocationService.getLocations.and.returnValue(of(mockLocations));

    mockToastService = jasmine.createSpyObj('ToastService', [
      'showSuccess',
      'showWarning',
      'showError',
    ]);

    await TestBed.configureTestingModule({
      imports: [RestockReviewPageComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ShoppingListService, useValue: mockShoppingListService },
        { provide: ItemService, useValue: mockItemService },
        { provide: IngredientService, useValue: mockIngredientService },
        { provide: UnitService, useValue: mockUnitService },
        { provide: LocationService, useValue: mockLocationService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RestockReviewPageComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch backend similarity candidates and set default action modes', () => {
    fixture.detectChanges();

    const drafts = component.draftItems();
    expect(drafts.length).toBe(2);

    const milkDraft = drafts.find((d) => d.name === 'Whole Milk');
    expect(milkDraft).toBeDefined();
    expect(milkDraft?.actionMode).toBe('update');
    expect(milkDraft?.matchedItemId).toBe('existing-milk-123');
    expect(milkDraft?.matchCandidates.length).toBe(1);

    const avocadoDraft = drafts.find((d) => d.name === 'Avocado');
    expect(avocadoDraft).toBeDefined();
    expect(avocadoDraft?.actionMode).toBe('create');
    expect(avocadoDraft?.matchedItemId).toBeNull();
    expect(avocadoDraft?.matchCandidates.length).toBe(0);
  });

  it('should correctly calculate updating and creating counts for header summary', () => {
    fixture.detectChanges();

    expect(component.updatingCount).toBe(1);
    expect(component.creatingCount).toBe(1);
    expect(component.selectedCount).toBe(2);
  });

  it('should allow toggling action mode between update and create', () => {
    fixture.detectChanges();

    const drafts = component.draftItems();
    const milkDraft = drafts.find((d) => d.name === 'Whole Milk')!;

    component.setActionMode(milkDraft, 'create');
    expect(milkDraft.actionMode).toBe('create');
    expect(component.updatingCount).toBe(0);
    expect(component.creatingCount).toBe(2);

    component.setActionMode(milkDraft, 'update');
    expect(milkDraft.actionMode).toBe('update');
    expect(component.updatingCount).toBe(1);
    expect(component.creatingCount).toBe(1);
  });

  it('should invoke backend similarity API when item name changes', () => {
    fixture.detectChanges();

    const drafts = component.draftItems();
    const avocadoDraft = drafts.find((d) => d.name === 'Avocado')!;

    avocadoDraft.name = 'Eggs';
    component.onNameChange(avocadoDraft);

    expect(mockItemService.getSimilarIngredientItems).toHaveBeenCalledWith('Eggs', 0.45);
  });

  it('should update existing item quantity and preserve ingredientId on confirmRestock for items in update mode', () => {
    fixture.detectChanges();

    component.confirmRestock();

    expect(mockItemService.updateItem).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: 'existing-milk-123',
        ingredientId: 'ing-uuid-milk-123',
        quantity: 3,
      }),
    );

    expect(mockItemService.addItem).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name: 'Avocado',
        quantity: 4,
      }),
    );

    expect(mockShoppingListService.removeItem).toHaveBeenCalledWith('shop-1');
    expect(mockShoppingListService.removeItem).toHaveBeenCalledWith('shop-2');

    expect(mockToastService.showSuccess).toHaveBeenCalledWith(
      jasmine.stringMatching(/1 updated, 1 created/),
      jasmine.any(String),
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory']);
  });

  it('should update storage location when onMatchedItemChange is called with a new candidate match', () => {
    fixture.detectChanges();

    const drafts = component.draftItems();
    const milkDraft = drafts.find((d) => d.name === 'Whole Milk')!;
    milkDraft.matchCandidates = [
      { item: mockPantryItems[0], score: 1.0, tier: 'exact' },
      {
        item: {
          id: 'existing-eggs-456',
          ingredientId: 'ing-uuid-eggs-456',
          name: 'Whole Milk Extra',
          quantity: 1,
          unit: mockUnits[0],
          purchaseDate: new Date(),
          expirationDate: new Date(),
          location: mockLocations[1],
          notes: '',
        },
        score: 0.9,
        tier: 'similar',
      },
    ];
    milkDraft.matchedItemId = 'existing-eggs-456';

    component.onMatchedItemChange(milkDraft);
    expect(milkDraft.location).toBe('Pantry Shelf');
  });

  it('should handle similar items returned from backend API like Olive Oil', () => {
    const shoppingWithOliveOil: ShoppingItem[] = [
      {
        id: 'shop-oil',
        name: 'Olive Oil',
        category: 'Carbs & Grains',
        quantity: 2,
        unit: 'bottle',
        checked: true,
      },
    ];
    (mockShoppingListService.items as jasmine.Spy).and.returnValue(shoppingWithOliveOil);

    fixture = TestBed.createComponent(RestockReviewPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const drafts = component.draftItems();
    expect(drafts.length).toBe(1);

    const oilDraft = drafts[0];
    expect(oilDraft.matchCandidates.length).toBe(1);
    expect(oilDraft.bestMatch?.item.name).toBe('Olive Oil (Extra Virgin)');
    expect(oilDraft.actionMode).toBe('update');

    component.setActionMode(oilDraft, 'create');
    expect(oilDraft.actionMode).toBe('create');
  });

  it('should lock unit to ingredient default measurement unit when matched item has linked ingredient', () => {
    fixture.detectChanges();

    const drafts = component.draftItems();
    const milkDraft = drafts.find((d) => d.name === 'Whole Milk')!;

    expect(milkDraft.isUnitLocked).toBeTrue();
    expect(milkDraft.unit).toBe('pcs');
  });

  it('should return current candidate and display score percentage for single similarity matches', () => {
    fixture.detectChanges();

    const drafts = component.draftItems();
    const milkDraft = drafts.find((d) => d.name === 'Whole Milk')!;

    const candidate = component.getCurrentCandidate(milkDraft);
    expect(candidate).toBeDefined();
    expect(candidate?.score).toBe(1.0);
    expect(candidate?.item.name).toBe('Whole Milk');
  });
});
