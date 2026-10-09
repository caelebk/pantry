import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { By } from '@angular/platform-browser';
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
import { ItemEditorComponent } from '../inventory-components/item-editor/item-editor.component';
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

  let mockQueryParams: Record<string, string> = {};

  beforeEach(async () => {
    mockQueryParams = {};
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
      imports: [
        AddItemPageComponent,
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
          useValue: { snapshot: { queryParams: mockQueryParams } },
        },
      ],
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(AddItemPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should initialize and load ingredients and units', () => {
    createComponent();
    expect(component).toBeTruthy();
    expect(component.ingredients().length).toBe(1);
    expect(component.units().length).toBe(1);
  });

  it('should auto-populate and disable unit control when ingredient is selected', () => {
    createComponent();
    component.addItemForm.patchValue({ ingredient: mockIngredient });
    expect(component.addItemForm.controls.unit.value).toEqual(mockUnit);
    expect(component.addItemForm.controls.unit.disabled).toBeTrue();
  });

  it('should submit item creation form cleanly', () => {
    createComponent();
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

  it('should auto-select ingredient from queryParams on initialization and fill item name & unit', () => {
    mockQueryParams['ingredientId'] = 'ing-1';
    createComponent();

    expect(component.addItemForm.controls.ingredient.value).toEqual(mockIngredient);
    expect(component.addItemForm.controls.name.value).toBe('Basmati Rice');
    expect(component.addItemForm.controls.unit.value).toEqual(mockUnit);
    expect(component.addItemForm.controls.unit.disabled).toBeTrue();
  });

  it('updates an automatic label on ingredient change and preserves a custom label', () => {
    createComponent();
    component.addItemForm.patchValue({ name: '', ingredient: mockIngredient });
    const next = { ...mockIngredient, id: 'next-ingredient', name: 'Tomatoes' };
    component.addItemForm.controls.ingredient.setValue(next);
    expect(component.addItemForm.controls.name.value).toBe('Tomatoes');
    component.addItemForm.controls.name.setValue('Market tomatoes');
    component.addItemForm.controls.ingredient.setValue(mockIngredient);
    expect(component.addItemForm.controls.name.value).toBe('Market tomatoes');
  });

  it('enables unit selection when an ingredient has no default unit', () => {
    createComponent();
    component.addItemForm.controls.ingredient.setValue(mockIngredient);
    expect(component.addItemForm.controls.unit.disabled).toBeTrue();
    component.addItemForm.controls.ingredient.setValue({ id: 'no-unit', name: 'Other ingredient' });
    expect(component.addItemForm.controls.unit.enabled).toBeTrue();
  });

  it('retains input after a failed save and prevents repeated pending submission', () => {
    createComponent();
    component.addItemForm.patchValue({
      name: 'Market tomatoes',
      ingredient: mockIngredient,
      location: { id: 1, name: 'Pantry' },
      unit: mockUnit,
      expirationDate: new Date(),
      notes: 'Keep dry.',
    });
    const pending = new Subject<Item>();
    mockItemService.addItem.and.returnValue(pending);
    component.onSubmit();
    component.onSubmit();
    expect(mockItemService.addItem).toHaveBeenCalledTimes(1);
    pending.error(new Error('Try again'));
    expect(component.isSubmitting()).toBeFalse();
    expect(component.addItemForm.controls.notes.value).toBe('Keep dry.');
    expect(component.submitError()).toBe('Try again');
  });

  it('keeps required details visible and focuses a missing purchase date error', async () => {
    createComponent();
    component.addItemForm.patchValue({
      ingredient: mockIngredient,
      location: { id: 1, name: 'Pantry' },
      expirationDate: new Date(),
      purchaseDate: null,
    });
    fixture.detectChanges();
    const editor = fixture.debugElement.query(By.directive(ItemEditorComponent))
      .componentInstance as ItemEditorComponent;
    expect(editor.detailsOpen()).toBeFalse();
    document.body.appendChild(fixture.nativeElement);
    try {
      editor.onSubmit();
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));
      fixture.detectChanges();
      expect(editor.detailsOpen()).toBeFalse();
      const purchase = fixture.nativeElement.querySelector('#purchaseDate');
      expect(purchase.getAttribute('aria-invalid')).toBe('true');
      expect(document.activeElement).toBe(purchase);
      expect(fixture.nativeElement.textContent).toContain('Choose a purchase date.');
    } finally {
      fixture.nativeElement.remove();
    }
  });

  it('shows an inherited unit while preserving it in the saved payload', () => {
    createComponent();
    component.addItemForm.patchValue({
      ingredient: mockIngredient,
      location: { id: 1, name: 'Pantry' },
      expirationDate: new Date(),
    });
    fixture.detectChanges();
    const unit = fixture.nativeElement.querySelector('#unit') as HTMLInputElement;
    expect(unit.readOnly).toBeTrue();
    expect(unit.value).toBe('Kilogram (kg)');
    component.onSubmit();
    expect(mockItemService.addItem).toHaveBeenCalledWith(
      jasmine.objectContaining({ unit: mockUnit, name: 'Basmati Rice' }),
    );
  });
  it('returns to the ingredient detail after adding a preselected item', () => {
    mockQueryParams['ingredientId'] = 'ing-1';
    mockQueryParams['returnTo'] = '/inventory/ingredients/ing-1';
    createComponent();
    component.addItemForm.patchValue({ expirationDate: new Date() });
    component.onSubmit();
    expect(mockItemService.addItem).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/ingredients/ing-1']);
  });

  it('returns to ingredient detail when cancelling an item addition', () => {
    mockQueryParams['returnTo'] = '/inventory/ingredients/ing-1';
    createComponent();
    component.onCancel();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/ingredients/ing-1']);
  });

  it('ignores an external return destination', () => {
    mockQueryParams['returnTo'] = 'https://example.com/inventory/ingredients/ing-1';
    createComponent();
    component.onCancel();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/items']);
  });
});
