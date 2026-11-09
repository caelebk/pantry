import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { UnitType } from '@models/unit.model';
import { IngredientService } from '@services/inventory/ingredient.service';
import { LocationService } from '@services/inventory/location.service';
import { UnitService } from '@services/inventory/unit.service';
import { ToastService } from '@services/toast.service';
import { of } from 'rxjs';
import { UnitReconciliationPageComponent } from './unit-reconciliation-page.component';

describe('UnitReconciliationPageComponent', () => {
  let component: UnitReconciliationPageComponent;
  let fixture: ComponentFixture<UnitReconciliationPageComponent>;
  let mockIngredientService: jasmine.SpyObj<IngredientService>;
  let mockUnitService: jasmine.SpyObj<UnitService>;
  let mockLocationService: jasmine.SpyObj<LocationService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;

  let mockQueryParams: Record<string, string> = {};

  beforeEach(async () => {
    mockQueryParams = {};
    mockIngredientService = jasmine.createSpyObj('IngredientService', [
      'getIngredientById',
      'getItemsByIngredientId',
      'reconcileIngredientUnit',
    ]);
    mockUnitService = jasmine.createSpyObj('UnitService', ['getUnits']);
    mockLocationService = jasmine.createSpyObj('LocationService', ['getLocations']);
    mockToastService = jasmine.createSpyObj('ToastService', ['showSuccess', 'showError']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockUnitService.getUnits.and.returnValue(
      of([
        { id: 1, name: 'Kg', shortName: 'kg', type: UnitType.Weight, toBaseFactor: 1000 },
        { id: 2, name: 'Gram', shortName: 'g', type: UnitType.Weight, toBaseFactor: 1 },
      ]),
    );

    mockIngredientService.getIngredientById.and.returnValue(
      of({
        id: 'ing-1',
        name: 'Rice',
        defaultUnit: {
          id: 1,
          name: 'Kg',
          shortName: 'kg',
          type: UnitType.Weight,
          toBaseFactor: 1000,
        },
      }),
    );

    mockLocationService.getLocations.and.returnValue(of([{ id: 1, name: 'Pantry' }]));

    mockIngredientService.getItemsByIngredientId.and.returnValue(
      of([
        {
          id: 'item-1',
          label: 'Jasmine Rice',
          quantity: 2,
          unitId: 1,
          locationId: 1,
          purchaseDate: '2026-08-01',
          expirationDate: '2026-08-10',
        },
      ]),
    );

    await TestBed.configureTestingModule({
      imports: [
        UnitReconciliationPageComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              inventory: {
                reconciliation: { newQtyFor: 'New quantity for {{label}} ({{unit}})' },
              },
            },
          },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        { provide: IngredientService, useValue: mockIngredientService },
        { provide: UnitService, useValue: mockUnitService },
        { provide: LocationService, useValue: mockLocationService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: mockQueryParams,
              paramMap: { get: () => 'ing-1' },
              queryParamMap: { get: () => '2' },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UnitReconciliationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should calculate smart unit conversion for item rows', () => {
    expect(component).toBeTruthy();
    const rows = component.itemRows();
    expect(rows.length).toBe(1);
    expect(rows[0].newQuantity).toBe(2000); // 2 kg converted to grams
  });
  it('returns to ingredient detail after reconciling stock', () => {
    mockQueryParams['returnTo'] = '/inventory/ingredients/ing-1';
    mockIngredientService.reconcileIngredientUnit.and.returnValue(of(undefined));
    component.onSubmit();
    expect(mockIngredientService.reconcileIngredientUnit).toHaveBeenCalledWith('ing-1', 2, [
      { id: 'item-1', quantity: 2000 },
    ]);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/ingredients/ing-1']);
  });

  it('returns to ingredient detail when cancelling reconciliation', () => {
    mockQueryParams['returnTo'] = '/inventory/ingredients/ing-1';
    component.onCancel();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/ingredients/ing-1']);
  });

  it('keeps the catalog destination without a detail return parameter', () => {
    component.onCancel();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/inventory/ingredients']);
  });

  it('leaves the quantity empty and flags manual input when units cannot be converted', () => {
    component.itemRows.set([]);
    mockUnitService.getUnits.and.returnValue(
      of([
        { id: 2, name: 'Gram', shortName: 'g', type: UnitType.Weight, toBaseFactor: 1 },
        { id: 7, name: 'Piece', shortName: 'pc', type: UnitType.Count, toBaseFactor: 1 },
      ]),
    );
    mockIngredientService.getItemsByIngredientId.and.returnValue(
      of([
        {
          id: 'item-2',
          label: 'Eggs',
          quantity: 6,
          unitId: 7,
          locationId: 99,
          purchaseDate: '2026-08-01',
          expirationDate: '2026-08-10',
        },
      ]),
    );
    component.ngOnInit();
    const row = component.itemRows()[0];
    expect(row.newQuantity).toBeNull();
    expect(row.needsManualInput).toBeTrue();
    expect(row.locationName).toBeNull();
  });

  it('blocks saving when a row has an empty or negative quantity', () => {
    component.itemRows.update((rows) => rows.map((r) => ({ ...r, newQuantity: null })));
    component.onSubmit();
    expect(mockIngredientService.reconcileIngredientUnit).not.toHaveBeenCalled();
    expect(component.submitAttempted()).toBeTrue();
    component.itemRows.update((rows) => rows.map((r) => ({ ...r, newQuantity: -1 })));
    component.onSubmit();
    expect(mockIngredientService.reconcileIngredientUnit).not.toHaveBeenCalled();
  });

  it('allows saving a row with a zero quantity', () => {
    mockIngredientService.reconcileIngredientUnit.and.returnValue(of(undefined));
    component.itemRows.update((rows) => rows.map((r) => ({ ...r, newQuantity: 0 })));
    component.onSubmit();
    expect(mockIngredientService.reconcileIngredientUnit).toHaveBeenCalledWith('ing-1', 2, [
      { id: 'item-1', quantity: 0 },
    ]);
  });

  it('renders one phone card per row with its quantity input', () => {
    const cards = fixture.nativeElement.querySelectorAll('[data-testid="reconcile-card"]');
    expect(cards.length).toBe(component.itemRows().length);
    expect(cards[0].textContent).toContain('Jasmine Rice');
    expect(cards[0].querySelector('p-inputNumber, p-inputnumber')).not.toBeNull();
  });

  it('labels each quantity input with its row label', () => {
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="reconcile-card"] input'),
    ).map((input) => (input as HTMLInputElement).getAttribute('aria-label'));
    expect(labels.length).toBe(component.itemRows().length);
    expect(labels[0]).toContain('Jasmine Rice');
    expect(new Set(labels).size).toBe(labels.length);
  });
});
