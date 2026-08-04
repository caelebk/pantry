import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { UnitService } from '@services/inventory/unit.service';
import { ToastService } from '@services/toast.service';
import { of } from 'rxjs';
import { AddIngredientPageComponent } from './add-ingredient-page.component';

describe('AddIngredientPageComponent', () => {
  let component: AddIngredientPageComponent;
  let fixture: ComponentFixture<AddIngredientPageComponent>;
  let mockIngredientService: jasmine.SpyObj<IngredientService>;
  let mockIngredientGroupService: jasmine.SpyObj<IngredientGroupService>;
  let mockUnitService: jasmine.SpyObj<UnitService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockIngredientService = jasmine.createSpyObj('IngredientService', ['createIngredient']);
    mockIngredientGroupService = jasmine.createSpyObj('IngredientGroupService', [
      'getIngredientGroups',
    ]);
    mockUnitService = jasmine.createSpyObj('UnitService', ['getUnits']);
    mockToastService = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockIngredientGroupService.getIngredientGroups.and.returnValue(of([]));
    mockUnitService.getUnits.and.returnValue(
      of([{ id: 1, name: 'Gram', shortName: 'g', type: 'weight' as any, toBaseFactor: 1 }]),
    );

    await TestBed.configureTestingModule({
      imports: [AddIngredientPageComponent],
      providers: [
        FormBuilder,
        { provide: IngredientService, useValue: mockIngredientService },
        { provide: IngredientGroupService, useValue: mockIngredientGroupService },
        { provide: UnitService, useValue: mockUnitService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddIngredientPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and require defaultUnit', () => {
    expect(component).toBeTruthy();
    expect(component.ingredientForm.valid).toBeFalse();

    component.ingredientForm.patchValue({
      name: 'Flour',
      defaultUnit: { id: 1, name: 'Gram' },
    });
    expect(component.ingredientForm.valid).toBeTrue();
  });
});
