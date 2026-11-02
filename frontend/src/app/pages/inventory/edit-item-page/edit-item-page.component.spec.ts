import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { Item } from '@models/items.model';
import { UnitType } from '@models/unit.model';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ToastService } from '@services/toast.service';
import { of, Subject } from 'rxjs';
import translations from '../../../../../public/i18n/en.json';
import { EditItemPageComponent } from './edit-item-page.component';

describe('EditItemPageComponent', () => {
  let component: EditItemPageComponent;
  let fixture: ComponentFixture<EditItemPageComponent>;
  let mockItemService: jasmine.SpyObj<ItemService>;
  let mockIngredientService: jasmine.SpyObj<IngredientService>;
  let mockIngredientGroupService: jasmine.SpyObj<IngredientGroupService>;
  let mockLocationService: jasmine.SpyObj<LocationService>;
  let mockUnitService: jasmine.SpyObj<UnitService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockUnit1 = { id: 1, name: 'Gram', shortName: 'g', type: UnitType.Weight, toBaseFactor: 1 };
  const mockUnit2 = {
    id: 2,
    name: 'Kilogram',
    shortName: 'kg',
    type: UnitType.Weight,
    toBaseFactor: 1000,
  };
  const mockIngredient1 = { id: 'ing-1', name: 'Flour', defaultUnit: mockUnit1 };
  const mockIngredient2 = { id: 'ing-2', name: 'Rice', defaultUnit: mockUnit2 };

  const mockItemDTO = {
    id: 'item-100',
    label: 'Whole Wheat Flour',
    ingredientId: 'ing-1',
    quantity: 500,
    unitId: 1,
    locationId: 1,
    purchaseDate: '2026-08-01',
    expirationDate: '2026-08-30',
  };

  let mockQueryParams: Record<string, string> = {};

  beforeEach(async () => {
    mockQueryParams = {};
    mockItemService = jasmine.createSpyObj('ItemService', ['getItemById', 'updateItem']);
    mockIngredientService = jasmine.createSpyObj('IngredientService', [
      'getIngredients',
      'createIngredient',
    ]);
    mockIngredientGroupService = jasmine.createSpyObj('IngredientGroupService', [
      'getIngredientGroups',
    ]);
    mockLocationService = jasmine.createSpyObj('LocationService', ['getLocations']);
    mockUnitService = jasmine.createSpyObj('UnitService', ['getUnits']);
    mockToastService = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockItemService.getItemById.and.returnValue(
      of({
        id: 'item-100',
        name: 'Whole Wheat Flour',
        ingredientId: 'ing-1',
        quantity: 500,
        unit: mockUnit1,
        location: { id: 1, name: 'Pantry' },
        purchaseDate: new Date('2026-08-01'),
        expirationDate: new Date('2026-08-30'),
        openedDate: new Date('2026-08-02'),
        notes: 'Keep dry.',
      } as Item),
    );
    mockIngredientService.getIngredients.and.returnValue(of([mockIngredient1, mockIngredient2]));
    mockIngredientGroupService.getIngredientGroups.and.returnValue(of([]));
    mockLocationService.getLocations.and.returnValue(of([{ id: 1, name: 'Pantry' }]));
    mockUnitService.getUnits.and.returnValue(of([mockUnit1, mockUnit2]));
    mockItemService.updateItem.and.returnValue(of(mockItemDTO as unknown as Item));

    await TestBed.configureTestingModule({
      imports: [
        EditItemPageComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: translations },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        FormBuilder,
        provideNoopAnimations(),
        { provide: ItemService, useValue: mockItemService },
        { provide: IngredientService, useValue: mockIngredientService },
        { provide: IngredientGroupService, useValue: mockIngredientGroupService },
        { provide: LocationService, useValue: mockLocationService },
        { provide: UnitService, useValue: mockUnitService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: () => 'item-100' },
              queryParams: mockQueryParams,
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditItemPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load existing item data and disable unit control', () => {
    expect(component).toBeTruthy();
    expect(mockItemService.getItemById).toHaveBeenCalledWith('item-100');
    expect(component.editItemForm.controls.unit.disabled).toBeTrue();
  });

  it('should update unit when ingredient choice changes', () => {
    component.editItemForm.patchValue({ ingredient: mockIngredient2 });
    expect(component.editItemForm.controls.unit.value).toEqual(mockUnit2);
    expect(component.editItemForm.controls.unit.disabled).toBeTrue();
  });

  it('should submit updated item form', () => {
    component.editItemForm.patchValue({
      name: 'Whole Wheat Flour Updated',
      ingredient: mockIngredient1,
      location: { id: 1, name: 'Pantry' },
      quantity: 10,
      unit: mockUnit1,
      purchaseDate: new Date(),
      expirationDate: new Date(),
    });

    component.onSubmit();
    expect(mockItemService.updateItem).toHaveBeenCalled();
    expect(mockToastService.showSuccess).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/items']);
  });

  it('updates an automatic label on ingredient change and preserves a custom label', () => {
    component.editItemForm.patchValue({ name: '', ingredient: mockIngredient1 });
    const next = { ...mockIngredient1, id: 'next-ingredient', name: 'Tomatoes' };
    component.editItemForm.controls.ingredient.setValue(next);
    expect(component.editItemForm.controls.name.value).toBe('Tomatoes');
    component.editItemForm.controls.name.setValue('Market tomatoes');
    component.editItemForm.controls.ingredient.setValue(mockIngredient1);
    expect(component.editItemForm.controls.name.value).toBe('Market tomatoes');
  });

  it('enables unit selection when an ingredient has no default unit', () => {
    component.editItemForm.controls.ingredient.setValue(mockIngredient1);
    expect(component.editItemForm.controls.unit.disabled).toBeTrue();
    component.editItemForm.controls.ingredient.setValue({
      id: 'no-unit',
      name: 'Other ingredient',
    });
    expect(component.editItemForm.controls.unit.enabled).toBeTrue();
  });

  it('retains input after a failed save and prevents repeated pending submission', () => {
    component.editItemForm.patchValue({
      name: 'Market tomatoes',
      ingredient: mockIngredient1,
      location: { id: 1, name: 'Pantry' },
      unit: mockUnit1,
      expirationDate: new Date(),
      notes: 'Keep dry.',
    });
    const pending = new Subject<Item>();
    mockItemService.updateItem.and.returnValue(pending);
    component.onSubmit();
    component.onSubmit();
    expect(mockItemService.updateItem).toHaveBeenCalledTimes(1);
    pending.error(new Error('Try again'));
    expect(component.isSubmitting()).toBeFalse();
    expect(component.editItemForm.controls.notes.value).toBe('Keep dry.');
    expect(component.submitError()).toBe('Try again');
  });
  it('returns to ingredient detail after saving an item edit', () => {
    mockQueryParams['returnTo'] = '/inventory/ingredients/ing-1';
    component.onSubmit();
    expect(mockItemService.updateItem).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/ingredients/ing-1']);
  });

  it('returns to ingredient detail when cancelling an item edit', () => {
    mockQueryParams['returnTo'] = '/inventory/ingredients/ing-1';
    component.onCancel();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/ingredients/ing-1']);
  });

  it('falls back to the items catalog for a nested editor return destination', () => {
    mockQueryParams['returnTo'] = '/inventory/ingredients/ing-1/edit';
    component.onCancel();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/items']);
  });
});
