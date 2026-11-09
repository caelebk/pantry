import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { UnitType } from '@models/unit.model';
import { IngredientGroupService } from '@services/inventory/ingredient-group.service';
import { IngredientService } from '@services/inventory/ingredient.service';
import { UnitService } from '@services/inventory/unit.service';
import { ToastService } from '@services/toast.service';
import { of, throwError } from 'rxjs';
import translations from '../../../../../public/i18n/en.json';
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

  let mockQueryParams: Record<string, string> = {};

  beforeEach(async () => {
    mockQueryParams = {};
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

    mockIngredientService.getIngredientById.and.returnValue(
      of(mockIngredient as unknown as Ingredient),
    );
    mockIngredientService.getItemsByIngredientId.and.returnValue(of([]));
    mockIngredientService.updateIngredient.and.returnValue(
      of(mockIngredient as unknown as Ingredient),
    );
    mockIngredientGroupService.getIngredientGroups.and.returnValue(of([]));
    mockUnitService.getUnits.and.returnValue(of([mockUnit1, mockUnit2]));

    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: translations },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
        EditIngredientPageComponent,
      ],
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
            snapshot: {
              paramMap: { get: () => 'ing-99' },
              queryParams: mockQueryParams,
            },
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
      of({ id: 'ing-99', name: 'Updated Rice' } as unknown as Ingredient),
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
  it('returns to detail after saving an ingredient without changing its unit', () => {
    mockQueryParams['returnTo'] = '/inventory/ingredients/ing-99';
    component.onSubmit();
    expect(mockIngredientService.updateIngredient).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/ingredients/ing-99']);
  });

  it('returns to detail after changing the unit when no stock needs reconciliation', () => {
    mockQueryParams['returnTo'] = '/inventory/ingredients/ing-99';
    component.ingredientForm.patchValue({ defaultUnit: mockUnit2 });
    component.onSubmit();
    expect(mockIngredientService.getItemsByIngredientId).toHaveBeenCalledWith('ing-99');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/ingredients/ing-99']);
  });

  it('preserves the detail destination when continuing into unit reconciliation', () => {
    mockQueryParams['returnTo'] = '/inventory/ingredients/ing-99';
    mockIngredientService.getItemsByIngredientId.and.returnValue(
      of([{ id: 'item-1', label: 'Rice bag', quantity: 2, unitId: 1, locationId: 1 }]),
    );
    component.ingredientForm.patchValue({ defaultUnit: mockUnit2 });
    component.onSubmit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['/inventory/ingredients/ing-99/unit-reconciliation'],
      { queryParams: { targetUnitId: 2, returnTo: '/inventory/ingredients/ing-99' } },
    );
  });

  it('returns to detail when cancelling an ingredient edit', () => {
    mockQueryParams['returnTo'] = '/inventory/ingredients/ing-99';
    component.onCancel();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/ingredients/ing-99']);
  });

  it('falls back to the catalog for the reserved new ingredient path', () => {
    mockQueryParams['returnTo'] = '/inventory/ingredients/new';
    component.onCancel();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/ingredients']);
  });

  it('sends an explicit null group when the ingredient group is cleared', () => {
    component.ingredientForm.patchValue({ ingredientGroup: null });
    component.onSubmit();
    expect(mockIngredientService.updateIngredient).toHaveBeenCalledWith(
      'ing-99',
      jasmine.objectContaining({ ingredientGroupId: null }),
    );
  });

  it('shows an error toast and navigates away when the ingredient is not found', () => {
    mockIngredientService.getIngredientById.and.returnValue(throwError(() => ({ status: 404 })));
    component.retryLoad();
    expect(mockToastService.showError).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/ingredients']);
    expect(component.loadFailed()).toBe(false);
  });

  it('keeps a retry state on other load errors and retry re-runs every loader', () => {
    mockIngredientService.getIngredientById.and.returnValue(throwError(() => ({ status: 500 })));
    component.retryLoad();
    expect(component.loadFailed()).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();

    mockIngredientService.getIngredientById.and.returnValue(
      of(mockIngredient as unknown as Ingredient),
    );
    component.retryLoad();
    // once on init, once per retry (two retries in this test)
    expect(mockIngredientService.getIngredientById).toHaveBeenCalledTimes(3);
    expect(mockIngredientGroupService.getIngredientGroups).toHaveBeenCalledTimes(3);
    expect(mockUnitService.getUnits).toHaveBeenCalledTimes(3);
    expect(component.loadFailed()).toBe(false);
  });

  it('sets loadFailed when the units load fails', () => {
    mockUnitService.getUnits.and.returnValue(throwError(() => ({ status: 500 })));
    component.retryLoad();
    expect(component.loadFailed()).toBe(true);
  });
});
