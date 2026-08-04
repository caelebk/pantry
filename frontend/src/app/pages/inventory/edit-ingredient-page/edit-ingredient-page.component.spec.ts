import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UnitType } from '@models/unit.model';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { UnitService } from '@services/inventory/unit.service';
import { ToastService } from '@services/toast.service';
import { of } from 'rxjs';
import { EditIngredientPageComponent } from './edit-ingredient-page.component';

describe('EditIngredientPageComponent', () => {
  let component: EditIngredientPageComponent;
  let fixture: ComponentFixture<EditIngredientPageComponent>;
  let mockIngredientService: jasmine.SpyObj<IngredientService>;
  let mockIngredientGroupService: jasmine.SpyObj<IngredientGroupService>;
  let mockUnitService: jasmine.SpyObj<UnitService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockUnit1 = {
    id: 1,
    name: 'Kilogram',
    shortName: 'kg',
    type: UnitType.Weight,
    toBaseFactor: 1000,
  };
  const mockUnit2 = { id: 2, name: 'Gram', shortName: 'g', type: UnitType.Weight, toBaseFactor: 1 };

  const mockIngredient = {
    id: 'ing-99',
    name: 'Basmati Rice',
    defaultUnit: mockUnit1,
  };

  beforeEach(async () => {
    mockIngredientService = jasmine.createSpyObj('IngredientService', [
      'getIngredientById',
      'getItemsByIngredientId',
      'updateIngredient',
    ]);
    mockIngredientGroupService = jasmine.createSpyObj('IngredientGroupService', [
      'getIngredientGroups',
    ]);
    mockUnitService = jasmine.createSpyObj('UnitService', ['getUnits']);
    mockToastService = jasmine.createSpyObj('ToastService', [
      'showSuccess',
      'showError',
      'showInfo',
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockIngredientService.getIngredientById.and.returnValue(of(mockIngredient as any));
    mockIngredientService.getItemsByIngredientId.and.returnValue(of([]));
    mockIngredientService.updateIngredient.and.returnValue(of(mockIngredient as any));
    mockIngredientGroupService.getIngredientGroups.and.returnValue(of([]));
    mockUnitService.getUnits.and.returnValue(of([mockUnit1, mockUnit2]));

    await TestBed.configureTestingModule({
      imports: [EditIngredientPageComponent],
      providers: [
        FormBuilder,
        { provide: IngredientService, useValue: mockIngredientService },
        { provide: IngredientGroupService, useValue: mockIngredientGroupService },
        { provide: UnitService, useValue: mockUnitService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => 'ing-99' } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditIngredientPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load ingredient details', () => {
    expect(component).toBeTruthy();
    expect(mockIngredientService.getIngredientById).toHaveBeenCalledWith('ing-99');
  });

  it('should redirect to unit reconciliation page if default unit changed and items exist', () => {
    mockIngredientService.getItemsByIngredientId.and.returnValue(
      of([
        {
          id: 'item-1',
          label: 'Rice Bag',
          quantity: 2,
          unitId: 1,
          locationId: 1,
          purchaseDate: '2026-08-01',
          expirationDate: '2026-08-10',
        },
      ]),
    );

    component.ingredientForm.patchValue({
      name: 'Basmati Rice',
      defaultUnit: mockUnit2, // Changed from unit 1 (kg) to unit 2 (g)
    });

    component.onSubmit();

    expect(mockIngredientService.getItemsByIngredientId).toHaveBeenCalledWith('ing-99');
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/inventory/ingredients/ing-99/unit-reconciliation'],
      { queryParams: { targetUnitId: 2 } },
    );
  });

  it('should update ingredient directly if default unit did not change', () => {
    mockIngredientService.updateIngredient.and.returnValue(
      of({ id: 'ing-99', name: 'Updated Rice' } as any),
    );

    component.ingredientForm.patchValue({
      name: 'Updated Basmati Rice',
      defaultUnit: mockUnit1, // Unchanged
    });

    component.onSubmit();

    expect(mockIngredientService.updateIngredient).toHaveBeenCalled();
    expect(mockToastService.showSuccess).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/ingredients']);
  });
});
