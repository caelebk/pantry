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
import { AddItemPageComponent } from './add-item-page.component';

describe('AddItemPageComponent', () => {
  let component: AddItemPageComponent;
  let fixture: ComponentFixture<AddItemPageComponent>;
  let mockItemService: jasmine.SpyObj<ItemService>;
  let mockIngredientService: jasmine.SpyObj<IngredientService>;
  let mockIngredientGroupService: jasmine.SpyObj<IngredientGroupService>;
  let mockLocationService: jasmine.SpyObj<LocationService>;
  let mockUnitService: jasmine.SpyObj<UnitService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockUnit = {
    id: 2,
    name: 'Kilogram',
    shortName: 'kg',
    type: UnitType.Weight,
    toBaseFactor: 1000,
  };
  const mockIngredient = {
    id: 'ing-1',
    name: 'Basmati Rice',
    defaultUnit: mockUnit,
  };

  beforeEach(async () => {
    mockItemService = jasmine.createSpyObj('ItemService', ['addItem']);
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

    mockIngredientService.getIngredients.and.returnValue(of([mockIngredient]));
    mockIngredientGroupService.getIngredientGroups.and.returnValue(of([]));
    mockLocationService.getLocations.and.returnValue(of([{ id: 1, name: 'Pantry' }]));
    mockUnitService.getUnits.and.returnValue(of([mockUnit]));
    mockItemService.addItem.and.returnValue(
      of({ id: 'item-1', label: 'Basmati Rice' } as unknown as Item),
    );

    await TestBed.configureTestingModule({
      imports: [AddItemPageComponent],
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
          useValue: { queryParamMap: of(new Map()) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddItemPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load ingredients and units', () => {
    expect(component).toBeTruthy();
    expect(component.ingredients().length).toBe(1);
    expect(component.units().length).toBe(1);
  });

  it('should auto-populate and disable unit control when ingredient is selected', () => {
    component.addItemForm.patchValue({ ingredient: mockIngredient });
    expect(component.addItemForm.controls.unit.value).toEqual(mockUnit);
    expect(component.addItemForm.controls.unit.disabled).toBeTrue();
  });

  it('should submit item creation form cleanly', () => {
    component.addItemForm.patchValue({
      name: 'Basmati Rice 5kg',
      ingredient: mockIngredient,
      location: { id: 1, name: 'Pantry' },
      quantity: 5,
      unit: mockUnit,
      purchaseDate: new Date(),
      expirationDate: new Date(),
    });

    component.onSubmit();
    expect(mockItemService.addItem).toHaveBeenCalled();
    expect(mockToastService.showSuccess).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/items']);
  });
});
