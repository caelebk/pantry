import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UnitType } from '@models/unit.model';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { ItemService } from '@services/inventory/item.service';
import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ToastService } from '@services/toast.service';
import { of } from 'rxjs';
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

  beforeEach(async () => {
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

    mockItemService.getItemById.and.returnValue(of(mockItemDTO as unknown as ItemDTO));
    mockIngredientService.getIngredients.and.returnValue(of([mockIngredient1, mockIngredient2]));
    mockIngredientGroupService.getIngredientGroups.and.returnValue(of([]));
    mockLocationService.getLocations.and.returnValue(of([{ id: 1, name: 'Pantry' }]));
    mockUnitService.getUnits.and.returnValue(of([mockUnit1, mockUnit2]));
    mockItemService.updateItem.and.returnValue(of(mockItemDTO as unknown as ItemDTO));

    await TestBed.configureTestingModule({
      imports: [EditItemPageComponent],
      providers: [
        FormBuilder,
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
            snapshot: { paramMap: { get: () => 'item-100' } },
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
});
